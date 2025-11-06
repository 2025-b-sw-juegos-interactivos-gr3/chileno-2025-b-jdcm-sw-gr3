import { Scene, Vector3, TransformNode, AnimationGroup } from "@babylonjs/core";
import { loadGLTF, LoadedModel } from "../utils/modelLoader";

/**
 * CandyPirate: Personaje que reacciona a la distancia de la hormiga
 * - IDLE: Cuando la hormiga está lejos
 * - ATTACK: Cuando la hormiga está a distancia media
 * - RUN: Cuando la hormiga está muy cerca
 */
export class CandyPirate {
  private scene: Scene;
  public root: TransformNode | null = null;
  private animationGroups: AnimationGroup[] = [];
  private idleAnim: AnimationGroup | null = null;
  private attackAnim: AnimationGroup | null = null;
  private runAnim: AnimationGroup | null = null;
  private currentAnim: AnimationGroup | null = null;
  
  // Distancias para cambiar de comportamiento
  private readonly ATTACK_DISTANCE = 8; // Distancia para empezar a atacar
  private readonly RUN_DISTANCE = 4;    // Distancia para empezar a huir
  
  // Estado actual del pirata
  private currentState: 'idle' | 'attack' | 'run' = 'idle';

  constructor(scene: Scene) {
    this.scene = scene;
  }

  /** Carga el GLTF del pirata y devuelve la instancia */
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

  /** Inicializa las animaciones específicas del pirata */
  private initializeAnimations() {
    // Debug: mostrar todas las animaciones disponibles
    console.log("=== ANIMACIONES DEL CANDY PIRATE ===");
    this.animationGroups.forEach((anim, index) => {
      console.log(`${index}: ${anim.name}`);
    });

    // Buscar las animaciones por nombre (buscando variaciones comunes)
    this.idleAnim = this.animationGroups.find(anim => 
      anim.name.toLowerCase().includes("idle") ||
      anim.name.toLowerCase().includes("stand") ||
      anim.name.toLowerCase().includes("wait")
    ) || null;
    
    this.attackAnim = this.animationGroups.find(anim => 
      anim.name.toLowerCase().includes("attack") ||
      anim.name.toLowerCase().includes("fight") ||
      anim.name.toLowerCase().includes("swing")
    ) || null;

    this.runAnim = this.animationGroups.find(anim => 
      anim.name.toLowerCase().includes("run") ||
      anim.name.toLowerCase().includes("flee") ||
      anim.name.toLowerCase().includes("escape")
    ) || null;

    // Verificar que se encontraron las animaciones
    if (this.idleAnim) {
      console.log("✓ Animación IDLE encontrada:", this.idleAnim.name);
    } else {
      console.warn("✗ Animación IDLE no encontrada");
    }

    if (this.attackAnim) {
      console.log("✓ Animación ATTACK encontrada:", this.attackAnim.name);
    } else {
      console.warn("✗ Animación ATTACK no encontrada");
    }

    if (this.runAnim) {
      console.log("✓ Animación RUN encontrada:", this.runAnim.name);
    } else {
      console.warn("✗ Animación RUN no encontrada");
    }

    console.log("=====================================");

    // Iniciar con la animación idle
    this.playIdleAnimation();
  }

  /** Actualiza el comportamiento del pirata basado en la distancia a la hormiga */
  updateBehavior(antPosition: Vector3) {
    if (!this.root) return;

    const distance = Vector3.Distance(this.root.position, antPosition);
    let newState: 'idle' | 'attack' | 'run' = 'idle';

    // Determinar nuevo estado basado en distancia
    if (distance <= this.RUN_DISTANCE) {
      newState = 'run';
    } else if (distance <= this.ATTACK_DISTANCE) {
      newState = 'attack';
    } else {
      newState = 'idle';
    }

    // Solo cambiar animación si el estado cambió
    if (newState !== this.currentState) {
      this.currentState = newState;
      
      switch (newState) {
        case 'idle':
          this.playIdleAnimation();
          console.log("🏴‍☠️ Pirata: IDLE - Hormiga lejos");
          break;
        case 'attack':
          this.playAttackAnimation();
          console.log("⚔️ Pirata: ATTACK - Hormiga cerca");
          break;
        case 'run':
          this.playRunAnimation();
          console.log("🏃‍♂️ Pirata: RUN - Hormiga muy cerca!");
          break;
      }
    }
  }

  /** Reproduce la animación de idle */
  private playIdleAnimation() {
    if (!this.idleAnim) return;
    if (this.currentAnim === this.idleAnim) return;
    
    this.stopCurrentAnimation();
    this.idleAnim.start(true, 1.0, this.idleAnim.from, this.idleAnim.to, false);
    this.currentAnim = this.idleAnim;
  }

  /** Reproduce la animación de ataque */
  private playAttackAnimation() {
    if (!this.attackAnim) return;
    if (this.currentAnim === this.attackAnim) return;
    
    this.stopCurrentAnimation();
    this.attackAnim.start(true, 1.0, this.attackAnim.from, this.attackAnim.to, false);
    this.currentAnim = this.attackAnim;
  }

  /** Reproduce la animación de correr */
  private playRunAnimation() {
    if (!this.runAnim) return;
    if (this.currentAnim === this.runAnim) return;
    
    this.stopCurrentAnimation();
    this.runAnim.start(true, 1.2, this.runAnim.from, this.runAnim.to, false); // Un poco más rápido
    this.currentAnim = this.runAnim;
  }

  /** Detiene la animación actual */
  private stopCurrentAnimation() {
    if (this.currentAnim) {
      this.currentAnim.stop();
    }
  }

  /** Obtiene la posición del pirata */
  getPosition(): Vector3 {
    return this.root ? this.root.position.clone() : Vector3.Zero();
  }

  /** Establece la posición del pirata */
  setPosition(pos: Vector3) {
    if (!this.root) return;
    this.root.position.copyFrom(pos);
  }

  /** Obtiene el estado actual del pirata */
  getCurrentState(): string {
    return this.currentState;
  }

  /** Obtiene información de debug sobre las distancias */
  getDebugInfo(antPosition: Vector3): string {
    if (!this.root) return "Pirata no cargado";
    
    const distance = Vector3.Distance(this.root.position, antPosition);
    return `Distancia: ${distance.toFixed(2)} | Estado: ${this.currentState.toUpperCase()}`;
  }
}
