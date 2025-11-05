import {
  Color3,
  Mesh,
  MeshBuilder,
  Scalar,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
} from '@babylonjs/core';
import { UTILS } from '../config';

export interface Rect {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface MazeOptions {
  outerRect: Rect;
  innerLimitRect: Rect; // Zona protegida (mansión + margen)
  entrances: Vector3[]; // Puntos donde abrir puertas en el anillo exterior
  doorWidth: number; // Ancho de puerta/grieta
  randomWall: {
    minHeight: number; // [3..5]
    maxHeight: number;
    minThickness: number; // [1..3]
    maxThickness: number;
  };
  grid: {
    cellSize: number; // Tamaño de celda del laberinto
  };
  addShadow?: boolean;
}

type Side = 'north' | 'south' | 'east' | 'west';

function nearestSideAndPos(p: Vector3, rect: Rect): { side: Side; pos: number } {
  const dNorth = Math.abs(p.z - rect.maxZ);
  const dSouth = Math.abs(p.z - rect.minZ);
  const dEast = Math.abs(p.x - rect.maxX);
  const dWest = Math.abs(p.x - rect.minX);
  const dMin = Math.min(dNorth, dSouth, dEast, dWest);
  if (dMin === dNorth) return { side: 'north', pos: Scalar.Clamp(p.x, rect.minX, rect.maxX) };
  if (dMin === dSouth) return { side: 'south', pos: Scalar.Clamp(p.x, rect.minX, rect.maxX) };
  if (dMin === dEast) return { side: 'east', pos: Scalar.Clamp(p.z, rect.minZ, rect.maxZ) };
  return { side: 'west', pos: Scalar.Clamp(p.z, rect.minZ, rect.maxZ) };
}

function createWall(
  scene: Scene,
  parent: TransformNode,
  name: string,
  x1: number,
  z1: number,
  x2: number,
  z2: number,
  height: number,
  thickness: number,
  addShadow: boolean
): Mesh | null {
  const length = Math.hypot(x2 - x1, z2 - z1);
  if (length <= 0.01) return null;

  const isHorizontal = Math.abs(z2 - z1) < 1e-3;
  const centerX = (x1 + x2) / 2;
  const centerZ = (z1 + z2) / 2;
  const wall = MeshBuilder.CreateBox(
    name,
    {
      width: isHorizontal ? length : thickness,
      depth: isHorizontal ? thickness : length,
      height,
    },
    scene
  );
  wall.position.set(centerX, height / 2, centerZ);
  wall.checkCollisions = true;
  wall.parent = parent;

  const mat = new StandardMaterial(name + '_mat', scene);
  mat.diffuseColor = new Color3(0.12, 0.12, 0.16);
  mat.specularColor = new Color3(0, 0, 0);
  wall.material = mat;

  if (addShadow && (scene as any).HorrorGame?.shadowGenerator) {
    try {
      (scene as any).HorrorGame.shadowGenerator.addShadowCaster(wall);
    } catch {}
  }

  return wall;
}

function createRingWithGaps(
  scene: Scene,
  parent: TransformNode,
  rect: Rect,
  gaps: Array<{ side: Side; pos: number; width: number }>,
  randomWall: MazeOptions['randomWall'],
  addShadow: boolean
) {
  const h = UTILS.randomBetween(randomWall.minHeight, randomWall.maxHeight);
  const t = UTILS.randomBetween(randomWall.minThickness, randomWall.maxThickness);

  const bySide: Record<Side, Array<{ pos: number; width: number }>> = {
    north: [],
    south: [],
    east: [],
    west: [],
  };
  gaps.forEach((g) => bySide[g.side].push({ pos: g.pos, width: g.width }));

  const createSide = (
    side: Side,
    fixedCoord: number,
    start: number,
    end: number,
    horizontal: boolean
  ) => {
    const sorted = bySide[side]
      .map((g) => ({
        from: Scalar.Clamp(g.pos - g.width / 2, start, end),
        to: Scalar.Clamp(g.pos + g.width / 2, start, end),
      }))
      .filter((s) => s.to > s.from)
      .sort((a, b) => a.from - b.from);

    let cursor = start;
    const segments: Array<{ a: number; b: number }> = [];
    for (const gap of sorted) {
      if (gap.from > cursor) segments.push({ a: cursor, b: gap.from });
      cursor = Math.max(cursor, gap.to);
    }
    if (cursor < end) segments.push({ a: cursor, b: end });

    segments.forEach((seg, i) => {
      if (horizontal) {
        createWall(
          scene,
          parent,
          `ring_${side}_${i}`,
          seg.a,
          fixedCoord,
          seg.b,
          fixedCoord,
          h,
          t,
          addShadow
        );
      } else {
        createWall(
          scene,
          parent,
          `ring_${side}_${i}`,
          fixedCoord,
          seg.a,
          fixedCoord,
          seg.b,
          h,
          t,
          addShadow
        );
      }
    });
  };

  // Norte/Sur (horizontales) y Este/Oeste (verticales)
  createSide('north', rect.maxZ, rect.minX, rect.maxX, true);
  createSide('south', rect.minZ, rect.minX, rect.maxX, true);
  createSide('east', rect.maxX, rect.minZ, rect.maxZ, false);
  createSide('west', rect.minX, rect.minZ, rect.maxZ, false);
}

// Generación de laberinto por celdas usando "recursive backtracker"
function generateMazeGrid(
  cols: number,
  rows: number
): {
  horizontalWalls: boolean[][]; // horizontalWalls[r][c] = pared entre (r,c) y (r,c+1)
  verticalWalls: boolean[][]; // verticalWalls[r][c] = pared entre (r,c) y (r+1,c)
} {
  // Inicialmente todas las paredes existen
  const horizontalWalls: boolean[][] = Array.from({ length: rows }, () =>
    Array(cols - 1).fill(true)
  );
  const verticalWalls: boolean[][] = Array.from({ length: rows - 1 }, () => Array(cols).fill(true));
  const visited: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));

  const stack: Array<{ r: number; c: number }> = [];
  const start = { r: 0, c: 0 };
  visited[start.r][start.c] = true;
  stack.push(start);

  const neighbors = (r: number, c: number) => {
    const out: Array<{ r: number; c: number; dir: 'N' | 'S' | 'E' | 'W' }> = [];
    if (r > 0 && !visited[r - 1][c]) out.push({ r: r - 1, c, dir: 'N' });
    if (r < rows - 1 && !visited[r + 1][c]) out.push({ r: r + 1, c, dir: 'S' });
    if (c > 0 && !visited[r][c - 1]) out.push({ r, c: c - 1, dir: 'W' });
    if (c < cols - 1 && !visited[r][c + 1]) out.push({ r, c: c + 1, dir: 'E' });
    return out;
  };

  while (stack.length) {
    const current = stack[stack.length - 1];
    const nbs = neighbors(current.r, current.c);
    if (nbs.length === 0) {
      stack.pop();
      continue;
    }
    const pick = nbs[Math.floor(Math.random() * nbs.length)];
    // Eliminar pared entre current y pick
    if (pick.dir === 'E') horizontalWalls[current.r][current.c] = false;
    if (pick.dir === 'W') horizontalWalls[current.r][pick.c] = false;
    if (pick.dir === 'S') verticalWalls[current.r][current.c] = false;
    if (pick.dir === 'N') verticalWalls[pick.r][current.c] = false;

    visited[pick.r][pick.c] = true;
    stack.push({ r: pick.r, c: pick.c });
  }

  return { horizontalWalls, verticalWalls };
}

