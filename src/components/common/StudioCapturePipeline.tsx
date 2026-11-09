import React, { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useStudioRender } from './StudioRenderContext';
import { CookwareDecoration } from '../kitchen/decoration/CookwareDecoration';
import { HumanScaleDecoration } from '../kitchen/decoration/HumanScaleDecoration';
import { PlantDecoration } from '../kitchen/decoration/PlantDecoration';
import { useKitchenStore } from '../../store/kitchenStore';

export const StudioCapturePipeline: React.FC = () => {
  const { gl, scene, camera } = useThree();
  const { settings, updateSetting, registerCaptureHandler } = useStudioRender();
  const { cabinets, countertopConfig } = useKitchenStore();

  // 1. Ubicación y rotación exacta de ollas y utensilios en encimera, isla o cocina FDV
  const cookwareTarget = React.useMemo(() => {
    // 1. Si hay cocina FDV en la escena
    const stove = cabinets.find((c) => c.variant === 'deco_stove');
    if (stove && Array.isArray(stove.position)) {
      return {
        position: [stove.position[0], stove.position[1] || 0, stove.position[2] || 0] as [number, number, number],
        rotation: stove.rotation || 0,
        localPot: [-10, 45.2, 0] as [number, number, number],
        localPan: [15, 45.2, 2] as [number, number, number],
      };
    }

    // 2. Sobre la isla si existe
    const island = cabinets.find((c) => c.type === 'island');
    if (island && Array.isArray(island.position)) {
      const topY = (island.height || 85) + (countertopConfig.enabled ? (countertopConfig.thickness || 2.5) : 2.5);
      return {
        position: [island.position[0], island.position[1] || 0, island.position[2] || 0] as [number, number, number],
        rotation: island.rotation || 0,
        localPot: [-12, topY, 0] as [number, number, number],
        localPan: [16, topY, 2] as [number, number, number],
      };
    }

    // 3. Sobre cualquier mueble base
    const base = cabinets.find((c) => c.type === 'base');
    if (base && Array.isArray(base.position)) {
      const topY = (base.height || 85) + (countertopConfig.enabled ? (countertopConfig.thickness || 2.5) : 2.5);
      return {
        position: [base.position[0], base.position[1] || 0, base.position[2] || 0] as [number, number, number],
        rotation: base.rotation || 0,
        localPot: [-10, topY, 0] as [number, number, number],
        localPan: [15, topY, 2] as [number, number, number],
      };
    }

    return null;
  }, [cabinets, countertopConfig]);

  // 2. Ubicación de la planta decorativa en piso
  const plantPos = React.useMemo<[number, number, number] | null>(() => {
    // Si el usuario ya colocó una planta manualmente en la escena, no duplicarla
    const existingPlant = cabinets.find((c) => c.variant === 'deco_plant');
    if (existingPlant) {
      return null;
    }
    if (cabinets.length === 0) return [160, 47.5, 50];
    const rightmostCab = [...cabinets].sort((a, b) => (b.position?.[0] || 0) - (a.position?.[0] || 0))[0];
    if (rightmostCab && Array.isArray(rightmostCab.position)) {
      return [(rightmostCab.position[0] || 0) + (rightmostCab.width || 60) / 2 + 30, 47.5, (rightmostCab.position[2] || 0) + 15];
    }
    return [160, 47.5, 50];
  }, [cabinets]);

  // 3. Ubicación de la figura humana (escala arquitectónica)
  const humanPos = React.useMemo<[number, number, number]>(() => {
    if (cabinets.length > 0) {
      const avgZ = cabinets.reduce((sum, c) => sum + (c.position?.[2] || 0), 0) / cabinets.length;
      const minX = Math.min(...cabinets.map((c) => (c.position?.[0] || 0) - (c.width || 60) / 2));
      return [minX - 45, 0, avgZ + 70];
    }
    return [40, 0, 140];
  }, [cabinets]);

  // Registrar el capturador oficial de alta definición en Three.js
  useEffect(() => {
    registerCaptureHandler(async () => {
      // Dimensiones exactas según configuración (aspect ratio 16:9 estricto)
      const targetWidth = settings.resolution === '4k' ? 3840 : settings.resolution === '2k' ? 2560 : 1920;
      const targetHeight = settings.resolution === '4k' ? 2160 : settings.resolution === '2k' ? 1440 : 1080;
      const targetAspect = targetWidth / targetHeight; // 16:9

      // Guardar ajustes originales del renderizador
      const origSize = new THREE.Vector2();
      gl.getSize(origSize);
      const origPixelRatio = gl.getPixelRatio();
      const origToneMapping = gl.toneMapping;
      const origToneExposure = gl.toneMappingExposure;
      const origShadowMapType = gl.shadowMap.type;

      const persCam = (camera as THREE.PerspectiveCamera).isPerspectiveCamera
        ? (camera as THREE.PerspectiveCamera)
        : null;
      const origAspect = persCam ? persCam.aspect : 1;

      try {
        // Configurar Tone Mapping Cinematográfico ACESFilmic calibrado
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure =
          settings.lightingPreset === 'warm' ? 1.05 : settings.lightingPreset === 'daylight' ? 1.12 : 0.95;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;

        // Ajustar cámara al aspect ratio exacto 16:9 para evitar cualquier distorsión o estiramiento
        if (persCam) {
          persCam.aspect = targetAspect;
          persCam.updateProjectionMatrix();
        }

        // Renderizado directo en alta resolución a escala de píxeles 1:1
        gl.setPixelRatio(1);
        gl.setSize(targetWidth, targetHeight, false);

        // Forzar renderizado del fotograma
        gl.render(scene, camera);

        // Captura sRGB cristalina y nítida directamente del búfer WebGL
        const highResDataUrl = gl.domElement.toDataURL('image/png', 1.0);
        return highResDataUrl;
      } finally {
        // Restaurar estado original del renderizador y cámara de trabajo
        gl.setPixelRatio(origPixelRatio);
        gl.setSize(origSize.x, origSize.y, true);
        gl.toneMapping = origToneMapping;
        gl.toneMappingExposure = origToneExposure;
        gl.shadowMap.type = origShadowMapType;

        if (persCam) {
          persCam.aspect = origAspect;
          persCam.updateProjectionMatrix();
        }
        gl.render(scene, camera);
      }
    });
  }, [gl, scene, camera, settings, updateSetting, registerCaptureHandler]);

  // Si no está el modal abierto ni en rendering mode, no inyectar luces adicionales ni decoraciones
  if (!settings.isRenderingMode) {
    return null;
  }

  return (
    <group name="studioLightingAndDeco">
      {/* 1. Iluminación Calibrada de Estudio */}
      {settings.lightingPreset === 'warm' && (
        <>
          <directionalLight
            position={[250, 400, 300]}
            intensity={0.85}
            color="#fff7ed"
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-bias={-0.0001}
          />
          <ambientLight intensity={0.25} color="#fed7aa" />
          <pointLight position={[0, 220, 50]} intensity={0.5} color="#fde047" distance={450} />
        </>
      )}

      {settings.lightingPreset === 'daylight' && (
        <>
          <directionalLight
            position={[300, 450, 250]}
            intensity={0.9}
            color="#f0f9ff"
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-bias={-0.0001}
          />
          <ambientLight intensity={0.3} color="#ffffff" />
          <pointLight position={[0, 240, 50]} intensity={0.4} color="#e0f2fe" distance={450} />
        </>
      )}

      {settings.lightingPreset === 'night_led' && (
        <>
          <ambientLight intensity={0.15} color="#1e1b4b" />
          <directionalLight position={[100, 300, 200]} intensity={0.3} color="#93c5fd" />
          <pointLight position={[0, 180, 50]} intensity={1.2} color="#fbbf24" distance={350} />
          <pointLight position={[0, 90, 80]} intensity={0.9} color="#38bdf8" distance={250} />
        </>
      )}

      {/* 2. Ollas y Utensilios alineados a mueble base, isla o cocina FDV */}
      {settings.includePots && cookwareTarget && (
        <group position={cookwareTarget.position} rotation={[0, cookwareTarget.rotation, 0]}>
          <group position={cookwareTarget.localPot}>
            <CookwareDecoration type="pot" scale={0.95} />
          </group>
          <group position={cookwareTarget.localPan}>
            <CookwareDecoration type="pan" scale={0.85} />
          </group>
        </group>
      )}

      {/* 3. Planta decorativa en macetero cerámico en piso */}
      {settings.includePlants && plantPos && (
        <group position={plantPos}>
          <PlantDecoration width={38} height={95} depth={38} />
        </group>
      )}

      {/* 4. Escala Humana Arquitectónica */}
      {settings.includeHumanScale && (
        <HumanScaleDecoration position={humanPos} height={172} opacity={0.85} />
      )}
    </group>
  );
};
