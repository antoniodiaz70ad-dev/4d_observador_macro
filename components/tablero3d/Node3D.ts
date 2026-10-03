
import * as BABYLON from '@babylonjs/core';
import { getWolcoffDistortion, getWolcoffColor } from '@/lib/nodeInterpreter';

export interface NodeData {
  id: string;
  x: number;
  y: number;
  z: number;
  size: number;
  energy: number;
  label: string;
  color: string;
  type: string;
  coherence?: number;
  metadata?: Record<string, any>;
}

export class Node3D {
  static create(
    scene: BABYLON.Scene,
    nodeData: NodeData,
    shadowGenerator: BABYLON.ShadowGenerator
  ): BABYLON.Mesh {
    const isObserver = nodeData.type === 'self';
    const isProject = nodeData.type === 'project';
    const isRelationship = nodeData.type === 'relationship';

    // La evidencia clínica/productiva se decide en el panel; el mapa debe conservar lectura visual estable.
    const measuredCoherence = nodeData.coherence ?? nodeData.energy;
    const coherence = isObserver || isProject || isRelationship
      ? Math.max(measuredCoherence, 0.68)
      : measuredCoherence;
    const wolcoff = getWolcoffDistortion(coherence);
    
    const baseColor = BABYLON.Color3.FromHexString(nodeData.color);

    // Crear geometría principal según tipo: ojo / cubo / persona
    let sphere: BABYLON.Mesh;
    if (isProject) {
      sphere = BABYLON.MeshBuilder.CreateBox(
        nodeData.id,
        { size: nodeData.size * 0.95 },
        scene
      );
      sphere.rotation = new BABYLON.Vector3(Math.PI / 10, Math.PI / 4, -Math.PI / 18);
    } else {
      sphere = BABYLON.MeshBuilder.CreateSphere(
        nodeData.id,
        {
          diameter: nodeData.size,
          segments: 48,
        },
        scene
      );
    }

    // Posición con eje Z real (Y es altura en Babylon.js)
    const basePosition = new BABYLON.Vector3(nodeData.x, nodeData.z, nodeData.y);
    sphere.position = basePosition.clone();
    sphere.receiveShadows = false;

    const wolcoffColorHex = getWolcoffColor(coherence);
    const wolcoffColor = BABYLON.Color3.FromHexString(wolcoffColorHex);
    const finalColor = isObserver || isProject || isRelationship
      ? baseColor
      : coherence > 0.5
        ? BABYLON.Color3.Lerp(baseColor, wolcoffColor, 0.3)
        : BABYLON.Color3.Lerp(baseColor, wolcoffColor, 0.5);

    const material = new BABYLON.StandardMaterial(`${nodeData.id}_mat`, scene);
    material.diffuseColor = finalColor;
    material.emissiveColor = finalColor.scale(isProject ? 0.65 : 0.5);
    material.specularColor = new BABYLON.Color3(1, 1, 1);
    material.specularPower = isProject ? 96 : 64;
    material.alpha = isProject ? 0.72 : 0.82;
    material.backFaceCulling = false;
    sphere.material = material;

    // Borde brillante para el cubo, como la referencia visual
    if (isProject) {
      sphere.enableEdgesRendering();
      sphere.edgesWidth = 4;
      sphere.edgesColor = new BABYLON.Color4(0.78, 0.62, 1, 0.95);
    }

    shadowGenerator.addShadowCaster(sphere);
    sphere.receiveShadows = true;

    // Halo externo translúcido
    const glow = BABYLON.MeshBuilder.CreateSphere(
      `${nodeData.id}_glow`,
      {
        diameter: nodeData.size * (isProject ? 1.85 : isObserver ? 1.55 : 1.45),
        segments: 32,
      },
      scene
    );
    glow.position = sphere.position.clone();

    const glowMat = new BABYLON.StandardMaterial(`${nodeData.id}_glow_mat`, scene);
    glowMat.diffuseColor = finalColor;
    glowMat.emissiveColor = finalColor;
    glowMat.alpha = isObserver ? 0.18 : isProject ? 0.11 : 0.16;
    glowMat.alphaMode = BABYLON.Engine.ALPHA_ADD;
    glowMat.backFaceCulling = false;
    glow.material = glowMat;
    glow.isPickable = false;

    // Núcleo / icono central según tipo
    let core: BABYLON.Mesh;
    if (isProject) {
      core = BABYLON.MeshBuilder.CreateBox(
        `${nodeData.id}_core`,
        { size: nodeData.size * 0.34 },
        scene
      );
      core.rotation = sphere.rotation.clone();
    } else if (isRelationship) {
      core = BABYLON.MeshBuilder.CreateSphere(
        `${nodeData.id}_core`,
        { diameter: nodeData.size * 0.26, segments: 24 },
        scene
      );
      core.position = sphere.position.clone().add(new BABYLON.Vector3(0, nodeData.size * 0.08, -nodeData.size * 0.47));
    } else {
      core = BABYLON.MeshBuilder.CreateSphere(
        `${nodeData.id}_core`,
        { diameter: nodeData.size * 0.18, segments: 24 },
        scene
      );
      core.position = sphere.position.clone().add(new BABYLON.Vector3(0, 0, -nodeData.size * 0.5));
    }

    if (isProject) {
      core.position = sphere.position.clone();
    }

    const coreMat = new BABYLON.StandardMaterial(`${nodeData.id}_core_mat`, scene);
    coreMat.diffuseColor = new BABYLON.Color3(0.88, 0.82, 1);
    coreMat.emissiveColor = isProject
      ? new BABYLON.Color3(0.9, 0.75, 1)
      : isRelationship
        ? new BABYLON.Color3(0.72, 1, 0.82)
        : new BABYLON.Color3(0.58, 1, 1);
    coreMat.alpha = 0.96;
    coreMat.specularPower = 96;
    core.material = coreMat;
    core.isPickable = false;

    let eyeRing: BABYLON.Mesh | null = null;
    let pupil: BABYLON.Mesh | null = null;
    let relationshipBody: BABYLON.Mesh | null = null;
    let projectOrbit: BABYLON.Mesh | null = null;

    // Ojo 3D del observador: aro elíptico + pupila sobre la esfera turquesa
    if (isObserver) {
      eyeRing = BABYLON.MeshBuilder.CreateTorus(
        `${nodeData.id}_eye_ring`,
        { diameter: nodeData.size * 0.68, thickness: nodeData.size * 0.045, tessellation: 72 },
        scene
      );
      eyeRing.position = sphere.position.clone().add(new BABYLON.Vector3(0, 0, -nodeData.size * 0.53));
      eyeRing.scaling.x = 1.65;
      eyeRing.scaling.y = 0.55;
      eyeRing.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
      const eyeMat = new BABYLON.StandardMaterial(`${nodeData.id}_eye_ring_mat`, scene);
      eyeMat.emissiveColor = new BABYLON.Color3(0.42, 1, 1);
      eyeMat.diffuseColor = new BABYLON.Color3(0.42, 1, 1);
      eyeMat.alpha = 0.98;
      eyeRing.material = eyeMat;
      eyeRing.isPickable = false;

      pupil = BABYLON.MeshBuilder.CreateSphere(
        `${nodeData.id}_pupil`,
        { diameter: nodeData.size * 0.22, segments: 24 },
        scene
      );
      pupil.position = sphere.position.clone().add(new BABYLON.Vector3(0, 0, -nodeData.size * 0.6));
      const pupilMat = new BABYLON.StandardMaterial(`${nodeData.id}_pupil_mat`, scene);
      pupilMat.emissiveColor = new BABYLON.Color3(0.85, 1, 1);
      pupilMat.diffuseColor = new BABYLON.Color3(0.75, 1, 1);
      pupil.material = pupilMat;
      pupil.isPickable = false;

      const highlight = BABYLON.MeshBuilder.CreateSphere(
        `${nodeData.id}_highlight`,
        { diameter: nodeData.size * 0.22, segments: 24 },
        scene
      );
      highlight.position = sphere.position.clone().add(new BABYLON.Vector3(-nodeData.size * 0.22, nodeData.size * 0.24, -nodeData.size * 0.42));
      const highlightMat = new BABYLON.StandardMaterial(`${nodeData.id}_highlight_mat`, scene);
      highlightMat.emissiveColor = new BABYLON.Color3(0.72, 1, 1);
      highlightMat.diffuseColor = new BABYLON.Color3(0.72, 1, 1);
      highlightMat.alpha = 0.55;
      highlightMat.alphaMode = BABYLON.Engine.ALPHA_ADD;
      highlight.material = highlightMat;
      highlight.isPickable = false;

      scene.registerBeforeRender(() => {
        highlight.position.x = sphere.position.x - nodeData.size * 0.22;
        highlight.position.y = sphere.position.y + nodeData.size * 0.24;
        highlight.position.z = sphere.position.z - nodeData.size * 0.42;
      });
    }

    // Icono de persona para relaciones: cabeza + cuerpo, como la fotografía
    if (isRelationship) {
      relationshipBody = BABYLON.MeshBuilder.CreateSphere(
        `${nodeData.id}_person_body`,
        { diameter: nodeData.size * 0.42, segments: 24 },
        scene
      );
      relationshipBody.position = sphere.position.clone().add(new BABYLON.Vector3(0, -nodeData.size * 0.22, -nodeData.size * 0.47));
      relationshipBody.scaling.y = 0.62;
      const bodyMat = new BABYLON.StandardMaterial(`${nodeData.id}_person_body_mat`, scene);
      bodyMat.emissiveColor = new BABYLON.Color3(0.72, 1, 0.82);
      bodyMat.diffuseColor = new BABYLON.Color3(0.72, 1, 0.82);
      bodyMat.alpha = 0.95;
      relationshipBody.material = bodyMat;
      relationshipBody.isPickable = false;
    }

    // Aro orbital fino para reforzar la selección visual del nodo proyecto
    if (isProject) {
      projectOrbit = BABYLON.MeshBuilder.CreateTorus(
        `${nodeData.id}_orbit`,
        { diameter: nodeData.size * 1.65, thickness: nodeData.size * 0.018, tessellation: 96 },
        scene
      );
      projectOrbit.position = sphere.position.clone();
      projectOrbit.rotation.x = Math.PI / 2.15;
      const orbitMat = new BABYLON.StandardMaterial(`${nodeData.id}_orbit_mat`, scene);
      orbitMat.emissiveColor = new BABYLON.Color3(0.48, 0.55, 1);
      orbitMat.diffuseColor = new BABYLON.Color3(0.48, 0.55, 1);
      orbitMat.alpha = 0.6;
      orbitMat.alphaMode = BABYLON.Engine.ALPHA_ADD;
      projectOrbit.material = orbitMat;
      projectOrbit.isPickable = false;
    }

    // Etiqueta persistente del nodo
    const labelWidth = 512;
    const labelHeight = 128;
    const labelTexture = new BABYLON.DynamicTexture(`${nodeData.id}_label_texture`, { width: labelWidth, height: labelHeight }, scene, true);
    labelTexture.hasAlpha = true;
    const labelContext = labelTexture.getContext();
    labelContext.clearRect(0, 0, labelWidth, labelHeight);
    labelContext.fillStyle = 'rgba(5, 12, 25, 0.82)';
    labelContext.strokeStyle = 'rgba(147, 197, 253, 0.58)';
    labelContext.lineWidth = 3;
    const radius = 22;
    labelContext.beginPath();
    labelContext.moveTo(8 + radius, 18);
    labelContext.lineTo(labelWidth - 8 - radius, 18);
    labelContext.quadraticCurveTo(labelWidth - 8, 18, labelWidth - 8, 18 + radius);
    labelContext.lineTo(labelWidth - 8, labelHeight - 18 - radius);
    labelContext.quadraticCurveTo(labelWidth - 8, labelHeight - 18, labelWidth - 8 - radius, labelHeight - 18);
    labelContext.lineTo(8 + radius, labelHeight - 18);
    labelContext.quadraticCurveTo(8, labelHeight - 18, 8, labelHeight - 18 - radius);
    labelContext.lineTo(8, 18 + radius);
    labelContext.quadraticCurveTo(8, 18, 8 + radius, 18);
    labelContext.closePath();
    labelContext.fill();
    labelContext.stroke();
    labelContext.fillStyle = '#ffffff';
    labelContext.font = 'bold 32px sans-serif';
    const title = nodeData.label.length > 24 ? `${nodeData.label.slice(0, 21)}…` : nodeData.label;
    labelContext.fillText(title, 34, 62);
    labelContext.fillStyle = 'rgba(191, 219, 254, 0.85)';
    labelContext.font = '22px sans-serif';
    const subtitle = nodeData.type === 'self' ? 'Centro de tu mapa' : nodeData.type === 'project' ? 'Proyecto' : nodeData.type === 'relationship' ? 'Relación' : 'Nodo';
    labelContext.fillText(subtitle, 34, 96);
    labelTexture.update();

    const labelPlane = BABYLON.MeshBuilder.CreatePlane(`${nodeData.id}_label`, { width: nodeData.size * 5.2, height: nodeData.size * 1.25 }, scene);
    labelPlane.position = new BABYLON.Vector3(nodeData.x, nodeData.z - nodeData.size * 1.05, nodeData.y);
    labelPlane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
    labelPlane.isPickable = false;

    const labelMat = new BABYLON.StandardMaterial(`${nodeData.id}_label_mat`, scene);
    labelMat.diffuseTexture = labelTexture;
    labelMat.emissiveColor = new BABYLON.Color3(0.85, 0.92, 1);
    labelMat.opacityTexture = labelTexture;
    labelMat.disableLighting = true;
    labelMat.backFaceCulling = false;
    labelPlane.material = labelMat;

    // === GEOMETRÍA DE WOLCOFF ===
    // Fase aleatoria para que cada nodo sea único
    let time = Math.random() * Math.PI * 2;
    const phase = Math.random() * Math.PI * 2;
    const phase2 = Math.random() * Math.PI * 2;
    const phase3 = Math.random() * Math.PI * 2;
    
    scene.registerBeforeRender(() => {
      time += 0.01;
      
      // === LÓGICA WOLCOFF: Distorsión basada en coherencia ===
      
      if (coherence >= 0.8) {
        // FLUJO DIVINO: Esfera perfecta, movimiento suave y armónico
        sphere.scaling.setAll(1);
        
        // Vibración mínima y armónica (levitación suave)
        const gentleVibration = Math.sin(time * 1.5 + phase) * 0.03 * nodeData.energy;
        sphere.position.y = nodeData.z + gentleVibration;
        glow.position.y = sphere.position.y;
        core.position.y = sphere.position.y;
        
        // Glow estable y brillante
        glowMat.alpha = 0.2 + Math.sin(time * 0.5) * 0.02;
        
        // Core con brillo constante
        const coreIntensity = 0.85 + Math.sin(time * 2) * 0.1;
        coreMat.emissiveColor = new BABYLON.Color3(coreIntensity, coreIntensity, coreIntensity);
        
      } else if (coherence >= 0.6) {
        // EXPANSIÓN: Leve ondulación, forma casi perfecta
        const scaleVar = wolcoff.scaleVariance * 0.5;
        sphere.scaling.x = 1 + Math.sin(time * 1.2 + phase) * scaleVar;
        sphere.scaling.y = 1 + Math.cos(time * 1.0 + phase2) * scaleVar * 0.8;
        sphere.scaling.z = 1 + Math.sin(time * 1.4 + phase3) * scaleVar * 0.6;
        
        // Vibración suave
        const vibration = Math.sin(time * 2 + phase) * 0.04 * nodeData.energy;
        sphere.position.y = nodeData.z + vibration;
        glow.position.y = sphere.position.y;
        core.position.y = sphere.position.y;
        
        // Glow con leve pulsación
        glowMat.alpha = 0.15 + Math.sin(time * 1.5) * 0.03;
        
        // Pulsación del glow
        const pulse = 1 + Math.sin(time) * 0.08;
        glow.scaling.setAll(pulse);
        
        // Core estable
        const coreIntensity = 0.75 + Math.sin(time * 2.5) * 0.15;
        coreMat.emissiveColor = new BABYLON.Color3(coreIntensity, coreIntensity, coreIntensity);
        
      } else if (coherence >= 0.4) {
        // FRICCIÓN: Distorsión visible, vibración irregular
        const scaleVar = wolcoff.scaleVariance;
        sphere.scaling.x = 1 + Math.sin(time * 2.5 + phase) * scaleVar;
        sphere.scaling.y = 1 + Math.cos(time * 2.0 + phase2) * scaleVar * 0.85;
        sphere.scaling.z = 1 + Math.sin(time * 3.0 + phase3) * scaleVar;
        
        // Vibración más intensa
        const vibration = Math.sin(time * wolcoff.vibrationSpeed + phase) * 0.06 * nodeData.energy;
        sphere.position.y = nodeData.z + vibration;
        glow.position.y = sphere.position.y;
        core.position.y = sphere.position.y;
        
        // Pequeño desplazamiento lateral (inestabilidad)
        const lateralShake = wolcoff.distortion * 0.03;
        sphere.position.x = nodeData.x + Math.sin(time * 3) * lateralShake;
        sphere.position.z = nodeData.y + Math.cos(time * 2.5) * lateralShake;
        glow.position.x = sphere.position.x;
        glow.position.z = sphere.position.z;
        core.position.x = sphere.position.x;
        core.position.z = sphere.position.z;
        
        // Glow inestable
        glowMat.alpha = 0.12 + Math.sin(time * 2.5) * 0.06;
        
        // Pulsación irregular
        const pulse = 1 + Math.sin(time * 1.5) * 0.12;
        glow.scaling.setAll(pulse);
        
        // Core con parpadeo
        const coreIntensity = 0.6 + Math.sin(time * 4) * 0.25;
        coreMat.emissiveColor = new BABYLON.Color3(coreIntensity, coreIntensity, coreIntensity);
        
      } else if (coherence >= 0.2) {
        // SATURACIÓN/EGO: Distorsión alta, movimiento errático
        const scaleVar = wolcoff.scaleVariance * 1.2;
        sphere.scaling.x = 1 + Math.sin(time * 4 + phase) * scaleVar;
        sphere.scaling.y = 1 + Math.cos(time * 3.5 + phase2) * scaleVar * 0.9;
        sphere.scaling.z = 1 + Math.sin(time * 5 + phase3) * scaleVar * 1.1;
        
        // Vibración errática
        const vibrationSpeed = wolcoff.vibrationSpeed * 1.5;
        const vibration = Math.sin(time * vibrationSpeed + phase) * 0.08 * nodeData.energy;
        sphere.position.y = nodeData.z + vibration;
        glow.position.y = sphere.position.y;
        core.position.y = sphere.position.y;
        
        // Temblor lateral visible
        const shake = wolcoff.distortion * 0.06;
        sphere.position.x = nodeData.x + Math.sin(time * 5) * shake + (Math.random() - 0.5) * 0.02;
        sphere.position.z = nodeData.y + Math.cos(time * 4) * shake + (Math.random() - 0.5) * 0.02;
        glow.position.x = sphere.position.x;
        glow.position.z = sphere.position.z;
        core.position.x = sphere.position.x;
        core.position.z = sphere.position.z;
        
        // Glow muy inestable
        glowMat.alpha = 0.1 + Math.sin(time * 4) * 0.08 + Math.random() * 0.02;
        
        // Pulsación caótica
        const pulse = 1 + Math.sin(time * 2.5) * 0.15 + Math.random() * 0.03;
        glow.scaling.setAll(pulse);
        
        // Core parpadeante
        const coreIntensity = 0.5 + Math.sin(time * 6) * 0.35;
        coreMat.emissiveColor = new BABYLON.Color3(coreIntensity, coreIntensity * 0.9, coreIntensity * 0.85);
        
      } else {
        // COLAPSO: Forma muy distorsionada, casi estática con espasmos
        const scaleVar = wolcoff.scaleVariance * 1.5;
        sphere.scaling.x = 1 + Math.sin(time * 6 + phase) * scaleVar;
        sphere.scaling.y = 1 + Math.cos(time * 5 + phase2) * scaleVar * 0.8;
        sphere.scaling.z = 1 + Math.sin(time * 7 + phase3) * scaleVar * 1.2;
        
        // Vibración mínima pero con espasmos aleatorios
        const spasm = Math.random() < 0.05 ? (Math.random() - 0.5) * 0.2 : 0;
        sphere.position.y = nodeData.z + spasm;
        glow.position.y = sphere.position.y;
        core.position.y = sphere.position.y;
        
        // Temblor constante
        const shake = wolcoff.distortion * 0.08;
        sphere.position.x = nodeData.x + (Math.random() - 0.5) * shake;
        sphere.position.z = nodeData.y + (Math.random() - 0.5) * shake;
        glow.position.x = sphere.position.x;
        glow.position.z = sphere.position.z;
        core.position.x = sphere.position.x;
        core.position.z = sphere.position.z;
        
        // Glow casi apagado, parpadeo errático
        glowMat.alpha = 0.05 + Math.random() * 0.08;
        
        // Pulsación débil
        const pulse = 1 + Math.random() * 0.1;
        glow.scaling.setAll(pulse);
        
        // Core apagándose
        const coreIntensity = 0.3 + Math.random() * 0.3;
        coreMat.emissiveColor = new BABYLON.Color3(coreIntensity * 0.8, coreIntensity * 0.7, coreIntensity * 0.7);
      }

      if (isObserver) {
        core.position.x = sphere.position.x;
        core.position.y = sphere.position.y;
        core.position.z = sphere.position.z - nodeData.size * 0.5;
        if (eyeRing) {
          eyeRing.position.x = sphere.position.x;
          eyeRing.position.y = sphere.position.y;
          eyeRing.position.z = sphere.position.z - nodeData.size * 0.53;
        }
        if (pupil) {
          pupil.position.x = sphere.position.x;
          pupil.position.y = sphere.position.y;
          pupil.position.z = sphere.position.z - nodeData.size * 0.6;
        }
      } else if (isRelationship) {
        core.position.x = sphere.position.x;
        core.position.y = sphere.position.y + nodeData.size * 0.08;
        core.position.z = sphere.position.z - nodeData.size * 0.47;
        if (relationshipBody) {
          relationshipBody.position.x = sphere.position.x;
          relationshipBody.position.y = sphere.position.y - nodeData.size * 0.22;
          relationshipBody.position.z = sphere.position.z - nodeData.size * 0.47;
        }
      } else if (isProject && projectOrbit) {
        projectOrbit.position.x = sphere.position.x;
        projectOrbit.position.y = sphere.position.y;
        projectOrbit.position.z = sphere.position.z;
      }

      labelPlane.position.x = sphere.position.x;
      labelPlane.position.y = sphere.position.y - nodeData.size * 1.05;
      labelPlane.position.z = sphere.position.z;
    });

    return sphere;
  }
}
