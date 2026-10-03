import * as BABYLON from '@babylonjs/core';

interface NodeData {
  x: number;
  y: number;
  z: number;
}

interface LinkData {
  strength: number;
}

export class Link3D {
  static create(
    scene: BABYLON.Scene,
    sourceNode: NodeData,
    targetNode: NodeData,
    linkData: LinkData
  ): BABYLON.Mesh {
    const source = new BABYLON.Vector3(sourceNode.x, sourceNode.z, sourceNode.y);
    const target = new BABYLON.Vector3(targetNode.x, targetNode.z, targetNode.y);
    const midpoint = BABYLON.Vector3.Center(source, target);
    const distance = BABYLON.Vector3.Distance(source, target);
    const arch = Math.min(12, Math.max(4, distance * 0.18));
    const control = midpoint.add(new BABYLON.Vector3(0, arch, 0));
    const curve = BABYLON.Curve3.CreateQuadraticBezier(source, control, target, 48);

    const tube = BABYLON.MeshBuilder.CreateTube(
      `link_${Math.random()}`,
      {
        path: curve.getPoints(),
        radius: Math.max(0.025, 0.045 * linkData.strength),
        cap: BABYLON.Mesh.CAP_ALL,
        tessellation: 12,
      },
      scene
    );

    const material = new BABYLON.StandardMaterial(`link_mat_${Math.random()}`, scene);
    material.emissiveColor = new BABYLON.Color3(0.22, 0.75, 1);
    material.diffuseColor = new BABYLON.Color3(0.12, 0.45, 0.8);
    material.alpha = 0.38 + linkData.strength * 0.12;
    material.alphaMode = BABYLON.Engine.ALPHA_ADD;
    material.disableLighting = true;
    tube.material = material;
    tube.isPickable = false;

    const endpointMat = new BABYLON.StandardMaterial(`link_endpoint_mat_${Math.random()}`, scene);
    endpointMat.emissiveColor = new BABYLON.Color3(0.35, 1, 1);
    endpointMat.diffuseColor = new BABYLON.Color3(0.35, 1, 1);
    endpointMat.alpha = 0.86;
    endpointMat.alphaMode = BABYLON.Engine.ALPHA_ADD;
    endpointMat.disableLighting = true;

    [source, target].forEach((point, index) => {
      const endpoint = BABYLON.MeshBuilder.CreateSphere(`link_endpoint_${index}_${Math.random()}`, { diameter: 0.42 + linkData.strength * 0.22, segments: 16 }, scene);
      endpoint.position = point;
      endpoint.material = endpointMat;
      endpoint.isPickable = false;
    });

    let time = 0;
    scene.registerBeforeRender(() => {
      time += 0.012;
      const pulse = 0.82 + Math.sin(time * 2) * 0.12;
      material.alpha = (0.34 + linkData.strength * 0.12) * pulse;
    });

    return tube;
  }
}
