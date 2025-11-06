🎯 Tu Misión: El Examen de "Recoger y Entregar"
 
El objetivo de este examen es diseñar y construir un juego 3D funcional utilizando la biblioteca Babylon.js.
La mecánica principal del juego debe ser simple pero bien implementada: el jugador debe poder recoger uno o más paquetes (u objetos) de un lugar específico y entregarlos en otro lugar designado. No olvidar que a parte de la funcionalidad el juego debe de tener las texturas, modelos objetos que representen al juego como lo hemos estado practicando en clase.
 
Requisitos Mínimos:
 
Un Jugador: Un objeto (cubo, esfera, modelo 3D) que el estudiante pueda controlar (por ejemplo, con las teclas WASD o flechas).
Un Paquete: Un objeto que se puede "recoger".
Una Zona de Recogida: El lugar donde el paquete comienza.
Una Zona de Entrega: El lugar donde el paquete debe ser soltado.
Mecánica de Recogida: Cuando el jugador se acerca al paquete y presiona una tecla (ej. "Espacio" o "E"), el paquete debe "unirse" al jugador.
Mecánica de Entrega: Cuando el jugador (con el paquete) llega a la zona de entrega y presiona una tecla, el paquete debe "soltarse" en esa zona.
Estado: El juego debe saber si el jugador tiene o no un paquete (no se puede recoger otro si ya tiene uno, no se puede entregar si no tiene nada).
 
🎨 Elige tu Aventura: Hormiga Trabajadora: Recoge migas de comida y llévalas al hormiguero.

🛠️ Kit de Herramientas de Babylon.js
 
Para completar esta misión, probablemente necesitarás usar los siguientes conceptos y funciones. ¡Investígalos!
BABYLON.Engine y BABYLON.Scene: El corazón de tu aplicación. El motor (engine) renderiza la escena (scene).
Cámaras y Luces:
BABYLON.FreeCamera: Una cámara simple en primera persona, útil para controlar con el teclado.
BABYLON.HemisphericLight: La forma más fácil de iluminar toda tu escena para que puedas ver tus objetos.
Creación de Objetos (Meshes):
BABYLON.MeshBuilder: Tu mejor amigo para este proyecto.
BABYLON.MeshBuilder.CreateBox("nombre", {size: 2}, scene);
BABYLON.MeshBuilder.CreateSphere("nombre", {diameter: 2}, scene);
BABYLON.MeshBuilder.CreateGround("nombre", {width: 10, height: 10}, scene);
Materiales:
BABYLON.StandardMaterial: Para dar color a tus objetos.
material.diffuseColor = new BABYLON.Color3(1, 0, 0); (Esto crearía un material rojo).
Manejo de Input (Teclado):
scene.onKeyboardObservable: La forma moderna de manejar el teclado. Te permite "observar" eventos de teclado (tecla presionada, tecla soltada) y reaccionar a ellos.
Lógica de "Recoger" (¡La Clave!):
Parenting (Emparantamiento): Este es el truco principal. Para "recoger" un objeto, simplemente lo conviertes en "hijo" del jugador.
paquete.parent = jugador;
Una vez que es hijo, se moverá, rotará y escalará junto con su padre (el jugador).
Lógica de "Dejar":
Para "soltar" el objeto, simplemente rompes esa relación de parentesco.
paquete.parent = null;
Detección de Proximidad:
¿Cómo saber si estás "cerca" de un objeto para recogerlo?
BABYLON.Vector3.Distance(vector1, vector2): Puedes obtener la posición de tu jugador (jugador.position) y la del paquete (paquete.position) y calcular la distancia entre ellos.
let distancia = BABYLON.Vector3.Distance(jugador.position, paquete.position);
Si distancia < 2 (o un valor pequeño), entonces permites que el jugador presione la tecla para recoger.
