import * as BABYLON from '@babylonjs/core';
// Registrar loaders necesarios (glTF/GLB y OBJ) según la documentación
import '@babylonjs/loaders/glTF';
import '@babylonjs/loaders/OBJ';

import type {
  AssetLoadResult,
  DebugInfo,
  GameConfig,
  GameState,
  HorrorEventCallback,
  HorrorEventType,
  PlayerControls,
  PlayerState,
} from './types';

import { Character } from './characters/Character';
import {
  DEFAULT_GAME_CONFIG,
  FRAGMENT_SHADER,
  GAME_MESSAGES,
  JOHNNY_CAGE_CONFIG,
  UTILS,
  VERTEX_SHADER,
} from './config';
import { createMaze } from './scenes/maze';

/**
 * Clase principal del juego de terror Horror Mansion 3D
 */
class HorrorGame {
  // Elementos del motor gráfico
  private canvas: HTMLCanvasElement | null = null;
  private engine: BABYLON.Engine | null = null;
  private scene: BABYLON.Scene | null = null;
  private camera: BABYLON.TargetCamera | null = null;

  // Assets del juego
  private mansion: BABYLON.AbstractMesh | null = null;
  private flashlight: BABYLON.SpotLight | null = null;
  private johnnyCage: Character | null = null;

  // Estado del juego
  private gameState: GameState = 'loading';
  private playerState: PlayerState;
  private controls: PlayerControls = {};
  private config: GameConfig;
  private originalAmbientColor: BABYLON.Color3 | null = null;

  // Sistemas del juego
  private horrorEvents: Map<HorrorEventType, HorrorEventCallback> = new Map();
  private particleSystem: BABYLON.ParticleSystem | null = null;
  private fireflyLights: BABYLON.PointLight[] = [];
  private shadowGenerator: BABYLON.ShadowGenerator | null = null;
  // Suavizado de linterna
  private flashlightTargetIntensity: number = 0;
  // Grupo del laberinto (referencia)
  private mazeRoot: BABYLON.TransformNode | null = null;

  // Para calcular deltaTime
  private lastTime: number = 0;

  constructor(customConfig?: Partial<GameConfig>) {
    this.config = { ...DEFAULT_GAME_CONFIG, ...customConfig };
    this.playerState = {
      stamina: this.config.movement.stamina.max,
      health: 100,
      isRunning: false,
      isFlashlightOn: false,
      isInCreatorMode: false,
      isLightsDisabled: false,
      isDayMode: false,
    };

    // Initialize lastTime properly
    this.lastTime = 0;

    this.setupShaders();
    this.init();
  }

  /**
   * Configura los shaders customizados para el juego
   */
  private setupShaders(): void {
    BABYLON.Effect.ShadersStore['horrorMansionVertexShader'] = VERTEX_SHADER;
    BABYLON.Effect.ShadersStore['horrorMansionFragmentShader'] = FRAGMENT_SHADER;

    // Verificar que los loaders estén disponibles
    console.log('🔍 Verificando loaders disponibles...');
    const availablePlugins = BABYLON.SceneLoader.GetPluginForExtension('');
    console.log('📦 Plugins disponibles:', Object.keys(availablePlugins || {}));

    const gltfAvailable = BABYLON.SceneLoader.IsPluginForExtensionAvailable('.gltf');
    const glbAvailable = BABYLON.SceneLoader.IsPluginForExtensionAvailable('.glb');

    console.log(`📦 Loader .gltf disponible: ${gltfAvailable}`);
    console.log(`📦 Loader .glb disponible: ${glbAvailable}`);

    if (glbAvailable || gltfAvailable) {
      console.log('✅ Loaders GLB/GLTF están disponibles');
    } else {
      console.error('❌ Loaders GLB/GLTF NO están disponibles');
      console.log('💡 Posibles soluciones:');
      console.log('   1. Reiniciar el servidor de desarrollo');
      console.log('   2. Verificar que babylonjs-loaders esté instalado');
      console.log('   3. Verificar la configuración de Vite');
    }
  }

  /**
   * Inicializa el motor gráfico
   */
  private async initializeEngine(): Promise<void> {
    const canvasElement = document.getElementById(this.config.canvas.id);
    if (!canvasElement) {
      throw new Error(`Canvas con ID '${this.config.canvas.id}' no encontrado`);
    }
    if (!(canvasElement instanceof HTMLCanvasElement)) {
      throw new Error(`Elemento con ID '${this.config.canvas.id}' no es un canvas`);
    }
    this.canvas = canvasElement;

    this.engine = new BABYLON.Engine(this.canvas, this.config.canvas.antialias, {
      preserveDrawingBuffer: this.config.canvas.preserveDrawingBuffer,
      stencil: this.config.canvas.stencil,
    });
  }

  /**
   * Crea la escena principal
   */
  private createScene(): void {
    if (!this.engine) throw new Error('Motor no inicializado');

    this.scene = new BABYLON.Scene(this.engine);
    this.scene.actionManager = new BABYLON.ActionManager(this.scene);
  }

  /**
   * Configura la atmósfera del juego
   */
  private setupAtmosphere(): void {
    if (!this.scene) return;

    const { atmosphere } = this.config;

    this.scene.fogMode = atmosphere.fogMode;
    this.scene.fogColor = atmosphere.fogColor;
    this.scene.fogDensity = atmosphere.fogDensity;
    this.scene.clearColor = new BABYLON.Color4(
      atmosphere.clearColor.r,
      atmosphere.clearColor.g,
      atmosphere.clearColor.b,
      1.0
    );
    this.scene.gravity = atmosphere.gravity;
    this.scene.collisionsEnabled = true;
  }

  /**
   * Inicializa el juego
   */
  private async init(): Promise<void> {
    try {
      this.gameState = 'loading';

      // Inicializar canvas y motor
      await this.initializeEngine();

      // Crear escena
      this.createScene();

      // Configurar atmósfera
      this.setupAtmosphere();

      // Configurar controles
      this.setupControls();

      // Cargar recursos
      await this.loadAssets();

      // Cargar Johnny Cage
      await this.loadJohnnyCage();

      // Configurar jugador
      this.setupPlayer();

      // Configurar iluminación
      this.setupLighting();

      // Crear laberinto alrededor de la mansión
      this.createMazeScene();

      // Configurar efectos de terror
      this.setupHorrorEffects();

      // Optimizar rendimiento
      this.optimizePerformance();

      // Iniciar render loop
      this.startRenderLoop();

      // Finalizar carga
      this.finishLoading();

      console.log('🎃 Horror Mansion 3D - ¡Juego iniciado!');
    } catch (error) {
      console.error('Error iniciando el juego:', error);
      this.gameState = 'error';
      this.hideLoadingScreen();
    }
  }

