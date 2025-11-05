import * as BABYLON from '@babylonjs/core';

/**
 * Configuración de efectos de terror del juego
 */
export interface HorrorEffects {
  fogDensity: number;
  lightIntensity: number;
  particleCount: number;
  eventProbability: number;
}

/**
 * Estado de controles del jugador
 */
export interface PlayerControls {
  [key: string]: boolean;
}

/**
 * Estado del jugador
 */
export interface PlayerState {
  stamina: number;
  health: number;
  isRunning: boolean;
  isFlashlightOn: boolean;
  isInCreatorMode: boolean;
  isLightsDisabled: boolean;
  isDayMode: boolean;
  lastFootstep?: number;
  originalCameraY?: number;
  lastPositionLog?: number;
}

/**
 * Configuración de la linterna
 */
export interface FlashlightConfig {
  intensity: number;
  range: number;
  angle: number;
  exponent: number;
  color: BABYLON.Color3;
  flickerProbability: number;
}

/**
 * Configuración de movimiento del jugador
 */
export interface MovementConfig {
  walkSpeed: number;
  runSpeed: number;
  creatorModeSpeed: number;
  angularSensibility: number;
  stamina: {
    max: number;
    drainRate: number;
    regenRate: number;
  };
}

/**
 * Configuración de la cámara
 */
export interface CameraConfig {
  position: BABYLON.Vector3;
  ellipsoid: BABYLON.Vector3;
  ellipsoidOffset: BABYLON.Vector3;
  minZ: number;
  maxZ: number;
  applyGravity: boolean;
  checkCollisions: boolean;
}

/**
 * Configuración de cámara en tercera persona (ArcRotateCamera)
 */
export interface ThirdPersonCameraConfig {
  alpha: number; // rotación horizontal inicial (radianes)
  beta: number; // rotación vertical inicial (radianes)
  radius: number; // distancia inicial al objetivo
  minRadius: number;
  maxRadius: number;
  lowerBetaLimit: number;
  upperBetaLimit: number;
  wheelPrecision: number; // sensibilidad zoom rueda
  angularSensibilityX: number;
  angularSensibilityY: number;
  panningSensibility: number;
  targetOffsetY: number; // altura respecto a Johnny
  checkCollisions: boolean;
  collisionRadius: BABYLON.Vector3;
  smoothFactor: number; // 0..1, factor de suavizado del seguimiento
}

/**
 * Configuración de cámara en primera persona (UniversalCamera)
 */
export interface FirstPersonCameraConfig {
  heightOffset: number; // altura de la “cámara/ojos” sobre el suelo
  fov: number; // campo de visión
  checkCollisions: boolean;
  applyGravity: boolean;
  collisionRadius: BABYLON.Vector3;
  angularSensibility: number; // sensibilidad del mouse (mayor = más lento)
  inertia: number; // suavizado de rotación de cámara
  speed: number; // velocidad del propio FreeCamera (si se usa)
}

/**
 * Configuración de atmósfera
 */
export interface AtmosphereConfig {
  fogMode: number;
  fogColor: BABYLON.Color3;
  fogDensity: number;
  clearColor: BABYLON.Color3;
  gravity: BABYLON.Vector3;
  dayMode: {
    fogColor: BABYLON.Color3;
    fogDensity: number;
    clearColor: BABYLON.Color3;
  };
}

/**
 * Configuración de iluminación
 */
export interface LightingConfig {
  ambient: {
    intensity: number;
    diffuse: BABYLON.Color3;
  };
  moon: {
    intensity: number;
    diffuse: BABYLON.Color3;
    specular: BABYLON.Color3;
    direction: BABYLON.Vector3;
  };
  dayMode: {
    ambient: {
      intensity: number;
      diffuse: BABYLON.Color3;
    };
    sun: {
      intensity: number;
      diffuse: BABYLON.Color3;
      specular: BABYLON.Color3;
      direction: BABYLON.Vector3;
    };
  };
  shadows: {
    mapSize: number;
    useBlurShadows: boolean;
    blurKernel: number;
  };
}

/**
 * Configuración de eventos de terror
 */
