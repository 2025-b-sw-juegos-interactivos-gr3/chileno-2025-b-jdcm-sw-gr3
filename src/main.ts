import {
	Engine,
	Scene,
	ArcRotateCamera,
	Vector3,
	HemisphericLight,
	StandardMaterial,
	Color3,
	MeshBuilder,
	Mesh,
  Tools,
  TransformNode,
	ParticleSystem,
	Texture,
	Color4,
	Ray,
	RayHelper,
	PhysicsImpostor
} from "@babylonjs/core";
import "@babylonjs/loaders";
import { AntCharacter } from "./characters/Character";
import { CandyPirate } from "./characters/CandyPirate";
import { loadGLTF } from "./utils/modelLoader";

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement | null;
if (!canvas) throw new Error("renderCanvas no encontrado en el DOM");
const engine = new Engine(canvas, true);

const createScene = async () => {
	const scene = new Scene(engine);

	// NO configurar motor de física por ahora para evitar problemas
	// try {
	// 	scene.enablePhysics(new Vector3(0, -9.81, 0));
	// 	console.log("✓ Motor de física habilitado");
	// } catch (e) {
	// 	console.warn("⚠️ Motor de física no disponible, usando sistema alternativo");
	// }

	// Cámara y luz (estilo GTA tercera persona)
	const camera = new ArcRotateCamera("arcCamera", 0, Math.PI / 3, 3, Vector3.Zero(), scene);
	camera.lowerBetaLimit = 0.1; // Límite inferior de rotación vertical
	camera.upperBetaLimit = Math.PI / 2.2; // Límite superior de rotación vertical
	camera.lowerRadiusLimit = 1; // Distancia mínima
	camera.upperRadiusLimit = 8; // Distancia máxima
	camera.attachControl(canvas, true);

	const light = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
	light.intensity = 0.8;

  // Cargar el escenario de la cabaña
  try {
    const cabin = await loadGLTF(scene, "/assets/model/forest_cabin/", "forest_cabin12.glb", new Vector3(Tools.ToRadians(-90), Tools.ToRadians(145), 0));
    if (cabin && cabin.root) {
      cabin.root.scaling = new Vector3(5, 5, 5);
      cabin.root.position = new Vector3(0, 4, 0);
      
      // NO configurar física por ahora para evitar problemas
      // cabin.meshes.forEach((mesh) => {
      //   if (mesh && mesh instanceof Mesh && mesh.name !== "__root__") {
      //     mesh.physicsImpostor = new PhysicsImpostor(mesh, PhysicsImpostor.BoxImpostor, { 
      //       mass: 0, restitution: 0.1, friction: 0.8 
      //     }, scene);
      //     console.log(`✓ Física aplicada al mesh: ${mesh.name}`);
      //   }
      // });
      
      console.log(`✓ Cabaña cargada con ${cabin.meshes.length} meshes`);
    }
  } catch (e) {
    console.error("Error cargando el modelo de la cabaña:", e);
    // Fallback a un suelo simple si falla la carga
    const groundMat = new StandardMaterial("groundMat", scene);
    groundMat.diffuseColor = new Color3(0.4, 0.4, 0.4);
    const ground = MeshBuilder.CreateGround("ground", { width: 40, height: 40 }, scene);
    ground.material = groundMat;
    
    // NO agregar física al suelo de fallback tampoco
    // ground.physicsImpostor = new PhysicsImpostor(ground, PhysicsImpostor.BoxImpostor, { 
    //   mass: 0, restitution: 0.1, friction: 0.8 
    // }, scene);
  }

  // Zona de entrega (Hormiguero)
  let anthillRoot: TransformNode | null = null;
  let anthillMesh: Mesh | null = null;
  try {
    const anthill = await loadGLTF(scene, "/assets/model/anthill/", "animated_ant_hill.glb", new Vector3(Tools.ToRadians(0), Tools.ToRadians(-90), 0));
    if (anthill && anthill.root) {
      anthill.root.scaling = new Vector3(7, 7, 7);
      anthill.root.position = new Vector3(-5, 0, -5);
      anthillRoot = anthill.root;
      
      // Buscar el mesh real del anthill.glb
      anthillMesh = anthill.meshes.find(mesh => mesh.name.toLowerCase().includes('animated_ant_hill')) as Mesh;
      if (!anthillMesh && anthill.meshes.length > 0) {
        anthillMesh = anthill.meshes[0] as Mesh; // Usar el primer mesh si no encontramos uno específico
      }
    }
    
    // Añadir wireframe azul para el hormiguero para ver dónde está exactamente
    const anthillWireframeMaterial = new StandardMaterial("anthillWireframe", scene);
    anthillWireframeMaterial.emissiveColor = new Color3(0, 0, 1); // Azul para el hormiguero
    anthillWireframeMaterial.wireframe = true;
    anthillWireframeMaterial.alpha = 0.3;
    
    // Crear una esfera de debug para mostrar el área de colisión del hormiguero
    const anthillDebugSphere = MeshBuilder.CreateSphere("anthillDebugSphere", { diameter: 5 }, scene);
    anthillDebugSphere.material = anthillWireframeMaterial;
    anthillDebugSphere.material = anthillWireframeMaterial;
    anthillDebugSphere.position = anthill.root.position ; // Posición del anthill
    
  } catch (e) {
    console.error("Error cargando el hormiguero:", e);
    // Fallback: crear un anthill root simple en caso de error
    anthillRoot = new TransformNode("anthillFallback", scene);
    anthillRoot.position = new Vector3(-5, 0, -5);
  }

	// HUD mejorado con funciones de la UI
	let foodDelivered = 0;
	const totalFood = 4;

	// Función para crear efectos de partículas
	const createPickupEffect = (position: Vector3) => {
		const particleSystem = new ParticleSystem("pickup", 50, scene);
		particleSystem.particleTexture = new Texture("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", scene);
		particleSystem.emitter = position;
		particleSystem.minEmitBox = new Vector3(-0.2, 0, -0.2);
		particleSystem.maxEmitBox = new Vector3(0.2, 0.5, 0.2);
		particleSystem.color1 = new Color4(1, 0.8, 0, 1);
		particleSystem.color2 = new Color4(1, 1, 0, 1);
		particleSystem.colorDead = new Color4(1, 1, 0, 0);
		particleSystem.minSize = 0.1;
		particleSystem.maxSize = 0.3;
		particleSystem.minLifeTime = 0.3;
		particleSystem.maxLifeTime = 0.8;
		particleSystem.emitRate = 100;
		particleSystem.gravity = new Vector3(0, -2, 0);
		particleSystem.start();
		
		// Detener después de un tiempo
		setTimeout(() => {
			particleSystem.stop();
			setTimeout(() => particleSystem.dispose(), 1000);
		}, 500);
	};

	const createDeliveryEffect = (position: Vector3) => {
		const particleSystem = new ParticleSystem("delivery", 100, scene);
		particleSystem.particleTexture = new Texture("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", scene);
		particleSystem.emitter = position;
		particleSystem.minEmitBox = new Vector3(-0.5, 0, -0.5);
		particleSystem.maxEmitBox = new Vector3(0.5, 1, 0.5);
		particleSystem.color1 = new Color4(0, 1, 0, 1);
		particleSystem.color2 = new Color4(0, 0.8, 0.2, 1);
		particleSystem.colorDead = new Color4(0, 1, 0, 0);
		particleSystem.minSize = 0.1;
		particleSystem.maxSize = 0.4;
		particleSystem.minLifeTime = 0.5;
		particleSystem.maxLifeTime = 1.2;
		particleSystem.emitRate = 150;
		particleSystem.gravity = new Vector3(0, -1, 0);
		particleSystem.start();
		
		// Detener después de un tiempo
		setTimeout(() => {
			particleSystem.stop();
			setTimeout(() => particleSystem.dispose(), 1500);
		}, 800);
	};

  // Cargar hormiga
  const ant = new AntCharacter(scene);
  try {
    await ant.load("/assets/model/ant/", "scene.gltf", 0.05, new Vector3(Tools.ToRadians(-90), Tools.ToRadians(-90), 0));
    ant.setPosition(new Vector3(0, 0, 0));
    
    // Añadir wireframe de debug para la hormiga
    const antWireframeMaterial = new StandardMaterial("antWireframe", scene);
    antWireframeMaterial.emissiveColor = new Color3(0, 1, 0); // Verde para la hormiga
    antWireframeMaterial.wireframe = true;
    antWireframeMaterial.alpha = 0.3;
    
    const antDebugSphere = MeshBuilder.CreateSphere("antDebugSphere", { diameter: 0.5 }, scene);
    antDebugSphere.material = antWireframeMaterial;
    if (ant.root) {
      antDebugSphere.parent = ant.root;
      antDebugSphere.position = new Vector3(0, 0, 0);
    }
    
    // Configurar la cámara para seguir a la hormiga (estilo GTA)
    if (ant.root) {
      camera.setTarget(ant.root.position);
    }
    
    // NO habilitar física para la hormiga por ahora
    // ant.enablePhysics();
    
  } catch (e) {
    console.error("Error cargando modelo de la hormiga:", e);
  }

  // Cargar Candy Pirate como personaje inteligente
  const candyPirate = new CandyPirate(scene);
  try {
    await candyPirate.load("/assets/model/candy_pirate/", "scene.gltf", 0.8, new Vector3(Tools.ToRadians(-90), Tools.ToRadians(45), 0));
    candyPirate.setPosition(new Vector3(8, 0, -8)); // Posición en una esquina del mapa
    
    // Añadir wireframe amarillo para debug del pirata
    const pirateWireframeMaterial = new StandardMaterial("pirateWireframe", scene);
    pirateWireframeMaterial.emissiveColor = new Color3(1, 1, 0); // Amarillo para el pirata
    pirateWireframeMaterial.wireframe = true;
    pirateWireframeMaterial.alpha = 0.3;
    
    const pirateDebugSphere = MeshBuilder.CreateSphere("pirateDebugSphere", { diameter: 1 }, scene);
    pirateDebugSphere.material = pirateWireframeMaterial;
    if (candyPirate.root) {
      pirateDebugSphere.parent = candyPirate.root;
      pirateDebugSphere.position = new Vector3(0, 1, 0);
    }
    
    console.log("✓ Candy Pirate inteligente cargado exitosamente en:", candyPirate.getPosition().toString());
  } catch (e) {
    console.error("Error cargando el Candy Pirate:", e);
  }

  // Paquetes (Candies)
  const paquetes: Mesh[] = [];
  const candyModels = ["sweetness1.glb", "sweetness2.glb", "sweetness3.glb", "sweetness4.glb"];
  const positions = [
    new Vector3(12, 0.1, 16),
    new Vector3(-6, 0.1, 20),
    new Vector3(17, 0.1, -9),
    new Vector3(-13, 0.1, -14),
  ];

  for (let i = 0; i < positions.length; i++) {
    try {
      const candy = await loadGLTF(scene, "/assets/model/candies/", candyModels[i % candyModels.length], new Vector3(Tools.ToRadians(-90), 0, 0));
      if (candy && candy.root) candy.root.scaling = new Vector3(0.5, 0.5, 0.5);
      candy.root.position = positions[i];
      
      // Asumimos que el primer mesh es el visible
      const candyMesh = candy.meshes[1] as Mesh;
      (candyMesh as any).gameData = { picked: false, delivered: false };
      
      // IMPORTANTE: Almacenar la posición del root para detección
      (candyMesh as any).rootPosition = positions[i];
      
      // Añadir wireframe rojo para debug
      const wireframeMaterial = new StandardMaterial("wireframe", scene);
      wireframeMaterial.emissiveColor = new Color3(1, 0, 0); // Rojo
      wireframeMaterial.wireframe = true;
      wireframeMaterial.alpha = 0.5;
      
      // Crear una esfera de debug para mostrar el área de colisión
      const debugSphere = MeshBuilder.CreateSphere("debugSphere_" + i, { diameter: 3 }, scene); // Diámetro 3 = radio 1.5
      debugSphere.material = wireframeMaterial;
      debugSphere.position = positions[i];
      
      // También añadir wireframe al mesh del dulce
      if (candyMesh) {
        const candyWireframe = candyMesh.clone("candyWireframe_" + i);
        candyWireframe.material = wireframeMaterial;
        candyWireframe.position = candyMesh.position;
        if (candyMesh.parent) {
          candyWireframe.parent = candyMesh.parent;
        }
      }
      
      paquetes.push(candyMesh);
    } catch (e) {
      console.error(`Error cargando el dulce ${candyModels[i % candyModels.length]}:`, e);
    }
  }

	// Input simple con soporte para Shift
	const inputMap: Record<string, boolean> = {};
	let isShiftPressed = false;
	window.addEventListener("keydown", (e) => {
		inputMap[e.key.toLowerCase()] = true;
		if (e.key === "Shift") isShiftPressed = true;
	});
	window.addEventListener("keyup", (e) => {
		inputMap[e.key.toLowerCase()] = false;
		if (e.key === "Shift") isShiftPressed = false;
	});

	// Lógica recoger / dejar con F (usando técnica del Agent.md)
	let paqueteEnMano: Mesh | null = null; // Variable simple para rastrear el paquete recogido
	
	window.addEventListener("keydown", (e) => {
		if (e.key.toLowerCase() === "f") {
			if (!paqueteEnMano) {
				// RECOGER: buscar paquete cercano
				let closest: Mesh | null = null;
				let bestDist = Infinity;
				paquetes.forEach((p) => {
					const data = (p as any).gameData || {};
					if (data.picked || data.delivered) return;
					
					const candyPosition = (p as any).rootPosition || p.position;
					const d = Vector3.Distance(candyPosition, ant.getPosition());
					
					if (d < 1.5 && d < bestDist) {
						bestDist = d;
						closest = p;
					}
				});
				
				if (closest) {
					console.log("¡Dulce recogido con parenting!"); // Debug
					(closest as any).gameData.picked = true;
					
					// Crear efecto de partículas al recoger
					const candyPosition = (closest as any).rootPosition || (closest as any).position;
					createPickupEffect(candyPosition);
					
					// TÉCNICA DEL AGENT.MD: Usar parenting directo
					(closest as any).setParent(ant.root);
					(closest as any).position = new Vector3(0, 1, 0.5); // Posición en la espalda de la hormiga
					
					paqueteEnMano = closest;
					// Actualizar UI
					(window as any).gameUI?.updateCarryStatus(true);
				} else {
					console.log(`No hay dulces cerca. Mejor distancia: ${bestDist.toFixed(2)}`); // Debug
				}
			} else {
				// SOLTAR: verificar distancia al hormiguero (colisión directa con anthill)
				if (anthillRoot) {
					const anthillPosition = anthillRoot.position; // La posición real donde está el hormiguero
					const distanceToAnthill = Vector3.Distance(ant.getPosition(), anthillPosition);
					console.log(`Distancia al hormiguero: ${distanceToAnthill.toFixed(2)} | Ant: ${ant.getPosition().toString()} | Anthill: ${anthillPosition.toString()}`); // Debug
					
					if (distanceToAnthill < 1.5) {
						console.log("¡Dulce entregado en el hormiguero!"); // Debug
						
						// Crear efecto de partículas al entregar
						const deliveryPosition = anthillPosition.clone().add(new Vector3(0, 0.5, 0));
						createDeliveryEffect(deliveryPosition);
						
						// TÉCNICA DEL AGENT.MD: Romper el parenting
						paqueteEnMano.setParent(null);
						paqueteEnMano.position = deliveryPosition;
						
						(paqueteEnMano as any).gameData.delivered = true;
						paqueteEnMano = null;
						foodDelivered++;
						
						// Actualizar UI
						(window as any).gameUI?.updateCarryStatus(false);
						(window as any).gameUI?.updateFoodCounter(foodDelivered);
					} else {
						console.log(`¡Debes acercarte al hormiguero! Distancia actual: ${distanceToAnthill.toFixed(2)}`); // Debug
					}
				} else {
					console.log("Error: No se encontró el hormiguero"); // Debug
				}
			}
		}
	});

	// Modos de cámara y velocidades
	enum CameraMode {
		THIRD_PERSON = "third_person",
		FREE = "free",
		CINEMATIC = "cinematic"
	}
	
	let currentCameraMode = CameraMode.THIRD_PERSON;
	const velocidadNormal = 0.12;
	const velocidadCorrer = 0.25;
	let cinematicTime = 0;
	let showRaycastDebug = false; // Variable para mostrar debug de raycast

	// Input para cambio de modos de cámara
	window.addEventListener("keydown", (e) => {
		if (e.key === "1") {
			currentCameraMode = CameraMode.THIRD_PERSON;
			console.log("Modo de cámara: Tercera Persona");
		}
		if (e.key === "2") {
			currentCameraMode = CameraMode.FREE;
			console.log("Modo de cámara: Libre");
		}
		if (e.key === "3") {
			currentCameraMode = CameraMode.CINEMATIC;
			console.log("Modo de cámara: Cinematográfica");
			cinematicTime = 0; // Reiniciar tiempo cinematográfico
		}
		
		// Controles de velocidad de animación
		if (e.key === "q") {
			ant.slowMotion();
			console.log("Velocidad de animación: Cámara lenta (0.5x)");
		}
		if (e.key === "e") {
			ant.normalSpeed();
			console.log("Velocidad de animación: Normal (1.0x)");
		}
		if (e.key === "r") {
			ant.fastMotion();
			console.log("Velocidad de animación: Rápida (2.0x)");
		}
		
		// Info de debug del pirata
		if (e.key === "p") {
			console.log("🏴‍☠️ PIRATE DEBUG:", candyPirate.getDebugInfo(ant.getPosition()));
		}
		
		// Toggle debug de raycast
		if (e.key === "t") {
			showRaycastDebug = !showRaycastDebug;
			console.log("🔍 RAYCAST DEBUG:", showRaycastDebug ? "ACTIVADO" : "DESACTIVADO");
		}
	});

	// Mostrar controles en consola
	console.log("=== CONTROLES ===");
	console.log("WASD: Mover hormiga");
	console.log("Shift + W: Correr");
	console.log("F: Recoger/Soltar comida");
	console.log("1: Cámara tercera persona");
	console.log("2: Cámara libre");
	console.log("3: Cámara cinematográfica");
	console.log("Q: Animación lenta (0.5x)");
	console.log("E: Animación normal (1.0x)");
	console.log("R: Animación rápida (2.0x)");
	console.log("P: Debug info del pirata");
	console.log("T: Toggle debug raycast");
	console.log("================");
	console.log("🌍 CANDY PIRATE BEHAVIOR:");
	console.log("- IDLE: Distancia > 8 unidades");
	console.log("- ATTACK: Distancia 4-8 unidades");
	console.log("- RUN: Distancia < 4 unidades");
	console.log("================");
	console.log("🔒 SISTEMA SIMPLIFICADO ACTIVO");
	console.log("📍 Raycast automático para suelo");
	console.log("🚫 Física compleja DESACTIVADA");
	console.log("⚡ Movimiento directo + detección terreno");
	console.log("================");

	// Movimiento y loop
  scene.onBeforeRenderObservable.add(() => {
    if (!ant.root) return;
    
    // Determinar velocidad actual
    const isRunning = isShiftPressed && inputMap["w"];
    const velocidadActual = isRunning ? velocidadCorrer : velocidadNormal;
    
    const pos = ant.getPosition();
    let isMoving = false;
    
    // Calcular la dirección de la cámara
    const cameraDirection = camera.getTarget().subtract(camera.position).normalize();
    const cameraRight = Vector3.Cross(cameraDirection, Vector3.Up()).normalize();
    const cameraForward = new Vector3(cameraDirection.x, 0, cameraDirection.z).normalize();
    
    // Movimiento relativo a la dirección de la cámara (solo en modo tercera persona)
    if (currentCameraMode === CameraMode.THIRD_PERSON) {
      // SOLO movimiento directo y simple
      if (inputMap["w"]) { 
        pos.addInPlace(cameraForward.scale(velocidadActual)); 
        isMoving = true; 
      }
      if (inputMap["s"]) { 
        pos.addInPlace(cameraForward.scale(-velocidadActual)); 
        isMoving = true; 
      }
      if (inputMap["a"]) { 
        pos.addInPlace(cameraRight.scale(velocidadActual)); 
        isMoving = true; 
      }
      if (inputMap["d"]) { 
        pos.addInPlace(cameraRight.scale(-velocidadActual)); 
        isMoving = true; 
      }
    }
    
    // Rotar la hormiga hacia la dirección de movimiento
    if (isMoving) {
      const movementDirection = new Vector3(0, 0, 0);
      if (inputMap["w"]) movementDirection.addInPlace(cameraForward);
      if (inputMap["s"]) movementDirection.addInPlace(cameraForward.scale(-1));
      if (inputMap["a"]) movementDirection.addInPlace(cameraRight);
      if (inputMap["d"]) movementDirection.addInPlace(cameraRight.scale(-1));
      
      if (movementDirection.length() > 0) {
        movementDirection.normalize();
        const targetRotation = Math.atan2(movementDirection.x, movementDirection.z);
        ant.root.rotation.y = targetRotation;
      }
    }
    
    // SIEMPRE actualizar posición horizontal primero
    ant.setPosition(pos);

    // SISTEMA DE RAYCAST SIMPLE PARA MANTENER EN EL SUELO
    const currentPos = ant.getPosition();
    const rayOrigin = new Vector3(currentPos.x, currentPos.y + 5, currentPos.z);
    const ray = new Ray(rayOrigin, new Vector3(0, -1, 0), 10);
    
    // Debug visual del raycast si está activado
    if (showRaycastDebug) {
      const rayHelper = new RayHelper(ray);
      rayHelper.show(scene, new Color3(0, 1, 0)); // Verde para el rayo de la hormiga
    }
    
    const hit = scene.pickWithRay(ray, (mesh: any) => {
      return !mesh.name.includes("ant") && 
             !mesh.name.includes("debug") && 
             !mesh.name.includes("wireframe") &&
             !mesh.name.includes("pirate") &&
             !mesh.name.includes("candy") &&
             !mesh.name.includes("sphere") &&
             mesh.isPickable && 
             mesh.isEnabled();
    });
    
    if (hit && hit.hit && hit.pickedPoint) {
      const groundHeight = hit.pickedPoint.y;
      const antHeight = 0.2;
      currentPos.y = groundHeight + antHeight;
      ant.setPosition(currentPos);
      
      if (showRaycastDebug) {
        console.log(`🐜 Terreno detectado: ${hit.pickedMesh?.name}, Altura: ${groundHeight.toFixed(2)}, Hormiga: ${currentPos.y.toFixed(2)}`);
      }
    } else {
      // Altura mínima de seguridad
      if (currentPos.y < 0.2) {
        currentPos.y = 0.2;
        ant.setPosition(currentPos);
      }
      
      if (showRaycastDebug) {
        console.log("⚠️ Sin suelo detectado - manteniendo posición actual o usando altura mínima 0.2");
      }
    }

    // Lógica de cámara según el modo actual
    switch (currentCameraMode) {
      case CameraMode.THIRD_PERSON:
        // Cámara que sigue a la hormiga (comportamiento original)
        camera.setTarget(ant.getPosition().add(new Vector3(0, 0.3, 0)));
        break;
        
      case CameraMode.FREE:
        // Cámara libre - permitir movimiento con WASD
        const cameraSpeed = 0.3;
        if (inputMap["w"]) camera.position.addInPlace(camera.getForwardRay().direction.scale(cameraSpeed));
        if (inputMap["s"]) camera.position.addInPlace(camera.getForwardRay().direction.scale(-cameraSpeed));
        if (inputMap["a"]) camera.position.addInPlace(Vector3.Cross(camera.getForwardRay().direction, Vector3.Up()).scale(-cameraSpeed));
        if (inputMap["d"]) camera.position.addInPlace(Vector3.Cross(camera.getForwardRay().direction, Vector3.Up()).scale(cameraSpeed));
        break;
        
      case CameraMode.CINEMATIC:
        // Cámara cinematográfica - movimiento orbital automático
        cinematicTime += 0.01;
        const radius = 8;
        const height = 3;
        const centerX = ant.getPosition().x;
        const centerZ = ant.getPosition().z;
        
        camera.position.x = centerX + Math.cos(cinematicTime) * radius;
        camera.position.z = centerZ + Math.sin(cinematicTime) * radius;
        camera.position.y = height;
        camera.setTarget(ant.getPosition().add(new Vector3(0, 0.3, 0)));
        break;
    }

    // Actualizar distancia al hormiguero
    const distanceToHome = anthillRoot ? Vector3.Distance(ant.getPosition(), anthillRoot.position) : 0;
    (window as any).gameUI?.updateDistanceToHome(distanceToHome);

    // Actualizar mini-mapa
    const foodPositions = paquetes.map((p, index) => {
      const data = (p as any).gameData || {};
      const rootPos = (p as any).rootPosition;
      return {
        x: rootPos ? rootPos.x : 0,
        z: rootPos ? rootPos.z : 0,
        visible: !data.picked && !data.delivered
      };
    });
    
    (window as any).gameUI?.updateMiniMap(
      ant.getPosition(),
      anthillRoot ? anthillRoot.position : new Vector3(-5, 0, -5),
      foodPositions
    );

    // Actualizar comportamiento del Candy Pirate
    candyPirate.updateBehavior(ant.getPosition());

    // Sistema simple de altura fija para el pirata también
    const piratePos = candyPirate.getPosition();
    const pirateFixedHeight = 0.2;
    
    if (piratePos.y !== pirateFixedHeight) {
      piratePos.y = pirateFixedHeight;
      candyPirate.setPosition(piratePos);
    }

    // Animaciones
    if (isMoving) {
      if (isRunning) {
        ant.playRunAnimation();
      } else {
        ant.playWalkAnimation();
      }
    } else {
      ant.playStandAnimation();
    }
  });	return scene;
};

const scenePromise = createScene();
scenePromise.then((scene) => {
	engine.runRenderLoop(() => {
		scene.render();
	});
});

window.addEventListener("resize", () => engine.resize());
