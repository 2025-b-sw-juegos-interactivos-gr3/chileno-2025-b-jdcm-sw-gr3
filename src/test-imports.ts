/**
 * 🧪 ARCHIVO DE PRUEBA - TEST DE IMPORTACIONES
 * ============================================
 *
 * Este archivo verifica por separado las importaciones de:
 * - CASA (modelo GLB)
 * - MANSION (modelo OBJ/MTL)
 * - JOHNNY CAGE (Character con animaciones GLB)
 *
 * Para usar este archivo:
 * 1. Ejecuta: npm run test-imports
 * 2. O importa directamente en la consola del navegador
 * 3. Revisa los logs detallados en la consola
 */

// Registrar loaders necesarios (glTF/GLB y OBJ) para las pruebas
import '@babylonjs/loaders/glTF';
import '@babylonjs/loaders/OBJ';
import {
  AbstractMesh,
  ArcRotateCamera,
  Engine,
  HemisphericLight,
  Scene,
  SceneLoader,
  Vector3,
} from '@babylonjs/core';
// Nota: Usamos los módulos ESM @babylonjs/* para evitar conflictos y seguir la documentación actual

// Importar nuestras clases y configuraciones
import { Character } from './characters/Character';
import { DEFAULT_GAME_CONFIG, JOHNNY_CAGE_CONFIG } from './config';

/**
 * Clase de prueba para verificar importaciones por separado
 */
export class ImportTester {
  private engine: Engine | null = null;
  private scene: Scene | null = null;
  private camera: ArcRotateCamera | null = null;

  /**
   * Inicializa un entorno mínimo de BabylonJS para pruebas
   */
  async initTestEnvironment(): Promise<void> {
    console.log('🧪 ========================================');
    console.log('🧪 INICIANDO ENTORNO DE PRUEBA');
    console.log('🧪 ========================================');

    // Crear un canvas virtual para pruebas
    const canvas = document.createElement('canvas');
    canvas.id = 'test-canvas';
    canvas.width = 800;
    canvas.height = 600;
    document.body.appendChild(canvas);

    // Inicializar motor
    this.engine = new Engine(canvas, true);
    console.log('✅ Motor de BabylonJS inicializado');

    // Crear escena básica
    this.scene = new Scene(this.engine);
    console.log('✅ Escena creada');

    // Agregar cámara
    this.camera = new ArcRotateCamera(
      'testCamera',
      Math.PI / 2,
      Math.PI / 2.5,
      10,
      Vector3.Zero(),
      this.scene
    );
    this.camera.attachControl(canvas, true);
    console.log('✅ Cámara configurada');

    // Luz ambiente básica
    const light = new HemisphericLight('testLight', new Vector3(0, 1, 0), this.scene);
    light.intensity = 0.7;
    console.log('✅ Iluminación configurada');

    // Verificar loaders disponibles
    this.checkAvailableLoaders();
  }

  /**
   * Verifica qué loaders están disponibles
   */
  private checkAvailableLoaders(): void {
    console.log('📦 ========================================');
    console.log('📦 VERIFICANDO LOADERS DISPONIBLES');
    console.log('📦 ========================================');

    // SceneLoader.IsPluginForExtensionAvailable está obsoleto, pero aún funciona para log.
    // La verdadera prueba es si la importación tiene éxito.
    const extensions = ['.glb', '.gltf', '.obj'];
    extensions.forEach((ext) => {
      console.log(`📦 Loader ${ext} debería estar disponible a través de @babylonjs/loaders.`);
    });
  }

