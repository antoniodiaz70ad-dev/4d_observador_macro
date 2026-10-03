
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
    // Calcular coherencia (si no viene, usar energía como proxy)
    const coherence = nodeData.coherence ?? nodeData.energy;
    const wolcoff = getWolcoffDistortion(coherence);
    
    // Crear esfera 3D
    const sphere = BABYLON.MeshBuilder.CreateSphere(
      nodeData.id,
      {
        diameter: nodeData.size,
        segments: 32,
      },
      scene
    );

    // Posición con eje Z real (Y es altura en Babylon.js)
    const basePosition = new BABYLON.Vector3(nodeData.x, nodeData.z, nodeData.y);
    sphere.position = basePosition.clone();
    
    // Configurar recepción de sombras
    sphere.receiveShadows = false;

    // Material con glow - Color puede ser Wolcoff o el original
    const material = new BABYLON.StandardMaterial(`${nodeData.id}_mat`, scene);
    const baseColor = BABYLON.Color3.FromHexString(nodeData.color);
    const wolcoffColorHex = getWolcoffColor(coherence);
    const wolcoffColor = BABYLON.Color3.FromHexString(wolcoffColorHex);
    
    // Mezclar color original con color Wolcoff según coherencia
    // Alta coherencia = más color Wolcoff (dorado), baja = color original (puede ser gris)
    const finalColor = coherence > 0.5 
      ? BABYLON.Color3.Lerp(baseColor, wolcoffColor, 0.3)
      : BABYLON.Color3.Lerp(baseColor, wolcoffColor, 0.5);
    
    material.diffuseColor = finalColor;
    material.emissiveColor = finalColor.scale(0.4);
    material.specularColor = new BABYLON.Color3(1, 1, 1);
    material.specularPower = 32;
    material.alpha = 0.95;

    sphere.material = material;

    // Habilitar sombras
    shadowGenerator.addShadowCaster(sphere);
    sphere.receiveShadows = true;

    // Halo glow (outer glow)
    const glow = BABYLON.MeshBuilder.CreateSphere(
      `${nodeData.id}_glow`,
      {
        diameter: nodeData.size * 1.5,
        segments: 16,
      },
      scene
    );
    glow.position = sphere.position.clone();
    
    const glowMat = new BABYLON.StandardMaterial(`${nodeData.id}_glow_mat`, scene);
    glowMat.emissiveColor = finalColor;
    glowMat.alpha = 0.15;
    glowMat.alphaMode = BABYLON.Engine.ALPHA_ADD;
    glow.material = glowMat;

    // Anillo interno (core)
    const core = BABYLON.MeshBuilder.CreateSphere(
      `${nodeData.id}_core`,
      {
        diameter: nodeData.size * 0.4,
        segments: 16,
      },
      scene
    );
    core.position = sphere.position.clone();
    
    const coreMat = new BABYLON.StandardMaterial(`${nodeData.id}_core_mat`, scene);
    coreMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
    coreMat.alpha = 0.9;
    core.material = coreMat;

    // Etiqueta persistente del nodo
    const labelWidth = 512;
    const labelHeight = 128;
    const labelTexture = new BABYLON.DynamicTexture(`${nodeData.id}_label_texture`, { width: labelWidth, height: labelHeight }, scene, true);
    labelTexture.hasAlpha = true;
    const labelContext = labelTexture.getContext();
    labelContext.clearRect(0, 0, labelWidth, labelHeight);
    labelContext.fillStyle = 'rgba(5, 12, 25, 0.78)';
    labelContext.strokeStyle = 'rgba(147, 197, 253, 0.75)';
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
    labelContext.font = 'bold 34px sans-serif';
    const title = nodeData.label.length > 24 ? `${nodeData.label.slice(0, 21)}…` : nodeData.label;
    labelContext.fillText(title, 34, 62);
    labelContext.fillStyle = 'rgba(191, 219, 254, 0.85)';
    labelContext.font = '24px sans-serif';
    const subtitle = nodeData.type === 'self' ? 'Centro de tu mapa' : nodeData.type === 'project' ? 'Proyecto' : nodeData.type === 'relationship' ? 'Relación' : 'Nodo';
    labelContext.fillText(subtitle, 34, 96);
    labelTexture.update();

    const labelPlane = BABYLON.MeshBuilder.CreatePlane(`${nodeData.id}_label`, { width: nodeData.size * 5.8, height: nodeData.size * 1.45 }, scene);
    labelPlane.position = new BABYLON.Vector3(nodeData.x, nodeData.z + nodeData.size * 1.7, nodeData.y);
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

      labelPlane.position.x = sphere.position.x;
      labelPlane.position.y = sphere.position.y + nodeData.size * 1.7;
      labelPlane.position.z = sphere.position.z;
    });

    return sphere;
  }
}
