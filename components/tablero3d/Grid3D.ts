import * as BABYLON from '@babylonjs/core';

export class Grid3D {
  static create(scene: BABYLON.Scene): void {
    const gridSize = 86;
    const divisions = 28;
    const step = gridSize / divisions;

    // Campo discreto de puntos: profundidad sin plano dominante ni superficies diagonales.
    for (let x = -divisions / 2; x <= divisions / 2; x++) {
      for (let z = -divisions / 2; z <= divisions / 2; z++) {
        if ((x + z) % 2 !== 0) continue;
        const dot = BABYLON.MeshBuilder.CreatePlane(`map_dot_${x}_${z}`, { width: 0.06, height: 0.06 }, scene);
        dot.position = new BABYLON.Vector3(x * step, -3.4, z * step);
        dot.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
        dot.isPickable = false;

        const dotMat = new BABYLON.StandardMaterial(`map_dot_mat_${x}_${z}`, scene);
        const intensity = 0.12 + Math.random() * 0.18;
        dotMat.emissiveColor = new BABYLON.Color3(0.18 * intensity, 0.72 * intensity, intensity);
        dotMat.diffuseColor = dotMat.emissiveColor;
        dotMat.alpha = 0.12 + Math.random() * 0.16;
        dotMat.alphaMode = BABYLON.Engine.ALPHA_ADD;
        dotMat.disableLighting = true;
        dot.material = dotMat;
      }
    }

    // Líneas guía apenas visibles, como profundidad espacial, no como piso azul.
    const lineMaterialColor = new BABYLON.Color3(0.12, 0.33, 0.58);
    for (let i = -divisions / 2; i <= divisions / 2; i += 4) {
      const offset = i * step;
      const lineX = BABYLON.MeshBuilder.CreateLines(
        `map_grid_x_${i}`,
        { points: [new BABYLON.Vector3(-gridSize / 2, -3.6, offset), new BABYLON.Vector3(gridSize / 2, -3.6, offset)] },
        scene
      );
      lineX.color = lineMaterialColor;
      lineX.alpha = 0.035;
      lineX.isPickable = false;

      const lineZ = BABYLON.MeshBuilder.CreateLines(
        `map_grid_z_${i}`,
        { points: [new BABYLON.Vector3(offset, -3.6, -gridSize / 2), new BABYLON.Vector3(offset, -3.6, gridSize / 2)] },
        scene
      );
      lineZ.color = lineMaterialColor;
      lineZ.alpha = 0.035;
      lineZ.isPickable = false;
    }
  }
}
