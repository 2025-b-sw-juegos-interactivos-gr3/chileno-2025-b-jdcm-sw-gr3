import { Color3, Color4, Scene, Vector3 } from '@babylonjs/core';
import type { GameConfig, CharacterConfig } from './types';

/**
 * Configuración de Johnny Cage - Exclusivamente formato GLB
 */
export const JOHNNY_CAGE_CONFIG: CharacterConfig = {
  name: 'JohnnyCage',
  modelPath: '/assets/model/Swordman/',
  animations: {
    idle: 'Swordman.glb',
    walk: 'Swordman.glb',
    run: 'Swordman.glb',
  },
  scale: new Vector3(1, 1, 1), // Scale down to reasonable size
  position: new Vector3(0, 0, 0), // Move closer to camera
};

/**
 * Configuración por defecto del juego de terror
 */
export const DEFAULT_GAME_CONFIG: GameConfig = {
  canvas: {
    id: 'renderCanvas',
    antialias: true,
    preserveDrawingBuffer: true,
    stencil: true,
  },

  assets: {
    // Ruta y archivo para el modelo de la casa (GLB)
    casa: {
      path: '/assets/model/casa/',
      file: 'casa.glb',
    },
    // Ruta y archivo para el modelo de la mansión (OBJ)
    mansion: {
      path: '/assets/model/mansion/',
      file: 'rp_playboymansion_b1.obj',
    },
    defaultTexturePath: '/assets/model/mansion/rp_playboymansion_b1_material_0.png',
  },

  horror: {
    fogDensity: 0.02,
    lightIntensity: 0.1,
    particleCount: 2000,
    eventProbability: 0.1,
  },

  movement: {
    walkSpeed: 1.0,
    runSpeed: 3.0,
    creatorModeSpeed: 5.0,
    angularSensibility: 2000,
    stamina: {
      max: 100,
      drainRate: 0.5,
      regenRate: 0.3,
    },
  },

  camera: {
    position: new Vector3(0, 3, -5),
    ellipsoid: new Vector3(0.5, 1, 0.5),
    ellipsoidOffset: new Vector3(0, 1, 0),
    minZ: 0.1,
    maxZ: 250,
    applyGravity: true,
    checkCollisions: true,
  },

  // Modo de cámara por defecto
  cameraMode: 'thirdPerson',

  // Configuración de cámara en tercera persona
  thirdPersonCamera: {
    alpha: -Math.PI / 2, // detrás mirando al centro
    beta: Math.PI / 3, // elevación moderada
    radius: 3, // distancia más corta por defecto
    minRadius: 2,
    maxRadius: 6,
    lowerBetaLimit: 0.8, // evita voltear por encima
    upperBetaLimit: Math.PI / 1.5, // límite horizontal
    wheelPrecision: 25,
    angularSensibilityX: 600,
    angularSensibilityY: 600,
    panningSensibility: 0, // sin paneo en 3ª persona
    targetOffsetY: 1.6, // altura de la cabeza
    checkCollisions: true,
    collisionRadius: new Vector3(0.5, 0.5, 0.5),
    smoothFactor: 0.6, // seguimiento más “pegado” al personaje
  },

  // Configuración de cámara en primera persona
  firstPersonCamera: {
    heightOffset: 1.7,
    fov: 0.8,
    checkCollisions: true,
    applyGravity: true,
    collisionRadius: new Vector3(0.3, 0.8, 0.3),
    angularSensibility: 3000,
    inertia: 0.7,
    speed: 2.0,
  },

  atmosphere: {
    fogMode: Scene.FOGMODE_EXP2,
    fogColor: new Color3(0.02, 0.02, 0.05),
    fogDensity: 0.02,
    clearColor: new Color3(0.01, 0.01, 0.02),
    gravity: new Vector3(0, -15, 0),
    dayMode: {
      fogColor: new Color3(0.8, 0.9, 1.0),
      fogDensity: 0.005,
      clearColor: new Color3(0.5, 0.7, 1.0),
    },
  },

  lighting: {
    ambient: {
      intensity: 0.1,
      diffuse: new Color3(0.1, 0.1, 0.2),
    },
    moon: {
      intensity: 0.3,
      diffuse: new Color3(0.2, 0.2, 0.4),
      specular: new Color3(0.1, 0.1, 0.2),
      direction: new Vector3(0.5, -1, 0.5),
    },
    dayMode: {
      ambient: {
        intensity: 1.0,
        diffuse: new Color3(1.0, 1.0, 1.0),
      },
      sun: {
        intensity: 2.0,
        diffuse: new Color3(1.0, 0.95, 0.8),
        specular: new Color3(0.8, 0.8, 0.8),
        direction: new Vector3(0.3, -1, 0.2),
      },
    },
    shadows: {
      mapSize: 1024,
      useBlurShadows: true,
      blurKernel: 32,
    },
  },

  flashlight: {
    intensity: 2.5, // más suave
    range: 25,
    angle: Math.PI / 5, // cono un poco más amplio
    exponent: 1.0, // borde más suave
    color: new Color3(1, 0.9, 0.7),
    flickerProbability: 0.0003, // menos parpadeo
  },

  horrorEvents: {
    flickerLights: {
      duration: 600,
      flickerCount: 6,
      interval: 100,
    },
    shadowFigure: {
      duration: 3000,
      distance: 20,
      alpha: 0.3,
    },
    fogIncrease: {
      duration: 5000,
      multiplier: 3,
    },
  },

  particles: {
    name: 'dust',
    capacity: 5,
    emitRate: 5,
    minSize: 0.1,
    maxSize: 0.5,
    minLifeTime: 5,
    maxLifeTime: 10,
    color1: new Color4(0.1, 0.1, 0.1, 0.1),
    color2: new Color4(0.2, 0.2, 0.2, 0.2),
    colorDead: new Color4(0, 0, 0, 0),
    minEmitBox: new Vector3(-10, 0, -10),
    maxEmitBox: new Vector3(10, 5, 10),
    direction1: new Vector3(-0.1, 0.1, -0.1),
    direction2: new Vector3(0.1, 0.2, 0.1),
    minEmitPower: 0.1,
    maxEmitPower: 0.3,
  },

  postProcessing: {
    vignette: {
      enabled: true,
      weight: 0.5,
      stretch: 0.5,
      color: new Color4(0, 0, 0, 0),
      cameraFov: 0.5,
    },
  },
};

