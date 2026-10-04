
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
        { size: nodeData.size * 0.78 },
        scene
      );
      sphere.rotation = new BABYLON.Vector3(Math.PI / 10, -Math.PI / 4.25, -Math.PI / 28);
    } else {
      sphere = BABYLON.MeshBuilder.CreateSphere(
        nodeData.id,
        {
          diameter: nodeData.size * (isObserver ? 1.14 : 1),
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
    material.diffuseColor = isProject
      ? new BABYLON.Color3(0.42, 0.22, 0.95)
      : isObserver
        ? new BABYLON.Color3(0.05, 0.17, 0.24)
        : finalColor;
    material.emissiveColor = isObserver
      ? new BABYLON.Color3(0.02, 0.22, 0.28)
      : finalColor.scale(isProject ? 0.36 : 0.42);
    material.specularColor = isProject
      ? new BABYLON.Color3(0.42, 0.34, 0.72)
      : isObserver
        ? new BABYLON.Color3(0.36, 0.68, 0.78)
        : new BABYLON.Color3(1, 0.9, 0.35);
    material.specularPower = isProject ? 28 : 42;
    material.alpha = isProject ? 0.72 : isObserver ? 0.0 : 0.78;
    material.backFaceCulling = false;
    if (isProject) {
      material.disableLighting = true;
    }
    sphere.material = material;
    if (isObserver) {
      sphere.visibility = 0;
    }

    // Borde brillante para el cubo, como la referencia visual
    if (isProject) {
      sphere.enableEdgesRendering();
      sphere.edgesWidth = 6;
      sphere.edgesColor = new BABYLON.Color4(0.9, 0.78, 1, 0.98);
    }

    shadowGenerator.addShadowCaster(sphere);
    sphere.receiveShadows = true;

    // Halo externo translúcido
    const glow = BABYLON.MeshBuilder.CreateSphere(
      `${nodeData.id}_glow`,
      {
        diameter: nodeData.size * (isProject ? 1.85 : isObserver ? 1.82 : 1.45),
        segments: 32,
      },
      scene
    );
    glow.position = sphere.position.clone();

    const glowMat = new BABYLON.StandardMaterial(`${nodeData.id}_glow_mat`, scene);
    glowMat.diffuseColor = finalColor;
    glowMat.emissiveColor = finalColor;
    glowMat.alpha = isObserver ? 0.0 : isProject ? 0.12 : 0.16;
    glowMat.alphaMode = BABYLON.Engine.ALPHA_ADD;
    glowMat.backFaceCulling = false;
    glow.material = glowMat;
    if (isObserver) {
      glow.visibility = 0;
    }
    glow.isPickable = false;

    // Núcleo / icono central según tipo
    let core: BABYLON.Mesh;
    if (isProject) {
      core = BABYLON.MeshBuilder.CreateBox(
        `${nodeData.id}_core`,
        { size: nodeData.size * 0.28 },
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
    coreMat.alpha = isObserver || isProject ? 0.0 : 0.96;
    coreMat.specularPower = 96;
    core.material = coreMat;
    core.isPickable = false;

    let eyeRing: BABYLON.Mesh | null = null;
    let pupil: BABYLON.Mesh | null = null;
    let relationshipBody: BABYLON.Mesh | null = null;
    let projectOrbit: BABYLON.Mesh | null = null;
    let iconPlane: BABYLON.Mesh | null = null;

    // Ojo del observador: textura premium con transparencia sobre el nodo pickable.
    if (isObserver) {
      const reducedMotion = typeof window !== 'undefined'
        && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

      eyeRing = BABYLON.MeshBuilder.CreateTorus(
        `${nodeData.id}_eye_orbit`,
        { diameter: nodeData.size * 1.52, thickness: nodeData.size * 0.008, tessellation: 144 },
        scene
      );
      eyeRing.position = sphere.position.clone().add(new BABYLON.Vector3(0, nodeData.size * 0.04, 0));
      eyeRing.scaling.x = 1.18;
      eyeRing.scaling.y = 0.84;
      eyeRing.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
      const eyeMat = new BABYLON.StandardMaterial(`${nodeData.id}_eye_orbit_mat`, scene);
      eyeMat.emissiveColor = new BABYLON.Color3(0.14, 0.72, 0.88);
      eyeMat.diffuseColor = new BABYLON.Color3(0.14, 0.72, 0.88);
      eyeMat.alpha = 0.18;
      eyeMat.alphaMode = BABYLON.Engine.ALPHA_ADD;
      eyeRing.material = eyeMat;
      eyeRing.visibility = 0;
      eyeRing.isPickable = false;

      const eyeTextureSize = { width: 1024, height: 512 };
      const eyeTexture = new BABYLON.DynamicTexture(`${nodeData.id}_eye_texture`, eyeTextureSize, scene, true);
      eyeTexture.hasAlpha = true;
      const eyeContext = eyeTexture.getContext() as unknown as CanvasRenderingContext2D;

      const drawMetalEye = (irisOffsetX = 0, irisOffsetY = 0, shimmer = 0) => {
        const ctx = eyeContext;
        const width = eyeTextureSize.width;
        const height = eyeTextureSize.height;
        const cx = width / 2;
        const cy = height / 2;
        ctx.clearRect(0, 0, width, height);
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Halo contenido detrás del ojo, sin disco sólido.
        const halo = ctx.createRadialGradient(cx, cy, 36, cx, cy, 328);
        halo.addColorStop(0, 'rgba(34, 211, 238, 0.16)');
        halo.addColorStop(0.48, 'rgba(14, 116, 144, 0.08)');
        halo.addColorStop(1, 'rgba(2, 6, 23, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(cx, cy, 330, 0, Math.PI * 2);
        ctx.fill();

        // Órbita única, fina y tenue integrada en la textura para evitar trazos 3D inestables.
        ctx.save();
        ctx.shadowColor = 'rgba(34, 211, 238, 0.32)';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(cx, cy, 224, Math.PI * 1.02, Math.PI * 1.93);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(124, 58, 237, 0.2)';
        ctx.beginPath();
        ctx.arc(cx, cy, 224, Math.PI * 1.93, Math.PI * 2.74);
        ctx.stroke();
        ctx.fillStyle = 'rgba(34, 211, 238, 0.78)';
        ctx.beginPath();
        ctx.arc(cx - 166 + Math.sin(shimmer * 0.16) * 6, cy - 146 + Math.cos(shimmer * 0.16) * 4, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Silueta exterior metálica superior e inferior.
        const shellGradient = ctx.createLinearGradient(0, 96, width, 392);
        shellGradient.addColorStop(0, 'rgba(5, 18, 28, 0.02)');
        shellGradient.addColorStop(0.18, 'rgba(78, 105, 120, 0.55)');
        shellGradient.addColorStop(0.42, 'rgba(203, 229, 238, 0.88)');
        shellGradient.addColorStop(0.62, 'rgba(31, 61, 76, 0.8)');
        shellGradient.addColorStop(0.82, 'rgba(42, 184, 213, 0.5)');
        shellGradient.addColorStop(1, 'rgba(167, 139, 250, 0.22)');

        ctx.shadowColor = 'rgba(34, 211, 238, 0.34)';
        ctx.shadowBlur = 24;
        ctx.fillStyle = shellGradient;
        ctx.strokeStyle = 'rgba(185, 224, 235, 0.82)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(102, 256);
        ctx.bezierCurveTo(212, 132, 390, 82, 540, 96);
        ctx.bezierCurveTo(690, 110, 822, 166, 930, 246);
        ctx.bezierCurveTo(812, 220, 704, 220, 613, 246);
        ctx.bezierCurveTo(548, 264, 480, 270, 402, 250);
        ctx.bezierCurveTo(292, 222, 194, 224, 102, 256);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        const lowerGradient = ctx.createLinearGradient(0, 270, width, 430);
        lowerGradient.addColorStop(0, 'rgba(2, 12, 22, 0.02)');
        lowerGradient.addColorStop(0.2, 'rgba(56, 83, 99, 0.58)');
        lowerGradient.addColorStop(0.52, 'rgba(10, 31, 43, 0.9)');
        lowerGradient.addColorStop(0.78, 'rgba(34, 211, 238, 0.45)');
        lowerGradient.addColorStop(1, 'rgba(148, 163, 184, 0.18)');
        ctx.fillStyle = lowerGradient;
        ctx.strokeStyle = 'rgba(148, 198, 214, 0.78)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(102, 278);
        ctx.bezierCurveTo(216, 316, 316, 316, 410, 286);
        ctx.bezierCurveTo(484, 262, 552, 260, 616, 286);
        ctx.bezierCurveTo(710, 326, 820, 318, 932, 278);
        ctx.bezierCurveTo(804, 394, 676, 434, 512, 426);
        ctx.bezierCurveTo(350, 418, 216, 370, 102, 278);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Línea cian fina de energía sobre los párpados metálicos.
        ctx.shadowColor = 'rgba(34, 211, 238, 0.9)';
        ctx.shadowBlur = 14;
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.92)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(136, 247);
        ctx.bezierCurveTo(236, 176, 364, 140, 472, 140);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(554, 140);
        ctx.bezierCurveTo(696, 144, 822, 192, 910, 248);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(128, 284);
        ctx.bezierCurveTo(244, 338, 362, 344, 470, 302);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(554, 304);
        ctx.bezierCurveTo(690, 342, 820, 330, 922, 284);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Iris con profundidad: azul petróleo/zafiro, fibras radiales y acento violeta.
        const irisCx = cx + irisOffsetX;
        const irisCy = cy + irisOffsetY;
        const irisRadius = 126;
        const irisOuter = ctx.createRadialGradient(irisCx, irisCy, 16, irisCx, irisCy, irisRadius);
        irisOuter.addColorStop(0, 'rgba(5, 15, 24, 1)');
        irisOuter.addColorStop(0.18, 'rgba(3, 45, 63, 1)');
        irisOuter.addColorStop(0.42, 'rgba(7, 111, 143, 1)');
        irisOuter.addColorStop(0.68, 'rgba(14, 116, 144, 0.98)');
        irisOuter.addColorStop(0.84, 'rgba(29, 78, 216, 0.92)');
        irisOuter.addColorStop(1, 'rgba(8, 18, 36, 1)');
        ctx.save();
        ctx.beginPath();
        ctx.arc(irisCx, irisCy, irisRadius, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = irisOuter;
        ctx.fillRect(irisCx - irisRadius, irisCy - irisRadius, irisRadius * 2, irisRadius * 2);

        const violet = ctx.createRadialGradient(irisCx + 64, irisCy + 12, 0, irisCx + 54, irisCy + 6, 104);
        violet.addColorStop(0, 'rgba(139, 92, 246, 0.72)');
        violet.addColorStop(0.42, 'rgba(79, 70, 229, 0.28)');
        violet.addColorStop(1, 'rgba(79, 70, 229, 0)');
        ctx.fillStyle = violet;
        ctx.fillRect(irisCx - irisRadius, irisCy - irisRadius, irisRadius * 2, irisRadius * 2);

        for (let i = 0; i < 132; i += 1) {
          const angle = (i / 132) * Math.PI * 2 + shimmer * 0.08;
          const inner = 31 + (i % 7) * 3;
          const outer = 88 + (i % 9) * 4;
          const alpha = 0.18 + (i % 5) * 0.045;
          ctx.strokeStyle = i % 11 === 0
            ? `rgba(167, 139, 250, ${alpha + 0.18})`
            : i % 3 === 0
              ? `rgba(103, 232, 249, ${alpha + 0.1})`
              : `rgba(6, 182, 212, ${alpha})`;
          ctx.lineWidth = i % 13 === 0 ? 3.4 : 1.35;
          ctx.beginPath();
          ctx.moveTo(irisCx + Math.cos(angle) * inner, irisCy + Math.sin(angle) * inner);
          ctx.lineTo(irisCx + Math.cos(angle + Math.sin(i) * 0.055) * outer, irisCy + Math.sin(angle + Math.cos(i) * 0.045) * outer);
          ctx.stroke();
        }

        // Anillos del iris, sin colores cálidos.
        ctx.strokeStyle = 'rgba(125, 211, 252, 0.58)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(irisCx, irisCy, 118, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.72)';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(irisCx, irisCy, 102, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.34)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(irisCx, irisCy, 72, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Lente de cristal y borde de titanio.
        const glass = ctx.createRadialGradient(irisCx - 30, irisCy - 46, 10, irisCx, irisCy, 132);
        glass.addColorStop(0, 'rgba(255, 255, 255, 0.36)');
        glass.addColorStop(0.34, 'rgba(125, 211, 252, 0.1)');
        glass.addColorStop(1, 'rgba(2, 6, 23, 0.08)');
        ctx.fillStyle = glass;
        ctx.beginPath();
        ctx.arc(irisCx, irisCy, 128, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(148, 190, 205, 0.88)';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(irisCx, irisCy, 132, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(8, 15, 26, 0.88)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(irisCx, irisCy, 139, 0, Math.PI * 2);
        ctx.stroke();

        const pupilGradient = ctx.createRadialGradient(irisCx - 18, irisCy - 18, 10, irisCx, irisCy, 57);
        pupilGradient.addColorStop(0, 'rgba(10, 18, 26, 1)');
        pupilGradient.addColorStop(0.56, 'rgba(0, 2, 8, 1)');
        pupilGradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
        ctx.fillStyle = pupilGradient;
        ctx.beginPath();
        ctx.arc(irisCx, irisCy, 56, 0, Math.PI * 2);
        ctx.fill();

        // Reflejos de cristal.
        ctx.fillStyle = 'rgba(241, 250, 255, 0.95)';
        ctx.beginPath();
        ctx.arc(irisCx + 30, irisCy - 45, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(224, 242, 254, 0.48)';
        ctx.beginPath();
        ctx.moveTo(irisCx - 86, irisCy - 78);
        ctx.bezierCurveTo(irisCx - 54, irisCy - 116, irisCx - 7, irisCy - 110, irisCx + 22, irisCy - 84);
        ctx.bezierCurveTo(irisCx - 26, irisCy - 86, irisCx - 58, irisCy - 66, irisCx - 86, irisCy - 78);
        ctx.fill();
        ctx.strokeStyle = 'rgba(226, 232, 240, 0.24)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(irisCx - 110, irisCy - 20);
        ctx.bezierCurveTo(irisCx - 74, irisCy - 90, irisCx - 36, irisCy - 120, irisCx + 54, irisCy - 118);
        ctx.stroke();

        // Puntas y borde final definidos.
        ctx.shadowColor = 'rgba(34, 211, 238, 0.55)';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = 'rgba(203, 213, 225, 0.78)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(95, 256);
        ctx.bezierCurveTo(232, 118, 390, 68, 512, 92);
        ctx.bezierCurveTo(658, 68, 804, 128, 936, 256);
        ctx.bezierCurveTo(800, 384, 652, 432, 512, 416);
        ctx.bezierCurveTo(372, 430, 220, 384, 95, 256);
        ctx.stroke();
        ctx.restore();
        eyeTexture.update();
      };

      drawMetalEye();

      const eyePlane = BABYLON.MeshBuilder.CreatePlane(
        `${nodeData.id}_eye_plane`,
        { width: nodeData.size * 2.72, height: nodeData.size * 1.36 },
        scene
      );
      eyePlane.position = sphere.position.clone().add(new BABYLON.Vector3(0, nodeData.size * 0.2, -nodeData.size * 0.02));
      eyePlane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
      eyePlane.renderingGroupId = 2;
      eyePlane.isPickable = false;
      const eyePlaneMat = new BABYLON.StandardMaterial(`${nodeData.id}_eye_plane_mat`, scene);
      eyePlaneMat.diffuseTexture = eyeTexture;
      eyePlaneMat.opacityTexture = eyeTexture;
      eyePlaneMat.emissiveColor = new BABYLON.Color3(0.62, 0.92, 1);
      eyePlaneMat.disableLighting = true;
      eyePlaneMat.backFaceCulling = false;
      eyePlaneMat.disableDepthWrite = true;
      eyePlane.material = eyePlaneMat;

      let eyeFrame = 0;
      scene.registerBeforeRender(() => {
        eyePlane.position.x = sphere.position.x;
        eyePlane.position.y = sphere.position.y + nodeData.size * 0.2;
        eyePlane.position.z = sphere.position.z - nodeData.size * 0.02;

        if (eyeRing) {
          eyeRing.rotation.z += reducedMotion ? 0 : 0.0016;
          eyeRing.position.x = sphere.position.x;
          eyeRing.position.y = sphere.position.y + nodeData.size * 0.04;
          eyeRing.position.z = sphere.position.z;
          eyeMat.alpha = 0.14 + Math.sin(time * 0.42) * 0.025;
        }

        eyeFrame += 1;
        if (eyeFrame % (reducedMotion ? 18 : 4) === 0) {
          const engine = scene.getEngine();
          const renderWidth = engine.getRenderWidth() || 1;
          const renderHeight = engine.getRenderHeight() || 1;
          const pointerX = Number.isFinite(scene.pointerX) ? scene.pointerX : renderWidth / 2;
          const pointerY = Number.isFinite(scene.pointerY) ? scene.pointerY : renderHeight / 2;
          const offsetX = reducedMotion ? Math.sin(time * 0.18) * 3 : Math.max(-18, Math.min(18, ((pointerX / renderWidth) - 0.5) * 28));
          const offsetY = reducedMotion ? Math.cos(time * 0.16) * 2 : Math.max(-10, Math.min(10, ((pointerY / renderHeight) - 0.5) * 16));
          drawMetalEye(offsetX, offsetY, time);
        }
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

    if (isProject || isRelationship) {
      const iconTexture = new BABYLON.DynamicTexture(`${nodeData.id}_icon_texture`, { width: 512, height: 512 }, scene, true);
      iconTexture.hasAlpha = true;
      const iconContext = iconTexture.getContext() as unknown as CanvasRenderingContext2D;
      iconContext.clearRect(0, 0, 512, 512);
      iconContext.lineCap = 'round';
      iconContext.lineJoin = 'round';
      iconContext.shadowBlur = 28;

      if (isProject) {
        iconContext.shadowColor = 'rgba(196, 181, 253, 0.95)';
        const gradient = iconContext.createLinearGradient(130, 90, 380, 430);
        gradient.addColorStop(0, 'rgba(245, 243, 255, 0.95)');
        gradient.addColorStop(0.45, 'rgba(167, 139, 250, 0.72)');
        gradient.addColorStop(1, 'rgba(91, 33, 182, 0.78)');
        iconContext.fillStyle = gradient;
        iconContext.strokeStyle = 'rgba(221, 214, 254, 0.95)';
        iconContext.lineWidth = 12;
        iconContext.beginPath();
        iconContext.moveTo(172, 132);
        iconContext.lineTo(332, 82);
        iconContext.lineTo(414, 182);
        iconContext.lineTo(260, 238);
        iconContext.closePath();
        iconContext.fill();
        iconContext.stroke();
        iconContext.beginPath();
        iconContext.moveTo(172, 132);
        iconContext.lineTo(260, 238);
        iconContext.lineTo(260, 410);
        iconContext.lineTo(156, 298);
        iconContext.closePath();
        iconContext.fillStyle = 'rgba(124, 58, 237, 0.58)';
        iconContext.fill();
        iconContext.stroke();
        iconContext.beginPath();
        iconContext.moveTo(260, 238);
        iconContext.lineTo(414, 182);
        iconContext.lineTo(398, 344);
        iconContext.lineTo(260, 410);
        iconContext.closePath();
        iconContext.fillStyle = 'rgba(139, 92, 246, 0.48)';
        iconContext.fill();
        iconContext.stroke();
        iconContext.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        iconContext.lineWidth = 5;
        iconContext.beginPath();
        iconContext.moveTo(206, 154);
        iconContext.lineTo(332, 116);
        iconContext.lineTo(382, 178);
        iconContext.stroke();
      } else {
        iconContext.shadowColor = 'rgba(110, 231, 183, 0.95)';
        iconContext.fillStyle = 'rgba(167, 243, 208, 0.92)';
        iconContext.beginPath();
        iconContext.arc(256, 176, 54, 0, Math.PI * 2);
        iconContext.fill();
        const bodyGradient = iconContext.createLinearGradient(174, 238, 338, 390);
        bodyGradient.addColorStop(0, 'rgba(187, 247, 208, 0.95)');
        bodyGradient.addColorStop(1, 'rgba(52, 211, 153, 0.82)');
        iconContext.fillStyle = bodyGradient;
        iconContext.beginPath();
        iconContext.moveTo(146, 374);
        iconContext.quadraticCurveTo(158, 260, 256, 260);
        iconContext.quadraticCurveTo(354, 260, 366, 374);
        iconContext.quadraticCurveTo(312, 414, 256, 414);
        iconContext.quadraticCurveTo(200, 414, 146, 374);
        iconContext.closePath();
        iconContext.fill();
      }

      iconTexture.update();
      iconPlane = BABYLON.MeshBuilder.CreatePlane(`${nodeData.id}_icon_plane`, { width: nodeData.size * 0.95, height: nodeData.size * 0.95 }, scene);
      iconPlane.position = sphere.position.clone().add(new BABYLON.Vector3(0, 0, -nodeData.size * 0.03));
      iconPlane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
      iconPlane.renderingGroupId = 2;
      iconPlane.isPickable = false;
      const iconMat = new BABYLON.StandardMaterial(`${nodeData.id}_icon_plane_mat`, scene);
      iconMat.diffuseTexture = iconTexture;
      iconMat.opacityTexture = iconTexture;
      iconMat.emissiveColor = isProject ? new BABYLON.Color3(0.9, 0.78, 1) : new BABYLON.Color3(0.72, 1, 0.82);
      iconMat.disableLighting = true;
      iconMat.disableDepthWrite = true;
      iconMat.backFaceCulling = false;
      iconPlane.material = iconMat;
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

    const labelPlaneWidth = Math.min(nodeData.size * 3.4, 10.8);
    const labelPlaneHeight = Math.min(nodeData.size * 0.95, 2.55);
    const labelPlane = BABYLON.MeshBuilder.CreatePlane(`${nodeData.id}_label`, { width: labelPlaneWidth, height: labelPlaneHeight }, scene);
    labelPlane.position = new BABYLON.Vector3(nodeData.x, nodeData.z - nodeData.size * (isObserver ? 1.62 : 1.18), nodeData.y);
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

      if (iconPlane) {
        iconPlane.position.x = sphere.position.x;
        iconPlane.position.y = sphere.position.y;
        iconPlane.position.z = sphere.position.z - nodeData.size * 0.03;
      }

      labelPlane.position.x = sphere.position.x;
      labelPlane.position.y = sphere.position.y - nodeData.size * (isObserver ? 1.62 : 1.18);
      labelPlane.position.z = sphere.position.z;
    });

    return sphere;
  }
}