  /**
   * Construye el laberinto usando el módulo de escenas
   */
  private createMazeScene(): void {
    if (!this.scene) return;

    // Coordenadas entregadas por el usuario (rectángulo de la mansión)
    const mansionCorners = [
      new BABYLON.Vector3(39.64079011400513, 0, 56.58017837888443),
      new BABYLON.Vector3(-58.78312106589467, 0, 56.52830268837474),
      new BABYLON.Vector3(-59.14558444393523, 0, -45.60276247736254),
      new BABYLON.Vector3(38.262917357934704, 0, -45.75699956326978),
    ];

    const minX = Math.min(...mansionCorners.map((v) => v.x));
    const maxX = Math.max(...mansionCorners.map((v) => v.x));
    const minZ = Math.min(...mansionCorners.map((v) => v.z));
    const maxZ = Math.max(...mansionCorners.map((v) => v.z));

    // Entradas solicitadas
    const entrances = [
      new BABYLON.Vector3(7.215832128882206, 0, 53.595853353774636),
      new BABYLON.Vector3(-18.658066946946217, 0, -42.729696346699455),
    ];

    // Parámetros de márgenes/puertas
    const outerMargin = 12;
    const innerMargin = 4;
    const doorWidth = 4.5;

    // Rectángulo base alrededor de la mansión
    const outerRect = {
      minX: minX - outerMargin,
      maxX: maxX + outerMargin,
      minZ: minZ - outerMargin,
      maxZ: maxZ + outerMargin,
    };

    // Asegurar apotema mínimo (distancia del centro a cada lado del rectángulo)
    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;
    const minApothem = 100; // solicitud del usuario: apotema mínimo de 100

    // Expandir si es necesario para cumplir apotema en X
    outerRect.minX = Math.min(outerRect.minX, centerX - minApothem);
    outerRect.maxX = Math.max(outerRect.maxX, centerX + minApothem);
    // Expandir si es necesario para cumplir apotema en Z
    outerRect.minZ = Math.min(outerRect.minZ, centerZ - minApothem);
    outerRect.maxZ = Math.max(outerRect.maxZ, centerZ + minApothem);
    const innerLimitRect = {
      minX: minX - innerMargin,
      maxX: maxX + innerMargin,
      minZ: minZ - innerMargin,
      maxZ: maxZ + innerMargin,
    };

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    if (this.mazeRoot) this.mazeRoot.dispose();
    this.mazeRoot = createMaze(this.scene, {
      outerRect,
      innerLimitRect,
      entrances,
      doorWidth,
      randomWall: {
        minHeight: 3,
        maxHeight: 5,
        minThickness: 1,
        maxThickness: 3,
      },
      grid: {
        cellSize: 6, // mantiene el ancho de pasillo solicitado
      },
      addShadow: !!this.shadowGenerator,
    });
  }

  private setupControls(): void {
    if (!this.scene || !this.canvas) return;

    // Asegurar que el canvas pueda recibir eventos de teclado
    this.canvas.setAttribute('tabindex', '0');
    this.canvas.focus();

    // Capturar puntero para controles FPS
    this.canvas.addEventListener('click', () => {
      this.canvas?.requestPointerLock();
      this.canvas?.focus();
    });

    // Manejar eventos de teclado directamente en el DOM
    window.addEventListener('keydown', (evt: KeyboardEvent) => {
      const key = evt.key.toLowerCase();

      // Solo prevenir por defecto para teclas de movimiento y juego
      if (
        [
          'w',
          'a',
          's',
          'd',
          'arrowup',
          'arrowdown',
          'arrowleft',
          'arrowright',
          'shift',
          ' ',
        ].includes(key)
      ) {
        evt.preventDefault();
      }

      this.controls[key] = true;
      this.handleKeyDown(key);
    });

    window.addEventListener('keyup', (evt: KeyboardEvent) => {
      const key = evt.key.toLowerCase();

      // Solo prevenir por defecto para teclas de movimiento y juego
      if (
        [
          'w',
          'a',
          's',
          'd',
          'arrowup',
          'arrowdown',
          'arrowleft',
          'arrowright',
          'shift',
          ' ',
        ].includes(key)
      ) {
        evt.preventDefault();
      }

      this.controls[key] = false;
      console.log('🔼 Tecla liberada:', key);
    });

    console.log('✅ Controles WASD + Arrow Keys configurados correctamente');
  }

  /**
   * Maneja las pulsaciones de teclas
   */
  private handleKeyDown(key: string): void {
    switch (key) {
      case 'l':
        this.toggleFlashlight();
        break;
      case 'c':
        this.toggleCreatorMode();
        break;
      case 'n':
        // Solo disponible en modo creativo
        if (this.playerState.isInCreatorMode) {
          this.toggleDayNightMode();
        }
        break;
      case ' ':
        this.playerAttack();
        break;
      case 'f12':
        this.toggleDebugMode();
        break;
      case 'h':
        this.showHelpMessage();
        break;
      case '1':
        this.playJohnnyAnimation('idle');
        break;
      case '2':
        this.playJohnnyAnimation('walk');
        break;
      case '3':
        this.playJohnnyAnimation('run');
        break;
      case 't':
        // Test de movimiento
        this.testMovement();
        break;
      case 'f':
        // Centrar cámara en Johnny manualmente
        this.centerCameraOnJohnny();
        break;
      case 'v':
        // Alternar entre 1ª y 3ª persona
        this.toggleCameraMode();
        break;
    }
  }

  // ============================================================================
  // FUNCIONES ESPECIALIZADAS DE CARGA DE MANSIÓN
  // ============================================================================

