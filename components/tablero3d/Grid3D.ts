import * as BABYLON from '@babylonjs/core';

export class Grid3D {
  static create(scene: BABYLON.Scene): void {
    const gridSize = 86;
    const divisions = 28;
    const step = gridSize / divisions;

    // Campo discreto de puntos: profundidad sin plano dominante.
    for (let x = -divisions / 2; x <= divisions / 2; x++) {
      for (let z = -divisions / 2; z <= divisions / 2; z++) {
        if ((x + z) % 2 !== 0) continue;
        const dot = BABYLON.MeshBuilder.CreatePlane(
          `map_dot_${x}_${z}`,
          { width: 0.07, height: 0.07 },
          scene
        );
        dot.position = new BABYLON.Vector3(x * step, -2.8, z * step);
        dot.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
        dot.isPickable = false;

        const dotMat = new BABYLON.StandardMaterial(`map_dot_mat_${x}_${z}`, scene);
        const intensity = 0.16 + Math.random() * 0.18;
        dotMat.emissiveColor = new BABYLON.Color3(0.2 * intensity, 0.75 * intensity, intensity);
        dotMat.diffuseColor = dotMat.emissiveColor;
        dotMat.alpha = 0.18 + Math.random() * 0.2;
        dotMat.alphaMode = BABYLON.Engine.ALPHA_ADD;
        dotMat.disableLighting = true;
        dot.material = dotMat;
      }
    }

    // Líneas de referencia extremadamente sutiles, sin superficie sólida.
    const lineMaterialColor = new BABYLON.Color3(0.16, 0.44, 0.72);
    for (let i = -divisions / 2; i <= divisions / 2; i += 4) {
      const offset = i * step;
      const lineX = BABYLON.MeshBuilder.CreateLines(
        `map_grid_x_${i}`,
        { points: [new BABYLON.Vector3(-gridSize / 2, -3.2, offset), new BABYLON.Vector3(gridSize / 2, -3.2, offset)] },
        scene
      );
      lineX.color = lineMaterialColor;
      lineX.alpha = 0.08;
      lineX.isPickable = false;

      const lineZ = BABYLON.MeshBuilder.CreateLines(
        `map_grid_z_${i}`,
        { points: [new BABYLON.Vector3(offset, -3.2, -gridSize / 2), new BABYLON.Vector3(offset, -3.2, gridSize / 2)] },
        scene
      );
      lineZ.color = lineMaterialColor;
      lineZ.alpha = 0.08;
      lineZ.isPickable = false;
    }

    // Nebulosas bajas y suaves para profundidad, sin tapar nodos ni texto.
    const makeNebula = (name: string, position: BABYLON.Vector3, color: BABYLON.Color3, width: number, alpha: number) => {
      const plane = BABYLON.MeshBuilder.CreatePlane(name, { width, height: width * 0.55 }, scene);
      plane.position = position;
      plane.rotation.x = Math.PI / 2;
      plane.isPickable = false;
      const mat = new BABYLON.StandardMaterial(`${name}_mat`, scene);
      mat.diffuseColor = color;
      mat.emissiveColor = color;
      mat.alpha = alpha;
      mat.alphaMode = BABYLON.Engine.ALPHA_ADD;
      mat.disableLighting = true;
      mat.backFaceCulling = false;
      plane.material = mat;
      return plane;
    };

    const cyanNebula = makeNebula('cyan_nebula', new BABYLON.Vector3(-12, -4.2, 4), new BABYLON.Color3(0.08, 0.55, 0.72), 34, 0.055);
    const violetNebula = makeNebula('violet_nebula', new BABYLON.Vector3(24, -4.4, -12), new BABYLON.Color3(0.32, 0.18, 0.72), 42, 0.045);

    let time = 0;
    scene.registerBeforeRender(() => {
      time += 0.006;
      cyanNebula.rotation.z = Math.sin(time) * 0.04;
      violetNebula.rotation.z = -Math.cos(time * 0.8) * 0.035;
    });
  }
}
