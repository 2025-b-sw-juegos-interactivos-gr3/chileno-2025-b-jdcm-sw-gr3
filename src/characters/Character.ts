import {
  AbstractMesh,
  AnimationGroup,
  Color3,
  MeshBuilder,
  Scene,
  SceneLoader,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core';
// Registrar loader GLTF/GLB
import '@babylonjs/loaders/glTF';

import type { AnimationSystem, CharacterConfig, CharacterState } from '../types';

/**
 * Clase para manejar un personaje con animaciones
 * ⚠️  SOLO SOPORTA FORMATO GLB - NO OTROS FORMATOS ⚠️
 */
export class Character {
  public mesh: AbstractMesh | null = null;
  public animations: AnimationSystem = {
    idle: null,
    walk: null,
    run: null,
    current: null,
  };
  public state: CharacterState = {
    currentAnimation: 'idle',
    isAnimating: false,
    health: 100,
    maxHealth: 100,
    speed: 1.0,
  };

  constructor(private config: CharacterConfig, private scene: Scene) {
    // Validar que todos los archivos de animación sean GLB
    this.validateGLBFiles();

    // Verificar que el loader GLB esté disponible
    this.checkGLBLoader();
  }

  /**
   * Verifica que el loader GLB esté disponible
   */
  private checkGLBLoader(): void {
    console.log('🔍 Verificando disponibilidad de loaders...');

    // Verificar múltiples extensiones GLTF/GLB
    const gltfAvailable = SceneLoader.IsPluginForExtensionAvailable('.gltf');
    const glbAvailable = SceneLoader.IsPluginForExtensionAvailable('.glb');

    console.log(`📦 Loader .gltf disponible: ${gltfAvailable}`);
    console.log(`📦 Loader .glb disponible: ${glbAvailable}`);

    if (!gltfAvailable && !glbAvailable) {
      console.error('❌ NINGÚN LOADER GLTF/GLB ESTÁ DISPONIBLE');
      console.log('💡 Esto puede deberse a:');
      console.log('   - babylonjs-loaders no está instalado correctamente');
      console.log('   - El import no se está cargando antes de usar SceneLoader');
      console.log('   - Problema de bundling con Vite');
    } else {
      console.log('✅ Al menos un loader GLTF/GLB está disponible');
    }
  }

  /**
   * Valida que todos los archivos de configuración sean formato GLB
   */
  private validateGLBFiles(): void {
    const animFiles = Object.values(this.config.animations);
    const nonGLBFiles = animFiles.filter((file) => !file.toLowerCase().endsWith('.glb'));

    if (nonGLBFiles.length > 0) {
      console.error(`❌ ARCHIVOS NO GLB DETECTADOS:`, nonGLBFiles);
      throw new Error(
        `Character solo soporta archivos GLB. Archivos inválidos: ${nonGLBFiles.join(', ')}`
      );
    }

    console.log(`✅ Validación GLB: Todos los archivos son formato GLB correcto`);
  }

  /**
   * Carga el personaje y sus animaciones usando formato GLB exclusivamente
   */
  async load(): Promise<void> {
    try {
      console.log(`🎭 CARGANDO PERSONAJE ${this.config.name.toUpperCase()}`);
      const { modelPath, animations } = this.config;

      // Cargar el modelo base (que contiene el mesh y la animación 'idle')
      console.log(`🔄 Cargando modelo base: ${animations.idle}`);
      const baseResult = await this.loadModelGLB(modelPath, animations.idle);

      if (baseResult.success && baseResult.mesh) {
        this.mesh = baseResult.mesh;
        this.setupMesh();

        // La primera animación cargada es 'idle'
        if (baseResult.animationGroups.length > 0) {
          this.animations.idle = baseResult.animationGroups[0];
          this.animations.idle.name = 'idle';
          console.log(`✅ Animación 'idle' encontrada en el modelo base.`);
        }

        // Cargar las animaciones restantes
        await this.loadAdditionalAnimationsGLB();

        this.playAnimation('idle');
        console.log(`✅ PERSONAJE ${this.config.name.toUpperCase()} CARGADO COMPLETAMENTE`);
      } else {
        throw new Error(`No se pudo cargar el modelo base. Detalles: ${baseResult.error}`);
      }
    } catch (error) {
      console.error(`❌ Error cargando personaje ${this.config.name}:`, error);
      this.createFallbackModel();
    }
  }

  /**
   * Carga animaciones adicionales y las aplica al personaje.
   */
  private async loadAdditionalAnimationsGLB(): Promise<void> {
    console.log(`🎬 Cargando animaciones adicionales...`);
    const { modelPath, animations } = this.config;

    const animsToLoad = [
      { key: 'walk', file: animations.walk },
      { key: 'run', file: animations.run },
    ];

    for (const anim of animsToLoad) {
      if (!anim.file) continue;

      console.log(`🔄 Cargando animación '${anim.key}' desde ${anim.file}`);
      const result = await this.loadAnimationGLB(modelPath, anim.file, anim.key);
      if (result.success && result.animationGroup) {
        this.animations[anim.key as keyof AnimationSystem] = result.animationGroup;
        console.log(`✅ Animación '${anim.key}' cargada.`);
      } else {
        console.warn(`⚠️ Fallo al cargar animación '${anim.key}': ${result.error}`);
      }
    }
  }

  /**
   * Crea un modelo básico si fallan todos los métodos de carga
   */
  private createFallbackModel(): void {
    console.log(`🎭 ========================================`);
    console.log(`🎭 CREANDO MODELO DE RESPALDO PARA ${this.config.name}`);
    console.log(`🎭 ========================================`);

    // Crear un modelo básico tipo cápsula más visible
    this.mesh = MeshBuilder.CreateCapsule(
      `${this.config.name}_fallback`,
      { height: 2, radius: 0.5 },
      this.scene
    );

    // Material más llamativo para el modelo de respaldo
    const material = new StandardMaterial(`${this.config.name}_mat`, this.scene);
    material.diffuseColor = new Color3(1.0, 0.5, 0.2); // Color naranja brillante
    material.emissiveColor = new Color3(0.2, 0.1, 0.0); // Ligero brillo
    this.mesh.material = material;

    this.setupMesh();

    console.log(`✅ Modelo de respaldo creado para ${this.config.name}`);
    console.log(`📍 Posición: ${this.mesh.position.toString()}`);
    console.log(`📏 Escalado: ${this.mesh.scaling.toString()}`);
    console.log(`🎭 ========================================`);
  }

  /**
   * Configura el mesh del personaje
   */
  private setupMesh(): void {
    if (!this.mesh) return;

    this.mesh.scaling = this.config.scale.clone();
    this.mesh.position = this.config.position.clone();
    this.mesh.checkCollisions = true;
    // Configurar elipsoid para colisiones con paredes del laberinto
    // Valores razonables para un personaje ~1.8m alto
    (this.mesh as any).ellipsoid = new Vector3(0.4, 0.9, 0.4);
    (this.mesh as any).ellipsoidOffset = new Vector3(0, 0.9, 0);

    // No rotar inicialmente - la rotación será controlada por la cámara
    this.mesh.rotation.y = 0;

    console.log(
      `🎭 Mesh configurado - Escalado: ${this.mesh.scaling.toString()}, Posición: ${this.mesh.position.toString()}`
    );
  }

  /**
   * Preserva el escalado del personaje
   */
  private preserveScaling(): void {
    if (!this.mesh) return;

    this.mesh.scaling = this.config.scale.clone();
    console.log(`📐 Escalado preservado: ${this.mesh.scaling.toString()}`);
  }

  /**
   * Reproduce una animación específica with validación mejorada
   */
  playAnimation(animationName: keyof AnimationSystem): void {
    const animation = this.animations[animationName];

    if (!animation) {
      console.warn(`⚠️ Animación ${animationName} no encontrada para ${this.config.name}`);
      console.log(
        `📋 Animaciones disponibles:`,
        Object.keys(this.animations).filter(
          (key) => key !== 'current' && this.animations[key as keyof AnimationSystem]
        )
      );
      return;
    }

    // Detener animación actual
    if (this.animations.current && this.animations.current !== animation) {
      this.animations.current.stop();
    }

    // Reproducir nueva animación
    animation.start(true, 1.0, animation.from, animation.to, false);
    this.animations.current = animation;
    this.state.currentAnimation = animationName;
    this.state.isAnimating = true;

    // Preservar escalado después de cambiar animación
    this.preserveScaling();

    console.log(`🎬 Reproduciendo animación: ${animationName} (${animation.name})`);
  }

  /**
   * Valida que todas las animaciones GLB estén cargadas correctamente
   */
  validateAnimations(): boolean {
    const requiredAnimations = ['idle', 'walk', 'run'] as const;
    const missingAnimations: string[] = [];

    console.log(`🔍 ========================================`);
    console.log(`🔍 VALIDANDO ANIMACIONES DE ${this.config.name.toUpperCase()}`);
    console.log(`🔍 ========================================`);

    for (const animName of requiredAnimations) {
      if (this.animations[animName]) {
        console.log(`✅ ${animName}: OK`);
      } else {
        console.log(`❌ ${animName}: FALTANTE`);
        missingAnimations.push(animName);
      }
    }

    const isValid = missingAnimations.length === 0;
    console.log(`🔍 ========================================`);
    console.log(
      `📊 RESULTADO: ${
        isValid ? '✅ TODAS LAS ANIMACIONES OK' : `❌ FALTAN: ${missingAnimations.join(', ')}`
      }`
    );
    console.log(`🔍 ========================================`);

    return isValid;
  }

  /**
   * Detiene todas las animaciones
   */
  stopAnimations(): void {
    Object.values(this.animations).forEach((anim) => {
      if (anim) anim.stop();
    });
    this.state.isAnimating = false;
  }

  /**
   * Actualiza el personaje basado en el estado del movimiento
   */
  updateAnimation(isMoving: boolean, isRunning: boolean): void {
    if (!isMoving && this.state.currentAnimation !== 'idle') {
      this.playAnimation('idle');
    } else if (isMoving && isRunning && this.state.currentAnimation !== 'run') {
      this.playAnimation('run');
    } else if (isMoving && !isRunning && this.state.currentAnimation !== 'walk') {
      this.playAnimation('walk');
    }
  }

  /**
   * Mueve el personaje en la dirección especificada
   */
  move(direction: Vector3, speed: number, deltaTime: number = 1 / 60): void {
    if (!this.mesh) {
      console.warn('⚠️ No se puede mover: mesh no encontrado');
      return;
    }

    // Validar inputs
    if (direction.length() === 0) {
      console.warn('⚠️ Vector de dirección es cero');
      return;
    }

    if (speed <= 0) {
      console.warn('⚠️ Velocidad es cero o negativa:', speed);
      return;
    }

    // Usar deltaTime más estable y asegurar movimiento mínimo
    const safeDeltaTime = Math.max(Math.min(deltaTime, 0.1), 0.016); // Entre 16ms y 100ms

    // Calcular movimiento más robusto
    const normalizedDirection = direction.normalize();
    const movement = normalizedDirection.scale(speed * safeDeltaTime);

    // Verificar que el movimiento sea significativo
    if (movement.length() < 0.001) {
      console.warn('⚠️ Movimiento demasiado pequeño:', movement.length());
      return;
    }

    const oldPosition = this.mesh.position.clone();
    // Usar colisiones del motor para evitar atravesar paredes del laberinto
    try {
      this.mesh.moveWithCollisions(movement);
    } catch {
      // Fallback en caso de que falle el sistema de colisiones
      this.mesh.position.addInPlace(movement);
    }

    // Preservar escalado después del movimiento
    this.preserveScaling();

    console.log(
      '🏃 Johnny movido desde:',
      oldPosition.toString(),
      'a:',
      this.mesh.position.toString()
    );
    console.log(
      '📏 Distancia movida:',
      movement.length(),
      'Velocidad aplicada:',
      speed,
      'deltaTime:',
      safeDeltaTime
    );
  }

  /**
   * Establece la rotación del personaje para que mire en una dirección específica
   */
  setRotation(rotationY: number): void {
    if (!this.mesh) return;

    this.mesh.rotation.y = rotationY;
  }

  /**
   * Obtiene la posición actual del personaje
   */
  getPosition(): Vector3 {
    return this.mesh ? this.mesh.position.clone() : Vector3.Zero();
  }

  // ============================================================================
  // FUNCIONES ESPECIALIZADAS DE CARGA DE MODELOS GLB
  // ============================================================================

  /**
   * Carga un modelo GLB con sus animaciones
   */
  private async loadModelGLB(
    filePath: string,
    fileName: string
  ): Promise<{
    mesh: AbstractMesh | null;
    animationGroups: AnimationGroup[];
    success: boolean;
    error?: string;
  }> {
    try {
      const result = await SceneLoader.ImportMeshAsync('', filePath, fileName, this.scene);
      if (result.meshes.length === 0) {
        throw new Error('No se encontraron meshes en el archivo GLB.');
      }
      return {
        mesh: result.meshes[0],
        animationGroups: result.animationGroups,
        success: true,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      return { mesh: null, animationGroups: [], success: false, error: msg };
    }
  }

  /**
   * Carga una animación desde un archivo GLB y la aplica al mesh principal.
   */
  private async loadAnimationGLB(
    filePath: string,
    fileName: string,
    animationName: string
  ): Promise<{
    animationGroup: AnimationGroup | null;
    success: boolean;
    error?: string;
  }> {
    try {
      const result = await SceneLoader.ImportMeshAsync(null, filePath, fileName, this.scene);
      if (result.animationGroups.length === 0) {
        throw new Error('No se encontraron animaciones en el archivo.');
      }

      const animationGroup = result.animationGroups[0];
      animationGroup.name = animationName;

      // Retarget la animación al esqueleto del mesh principal
      if (this.mesh) {
        const skeleton = this.mesh.skeleton;
        if (skeleton) {
          animationGroup.targetedAnimations.forEach((ta) => {
            const anim = ta.animation;
            // El target de la animación debe ser el esqueleto
            anim.targetPropertyPath.forEach((_, i) => {
              try {
                // Intenta re-vincular la animación al hueso correspondiente por nombre
                const bone = skeleton.bones.find((b) => b.name === ta.target.name);
                if (bone) {
                  animationGroup.addTargetedAnimation(anim, bone);
                }
              } catch (e) {
                // Ignorar si la re-vinculación falla
              }
            });
          });
        }
      }

      // Descartar los meshes cargados con la animación para no tener duplicados
      result.meshes.forEach((m) => m.dispose());

      return { animationGroup, success: true };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      return { animationGroup: null, success: false, error: msg };
    }
  }

  // ============================================================================

  /**
   * Libera recursos del personaje
   */
  dispose(): void {
    this.stopAnimations();

    Object.values(this.animations).forEach((anim) => {
      if (anim) anim.dispose();
    });

    if (this.mesh) {
      this.mesh.dispose();
    }
  }
}