  /**
   * Carga un modelo OBJ/MTL de mansión con debug detallado
   */
  private async loadMansionOBJ(
    filePath: string,
    fileName: string
  ): Promise<{
    mansion: BABYLON.AbstractMesh | null;
    success: boolean;
    error?: string;
  }> {
    try {
      console.log(`🏚️ [OBJ] Cargando mansión: ${filePath}${fileName}`);

      console.log('✅ [OBJ] Plugin OBJ está disponible');
      console.log(`🔄 [OBJ] Intentando cargar: ${filePath}${fileName}`);

      const result: AssetLoadResult = await BABYLON.SceneLoader.ImportMeshAsync(
        '',
        filePath,
        fileName,
        this.scene!
      );

      console.log(`📊 [OBJ] Resultado carga mansión - Meshes: ${result.meshes?.length || 0}`);

      if (result.meshes && result.meshes.length > 0) {
        const mansion = result.meshes[0];
        console.log(`✅ [OBJ] Mansión cargada exitosamente`);
        console.log(`📍 [OBJ] Posición mansión: ${mansion.position.toString()}`);
        console.log(`📏 [OBJ] Escala mansión: ${mansion.scaling.toString()}`);

        return {
          mansion: mansion,
          success: true,
        };
      } else {
        throw new Error('No se encontraron meshes en el archivo OBJ');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error(`❌ [OBJ] Error cargando mansión:`, errorMessage);
      return {
        mansion: null,
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Carga un modelo GLB de casa con debug detallado
   */
  private async loadCasaGLB(
    filePath: string,
    fileName: string
  ): Promise<{
    mansion: BABYLON.AbstractMesh | null;
    success: boolean;
    error?: string;
  }> {
    // Try multiple path variations for GLB files
    const pathVariations = [
      `/assets/model/casa/${fileName}`, // Vite public path (most likely)
      `${filePath}${fileName}`, // Original config path
      `assets/model/casa/${fileName}`, // Without leading slash
      `public/assets/model/casa/${fileName}`, // Full public path
      `/${filePath}${fileName}`.replace('//', '/'), // Normalized path
    ];

    console.log(`🏠 [GLB] ========================================`);
    console.log(`🏠 [GLB] INTENTANDO CARGAR CASA: ${fileName}`);
    console.log(`🏠 [GLB] ========================================`);
    console.log(`🔍 [GLB] Variaciones de ruta a probar:`, pathVariations);

    // Verificar disponibilidad del loader GLB
    if (!BABYLON.SceneLoader.IsPluginForExtensionAvailable('.glb')) {
      console.error(`❌ [GLB] Loader GLB no está disponible en BabylonJS`);
      return {
        mansion: null,
        success: false,
        error: 'Loader GLB no está disponible en BabylonJS',
      };
    }

    for (let i = 0; i < pathVariations.length; i++) {
      const fullPath = pathVariations[i];
      try {
        console.log(`🔄 [GLB] Intento ${i + 1}/${pathVariations.length}: ${fullPath}`);

        // Extract path and filename for BABYLON.SceneLoader (BabylonJS 8.x way)
        const lastSlashIndex = fullPath.lastIndexOf('/');
        const basePath = fullPath.substring(0, lastSlashIndex + 1);
        const file = fullPath.substring(lastSlashIndex + 1);

        console.log(`📂 [GLB] BasePath: "${basePath}"`);
        console.log(`📄 [GLB] File: "${file}"`);

        // Usar BABYLON.SceneLoader.ImportMeshAsync (forma moderna BabylonJS 8.x)
        const result = await BABYLON.SceneLoader.ImportMeshAsync('', basePath, file, this.scene!);

        console.log(
          `📊 [GLB] Resultado - Meshes: ${result.meshes.length}, Animaciones: ${result.animationGroups.length}`
        );

        if (result.meshes.length === 0) {
          throw new Error('No se encontraron meshes en el archivo GLB');
        }

        const casa = result.meshes[0];
        console.log(`✅ [GLB] ¡CASA CARGADA EXITOSAMENTE! Ruta: ${fullPath}`);
        console.log(`📍 [GLB] Posición casa: ${casa.position.toString()}`);
        console.log(`📏 [GLB] Escala casa: ${casa.scaling.toString()}`);
        console.log(`🏠 [GLB] ========================================`);

        return {
          mansion: casa,
          success: true,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        console.warn(`⚠️ [GLB] Fallo intento ${i + 1} (${fullPath}):`);
        console.warn(`   └─ Error: ${errorMessage}`);

        // Continue to next variation unless this is the last one
        if (i === pathVariations.length - 1) {
          console.error(`❌ [GLB] TODOS LOS INTENTOS FALLARON`);
          console.error(`🏠 [GLB] ========================================`);
          return {
            mansion: null,
            success: false,
            error: `Todos los intentos GLB fallaron. Último error: ${errorMessage}. Rutas probadas: ${pathVariations.join(
              ', '
            )}`,
          };
        }
      }
    }

    // This should never be reached, but just in case
    return {
      mansion: null,
      success: false,
      error: 'Error inesperado en loadCasaGLB',
    };
  }

  /**
   * Crea una escena básica procedural como respaldo
   */
  private createFallbackMansion(): BABYLON.AbstractMesh {
    if (!this.scene) throw new Error('Escena no inicializada');

    console.log('🏗️ [FALLBACK] Creando casa procedural...');

    // Crear un ground básico
    const ground = BABYLON.MeshBuilder.CreateGround(
      'casaGround',
      { width: 100, height: 100 },
      this.scene
    );
    const groundMaterial = new BABYLON.StandardMaterial('casaGroundMat', this.scene);
    groundMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    groundMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    ground.material = groundMaterial;
    ground.checkCollisions = true;

    // Crear algunas estructuras básicas para BABYLON.dar ambiente
    for (let i = 0; i < 10; i++) {
      const building = BABYLON.MeshBuilder.CreateBox(
        `casaBuilding${i}`,
        {
          width: Math.random() * 5 + 2,
          height: Math.random() * 8 + 3,
          depth: Math.random() * 5 + 2,
        },
        this.scene
      );

      building.position.x = (Math.random() - 0.5) * 80;
      building.position.z = (Math.random() - 0.5) * 80;
      building.position.y = building.scaling.y / 2;

      const material = new BABYLON.StandardMaterial(`casaBuildingMat${i}`, this.scene);
      material.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.15);
      material.specularColor = new BABYLON.Color3(0, 0, 0);
      building.material = material;
      building.checkCollisions = true;
    }

    console.log('✅ [FALLBACK] Casa procedural creada');
    return ground; // Retornar el ground como casa principal
  }

  // ============================================================================

  /**
   * Carga los assets del juego usando funciones especializadas
   */
  private async loadAssets(): Promise<void> {
    if (!this.scene) return;

    try {
      console.log('🏠 Iniciando carga de casa GLB...');

      // Intentar cargar casa GLB usando función especializada
      // const casaResult = await this.loadCasaGLB(
      //   this.config.assets.mansion.path,
      //   this.config.assets.mansion.file
      // );

      const mansionResult = await this.loadMansionOBJ(
        this.config.assets.mansion.path,
        this.config.assets.mansion.file
      );

      if (mansionResult.success && mansionResult.mansion) {
        this.mansion = mansionResult.mansion;
        this.setupMansion();
        console.log('✅ Casa GLB cargada y configurada exitosamente');
      } else {
        console.warn('⚠️ No se pudo cargar casa GLB, creando respaldo...');
        this.mansion = this.createFallbackMansion();
        this.setupMansion();
        console.log('✅ Casa procedural de respaldo creada');
      }
    } catch (error) {
      console.error('❌ Error crítico en carga de assets:', error);
      console.log('🏗️ Creando casa de emergencia...');
      this.mansion = this.createFallbackMansion();
      this.setupMansion();
    }
  }

  /**
   * Carga Johnny Cage con sus animaciones usando funciones especializadas
   */
  private async loadJohnnyCage(): Promise<void> {
    if (!this.scene) return;

    try {
      console.log('🥋 ========================================');
      console.log('🥋 INICIANDO CARGA DE JOHNNY CAGE');
      console.log('🥋 ========================================');
      console.log('📋 Configuración:', JOHNNY_CAGE_CONFIG);

      this.johnnyCage = new Character(JOHNNY_CAGE_CONFIG, this.scene);

      console.log('🎭 Instancia de Character creada, iniciando carga GLB...');
      await this.johnnyCage.load();

      // Verificar si se cargó correctamente
      if (this.johnnyCage.mesh) {
        console.log('✅ Johnny Cage mesh encontrado:', this.johnnyCage.mesh.name);
        console.log('📍 Posición de Johnny:', this.johnnyCage.mesh.position.toString());
        console.log('📏 Escalado de Johnny:', this.johnnyCage.mesh.scaling.toString());

        // Validar que todas las animaciones GLB se cargaron
        const animationsValid = this.johnnyCage.validateAnimations();
        if (animationsValid) {
          console.log('🎬 ✅ Todas las animaciones GLB validadas correctamente');
        } else {
          console.warn('🎬 ⚠️ Algunas animaciones GLB no se cargaron correctamente');
        }

        // Añadir Johnny a las sombras si están disponibles
        if (this.shadowGenerator) {
          this.shadowGenerator.addShadowCaster(this.johnnyCage.mesh);
          console.log('🌫️ Johnny añadido al generador de sombras');
        }
      } else {
        console.warn('⚠️ Johnny Cage mesh es null - usando modelo de respaldo');
      }

      console.log('🥋 ========================================');
      console.log('✅ JOHNNY CAGE CARGADO Y LISTO PARA LA ACCIÓN! (GLB)');
      console.log('🥋 ========================================');
    } catch (error) {
      console.error('🥋 ========================================');
      console.error('❌ ERROR CARGANDO JOHNNY CAGE:');
      console.error('🥋 ========================================');
      console.error('Error completo:', error);
      console.log('🔄 Continuando sin Johnny Cage...');

      // Set johnnyCage to null so other systems know it failed
      this.johnnyCage = null;
    }
  }

  /**
   * Configura la casa después de cargarla
   */
  private setupMansion(): void {
    if (!this.mansion) return;

    // Configurar colisiones para la casa
    this.mansion.checkCollisions = true;

    // Escalar apropiadamente si es necesario
    this.mansion.scaling = new BABYLON.Vector3(1, 1, 1);
    this.mansion.position = new BABYLON.Vector3(0, 0, 0);

    // Aplicar shader customizado para iluminación
    this.applyMansionShaders();
  }

  /**
   * Aplica los shaders customizados a la mansión
   */
  private applyMansionShaders(): void {
    if (!this.mansion || !this.scene) return;

    const horrorMaterial = new BABYLON.ShaderMaterial(
      'horrorMansion',
      this.scene,
      {
        vertex: 'horrorMansion',
        fragment: 'horrorMansion',
      },
      {
        attributes: ['position', 'normal', 'uv'],
        uniforms: [
          'world',
          'worldView',
          'worldViewProjection',
          'vLightPosition',
          'vCameraPosition',
          'fogColor',
          'fogDensity',
          'time',
        ],
        samplers: ['textureSampler'],
      }
    );

    // Configurar uniforms iniciales
    horrorMaterial.setVector3('vLightPosition', new BABYLON.Vector3(0, 10, 0));
    horrorMaterial.setColor3('fogColor', this.config.atmosphere.fogColor);
    horrorMaterial.setFloat('fogDensity', this.config.atmosphere.fogDensity);

    // Actualizar uniforms en cada frame
    this.scene.registerBeforeRender(() => {
      if (!this.camera) return;

      horrorMaterial.setFloat('time', Date.now() / 1000);
      horrorMaterial.setVector3('vCameraPosition', this.camera.position);

      if (this.flashlight) {
        horrorMaterial.setVector3('vLightPosition', this.flashlight.position);
      }
    });

    // Aplicar material a los meshes
    const meshes = this.mansion.getChildMeshes ? this.mansion.getChildMeshes() : [this.mansion];

    meshes.forEach((mesh, index) => {
      if (mesh.material && (mesh.material as any).diffuseTexture) {
        const materialInstance = horrorMaterial.clone(`horrorMaterial_${index}`);
        materialInstance.setTexture('textureSampler', (mesh.material as any).diffuseTexture);
        mesh.material = materialInstance;
      } else {
        const defaultTexture = new BABYLON.Texture(
          this.config.assets.defaultTexturePath,
          this.scene!
        );
        horrorMaterial.setTexture('textureSampler', defaultTexture);
        mesh.material = horrorMaterial;
      }
    });

    console.log('🎨 Shaders de horror aplicados a la mansión');
  }

  /**
   * Configura el jugador/cámara
   */
  private setupPlayer(): void {
    if (!this.scene || !this.canvas) return;
    if (this.config.cameraMode === 'firstPerson') {
      this.setupFirstPersonCamera();
    } else {
      this.setupThirdPersonCamera();
    }
  }

  /**
   * Configura ArcRotateCamera para 3ª persona
   */
  private setupThirdPersonCamera(): void {
    if (!this.scene || !this.canvas) return;
    const camCfg = this.config.thirdPersonCamera;

    const target = this.johnnyCage
      ? this.johnnyCage.getPosition().add(new BABYLON.Vector3(0, camCfg.targetOffsetY, 0))
      : new BABYLON.Vector3(0, camCfg.targetOffsetY, 0);

    const arc = new BABYLON.ArcRotateCamera(
      'playerCamera',
      camCfg.alpha,
      camCfg.beta,
      camCfg.radius,
      target,
      this.scene
    );

    arc.attachControl(this.canvas, true);
    arc.panningSensibility = camCfg.panningSensibility;
    arc.lowerBetaLimit = camCfg.lowerBetaLimit;
    arc.upperBetaLimit = camCfg.upperBetaLimit;
    arc.lowerRadiusLimit = camCfg.minRadius;
    arc.upperRadiusLimit = camCfg.maxRadius;
    arc.angularSensibilityX = camCfg.angularSensibilityX;
    arc.angularSensibilityY = camCfg.angularSensibilityY;
    arc.wheelPrecision = camCfg.wheelPrecision;

    arc.minZ = this.config.camera.minZ;
    arc.maxZ = this.config.camera.maxZ;
    arc.checkCollisions = camCfg.checkCollisions;
    arc.collisionRadius = camCfg.collisionRadius.clone();

    this.camera = arc;
    if (this.scene) this.scene.activeCamera = this.camera;
    // Mostrar al personaje en 3ª persona
    this.setJohnnyVisibility(true);
    console.log('📹 Cámara 3ª persona configurada (ArcRotateCamera)');
  }

  /**
   * Configura UniversalCamera para 1ª persona (FPS)
   */
  private setupFirstPersonCamera(): void {
    if (!this.scene || !this.canvas) return;
    const cfg = this.config.firstPersonCamera;

    // Posición inicial: cabeza de Johnny si existe, si no origen elevado
    const startPos = this.johnnyCage
      ? this.johnnyCage.getPosition().add(new BABYLON.Vector3(0, cfg.heightOffset, 0))
      : new BABYLON.Vector3(0, cfg.heightOffset, 0);

    const cam = new BABYLON.UniversalCamera('fpsCamera', startPos, this.scene);
    cam.setTarget(startPos.add(new BABYLON.Vector3(0, 0, 1))); // mirar hacia adelante
    cam.fov = cfg.fov;
    cam.inertia = cfg.inertia;
    cam.speed = cfg.speed; // por si usamos inputs del propio FreeCamera

    // Controles del usuario (mouse look)
    cam.attachControl(this.canvas, true);
    // Ajustar sensibilidad del mouse si está disponible
    const mouse = cam.inputs.attached.mouse as any;
    if (mouse && typeof mouse.angularSensibility !== 'undefined') {
      mouse.angularSensibility = cfg.angularSensibility;
    }

    // Colisiones y física básica
    cam.minZ = this.config.camera.minZ;
    cam.maxZ = this.config.camera.maxZ;
    cam.checkCollisions = cfg.checkCollisions;
    cam.applyGravity = cfg.applyGravity;
    cam.ellipsoid = cfg.collisionRadius.clone();

    this.camera = cam;
    if (this.scene) this.scene.activeCamera = this.camera;
    // Ocultar al personaje en 1ª persona para evitar ver el cuerpo
    this.setJohnnyVisibility(false);
    console.log('📹 Cámara 1ª persona configurada (UniversalCamera)');
  }

  /**
   * Alterna entre cámara de 1ª y 3ª persona
   */
  private toggleCameraMode(): void {
    this.config.cameraMode =
      this.config.cameraMode === 'firstPerson' ? 'thirdPerson' : 'firstPerson';
    console.log(`🎥 Alternando modo de cámara a: ${this.config.cameraMode}`);
    this.recreateCamera();
  }

  /**
   * Re-crea la cámara actual sin reiniciar la escena
   */
  private recreateCamera(): void {
    if (!this.scene || !this.canvas) return;
    // Detach y dispose de la cámara actual
    if (this.camera) {
      try {
        this.camera.detachControl();
      } catch {}
      this.camera.dispose();
      this.camera = null;
    }

    // Crear la nueva cámara según el modo actual
    if (this.config.cameraMode === 'firstPerson') {
      this.setupFirstPersonCamera();
    } else {
      this.setupThirdPersonCamera();
    }

    // Asegurar cámara activa y refrescar linterna
    if (this.scene && this.camera) {
      this.scene.activeCamera = this.camera;
    }
    this.updateFlashlightPosition();
  }

  /**
   * Controla la visibilidad del personaje (útil para 1ª persona)
   */
  private setJohnnyVisibility(visible: boolean): void {
    if (!this.johnnyCage || !this.johnnyCage.mesh) return;
    const root = this.johnnyCage.mesh;
    // No deshabilitamos (setEnabled) para que animaciones/posición sigan actualizando
    root.isVisible = visible;
    if (typeof (root as any).getChildMeshes === 'function') {
      const children = (root as any).getChildMeshes() as BABYLON.AbstractMesh[];
      children.forEach((m) => (m.isVisible = visible));
    }
  }

  /**
   * Configura la iluminación
   */
  private setupLighting(): void {
    if (!this.scene) return;

    const { lighting } = this.config;

    // Luz ambiental
    const ambientLight = new BABYLON.HemisphericLight(
      'ambientLight',
      new BABYLON.Vector3(0, 1, 0),
      this.scene
    );
    ambientLight.intensity = lighting.ambient.intensity;
    ambientLight.diffuse = lighting.ambient.diffuse;

    // Luz lunar
    const moonLight = new BABYLON.DirectionalLight(
      'moonLight',
      lighting.moon.direction,
      this.scene
    );
    moonLight.intensity = lighting.moon.intensity;
    moonLight.diffuse = lighting.moon.diffuse;
    moonLight.specular = lighting.moon.specular;

    // Configurar sombras
    this.shadowGenerator = new BABYLON.ShadowGenerator(lighting.shadows.mapSize, moonLight);
    this.shadowGenerator.useBlurExponentialShadowMap = lighting.shadows.useBlurShadows;
    this.shadowGenerator.blurKernel = lighting.shadows.blurKernel;

    if (this.mansion) {
      this.shadowGenerator.addShadowCaster(this.mansion);
    }
  }

  /**
   * Configura los efectos de terror
   */
  private setupHorrorEffects(): void {
    this.createFlashlight();
    this.setupAmbientSounds();
    this.setupPostProcessing();
    this.createAtmosphericEffects();
    this.setupHorrorEvents();
  }

  /**
   * Crea la linterna del jugador
   */
  private createFlashlight(): void {
    if (!this.scene || !this.camera) return;

    const { flashlight } = this.config;

    this.flashlight = new BABYLON.SpotLight(
      'flashlight',
      this.camera.position,
      this.camera.getForwardRay().direction,
      flashlight.angle,
      2,
      this.scene
    );

    // Empezar apagada y con decaimiento físico para un haz más natural
    this.flashlight.intensity = 0;
    this.flashlight.falloffType = BABYLON.Light.FALLOFF_PHYSICAL;
    this.flashlight.diffuse = flashlight.color;
    this.flashlight.range = flashlight.range;
    this.flashlight.exponent = flashlight.exponent;

    // Inicializar objetivo de intensidad
    this.flashlightTargetIntensity = 0;

    // Parpadeo aleatorio
    this.scene.registerBeforeRender(() => {
      if (!this.flashlight) return;

      // Objetivo base según estado ON/OFF
      let target = this.playerState.isFlashlightOn ? flashlight.intensity : 0;

      // Parpadeo suave: pequeña variación del objetivo
      if (this.playerState.isFlashlightOn && Math.random() < flashlight.flickerProbability) {
        const jitter = UTILS.randomBetween(-0.2, 0.2); // variación pequeña
        target = Math.max(0, target + jitter);
      }

      // Interpolación suave hacia el objetivo
      const current = this.flashlight.intensity;
      const lerpFactor = 0.15; // suavizado
      const next = current + (target - current) * lerpFactor;
      this.flashlight.intensity = next;
    });
  }

  /**
   * Configura efectos atmosféricos con partículas
   */
  private createAtmosphericEffects(): void {
    if (!this.scene || !this.johnnyCage) return;

    const { particles } = this.config;

    this.particleSystem = new BABYLON.ParticleSystem(
      particles.name,
      particles.capacity,
      this.scene
    );
    this.particleSystem.particleTexture = new BABYLON.Texture(
      'https://playground.babylonjs.com/textures/flare.png',
      this.scene
    );

    // Hacer que las partículas emanen desde Johnny
    this.particleSystem.emitter = this.johnnyCage.getPosition();
    this.particleSystem.minEmitBox = particles.minEmitBox;
    this.particleSystem.maxEmitBox = particles.maxEmitBox;

    this.particleSystem.color1 = particles.color1;
    this.particleSystem.color2 = particles.color2;
    this.particleSystem.colorDead = particles.colorDead;

    this.particleSystem.minSize = particles.minSize;
    this.particleSystem.maxSize = particles.maxSize;
    this.particleSystem.minLifeTime = particles.minLifeTime;
    this.particleSystem.maxLifeTime = particles.maxLifeTime;
    this.particleSystem.emitRate = particles.emitRate;

    this.particleSystem.direction1 = particles.direction1;
    this.particleSystem.direction2 = particles.direction2;
    this.particleSystem.minEmitPower = particles.minEmitPower;
    this.particleSystem.maxEmitPower = particles.maxEmitPower;

    this.particleSystem.start();

    // Crear pequeñas luces que sigan a las partículas (luciérnagas)
    this.setupFireflyLights();
  }

  /**
   * Crea y sincroniza hasta 5 luces puntuales para que sigan a las partículas
   * simulando luciérnagas que iluminan muy poco en un rango de 0-5.
   */
  private setupFireflyLights(): void {
    if (!this.scene || !this.particleSystem) return;

    // Limpiar luces anteriores si se re-crea el sistema
    this.fireflyLights.forEach((l) => l.dispose());
    this.fireflyLights = [];

    const maxLights = Math.min(5, this.particleSystem.getCapacity());

    for (let i = 0; i < maxLights; i++) {
      const light = new BABYLON.PointLight(
        `fireflyLight_${i}`,
        new BABYLON.Vector3(0, 0, 0),
        this.scene
      );
      // Luz muy tenue, con caída física y alcance corto (0-5)
      light.intensity = 0.25; // pequeño brillo
      light.range = 5;
      light.falloffType = BABYLON.Light.FALLOFF_PHYSICAL;
      light.diffuse = new BABYLON.Color3(0.8, 1.0, 0.7); // tono verdoso suave
      this.fireflyLights.push(light);
    }

    // Actualizar posiciones de las luces para que sigan a las primeras partículas activas
    this.scene.onBeforeRenderObservable.add(() => {
      if (!this.particleSystem) return;
      const particles = (this.particleSystem as any).particles as BABYLON.Particle[] | undefined;
      for (let i = 0; i < this.fireflyLights.length; i++) {
        const light = this.fireflyLights[i];
        if (particles && i < particles.length && particles[i] && particles[i].position) {
          light.setEnabled(true);
          light.position.copyFrom(particles[i].position);
        } else {
          light.setEnabled(false);
        }
      }
    });
  }

  /**
   * Configura eventos aleatorios de terror
   */
  private setupHorrorEvents(): void {
    // Registrar eventos
    this.horrorEvents.set('flickerLights', () => this.flickerLights());
    this.horrorEvents.set('shadowFigure', () => this.createShadowFigure());
    this.horrorEvents.set('scareSound', () => this.playScareSound());
    this.horrorEvents.set('fogIncrease', () => this.temporaryFogIncrease());

    // Ejecutar eventos aleatorios
    setInterval(() => {
      if (Math.random() < this.config.horror.eventProbability) {
        this.triggerRandomHorrorEvent();
      }
    }, 5000);
  }

  /**
   * Configura sonidos ambientales
   */
  private setupAmbientSounds(): void {
    console.log('🔊 Configurando sonidos ambientales...');
    // TODO: Implementar sistema de audio real
  }

  /**
   * Configura post-processing
   */
  private setupPostProcessing(): void {
    if (!this.camera) return;

    const { postProcessing } = this.config;

    const postProcess = new BABYLON.ImageProcessingPostProcess('processing', 1.0, this.camera);
    postProcess.vignetteEnabled = postProcessing.vignette.enabled;
    postProcess.vignetteWeight = postProcessing.vignette.weight;
    postProcess.vignetteStretch = postProcessing.vignette.stretch;
    postProcess.vignetteColor = postProcessing.vignette.color;
    postProcess.vignetteCameraFov = postProcessing.vignette.cameraFov;
  }

  /**
   * Optimiza el rendimiento del juego
   */
  private optimizePerformance(): void {
    if (!this.scene || !this.camera) return;

    // Configurar LOD y culling
    this.scene.autoClear = false;
    this.scene.autoClearDepthAndStencil = false;

    // Optimizar sombras
    if (this.shadowGenerator) {
      this.shadowGenerator.bias = 0.0001;
      this.shadowGenerator.normalBias = 0.02;
    }

    console.log('⚡ Optimizaciones de rendimiento aplicadas');
  }

  /**
   * Actualiza el estado del jugador
   */
  private updatePlayer(): void {
    if (!this.camera) {
      console.warn('⚠️ No hay cámara para actualizar jugador');
      return;
    }

    if (!this.johnnyCage) {
      console.warn('⚠️ Johnny Cage no está cargado');
      return;
    }

    // Manejar el movimiento y obtener información
    const movementInfo = this.handleMovement();

    // Actualizar resistencia
    this.updateStamina();

    // Actualizar animaciones de Johnny Cage
    this.johnnyCage.updateAnimation(movementInfo.isMoving, movementInfo.isRunning);

    // Debug: mostrar posición actual cada cierto tiempo
    if (!this.playerState.lastPositionLog || Date.now() - this.playerState.lastPositionLog > 1000) {
      const position = this.johnnyCage.getPosition();
      console.log('📍 Posición actual de Johnny:', position.toString());
      this.playerState.lastPositionLog = Date.now();
    }
  }

  /**
   * Centra manualmente la cámara en Johnny (sin seguimiento automático)
   */
  private centerCameraOnJohnny(): void {
    if (!this.camera || !this.johnnyCage) {
      console.warn('⚠️ No se puede centrar cámara - falta cámara o Johnny');
      return;
    }

    const johnnyPosition = this.johnnyCage.getPosition();
    this.camera.setTarget(johnnyPosition);
    console.log('📷 Cámara centrada manualmente en Johnny:', johnnyPosition.toString());
  }

  /**
   * Actualiza la cámara para seguir a Johnny
   */
  private updateCameraTarget(): void {
    if (!this.camera || !this.johnnyCage) return;

    // Solo aplica a 3ª persona (ArcRotateCamera)
    if (this.camera instanceof BABYLON.ArcRotateCamera) {
      const camCfg = this.config.thirdPersonCamera;
      const desired = this.johnnyCage
        .getPosition()
        .add(new BABYLON.Vector3(0, camCfg.targetOffsetY, 0));

      const currentTarget = this.camera.getTarget();
      const targetOffset = desired.subtract(currentTarget);
      const newTarget = currentTarget.add(targetOffset.scale(camCfg.smoothFactor));

      this.camera.setTarget(newTarget);
    }
  }

  /**
   * Obtiene el yaw (rotación Y) de la cámara para alinear a Johnny
   */
  private getCameraYaw(): number {
    if (!this.camera) return 0;
    if (this.camera instanceof BABYLON.ArcRotateCamera) {
      return this.camera.alpha;
    }
    const dir = this.camera.getForwardRay().direction;
    // yaw a partir del vector dirección (x,z)
    return Math.atan2(dir.x, dir.z);
  }

  /**
   * Actualiza la posición de la linterna
   */
  private updateFlashlightPosition(): void {
    if (!this.flashlight || !this.johnnyCage || !this.camera) return;

    const johnnyPosition = this.johnnyCage.getPosition();

    // Posicionar la linterna cerca de Johnny
    this.flashlight.position = johnnyPosition.clone();
    this.flashlight.position.y += 1.8; // Altura aproximada de la cabeza

    // Obtener la dirección exacta de la cámara
    const cameraDirection = this.camera.getForwardRay().direction;

    // La linterna apunta en la misma dirección que la cámara
    this.flashlight.direction = cameraDirection.clone();

    // Hacer que Johnny mire hacia la misma dirección que la cámara
    const cameraRotationY = this.getCameraYaw();
    this.johnnyCage.setRotation(cameraRotationY);
  }

  /**
   * Maneja el movimiento del jugador
   */
  private handleMovement(): { isMoving: boolean; isRunning: boolean } {
    if (!this.johnnyCage || !this.camera) {
      console.warn('⚠️ No se puede mover - Johnny:', !!this.johnnyCage, 'Camera:', !!this.camera);
      return { isMoving: false, isRunning: false };
    }

    // Calcular deltaTime properly
    const currentTime = performance.now();
    const deltaTime = this.lastTime === 0 ? 1 / 60 : (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    const { movement } = this.config;
    const { isInCreatorMode } = this.playerState;

    // Determinar velocidad - Usar velocidades más altas para movimiento visible
    let baseSpeed = isInCreatorMode ? 20 : 5; // Velocidades fijas más altas
    const isRunning = this.controls['shift'] && this.playerState.stamina > 0;
    const speed = isRunning ? baseSpeed * 2 : baseSpeed;

    this.playerState.isRunning = isRunning;

    // Calcular dirección de movimiento basada en la orientación de la cámara
    let movementVector = BABYLON.Vector3.Zero();

    // Obtener los vectores forward y right de la cámara
    const cameraMatrix = this.camera.getWorldMatrix();
    const cameraForward = BABYLON.Vector3.TransformNormal(
      new BABYLON.Vector3(0, 0, 1),
      cameraMatrix
    ).normalize();
    const cameraRight = BABYLON.Vector3.TransformNormal(
      new BABYLON.Vector3(1, 0, 0),
      cameraMatrix
    ).normalize();

    // Proyectar los vectores en el plano horizontal (Y = 0)
    cameraForward.y = 0;
    cameraRight.y = 0;
    cameraForward.normalize();
    cameraRight.normalize();

    // Movimiento relativo a la cámara - WASD + Arrow Keys
    if (this.controls['w']) {
      movementVector.addInPlace(cameraForward);
    }
    if (this.controls['s']) {
      movementVector.addInPlace(cameraForward.scale(-1));
    }
    if (this.controls['a']) {
      movementVector.addInPlace(cameraRight.scale(-1));
    }
    if (this.controls['d']) {
      movementVector.addInPlace(cameraRight);
    }

    const isMoving = movementVector.length() > 0;

    // Debug: Mostrar vector de movimiento antes de aplicarlo
    if (isMoving) {
      console.log(
        '📐 Vector de movimiento RAW:',
        movementVector.toString(),
        'Magnitud:',
        movementVector.length()
      );
    }

    // Hacer que el personaje siempre mire en la dirección de la cámara
    const cameraRotationY = this.getCameraYaw();
    this.johnnyCage.setRotation(cameraRotationY);

    // Aplicar movimiento a Johnny
    if (isMoving) {
      console.log('🚶 Aplicando movimiento - Vector RAW:', movementVector, 'Velocidad:', speed);

      // Aplicar el movimiento al personaje directamente (sin normalizar aún, lo hace en move())
      this.johnnyCage.move(movementVector, speed, deltaTime);

      // Actualizar partículas para seguir a Johnny si están activas
      if (this.particleSystem) {
        this.particleSystem.emitter = this.johnnyCage.getPosition();
      }

      // Efectos de movimiento
      if (!isInCreatorMode) {
        this.playFootstepSounds(isRunning);
      }
    }

    // Actualizar target de cámara sólo si es 3ª persona
    if (this.camera instanceof BABYLON.ArcRotateCamera) {
      this.updateCameraTarget();
    }

    return { isMoving, isRunning };
  }

  /**
   * Actualiza el sistema de resistencia
   */
  private updateStamina(): void {
    const { stamina } = this.config.movement;

    if (this.playerState.isRunning) {
      this.playerState.stamina = Math.max(0, this.playerState.stamina - stamina.drainRate);
    } else {
      this.playerState.stamina = Math.min(
        stamina.max,
        this.playerState.stamina + stamina.regenRate
      );
    }
  }

  /**
   * Reproduce sonidos de pasos
   */
  private playFootstepSounds(isRunning: boolean): void {
    const interval = isRunning ? 200 : 400;

    if (!this.playerState.lastFootstep || Date.now() - this.playerState.lastFootstep > interval) {
      console.log(isRunning ? '🏃 *pasos rápidos*' : '🚶 *pasos lentos*');
      this.playerState.lastFootstep = Date.now();
    }
  }

  /**
   * Activa/desactiva la linterna
   */
  private toggleFlashlight(): void {
    if (!this.flashlight) return;

    this.playerState.isFlashlightOn = !this.playerState.isFlashlightOn;
    // No establecer intensidad abruptamente; el beforeRender suaviza hacia el objetivo

    console.log(
      this.playerState.isFlashlightOn
        ? GAME_MESSAGES.STATUS.FLASHLIGHT_ON
        : GAME_MESSAGES.STATUS.FLASHLIGHT_OFF
    );
  }

  /**
   * Activa/desactiva el modo creador
   */
  private toggleCreatorMode(): void {
    if (!this.camera) return;

    this.playerState.isInCreatorMode = !this.playerState.isInCreatorMode;

    if (this.playerState.isInCreatorMode) {
      // En modo creador, aumentar la velocidad de movimiento
      console.log(GAME_MESSAGES.STATUS.CREATOR_MODE_ON);
      console.log('🎨 Modo Creativo activado - Presiona [N] para alternar DÍA/NOCHE');
    } else {
      console.log(GAME_MESSAGES.STATUS.CREATOR_MODE_OFF);
      // Si sal del modo creativo, restaurar modo noche automáticamente
      if (this.playerState.isDayMode) {
        this.playerState.isDayMode = false;
        this.activateNightMode();
      }
    }
  }

  /**
   * Alterna entre modo día y noche (solo en modo creativo)
   */
  private toggleDayNightMode(): void {
    if (!this.scene || !this.playerState.isInCreatorMode) return;

    this.playerState.isDayMode = !this.playerState.isDayMode;

    if (this.playerState.isDayMode) {
      this.activateDayMode();
      console.log(GAME_MESSAGES.STATUS.DAY_MODE_ON);
      console.log('� Ambiente diurno: Perfectecto para examinar todos los modelos');
      console.log('☀️ Iluminación completa y brillante activa');
    } else {
      this.activateNightMode();
      console.log(GAME_MESSAGES.STATUS.DAY_MODE_OFF);
      console.log('🌙 Ambiente nocturno: Atmósfera de terror restaurada');
    }
  }

  /**
   * Activa el modo día con iluminación brillante
   */
  private activateDayMode(): void {
    if (!this.scene) return;

    const { dayMode } = this.config.lighting;
    const { dayMode: dayAtmosphere } = this.config.atmosphere;

    // Guardar configuración original si no está guardada
    if (!this.originalAmbientColor) {
      this.originalAmbientColor = this.scene.ambientColor.clone();
    }

    // Configurar atmósfera de día
    this.scene.ambientColor = dayMode.ambient.diffuse;
    this.scene.fogColor = dayAtmosphere.fogColor;
    this.scene.fogDensity = dayAtmosphere.fogDensity;
    this.scene.clearColor = new BABYLON.Color4(
      dayAtmosphere.clearColor.r,
      dayAtmosphere.clearColor.g,
      dayAtmosphere.clearColor.b,
      1.0
    );

    // Actualizar luces existentes para modo día
    this.scene.lights.forEach((light, index) => {
      if (light instanceof BABYLON.HemisphericLight) {
        // Luz ambiental muy brillante
        light.intensity = dayMode.ambient.intensity;
        light.diffuse = dayMode.ambient.diffuse;
      } else if (light instanceof BABYLON.DirectionalLight) {
        // Convertir luna en sol
        light.intensity = dayMode.sun.intensity;
        light.diffuse = dayMode.sun.diffuse;
        light.specular = dayMode.sun.specular;
        light.direction = dayMode.sun.direction;
      }
      light.setEnabled(true);
    });

    // Desactivar la linterna en modo día (no es necesaria)
    if (this.flashlight) {
      this.flashlight.setEnabled(false);
    }
  }

  /**
   * Activa el modo noche con atmósfera de terror
   */
  private activateNightMode(): void {
    if (!this.scene) return;

    const { lighting, atmosphere } = this.config;

    // Restaurar atmósfera nocturna
    this.scene.ambientColor = this.originalAmbientColor || lighting.ambient.diffuse;
    this.scene.fogColor = atmosphere.fogColor;
    this.scene.fogDensity = atmosphere.fogDensity;
    this.scene.clearColor = new BABYLON.Color4(
      atmosphere.clearColor.r,
      atmosphere.clearColor.g,
      atmosphere.clearColor.b,
      1.0
    );
    this.scene.fogMode = atmosphere.fogMode;

    // Restaurar luces originales
    this.scene.lights.forEach((light, index) => {
      if (light instanceof BABYLON.HemisphericLight) {
        // Luz ambiental tenue
        light.intensity = lighting.ambient.intensity;
        light.diffuse = lighting.ambient.diffuse;
      } else if (light instanceof BABYLON.DirectionalLight) {
        // Luz lunar
        light.intensity = lighting.moon.intensity;
        light.diffuse = lighting.moon.diffuse;
        light.specular = lighting.moon.specular;
        light.direction = lighting.moon.direction;
      }
      light.setEnabled(true);
    });

    // Reactivar la linterna si estaba encendida
    if (this.flashlight && this.playerState.isFlashlightOn) {
      this.flashlight.setEnabled(true);
    }
  }

  /**
   * Reproduce una animación específica de Johnny Cage
   */
  private playJohnnyAnimation(animationName: 'idle' | 'walk' | 'run'): void {
    if (this.johnnyCage) {
      this.johnnyCage.playAnimation(animationName);
      console.log(`🥋 Johnny Cage: ${animationName}`);
    } else {
      console.warn('Johnny Cage no está cargado');
    }
  }

  /**
   * Maneja el ataque del jugador
   */
  private playerAttack(): void {
    console.log(GAME_MESSAGES.STATUS.ATTACK);
    // TODO: Implementar lógica de ataque
  }

  /**
   * Activa/desactiva el modo debug
   */
  private toggleDebugMode(): void {
    if (!this.scene) return;

    if (this.scene.debugLayer.isVisible()) {
      this.scene.debugLayer.hide();
      console.log(GAME_MESSAGES.STATUS.DEBUG_OFF);
    } else {
      this.scene.debugLayer.show();
      console.log(GAME_MESSAGES.STATUS.DEBUG_ON);
    }
  }

  /**
   * Muestra el mensaje de ayuda
   */
  private showHelpMessage(): void {
    const helpMessage = GAME_MESSAGES.HELP.replace('{{STATUS}}', this.getStatusInfo());
    console.log(helpMessage);
  }

  /**
   * Obtiene información del estado actual
   */
  private getStatusInfo(): string {
    const johnnyPosition = this.johnnyCage ? this.johnnyCage.getPosition() : BABYLON.Vector3.Zero();

    return `
Estado actual:
  Linterna: ${this.playerState.isFlashlightOn ? 'ENCENDIDA 🔦' : 'APAGADA 🔦'}
  Modo: ${this.playerState.isInCreatorMode ? 'CREADOR 🛠️' : 'JUEGO 🎮'}
  Ambiente: ${this.playerState.isDayMode ? 'DÍA ☀️' : 'NOCHE 🌙'}
  Resistencia: ${Math.round(this.playerState.stamina)}%
  Posición de Johnny: ${johnnyPosition.toString()}
  Animación actual: ${this.johnnyCage?.state.currentAnimation || 'N/A'}
    `;
  }

  /**
   * Dispara un evento de terror aleatorio
   */
  private triggerRandomHorrorEvent(): void {
    const eventTypes: HorrorEventType[] = [
      'flickerLights',
      'shadowFigure',
      'scareSound',
      'fogIncrease',
    ];
    const randomEventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

    const eventCallback = this.horrorEvents.get(randomEventType);
    if (eventCallback) {
      eventCallback();
    }
  }

  /**
   * Hace parpadear las luces
   */
  private flickerLights(): void {
    if (!this.playerState.isFlashlightOn || !this.flashlight) return;

    console.log(GAME_MESSAGES.HORROR_EVENTS.FLICKER);

    const { flickerLights } = this.config.horrorEvents;
    const originalIntensity = this.flashlight.intensity;

    let flickerCount = 0;
    const flickerInterval = setInterval(() => {
      this.flashlight!.intensity = this.flashlight!.intensity > 0 ? 0 : originalIntensity;
      flickerCount++;

      if (flickerCount >= flickerLights.flickerCount) {
        clearInterval(flickerInterval);
        this.flashlight!.intensity = originalIntensity;
      }
    }, flickerLights.interval);
  }

  /**
   * Crea una figura sombría temporal
   */
  private createShadowFigure(): void {
    if (!this.scene || !this.camera) return;

    console.log(GAME_MESSAGES.HORROR_EVENTS.SHADOW);

    const { shadowFigure } = this.config.horrorEvents;

    const figure = BABYLON.MeshBuilder.CreateBox('shadowFigure', { size: 2 }, this.scene);
    figure.position = this.camera.position.add(
      this.camera.getForwardRay().direction.scale(shadowFigure.distance)
    );
    figure.position.y = 0;

    const material = new BABYLON.StandardMaterial('shadowMat', this.scene);
    material.diffuseColor = new BABYLON.Color3(0, 0, 0);
    material.alpha = shadowFigure.alpha;
    figure.material = material;

    setTimeout(() => {
      figure.dispose();
    }, shadowFigure.duration);
  }

  /**
   * Reproduce un sonido de terror
   */
  private playScareSound(): void {
    console.log(GAME_MESSAGES.HORROR_EVENTS.SOUND);
    // TODO: Implementar sistema de audio real
  }

  /**
   * Aumenta temporalmente la niebla
   */
  private temporaryFogIncrease(): void {
    if (!this.scene) return;

    console.log(GAME_MESSAGES.HORROR_EVENTS.FOG);

    const { fogIncrease } = this.config.horrorEvents;
    const originalDensity = this.scene.fogDensity;

    this.scene.fogDensity = originalDensity * fogIncrease.multiplier;

    setTimeout(() => {
      if (this.scene) {
        this.scene.fogDensity = originalDensity;
      }
    }, fogIncrease.duration);
  }

  /**
   * Inicia el bucle de renderizado
   */
  private startRenderLoop(): void {
    if (!this.engine || !this.scene) return;

    this.engine.runRenderLoop(() => {
      if (this.scene && this.gameState === 'playing') {
        // Actualizar posición de la linterna antes del movimiento
        this.updateFlashlightPosition();
        this.updatePlayer();
        this.scene.render();
      }
    });

    // Manejar redimensionado
    window.addEventListener('resize', () => {
      this.engine?.resize();
    });
  }

  /**
   * Finaliza la carga del juego
   */
  private finishLoading(): void {
    this.hideLoadingScreen();
    this.gameState = 'playing';
    this.showWelcomeMessage();
  }

  /**
   * Oculta la pantalla de carga
   */
  private hideLoadingScreen(): void {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
      setTimeout(() => {
        loadingScreen.classList.add('hidden');
      }, 1000);
    }
  }

  /**
   * Muestra el mensaje de bienvenida
   */
  private showWelcomeMessage(): void {
    console.log(GAME_MESSAGES.WELCOME);
  }

  /**
   * Función de prueba para mover el personaje automáticamente (para debugging)
   */
  public testMovement(): void {
    if (!this.johnnyCage || !this.camera) {
      console.log('❌ No se puede probar movimiento - Johnny o cámara no cargados');
      return;
    }

    console.log('🧪 INICIANDO TEST DE MOVIMIENTO Y ROTACIÓN...');

    // Test 1: Movimiento hacia adelante (dirección de la cámara)
    const cameraMatrix = this.camera.getWorldMatrix();
    const cameraForward = BABYLON.Vector3.TransformNormal(
      new BABYLON.Vector3(0, 0, 1),
      cameraMatrix
    ).normalize();
    cameraForward.y = 0; // Mantener en plano horizontal
    cameraForward.normalize();

    const testSpeed = 10;
    const testDeltaTime = 1 / 60;

    console.log(
      '📊 Test - Vector cámara forward:',
      cameraForward.toString(),
      'Velocidad:',
      testSpeed
    );

    const positionBefore = this.johnnyCage.getPosition();
    const rotationBefore = this.johnnyCage.mesh?.rotation.y || 0;

    console.log('📍 Posición ANTES:', positionBefore.toString());
    console.log('🔄 Rotación ANTES:', rotationBefore);

    // Test movimiento
    this.johnnyCage.move(cameraForward, testSpeed, testDeltaTime);

    // Test rotación (hacer que mire hacia la cámara)
    const cameraRotationY = this.getCameraYaw();
    this.johnnyCage.setRotation(cameraRotationY);

    const positionAfter = this.johnnyCage.getPosition();
    const rotationAfter = this.johnnyCage.mesh?.rotation.y || 0;

    console.log('📍 Posición DESPUÉS:', positionAfter.toString());
    console.log('🔄 Rotación DESPUÉS:', rotationAfter);
    console.log('📐 Escalado actual:', this.johnnyCage.mesh?.scaling.toString());

    const distance = positionAfter.subtract(positionBefore).length();
    console.log('📏 Distancia movida:', distance);

    if (distance > 0.001) {
      console.log('✅ TEST MOVIMIENTO EXITOSO');
    } else {
      console.log('❌ TEST MOVIMIENTO FALLIDO');
    }

    if (Math.abs(rotationAfter - cameraRotationY) < 0.1) {
      console.log('✅ TEST ROTACIÓN EXITOSO');
    } else {
      console.log('❌ TEST ROTACIÓN FALLIDO');
    }
  }

  /**
   * Obtiene información de debug
   */
  public getDebugInfo(): DebugInfo {
    if (!this.scene || !this.engine || !this.camera) {
      return {
        fps: 0,
        triangles: 0,
        meshes: 0,
        lights: 0,
        textures: 0,
        materials: 0,
        playerPosition: BABYLON.Vector3.Zero(),
        playerStamina: 0,
        isFlashlightOn: false,
        gameState: this.gameState,
      };
    }

    return {
      fps: this.engine.getFps(),
      triangles: this.scene.getActiveMeshes().length,
      meshes: this.scene.meshes.length,
      lights: this.scene.lights.length,
      textures: this.scene.textures.length,
      materials: this.scene.materials.length,
      playerPosition: this.johnnyCage ? this.johnnyCage.getPosition() : BABYLON.Vector3.Zero(),
      playerStamina: this.playerState.stamina,
      isFlashlightOn: this.playerState.isFlashlightOn,
      gameState: this.gameState,
    };
  }

  /**
   * Obtiene el estado de los controles (para debugging)
   */
  public getControls(): PlayerControls {
    return { ...this.controls };
  }

  /**
   * Libera recursos del juego
   */
  public dispose(): void {
    if (this.johnnyCage) {
      this.johnnyCage.dispose();
    }
    if (this.scene) {
      this.scene.dispose();
    }
    if (this.engine) {
      this.engine.dispose();
    }
  }
}

// Inicializar el juego cuando la página esté cargada
window.addEventListener('DOMContentLoaded', () => {
  const game = new HorrorGame();

  // Exponer el juego globalmente para debugging
  (window as any).HorrorGame = game;

  // Limpiar recursos al cerrar
  window.addEventListener('beforeunload', () => {
    game.dispose();
  });
});

export default HorrorGame;
