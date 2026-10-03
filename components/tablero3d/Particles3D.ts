
import * as BABYLON from '@babylonjs/core';

export class Particles3D {
  static create(scene: BABYLON.Scene): void {
    // Sistema de partículas ambientales
    const particleSystem = new BABYLON.ParticleSystem('particles', 420, scene);

    // Textura de partícula (punto brillante)
    particleSystem.particleTexture = new BABYLON.Texture(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQYV2NkYGD4z8DAwMgABXAGMgOpgRhgZIAAOAOZAQCn8AEL5C4AqAAAAABJRU5ErkJggg==',
      scene
    );

    // Emisor (volumen esférico)
    particleSystem.emitter = BABYLON.Vector3.Zero();
    particleSystem.minEmitBox = new BABYLON.Vector3(-48, -8, -38);
    particleSystem.maxEmitBox = new BABYLON.Vector3(48, 28, 38);

    // Colores
    particleSystem.color1 = new BABYLON.Color4(0.25, 0.85, 1, 0.38);
    particleSystem.color2 = new BABYLON.Color4(0.55, 0.45, 1, 0.24);
    particleSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0);

    // Tamaño
    particleSystem.minSize = 0.045;
    particleSystem.maxSize = 0.16;

    // Vida
    particleSystem.minLifeTime = 5;
    particleSystem.maxLifeTime = 10;

    // Emisión
    particleSystem.emitRate = 14;

    // Blend mode
    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;

    // Dirección (flotación lenta)
    particleSystem.direction1 = new BABYLON.Vector3(-0.5, 0.5, -0.5);
    particleSystem.direction2 = new BABYLON.Vector3(0.5, 1, 0.5);

    // Velocidad
    particleSystem.minEmitPower = 0.2;
    particleSystem.maxEmitPower = 0.5;
    particleSystem.updateSpeed = 0.01;

    // Gravedad (leve ascenso)
    particleSystem.gravity = new BABYLON.Vector3(0, 0.2, 0);

    // Iniciar sistema
    particleSystem.start();

    // Partículas de energía más brillantes (menos cantidad)
    const energyParticles = new BABYLON.ParticleSystem('energyParticles', 90, scene);
    energyParticles.particleTexture = particleSystem.particleTexture;

    energyParticles.emitter = BABYLON.Vector3.Zero();
    energyParticles.minEmitBox = new BABYLON.Vector3(-30, 0, -30);
    energyParticles.maxEmitBox = new BABYLON.Vector3(30, 15, 30);

    energyParticles.color1 = new BABYLON.Color4(1, 0.5, 1, 1);
    energyParticles.color2 = new BABYLON.Color4(0.5, 1, 1, 0.8);
    energyParticles.colorDead = new BABYLON.Color4(0, 0, 0, 0);

    energyParticles.minSize = 0.06;
    energyParticles.maxSize = 0.22;

    energyParticles.minLifeTime = 3;
    energyParticles.maxLifeTime = 6;

    energyParticles.emitRate = 4;
    energyParticles.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;

    energyParticles.direction1 = new BABYLON.Vector3(-1, 0.2, -1);
    energyParticles.direction2 = new BABYLON.Vector3(1, 0.8, 1);

    energyParticles.minEmitPower = 0.5;
    energyParticles.maxEmitPower = 1;
    energyParticles.updateSpeed = 0.015;

    energyParticles.gravity = new BABYLON.Vector3(0, 0.1, 0);

    energyParticles.start();
  }
}
