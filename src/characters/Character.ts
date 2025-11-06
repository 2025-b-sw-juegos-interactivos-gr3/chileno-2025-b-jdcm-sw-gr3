import { Scene, Vector3, TransformNode, AbstractMesh, AnimationGroup, PhysicsImpostor, Mesh, MeshBuilder } from "@babylonjs/core";
import { loadGLTF, LoadedModel } from "../utils/modelLoader";

/**
 * AntCharacter: envolverá el modelo de la hormiga y proveerá métodos simples
 * para posicionar, llevar y soltar objetos.
 */
export class AntCharacter {
  private scene: Scene;
  public root: TransformNode | null = null;
  private carrying: AbstractMesh | null = null;
  private animationGroups: AnimationGroup[] = [];
  private standAnim: AnimationGroup | null = null;
  private walkAnim: AnimationGroup | null = null;
  private runAnim: AnimationGroup | null = null;
  private currentAnim: AnimationGroup | null = null;
  private physicsImpostor: PhysicsImpostor | null = null;
  private physicsEnabled: boolean = false;	constructor(scene: Scene) {
		this.scene = scene;
	}

  /** Carga el GLTF de la hormiga y devuelve la instancia */
  async load(rootUrl: string, fileName: string, scaling = 1, rotation?: Vector3): Promise<this> {
    const res: LoadedModel = await loadGLTF(this.scene, rootUrl, fileName, rotation);
    this.root = res.root;
    this.animationGroups = res.animationGroups || [];
    
    // Inicializar las animaciones específicas
    this.initializeAnimations();
    
    if (this.root && scaling !== 1) {
      this.root.scaling = this.root.scaling.scaleInPlace(scaling);
    }
    return this;
  }

  /** Inicializa las animaciones específicas de la hormiga */
  private initializeAnimations() {
    // Buscar las animaciones por nombre
    this.standAnim = this.animationGroups.find(anim => 
      anim.name === "Leafka Armature|Leafka Stand"
    ) || null;
    
    this.walkAnim = this.animationGroups.find(anim => 
      anim.name === "Leafka Armature|Leafka Walk"
    ) || null;

    // Buscar animación de correr (si existe)
    this.runAnim = this.animationGroups.find(anim => 
      anim.name.toLowerCase().includes("run") || 
      anim.name.toLowerCase().includes("correr")
    ) || null;

    // Debug: mostrar todas las animaciones disponibles
    console.log("Animaciones disponibles:");
    this.animationGroups.forEach((anim, index) => {
      console.log(`${index}: ${anim.name}`);
    });

    // Verificar que se encontraron las animaciones
    if (this.standAnim) {
      console.log("✓ Animación Stand encontrada:", this.standAnim.name);
    } else {
      console.warn("✗ Animación Stand no encontrada");
    }

    if (this.walkAnim) {
      console.log("✓ Animación Walk encontrada:", this.walkAnim.name);
    } else {
      console.warn("✗ Animación Walk no encontrada");
    }

    if (this.runAnim) {
      console.log("✓ Animación Run encontrada:", this.runAnim.name);
    } else {
      console.log("ℹ Animación Run no encontrada, se usará Walk con velocidad aumentada");
    }

    // Iniciar con la animación de stand
    if (this.standAnim) {
      this.playStandAnimation();
    }
  }	setPosition(pos: Vector3) {
		if (!this.root) return;
		this.root.position.copyFrom(pos);
	}

	getPosition(): Vector3 {
		return this.root ? this.root.position.clone() : Vector3.Zero();
	}

	carry(mesh: AbstractMesh) {
		if (!this.root) return;
		mesh.setParent(this.root);
		// Colocar el objeto encima de la hormiga (ajustable)
		mesh.position = new Vector3(0, 0.5, 0);
		this.carrying = mesh;
	}

	dropAt(position: Vector3) {
		if (!this.carrying) return;
		const m = this.carrying;
		m.setParent(null);
		m.position.copyFrom(position);
		this.carrying = null;
	}

	isCarrying() {
		return !!this.carrying;
	}

  getCarriedMesh(): AbstractMesh | null {
    return this.carrying;
  }

  playStandAnimation() {
    if (!this.standAnim) return;
    if (this.currentAnim === this.standAnim) return;
    
    // Detener la animación actual
    if (this.currentAnim) {
      this.currentAnim.stop();
    }
    
    // Reproducir animación de stand
    this.standAnim.start(true, 1.0, this.standAnim.from, this.standAnim.to, false);
    this.currentAnim = this.standAnim;
  }