/**
 * Shader de vértice para la mansión
 */
export const VERTEX_SHADER = `
precision highp float;
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
uniform mat4 world;
uniform mat4 worldViewProjection;
varying vec3 vPositionW;
varying vec3 vNormalW;
varying vec2 vUV;

void main(void) {
    vec4 worldPos = world * vec4(position, 1.0);
    vPositionW = worldPos.xyz;
    vNormalW = normalize(mat3(world) * normal);
    vUV = uv;
    gl_Position = worldViewProjection * vec4(position, 1.0);
}
`;

/**
 * Shader de fragmento para efectos de terror
 */
export const FRAGMENT_SHADER = `
precision mediump float;
varying vec3 vPositionW;
varying vec3 vNormalW;
varying vec2 vUV;

uniform sampler2D textureSampler;
uniform vec3 vLightPosition;
uniform vec3 vCameraPosition;
uniform vec3 fogColor;
uniform float fogDensity;
uniform float time;

void main(void) {
    vec3 lightDirection = normalize(vLightPosition - vPositionW);
    vec3 normal = normalize(vNormalW);
    
    // Iluminación básica
    float ndl = max(0.0, dot(normal, lightDirection));
    
    // Color base de la textura
    vec4 baseColor = texture2D(textureSampler, vUV);
    
    // Aplicar iluminación tenebrosa
    vec3 color = baseColor.rgb * (0.1 + ndl * 0.4);
    
    // Efecto de niebla basado en distancia
    float distance = length(vCameraPosition - vPositionW);
    float fogFactor = exp(-fogDensity * distance * distance);
    fogFactor = clamp(fogFactor, 0.0, 1.0);
    
    // Efecto de parpadeo sutil para terror
    float flicker = 0.9 + 0.1 * sin(time * 10.0);
    color *= flicker;
    
    vec3 finalColor = mix(fogColor, color, fogFactor);
    gl_FragColor = vec4(finalColor, baseColor.a);
}
`;

