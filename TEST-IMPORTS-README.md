# 🧪 Test de Importaciones - Horror Mansion 3D

Este sistema de pruebas te permite verificar por separado si las importaciones de **CASA**, **MANSION** y **JOHNNY CAGE** se están haciendo correctamente.

## 🚀 Cómo usar

### Opción 1: Interfaz Web (Recomendado)
```bash
# 1. Ejecutar el servidor de desarrollo
npm run dev

# 2. Abrir en el navegador
http://localhost:5173/test-imports.html
```

### Opción 2: Consola del Navegador
```bash
# 1. Ejecutar el servidor
npm run dev

# 2. Abrir http://localhost:5173
# 3. Presionar F12 para abrir consola
# 4. Ejecutar comandos:
```

```javascript
// Todas las pruebas
testAllImports()

// Pruebas individuales
testCasaOnly()     // Solo casa GLB
testMansionOnly()  // Solo mansion OBJ
testJohnnyOnly()   // Solo Johnny Cage

// Manual avanzado
const tester = new ImportTester()
await tester.initTestEnvironment()
await tester.testCasaGLB()
```

## 📁 Estructura de Archivos Esperada

```
public/
├── assets/
    ├── model/
        ├── casa/
        │   └── casa.glb                    # 🏠 Casa principal
        ├── mansion/
        │   ├── rp_playboymansion_b1.obj    # 🏚️ Mansion OBJ
        │   └── rp_playboymansion_b1.mtl    # 🏚️ Mansion MTL
        └── JhonnyCage/
            ├── JhonnyCage_idle.glb         # 🥋 Animación idle
            ├── JhonnyCage_walk.glb         # 🥋 Animación walk
            └── JhonnyCage_run.glb          # 🥋 Animación run
```

## 🔍 Qué Verifica Cada Prueba

### 🏠 Test Casa GLB
- Verifica carga de `casa.glb`
- Prueba múltiples rutas automáticamente
- Valida que el mesh se cargue correctamente
- Muestra información de posición y escala

### 🏚️ Test Mansion OBJ
- Verifica carga de `rp_playboymansion_b1.obj`
- Prueba el sistema de carga OBJ/MTL
- Valida compatibilidad con BabylonJS loaders
- Verifica meshes y materiales

### 🥋 Test Johnny Cage
- Verifica la clase `Character`
- Carga las 3 animaciones GLB (idle, walk, run)
- Valida el sistema de animaciones
- Prueba escalado y posicionamiento
- Verifica modelo de respaldo si falla la carga

## 📊 Interpretando los Resultados

### ✅ Éxito
```
✅ ¡CASA CARGADA EXITOSAMENTE!
📍 Nombre del mesh: casa_mesh
📍 Posición: (0, 0, 0)
📍 Meshes totales: 1
```

### ❌ Error Común: Archivo No Encontrado
```
❌ Fallo intento 1: 404 Not Found
⚠️ Solución: Verificar que el archivo existe en public/assets/model/
```

### ❌ Error Común: Loader No Disponible
```
❌ Loader GLB no está disponible en BabylonJS
⚠️ Solución: npm install babylonjs-loaders
```

## 🛠️ Resolución de Problemas

### 1. Archivos No Encontrados
- Verificar que los archivos estén en `public/assets/model/`
- Revisar nombres exactos de archivos
- Comprobar permisos de lectura

### 2. Loaders No Disponibles
```bash
npm install babylonjs-loaders
```

### 3. Errores de CORS
- Usar `npm run dev` (no abrir directamente el HTML)
- Verificar que el servidor esté corriendo en puerto 5173

### 4. Memoria/Performance
- Los tests crean un entorno temporal
- Se limpia automáticamente después de 5 segundos
- Si hay problemas, refrescar la página

## 📝 Logs Detallados

El sistema proporciona logs muy detallados:

```
🧪 INICIANDO ENTORNO DE PRUEBA
✅ Motor de BabylonJS inicializado
✅ Escena creada
📦 Loader .glb: ✅ Disponible
🏠 INTENTANDO CARGAR CASA: casa.glb
🔍 Rutas a probar: ["/assets/model/casa/casa.glb", ...]
🔄 Intento 1/4: /assets/model/casa/casa.glb
📂 BasePath: "/assets/model/casa/"
📄 Archivo: "casa.glb"
✅ ¡CASA CARGADA EXITOSAMENTE!
```

## 🎯 Casos de Uso

### Desarrollador Frontend
- Verificar que las rutas de assets están configuradas correctamente
- Validar que los modelos se cargan antes de integrar al juego principal

### Artista 3D
- Comprobar que los modelos exportados funcionan con BabylonJS
- Verificar escalas y posiciones de modelos
- Validar animaciones de personajes

### QA/Testing
- Pruebas automatizadas de carga de assets
- Verificación de compatibilidad de formatos
- Tests de regresión cuando se cambian modelos

## 🔧 Personalización

Para agregar nuevos tests, editar `src/test-imports.ts`:

```typescript
// Agregar nuevo test
async testNuevoModelo(): Promise<{success: boolean, error?: string}> {
  // ... implementación
}

// Agregar al runAllTests()
const nuevoResult = await this.testNuevoModelo();
```

## 📚 API Reference

### ImportTester
```typescript
class ImportTester {
  async initTestEnvironment(): Promise<void>
  async testCasaGLB(): Promise<{success: boolean, error?: string, mesh?: AbstractMesh}>
  async testMansionOBJ(): Promise<{success: boolean, error?: string, mesh?: AbstractMesh}>
  async testJohnnyCage(): Promise<{success: boolean, error?: string, character?: Character}>
  async runAllTests(): Promise<void>
  cleanup(): void
}
```

### Funciones Globales
```typescript
testAllImports(): Promise<void>     // Ejecuta todas las pruebas
testCasaOnly(): Promise<void>       // Solo casa
testMansionOnly(): Promise<void>    // Solo mansion  
testJohnnyOnly(): Promise<void>     // Solo Johnny
```

---

💡 **Tip:** Ejecuta las pruebas después de cualquier cambio en los modelos 3D o configuración de rutas para asegurar que todo funcione correctamente.