  playWalkAnimation() {
    if (!this.walkAnim) return;
    if (this.currentAnim === this.walkAnim) return;
    
    // Detener la animación actual
    if (this.currentAnim) {
      this.currentAnim.stop();
    }
    
    // Reproducir animación de caminar
    this.walkAnim.start(true, 1.0, this.walkAnim.from, this.walkAnim.to, false);
    this.currentAnim = this.walkAnim;
  }

  playRunAnimation() {
    // Si existe animación específica de correr, usarla
    if (this.runAnim) {
      if (this.currentAnim === this.runAnim) return;
      
      // Detener la animación actual
      if (this.currentAnim) {
        this.currentAnim.stop();
      }
      
      // Reproducir animación de correr
      this.runAnim.start(true, 1.0, this.runAnim.from, this.runAnim.to, false);
      this.currentAnim = this.runAnim;
    } else {
      // Si no hay animación de correr, usar walk pero más rápida
      if (!this.walkAnim) return;
      if (this.currentAnim === this.walkAnim && this.currentAnim.speedRatio === 2.0) return;
      
      // Detener la animación actual
      if (this.currentAnim) {
        this.currentAnim.stop();
      }
      
      // Reproducir animación de caminar más rápida
      this.walkAnim.start(true, 2.0, this.walkAnim.from, this.walkAnim.to, false);
      this.currentAnim = this.walkAnim;
    }
  }

  /** Controla la velocidad de la animación actual */
  setAnimationSpeed(speed: number) {
    if (this.currentAnim) {
      this.currentAnim.speedRatio = speed;
    }
  }

  /** Obtiene la velocidad actual de la animación */
  getAnimationSpeed(): number {
    return this.currentAnim ? this.currentAnim.speedRatio : 1.0;
  }

  /** Métodos de conveniencia para velocidades comunes */
  slowMotion() { this.setAnimationSpeed(0.5); }
  normalSpeed() { this.setAnimationSpeed(1.0); }
  fastMotion() { this.setAnimationSpeed(2.0); }

  /** Habilita la física para la hormiga */
  enablePhysics() {
    if (!this.root || this.physicsEnabled) return;
    
    // Crear un mesh box simple para la física de la hormiga
    const antPhysicsMesh = MeshBuilder.CreateBox("antPhysics", {
      width: 0.3,
      height: 0.5,
      depth: 0.3
    }, this.scene);
    
    // Hacer el mesh invisible (solo para física)
    antPhysicsMesh.isVisible = false;
    
    // Posicionar el mesh de física en la misma posición que la hormiga
    antPhysicsMesh.position.copyFrom(this.root.position);
    
    // Hacer que el mesh de física sea hijo del root de la hormiga
    antPhysicsMesh.parent = this.root;
    antPhysicsMesh.position = Vector3.Zero(); // Resetear posición relativa
    
    // Crear el impostor de física usando BoxImpostor (más compatible)
    this.physicsImpostor = new PhysicsImpostor(antPhysicsMesh, PhysicsImpostor.BoxImpostor, {
      mass: 1, // Masa ligera para la hormiga
      restitution: 0.1, // Poco rebote
      friction: 0.8 // Buena fricción para caminar
    }, this.scene);
    
    this.physicsEnabled = true;
    console.log("✓ Física habilitada para la hormiga (BoxImpostor)");
  }

  /** Deshabilita la física para la hormiga */
  disablePhysics() {
    if (this.physicsImpostor) {
      this.physicsImpostor.dispose();
      this.physicsImpostor = null;
    }
    this.physicsEnabled = false;
    console.log("✗ Física deshabilitada para la hormiga");
  }

  /** Aplica una fuerza de movimiento (para usar con física) */
  applyMovementForce(direction: Vector3, force: number) {
    if (!this.physicsImpostor) return;
    
    // Aplicar fuerza horizontal (mantener Y en 0 para evitar vuelo)
    const movementForce = new Vector3(direction.x * force, 0, direction.z * force);
    this.physicsImpostor.applyImpulse(movementForce, this.getPosition());
  }

  /** Verifica si la física está habilitada */
  isPhysicsEnabled(): boolean {
    return this.physicsEnabled;
  }
}
