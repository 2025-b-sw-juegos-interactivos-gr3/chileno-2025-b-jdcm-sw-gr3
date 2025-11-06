import { Scene, TransformNode, AbstractMesh, AnimationGroup, Vector3 } from "@babylonjs/core";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import "@babylonjs/loaders";

export type LoadedModel = {
  root: TransformNode;
  meshes: AbstractMesh[];
  animationGroups: AnimationGroup[];
};

/**
 * Carga un GLTF/GLB y agrupa las mallas bajo un TransformNode padre para manipulación sencilla.
 * @param scene Babylon scene
 * @param rootUrl Ruta relativa desde /public (p.ej. '/assets/model/ant/')
 * @param fileName Nombre de archivo (p.ej. 'scene.gltf')
 */
export async function loadGLTF(scene: Scene, rootUrl: string, fileName: string, rotation?: Vector3): Promise<LoadedModel> {
  const result = await SceneLoader.ImportMeshAsync("", rootUrl, fileName, scene);

  const root = new TransformNode((fileName || "model") + "_root", scene);
  result.meshes.forEach((m) => {
    try {
      m.parent = root;
    } catch (e) {
      // ignore
    }
  });

  if (rotation) {
    root.rotation = rotation;
  }

  return {
    root,
    meshes: result.meshes as AbstractMesh[],
    animationGroups: result.animationGroups as AnimationGroup[] || [],
  };
}