  /**
   * 🏠 TEST 1: Verificar carga de CASA (GLB)
   */
  async testCasaGLB(): Promise<{ success: boolean; error?: string; mesh?: AbstractMesh }> {
    console.log('🏠 ========================================');
    console.log('🏠 TEST 1: CARGANDO CASA (GLB)');
    console.log('🏠 ========================================');

    if (!this.scene) {
      return { success: false, error: 'Escena no inicializada' };
    }

    const { path, file } = DEFAULT_GAME_CONFIG.assets.casa;
    console.log(`📋 Configuración de casa: path=${path}, file=${file}`);

    try {
      // Con Vite, los assets en `public` se sirven desde la raíz.
      // ImportMeshAsync toma la ruta de la carpeta y el nombre del archivo por separado.
      console.log(`🔄 Cargando desde: ${path}${file}`);
      const result = await SceneLoader.ImportMeshAsync(
        null, // Cargar todos los meshes
        path,
        file,
        this.scene
      );

      if (result.meshes.length > 0) {
        const casa = result.meshes[0];
        console.log('✅ ¡CASA CARGADA EXITOSAMENTE!');
        console.log(`📍 Nombre del mesh: ${casa.name}`);
        console.log(`📍 Meshes totales: ${result.meshes.length}`);
        return { success: true, mesh: casa };
      } else {
        throw new Error('El archivo GLB se cargó pero no contiene meshes.');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      console.error(`❌ ERROR AL CARGAR CASA: ${errorMsg}`);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * 🏚️ TEST 2: Verificar carga de MANSION (OBJ/MTL)
   */
  async testMansionOBJ(): Promise<{ success: boolean; error?: string; mesh?: AbstractMesh }> {
    console.log('🏚️ ========================================');
    console.log('🏚️ TEST 2: CARGANDO MANSION (OBJ)');
    console.log('🏚️ ========================================');

    if (!this.scene) {
      return { success: false, error: 'Escena no inicializada' };
    }

    const { path, file } = DEFAULT_GAME_CONFIG.assets.mansion;
    console.log(`� Configuración de mansión: path=${path}, file=${file}`);

    try {
      // Para OBJ, el loader buscará el .mtl asociado en la misma ruta.
      console.log(`🔄 Cargando desde: ${path}${file}`);
      const result = await SceneLoader.ImportMeshAsync(
        null, // Cargar todos los meshes
        path,
        file,
        this.scene
      );

      if (result.meshes.length > 0) {
        const mansion = result.meshes[0];
        console.log('✅ ¡MANSION OBJ CARGADA EXITOSAMENTE!');
        console.log(`📍 Nombre del mesh: ${mansion.name}`);
        console.log(`📍 Meshes totales: ${result.meshes.length}`);
        return { success: true, mesh: mansion };
      } else {
        throw new Error('El archivo OBJ se cargó pero no contiene meshes.');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      console.error(`❌ ERROR AL CARGAR MANSION: ${errorMsg}`);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * 🥋 TEST 3: Verificar carga de JOHNNY CAGE (Character + GLB animations)
   */
  async testJohnnyCage(): Promise<{ success: boolean; error?: string; character?: Character }> {
    console.log('🥋 ========================================');
    console.log('🥋 TEST 3: CARGANDO JOHNNY CAGE');
    console.log('🥋 ========================================');

    if (!this.scene) {
      return { success: false, error: 'Escena no inicializada' };
    }

    try {
      console.log('📋 Configuración de Johnny Cage:', JOHNNY_CAGE_CONFIG);

      // Crear instancia de Character
      const johnny = new Character(JOHNNY_CAGE_CONFIG, this.scene);
      console.log('✅ Instancia de Character creada');

      // Intentar cargar
      console.log('🔄 Iniciando carga de Johnny Cage...');
      await johnny.load();

      // Verificar resultado
      if (johnny.mesh) {
        console.log('✅ ¡JOHNNY CAGE CARGADO EXITOSAMENTE!');
        console.log(`📍 Mesh: ${johnny.mesh.name}`);

        // Validar animaciones
        const animationsValid = johnny.validateAnimations();
        if (animationsValid) {
          console.log('🎬 ¡Todas las animaciones de Johnny Cage son válidas!');
          return { success: true, character: johnny };
        } else {
          return { success: false, error: 'Johnny se cargó, pero faltan animaciones.' };
        }
      } else {
        return { success: false, error: 'El mesh de Johnny es nulo después de la carga.' };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error cargando Johnny Cage:', errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * 🧪 Ejecuta TODAS las pruebas en secuencia
   */
  async runAllTests(): Promise<void> {
    console.log('🧪 ========================================');
    console.log('🧪 EJECUTANDO TODAS LAS PRUEBAS DE IMPORTACIÓN');
    console.log('🧪 ========================================');

    // Inicializar entorno
    await this.initTestEnvironment();

    // Resultados
    const results = {
      casa: { success: false, error: '' as string },
      mansion: { success: false, error: '' as string },
      johnny: { success: false, error: '' as string },
    };

    // Test 1: Casa GLB
    try {
      const casaResult = await this.testCasaGLB();
      results.casa = { success: casaResult.success, error: casaResult.error || '' };
    } catch (error) {
      results.casa = { success: false, error: `Excepción: ${error}` };
    }

    // Test 2: Mansion OBJ
    try {
      const mansionResult = await this.testMansionOBJ();
      results.mansion = { success: mansionResult.success, error: mansionResult.error || '' };
    } catch (error) {
      results.mansion = { success: false, error: `Excepción: ${error}` };
    }

    // Test 3: Johnny Cage
    try {
      const johnnyResult = await this.testJohnnyCage();
      results.johnny = { success: johnnyResult.success, error: johnnyResult.error || '' };
    } catch (error) {
      results.johnny = { success: false, error: `Excepción: ${error}` };
    }

    // Reporte final
    this.generateFinalReport(results);
  }

  /**
   * 📊 Genera un reporte final de todas las pruebas
   */
  private generateFinalReport(results: any): void {
    console.log('📊 ========================================');
    console.log('📊 REPORTE FINAL DE IMPORTACIONES');
    console.log('📊 ========================================');

    console.log(`🏠 CASA (GLB): ${results.casa.success ? '✅ ÉXITO' : '❌ FALLO'}`);
    if (!results.casa.success) {
      console.log(`   └─ Error: ${results.casa.error}`);
    }

    console.log(`🏚️ MANSION (OBJ): ${results.mansion.success ? '✅ ÉXITO' : '❌ FALLO'}`);
    if (!results.mansion.success) {
      console.log(`   └─ Error: ${results.mansion.error}`);
    }

    console.log(`🥋 JOHNNY (Character): ${results.johnny.success ? '✅ ÉXITO' : '❌ FALLO'}`);
    if (!results.johnny.success) {
      console.log(`   └─ Error: ${results.johnny.error}`);
    }

    const successCount = [
      results.casa.success,
      results.mansion.success,
      results.johnny.success,
    ].filter(Boolean).length;
    const totalTests = 3;

    console.log('📊 ========================================');
    console.log(`📊 RESUMEN: ${successCount}/${totalTests} pruebas exitosas`);

    if (successCount === totalTests) {
      console.log('🎉 ¡TODAS LAS IMPORTACIONES FUNCIONAN CORRECTAMENTE!');
    } else {
      console.log('⚠️ Algunas importaciones tienen problemas. Revisa los errores arriba.');
    }
    console.log('📊 ========================================');
  }

  /**
   * 🧹 Limpia el entorno de prueba
   */
  cleanup(): void {
    if (this.engine) {
      this.engine.dispose();
      console.log('🧹 Motor de prueba limpiado');
    }

    const testCanvas = document.getElementById('test-canvas');
    if (testCanvas) {
      testCanvas.remove();
      console.log('🧹 Canvas de prueba removido');
    }
  }
}

// ============================================================================
// FUNCIONES DE UTILIDAD PARA USAR EN CONSOLA
// ============================================================================

/**
 * 🚀 Función principal para ejecutar todas las pruebas
 * Úsala en la consola: testAllImports()
 */
export async function testAllImports(): Promise<void> {
  const tester = new ImportTester();
  try {
    await tester.runAllTests();
  } finally {
    // Limpiar después de 5 segundos para poder ver los resultados
    setTimeout(() => {
      tester.cleanup();
    }, 5000);
  }
}

/**
 * 🏠 Función para probar solo la casa
 * Úsala en la consola: testCasaOnly()
 */
export async function testCasaOnly(): Promise<void> {
  const tester = new ImportTester();
  try {
    await tester.initTestEnvironment();
    await tester.testCasaGLB();
  } finally {
    setTimeout(() => tester.cleanup(), 3000);
  }
}

/**
 * 🏚️ Función para probar solo la mansion
 * Úsala en la consola: testMansionOnly()
 */
export async function testMansionOnly(): Promise<void> {
  const tester = new ImportTester();
  try {
    await tester.initTestEnvironment();
    await tester.testMansionOBJ();
  } finally {
    setTimeout(() => tester.cleanup(), 3000);
  }
}

/**
 * 🥋 Función para probar solo Johnny Cage
 * Úsala en la consola: testJohnnyOnly()
 */
export async function testJohnnyOnly(): Promise<void> {
  const tester = new ImportTester();
  try {
    await tester.initTestEnvironment();
    await tester.testJohnnyCage();
  } finally {
    setTimeout(() => tester.cleanup(), 3000);
  }
}

// ============================================================================
// INSTRUCCIONES DE USO
// ============================================================================

console.log(`
🧪 ARCHIVO DE PRUEBA DE IMPORTACIONES CARGADO
==============================================

Para usar este archivo de prueba, abre la consola del navegador y ejecuta:

📋 TODAS LAS PRUEBAS:
   testAllImports()

📋 PRUEBAS INDIVIDUALES:
   testCasaOnly()     - Solo prueba la casa GLB
   testMansionOnly()  - Solo prueba la mansion OBJ
   testJohnnyOnly()   - Solo prueba Johnny Cage

📋 TAMBIÉN PUEDES:
   const tester = new ImportTester()
   await tester.initTestEnvironment()
   await tester.testCasaGLB()

Los resultados aparecerán en la consola con logs detallados.
`);

// Exportar para uso global en consola
(window as any).testAllImports = testAllImports;
(window as any).testCasaOnly = testCasaOnly;
(window as any).testMansionOnly = testMansionOnly;
(window as any).testJohnnyOnly = testJohnnyOnly;
(window as any).ImportTester = ImportTester;