export interface HorrorEventConfig {
  flickerLights: {
    duration: number;
    flickerCount: number;
    interval: number;
  };
  shadowFigure: {
    duration: number;
    distance: number;
    alpha: number;
  };
  fogIncrease: {
    duration: number;
    multiplier: number;
  };
}

/**
 * Configuración de un personaje jugable
 */
export interface CharacterConfig {
  name: string;
  modelPath: string;
  animations: {
    idle: string;
    walk: string;
    run: string;
    attack?: string;
    jump?: string;
  };
  scale: BABYLON.Vector3;
  position: BABYLON.Vector3;
}

/**
 * Estado de un personaje
 */
export interface CharacterState {
  currentAnimation: string;
  isAnimating: boolean;
  health: number;
  maxHealth: number;
  speed: number;
}

/**
 * Sistema de animaciones del personaje
 */
export interface AnimationSystem {
  idle: BABYLON.AnimationGroup | null;
  walk: BABYLON.AnimationGroup | null;
  run: BABYLON.AnimationGroup | null;
  attack?: BABYLON.AnimationGroup | null;
  jump?: BABYLON.AnimationGroup | null;
  current: BABYLON.AnimationGroup | null;
}

/**
 * Resultado de carga de assets
 */
export interface AssetLoadResult {
  meshes: BABYLON.AbstractMesh[];
  particleSystems: BABYLON.IParticleSystem[];
  skeletons: BABYLON.Skeleton[];
  animationGroups: BABYLON.AnimationGroup[];
}

/**
 * Configuración de partículas
 */
export interface ParticleSystemConfig {
  name: string;
  capacity: number;
  emitRate: number;
  minSize: number;
  maxSize: number;
  minLifeTime: number;
  maxLifeTime: number;
  color1: BABYLON.Color4;
  color2: BABYLON.Color4;
  colorDead: BABYLON.Color4;
  minEmitBox: BABYLON.Vector3;
  maxEmitBox: BABYLON.Vector3;
  direction1: BABYLON.Vector3;
  direction2: BABYLON.Vector3;
  minEmitPower: number;
  maxEmitPower: number;
}

/**
 * Configuración de post-processing
 */
export interface PostProcessingConfig {
  vignette: {
    enabled: boolean;
    weight: number;
    stretch: number;
    color: BABYLON.Color4;
    cameraFov: number;
  };
}

/**
 * Configuración completa del juego
 */
export interface GameConfig {
  canvas: {
    id: string;
    antialias: boolean;
    preserveDrawingBuffer: boolean;
    stencil: boolean;
  };
  assets: {
    casa: {
      path: string;
      file: string;
    };
    mansion: {
      path: string;
      file: string;
    };
    defaultTexturePath: string;
  };
  horror: HorrorEffects;
  movement: MovementConfig;
  camera: CameraConfig;
  cameraMode: CameraMode; // modo de cámara seleccionado
  thirdPersonCamera: ThirdPersonCameraConfig;
  firstPersonCamera: FirstPersonCameraConfig;
  atmosphere: AtmosphereConfig;
  lighting: LightingConfig;
  flashlight: FlashlightConfig;
  horrorEvents: HorrorEventConfig;
  particles: ParticleSystemConfig;
  postProcessing: PostProcessingConfig;
}

/**
 * Tipo para eventos de terror
 */
export type HorrorEventType = 'flickerLights' | 'shadowFigure' | 'scareSound' | 'fogIncrease';

/**
 * Tipo para callbacks de eventos
 */
export type HorrorEventCallback = () => void;

/**
 * Tipo para el estado del juego
 */
export type GameState = 'loading' | 'playing' | 'paused' | 'error';

/**
 * Tipo para modos de cámara
 */
export type CameraMode = 'firstPerson' | 'thirdPerson' | 'freeCam';

/**
 * Interface para debugging
 */
export interface DebugInfo {
  fps: number;
  triangles: number;
  meshes: number;
  lights: number;
  textures: number;
  materials: number;
  playerPosition: BABYLON.Vector3;
  playerStamina: number;
  isFlashlightOn: boolean;
  gameState: GameState;
}
