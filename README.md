# Demo BabylonJS local

Estos archivos permiten ejecutar de forma local tu script de BabylonJS con un servidor estático simple.

Archivos creados:
- `index.html` — página que carga Babylon desde CDN y `script.js`.
- `script.js` — tu script adaptado y corregido (URLs completas para texturas públicas con CORS habilitado).

Cómo ejecutar:

1) Opción rápida con Python 3 (incluido en la mayoría de sistemas):

```
python -m http.server 8000
```

Luego abre http://localhost:8000 en tu navegador.

2) Opción con npm (si tienes Node):

```
npm i -g http-server
http-server -p 8000
```

Notas:
- Si alguna textura externa no carga, puede ser un problema de CORS desde el host de la imagen. En ese caso descarga la imagen y sírvela desde el mismo servidor.
- He usado el CDN oficial de Babylon (`https://cdn.babylonjs.com/babylon.js`) para mayor compatibilidad.

Opción con Node.js / Express (recomendada si quieres un servidor propio):

```bash
# desde la carpeta del proyecto
npm install
npm start
```

El servidor se iniciará en http://localhost:8000 por defecto.

Desarrollo con Vite (modo moderno)
---------------------------------

Para un flujo de desarrollo rápido con recarga en caliente, usamos Vite.

Instala dependencias y arranca el modo dev:

```bash
npm install
npm run dev
```

Esto abrirá (o indicará) la URL de desarrollo (por defecto http://localhost:5173).

Build de producción
-------------------

Genera la carpeta `dist` optimizada con:

```bash
npm run build
```

Luego puedes servir la carpeta `dist` con el servidor incluido:

```bash
npm start
```

El comando `npm start` servirá `dist` cuando exista y, en caso contrario, servirá la carpeta raíz (útil para preview sin build).

Estructura del proyecto
-----------------------

Recomendada para desarrollo y producción:

```
.
├─ src/
│  ├─ main.js            # entrada principal (Vite)
│  └─ components/
│     └─ gato.js         # componente del gato (mesh builder)
├─ index.html
├─ server.js             # servidor Express para servir `dist`
├─ vite.config.js
├─ package.json
└─ README.md
```

Buenas prácticas
- Mantén las texturas y assets en `public/` o `src/assets/` y refiérelos con rutas relativas para evitar problemas de CORS.
- Usa `@babylonjs/core` + `@babylonjs/loaders` para builds modernas con tree-shaking.
- Añade pruebas unitarias y CI (GitHub Actions) para automatizar builds y checks.

Modelos 3D (GLB/OBJ) con BabylonJS
-----------------------------------

- Coloca tus modelos bajo `public/assets/model/<carpeta>/`.
- Referéncialos con rutas absolutas desde la raíz, por ejemplo: `/assets/model/casa/casa.glb`.
- Los loaders se registran por side-effect en el código:
	- `import '@babylonjs/loaders/glTF'` para GLB/GLTF
	- `import '@babylonjs/loaders/OBJ'` para OBJ/MTL
- Carga modelos así (Vite sirve `public` desde la raíz):

```ts
import { SceneLoader } from '@babylonjs/core';
await SceneLoader.ImportMeshAsync('', '/assets/model/casa/', 'casa.glb', scene);
```

Si recibes errores de importación, asegúrate de tener instalados:

```bash
npm i @babylonjs/core @babylonjs/loaders
```
# chileno-2025-b-jdcm-sw-gr3
Chileno Manobanda Jefferson David

| Hola 