/**
 * Mensajes del juego
 */
export const GAME_MESSAGES = {
  WELCOME: `
🎃========================================🎃
     ¡BIENVENIDO A HORROR MANSION 3D!
🎃========================================🎃

🏚️  Has entrado a una mansión embrujada...
👻  Extraños eventos pueden ocurrir en cualquier momento
🔦  Usa la linterna (L) para iluminar tu camino
🏃  Corre (Shift) pero cuida tu resistencia
👁️  Mantente alerta... no estás solo aquí
🥋  Johnny Cage te acompaña en esta aventura!

🎮 CONTROLES:
   WASD / Flechas ↑↓←→ - Movimiento (¡Ambos funcionan!)
   Shift - Correr
   L - Linterna
   C - Modo creador
   Espacio - Ataque
   1, 2, 3 - Animaciones de Johnny

🛠️ MODO DESARROLLADOR:
   Presiona C para activar/desactivar el modo creador
   En modo creador puedes volar y moverte más rápido
   Presiona N en modo creador para activar ambiente de DÍA ☀️

¡Buena suerte... la vas a necesitar! 👻
  `,

  HELP: `
🎮 AYUDA - HORROR MANSION 3D
============================
Controles básicos:
  WASD / ↑↓←→  - Movimiento
  Shift        - Correr (consume resistencia)
  L            - Encender/apagar linterna
  C            - Modo creador (volar)
  N            - Alternar luces (solo modo creador)
  Espacio      - Ataque
  H            - Mostrar esta ayuda
  F12          - Modo debug (inspector)

Controles de Johnny Cage:
  1            - Animación Idle
  2            - Animación Walk
  3            - Animación Run

Modo Creativo:
  ☀️ Presiona [N] para alternar entre NOCHE 🌙 y DÍA ☀️
  � Modo Noche: Atmósfera de terror con poca luz
  ☀️ Modo Día: Iluminación brillante para ver todos los modelos
  📋 Examinar texturas y materiales con claridad completa

¡Ten cuidado, la mansión está llena de sorpresas! 👻
  `,

  HORROR_EVENTS: {
    FLICKER: '👻 ¡La linterna parpadea misteriosamente!',
    SHADOW: '👤 Una sombra se mueve en la distancia...',
    SOUND: '🔊 *Sonido escalofriante*',
    FOG: '🌫️ La niebla se espesa...',
  },

  STATUS: {
    FLASHLIGHT_ON: '🔦 Linterna encendida',
    FLASHLIGHT_OFF: '🔦 Linterna apagada',
    CREATOR_MODE_ON: '🛠️ Modo creador activado',
    CREATOR_MODE_OFF: '🎮 Modo juego activado',
    DAY_MODE_ON: '☀️ MODO DÍA activado - Iluminación completa para ver modelos',
    DAY_MODE_OFF: '🌙 MODO NOCHE activado - Atmósfera de terror',
    ATTACK: '⚔️ ¡Ataque!',
    DEBUG_ON: '🔧 Modo debug activado',
    DEBUG_OFF: '🔧 Modo debug desactivado',
  },
};

/**
 * Utilidades para el juego
 */
export const UTILS = {
  /**
   * Genera un número aleatorio entre min y max
   */
  randomBetween: (min: number, max: number): number => {
    return Math.random() * (max - min) + min;
  },

  /**
   * Interpola linealmente entre dos valores
   */
  lerp: (a: number, b: number, t: number): number => {
    return a + (b - a) * t;
  },

  /**
   * Clamp un valor entre min y max
   */
  clamp: (value: number, min: number, max: number): number => {
    return Math.min(Math.max(value, min), max);
  },
};