export function createMaze(scene: Scene, options: MazeOptions): TransformNode {
  const root = new TransformNode('mazeRoot', scene);

  // 1) Crear anillo exterior con dos entradas
  const gapInfos = options.entrances.map((e) => {
    const sp = nearestSideAndPos(e, options.outerRect);
    return { side: sp.side, pos: sp.pos, width: options.doorWidth };
  });

  createRingWithGaps(
    scene,
    root,
    options.outerRect,
    gapInfos,
    options.randomWall,
    !!options.addShadow
  );

  // 2) Generar celdas internas para el laberinto (sin tocar el rectángulo interior de la mansión)
  const pad = 1.5; // pequeño padding para no pegar los muros a los exteriores
  const mazeMinX = options.outerRect.minX + pad;
  const mazeMaxX = options.outerRect.maxX - pad;
  const mazeMinZ = options.outerRect.minZ + pad;
  const mazeMaxZ = options.outerRect.maxZ - pad;

  const width = mazeMaxX - mazeMinX;
  const height = mazeMaxZ - mazeMinZ;
  const cell = Math.max(2, options.grid.cellSize);

  const cols = Math.max(2, Math.floor(width / cell));
  const rows = Math.max(2, Math.floor(height / cell));

  const cellW = width / cols;
  const cellH = height / rows;

  const { horizontalWalls, verticalWalls } = generateMazeGrid(cols, rows);

  // 3) Construir los muros del grid según el resultado, evitando el rectángulo interior
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols - 1; c++) {
      if (!horizontalWalls[r][c]) continue; // no hay pared entre (r,c) y (r,c+1)

      const x1 = mazeMinX + c * cellW;
      const x2 = mazeMinX + (c + 1) * cellW;
      const z = mazeMinZ + (r + 1) * cellH; // borde inferior de la celda superior

      const midX = (x1 + x2) / 2;
      const midZ = z;
      // Omitir si este segmento cae dentro del límite interior protegido
      if (
        midX > options.innerLimitRect.minX &&
        midX < options.innerLimitRect.maxX &&
        midZ > options.innerLimitRect.minZ &&
        midZ < options.innerLimitRect.maxZ
      ) {
        continue;
      }

      const h = UTILS.randomBetween(options.randomWall.minHeight, options.randomWall.maxHeight);
      const t = UTILS.randomBetween(
        options.randomWall.minThickness,
        options.randomWall.maxThickness
      );
      createWall(scene, root, `maze_h_${r}_${c}`, x1, z, x2, z, h, t, !!options.addShadow);
    }
  }

  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols; c++) {
      if (!verticalWalls[r][c]) continue; // no hay pared entre (r,c) y (r+1,c)

      const x = mazeMinX + (c + 1) * cellW; // borde derecho de la celda izquierda
      const z1 = mazeMinZ + r * cellH;
      const z2 = mazeMinZ + (r + 1) * cellH;

      const midX = x;
      const midZ = (z1 + z2) / 2;
      if (
        midX > options.innerLimitRect.minX &&
        midX < options.innerLimitRect.maxX &&
        midZ > options.innerLimitRect.minZ &&
        midZ < options.innerLimitRect.maxZ
      ) {
        continue;
      }

      const h = UTILS.randomBetween(options.randomWall.minHeight, options.randomWall.maxHeight);
      const t = UTILS.randomBetween(
        options.randomWall.minThickness,
        options.randomWall.maxThickness
      );
      createWall(scene, root, `maze_v_${r}_${c}`, x, z1, x, z2, h, t, !!options.addShadow);
    }
  }

  return root;
}
