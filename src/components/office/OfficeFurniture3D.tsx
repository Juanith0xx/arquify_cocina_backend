import React, { useMemo, forwardRef } from 'react';
import * as THREE from 'three';
import { PlacedOfficeItem } from '../../types/office';
import { MELAMINE_FINISHES, METAL_FINISHES, SCREEN_FABRICS } from '../../store/officeStore';

interface OfficeFurniture3DProps {
  item: PlacedOfficeItem;
  isSelected: boolean;
  onSelect?: (e: any) => void;
}

export const OfficeFurniture3D = forwardRef<THREE.Group, OfficeFurniture3DProps>(
  ({ item, isSelected, onSelect }, ref) => {
  // Acabados
  const mel = useMemo(
    () => MELAMINE_FINISHES.find((m) => m.id === item.melamineFinish) || MELAMINE_FINISHES[0],
    [item.melamineFinish]
  );
  const met = useMemo(
    () => METAL_FINISHES.find((m) => m.id === item.metalFinish) || METAL_FINISHES[0],
    [item.metalFinish]
  );
  const scr = useMemo(
    () => SCREEN_FABRICS.find((s) => s.id === item.screenFinish) || SCREEN_FABRICS[0],
    [item.screenFinish]
  );

  const melamineMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: mel.hex,
      roughness: mel.roughness,
      metalness: 0.05,
    });
  }, [mel]);

  const metalMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: met.hex,
      roughness: met.roughness,
      metalness: met.metalness,
    });
  }, [met]);

  const screenMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: scr.hex,
      roughness: 0.85,
      metalness: 0.05,
    });
  }, [scr]);

  const glassMat = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: '#E0F2FE',
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      transmission: 0.8,
      thickness: 0.5,
    });
  }, []);

  const chairMeshMat = useMemo(() => {
    const chairColor = item.chairFabricColor || scr?.hex || '#18181B';
    return new THREE.MeshStandardMaterial({
      color: chairColor,
      roughness: 0.85,
      metalness: 0.05,
    });
  }, [scr, item.chairFabricColor]);

  const chromeMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#E4E4E7',
      roughness: 0.2,
      metalness: 0.85,
    });
  }, []);

  const woodLegMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#D4A373',
      roughness: 0.6,
      metalness: 0.05,
    });
  }, []);

  // Conversión a metros
  const w = item.dimensionsCm.width / 100;
  const d = item.dimensionsCm.depth / 100;
  const h = item.dimensionsCm.height / 100;
  const rw = (item.dimensionsCm.returnWidth || 80) / 100;
  const rd = (item.dimensionsCm.returnDepth || 45) / 100;
  const isRightReturn = item.returnSide !== 'left';

  // Renderizado condicional por tipo
  const renderGeometry = () => {
    switch (item.type) {
      case 'desk-executive-l': {
        // Escritorio gerencial con retorno en L y cajonera
        const topThick = 0.024;
        const legProfile = 0.05;
        const returnOffsetX = isRightReturn ? (w / 2 + rd / 2 - legProfile) : -(w / 2 + rd / 2 - legProfile);
        const returnOffsetZ = d / 2 - rw / 2;

        return (
          <group>
            {/* Cubierta principal */}
            <mesh position={[0, h - topThick / 2, 0]} material={melamineMat} castShadow receiveShadow>
              <boxGeometry args={[w, topThick, d]} />
            </mesh>
            {/* Pasacables sobre cubierta */}
            <mesh position={[w / 3, h + 0.001, -d / 3]} material={metalMat}>
              <boxGeometry args={[0.16, 0.005, 0.08]} />
            </mesh>
            {/* Patas pórtico 50x50mm */}
            <mesh position={[-w / 2 + legProfile / 2, (h - topThick) / 2, 0]} material={metalMat} castShadow>
              <boxGeometry args={[legProfile, h - topThick, d]} />
            </mesh>
            <mesh position={[w / 2 - legProfile / 2, (h - topThick) / 2, 0]} material={metalMat} castShadow>
              <boxGeometry args={[legProfile, h - topThick, d]} />
            </mesh>
            {/* Faldón de privacidad (Modesty panel) */}
            <mesh position={[0, h - topThick - 0.15, -d / 2 + 0.04]} material={melamineMat} castShadow>
              <boxGeometry args={[w - legProfile * 2 - 0.02, 0.3, 0.015]} />
            </mesh>

            {/* Retorno Lateral en L */}
            <group position={[returnOffsetX, 0, returnOffsetZ]}>
              <mesh position={[0, h - topThick / 2, 0]} material={melamineMat} castShadow receiveShadow>
                <boxGeometry args={[rd, topThick, rw]} />
              </mesh>
              {/* Cajonera Pedestal 2C1K bajo el retorno */}
              <group position={[0, 0.725 / 2, rw / 2 - 0.45 / 2]}>
                <mesh material={melamineMat} castShadow>
                  <boxGeometry args={[0.42, 0.725 - topThick, 0.45]} />
                </mesh>
                {/* Tiradores y frente */}
                <mesh position={[0, 0.18, 0.45 / 2 + 0.005]} material={metalMat}>
                  <boxGeometry args={[0.12, 0.015, 0.02]} />
                </mesh>
                <mesh position={[0, -0.05, 0.45 / 2 + 0.005]} material={metalMat}>
                  <boxGeometry args={[0.12, 0.015, 0.02]} />
                </mesh>
                <mesh position={[0, -0.22, 0.45 / 2 + 0.005]} material={metalMat}>
                  <boxGeometry args={[0.12, 0.015, 0.02]} />
                </mesh>
              </group>
              {/* Pata de soporte extremo retorno */}
              <mesh position={[0, (h - topThick) / 2, -rw / 2 + legProfile / 2]} material={metalMat} castShadow>
                <boxGeometry args={[rd, h - topThick, legProfile]} />
              </mesh>
            </group>
          </group>
        );
      }

      case 'desk-open-l': {
        const topThick = 0.024;
        const legProfile = 0.05;
        const returnOffsetX = isRightReturn ? (w / 2 + rd / 2 - legProfile) : -(w / 2 + rd / 2 - legProfile);

        return (
          <group>
            {/* Cubierta principal */}
            <mesh position={[0, h - topThick / 2, 0]} material={melamineMat} castShadow receiveShadow>
              <boxGeometry args={[w, topThick, d]} />
            </mesh>
            {/* Patas metálicas */}
            <mesh position={[-w / 2 + legProfile / 2, (h - topThick) / 2, 0]} material={metalMat} castShadow>
              <boxGeometry args={[legProfile, h - topThick, d]} />
            </mesh>
            <mesh position={[w / 2 - legProfile / 2, (h - topThick) / 2, 0]} material={metalMat} castShadow>
              <boxGeometry args={[legProfile, h - topThick, d]} />
            </mesh>
            {/* Retorno */}
            <group position={[returnOffsetX, 0, d / 2 - rw / 2]}>
              <mesh position={[0, h - topThick / 2, 0]} material={melamineMat} castShadow receiveShadow>
                <boxGeometry args={[rd, topThick, rw]} />
              </mesh>
              {/* Cajonera 2C1K */}
              <group position={[0, 0.725 / 2, rw / 2 - 0.45 / 2]}>
                <mesh material={melamineMat} castShadow>
                  <boxGeometry args={[0.42, 0.725 - topThick, 0.45]} />
                </mesh>
                <mesh position={[0, 0.1, 0.45 / 2 + 0.005]} material={metalMat}>
                  <boxGeometry args={[0.1, 0.015, 0.015]} />
                </mesh>
                <mesh position={[0, -0.15, 0.45 / 2 + 0.005]} material={metalMat}>
                  <boxGeometry args={[0.1, 0.015, 0.015]} />
                </mesh>
              </group>
            </group>
          </group>
        );
      }

      case 'desk-single': {
        const topThick = 0.024;
        const legProfile = 0.05;

        return (
          <group>
            <mesh position={[0, h - topThick / 2, 0]} material={melamineMat} castShadow receiveShadow>
              <boxGeometry args={[w, topThick, d]} />
            </mesh>
            {/* Pasacables */}
            <mesh position={[w / 3, h + 0.001, -d / 3]} material={metalMat}>
              <boxGeometry args={[0.12, 0.004, 0.06]} />
            </mesh>
            {/* Patas metálicas cerradas */}
            <mesh position={[-w / 2 + legProfile / 2, (h - topThick) / 2, 0]} material={metalMat} castShadow>
              <boxGeometry args={[legProfile, h - topThick, d]} />
            </mesh>
            <mesh position={[w / 2 - legProfile / 2, (h - topThick) / 2, 0]} material={metalMat} castShadow>
              <boxGeometry args={[legProfile, h - topThick, d]} />
            </mesh>
            {/* Cajonera pedestal bajo cubierta */}
            <group position={[w / 2 - 0.42 / 2 - legProfile - 0.02, 0.725 / 2, 0]}>
              <mesh material={melamineMat} castShadow>
                <boxGeometry args={[0.42, 0.725 - topThick, 0.45]} />
              </mesh>
              <mesh position={[0, 0.15, 0.45 / 2 + 0.005]} material={metalMat}>
                <boxGeometry args={[0.1, 0.012, 0.015]} />
              </mesh>
              <mesh position={[0, -0.05, 0.45 / 2 + 0.005]} material={metalMat}>
                <boxGeometry args={[0.1, 0.012, 0.015]} />
              </mesh>
              <mesh position={[0, -0.22, 0.45 / 2 + 0.005]} material={metalMat}>
                <boxGeometry args={[0.1, 0.012, 0.015]} />
              </mesh>
            </group>
          </group>
        );
      }

      case 'bench-2p':
      case 'bench-4p':
      case 'bench-6p': {
        const topThick = 0.024;
        const legProfile = 0.05;
        const screenHeight = 0.35;
        const numStations = item.type === 'bench-2p' ? 2 : item.type === 'bench-4p' ? 4 : 6;
        const moduleCount = numStations / 2;
        const moduleWidth = w / moduleCount;

        return (
          <group>
            {/* Cubiertas enfrentadas divididas */}
            <mesh position={[0, h - topThick / 2, -d / 4 - 0.01]} material={melamineMat} castShadow receiveShadow>
              <boxGeometry args={[w, topThick, d / 2 - 0.02]} />
            </mesh>
            <mesh position={[0, h - topThick / 2, d / 4 + 0.01]} material={melamineMat} castShadow receiveShadow>
              <boxGeometry args={[w, topThick, d / 2 - 0.02]} />
            </mesh>

            {/* Pantallas acústicas divisorias centrales */}
            {Array.from({ length: moduleCount }).map((_, idx) => {
              const xPos = -w / 2 + moduleWidth / 2 + idx * moduleWidth;
              return (
                <group key={`screen-${idx}`} position={[xPos, h + screenHeight / 2 - 0.05, 0]}>
                  <mesh material={screenMat} castShadow>
                    <boxGeometry args={[moduleWidth - 0.08, screenHeight, 0.03]} />
                  </mesh>
                  {/* Soportes de pantalla a la estructura */}
                  <mesh position={[-moduleWidth / 3, -screenHeight / 2 + 0.02, 0]} material={metalMat}>
                    <boxGeometry args={[0.04, 0.08, 0.04]} />
                  </mesh>
                  <mesh position={[moduleWidth / 3, -screenHeight / 2 + 0.02, 0]} material={metalMat}>
                    <boxGeometry args={[0.04, 0.08, 0.04]} />
                  </mesh>
                </group>
              );
            })}

            {/* Canaleta de electrificación central bajo cubiertas */}
            <mesh position={[0, h - 0.12, 0]} material={metalMat}>
              <boxGeometry args={[w - 0.1, 0.08, 0.2]} />
            </mesh>

            {/* Pórticos de patas metálicas */}
            {Array.from({ length: moduleCount + 1 }).map((_, idx) => {
              const xPos = -w / 2 + idx * moduleWidth;
              return (
                <group key={`leg-${idx}`} position={[xPos, (h - topThick) / 2, 0]}>
                  <mesh material={metalMat} castShadow>
                    <boxGeometry args={[legProfile, h - topThick, d]} />
                  </mesh>
                </group>
              );
            })}
          </group>
        );
      }

      case 'meeting-10p': {
        const topThick = 0.024;
        const legProfile = 0.05;

        return (
          <group>
            {/* Cubierta de reunión */}
            <mesh position={[0, h - topThick / 2, 0]} material={melamineMat} castShadow receiveShadow>
              <boxGeometry args={[w, topThick, d]} />
            </mesh>
            {/* 2 Cajas de electrificación triples con tapa abatible */}
            <mesh position={[-w / 4, h + 0.002, 0]} material={metalMat}>
              <boxGeometry args={[0.3, 0.006, 0.12]} />
            </mesh>
            <mesh position={[w / 4, h + 0.002, 0]} material={metalMat}>
              <boxGeometry args={[0.3, 0.006, 0.12]} />
            </mesh>
            {/* 3 Pórticos estructurales (Extremos y Centro) */}
            <mesh position={[-w / 2 + legProfile / 2 + 0.1, (h - topThick) / 2, 0]} material={metalMat} castShadow>
              <boxGeometry args={[legProfile, h - topThick, d - 0.1]} />
            </mesh>
            <mesh position={[0, (h - topThick) / 2, 0]} material={metalMat} castShadow>
              <boxGeometry args={[legProfile, h - topThick, d - 0.1]} />
            </mesh>
            <mesh position={[w / 2 - legProfile / 2 - 0.1, (h - topThick) / 2, 0]} material={metalMat} castShadow>
              <boxGeometry args={[legProfile, h - topThick, d - 0.1]} />
            </mesh>
            {/* Vigas longitudinales de unión */}
            <mesh position={[0, h - topThick - 0.03, -d / 3]} material={metalMat}>
              <boxGeometry args={[w - 0.2, 0.04, 0.04]} />
            </mesh>
            <mesh position={[0, h - topThick - 0.03, d / 3]} material={metalMat}>
              <boxGeometry args={[w - 0.2, 0.04, 0.04]} />
            </mesh>
          </group>
        );
      }

      case 'meeting-4p-round': {
        const topThick = 0.024;
        const radius = w / 2;

        return (
          <group>
            {/* Cubierta circular */}
            <mesh position={[0, h - topThick / 2, 0]} material={melamineMat} castShadow receiveShadow>
              <cylinderGeometry args={[radius, radius, topThick, 32]} />
            </mesh>
            {/* Columna central tubo 5" */}
            <mesh position={[0, (h - topThick) / 2, 0]} material={metalMat} castShadow>
              <cylinderGeometry args={[0.065, 0.065, h - topThick, 24]} />
            </mesh>
            {/* Plato base de acero Ø60 cm */}
            <mesh position={[0, 0.008, 0]} material={metalMat} castShadow receiveShadow>
              <cylinderGeometry args={[0.3, 0.3, 0.016, 32]} />
            </mesh>
          </group>
        );
      }

      case 'cabinet-mid-2p': {
        return (
          <group position={[0, h / 2, 0]}>
            {/* Cuerpo principal */}
            <mesh material={melamineMat} castShadow receiveShadow>
              <boxGeometry args={[w, h, d]} />
            </mesh>
            {/* Separación de puertas frontal */}
            <mesh position={[0, 0, d / 2 + 0.002]} material={metalMat}>
              <boxGeometry args={[0.003, h - 0.05, 0.002]} />
            </mesh>
            {/* Tiradores */}
            <mesh position={[-0.08, 0.15, d / 2 + 0.015]} material={metalMat}>
              <boxGeometry args={[0.02, 0.15, 0.02]} />
            </mesh>
            <mesh position={[0.08, 0.15, d / 2 + 0.015]} material={metalMat}>
              <boxGeometry args={[0.02, 0.15, 0.02]} />
            </mesh>
            {/* Cerradura */}
            <mesh position={[0.08, 0.3, d / 2 + 0.01]} rotation={[Math.PI / 2, 0, 0]} material={chromeMat}>
              <cylinderGeometry args={[0.01, 0.01, 0.01, 16]} />
            </mesh>
          </group>
        );
      }

      case 'locker-2p': {
        return (
          <group position={[0, h / 2, 0]}>
            {/* Cuerpo metálico */}
            <mesh material={metalMat} castShadow receiveShadow>
              <boxGeometry args={[w, h, d]} />
            </mesh>
            {/* División de 2 puertas verticales */}
            <mesh position={[0, 0, d / 2 + 0.002]} material={chromeMat}>
              <boxGeometry args={[w - 0.04, 0.004, 0.002]} />
            </mesh>
            {/* Celosías y portacandado Puerta Superior */}
            <mesh position={[0, h / 4 + 0.25, d / 2 + 0.004]} material={chromeMat}>
              <boxGeometry args={[0.12, 0.03, 0.002]} />
            </mesh>
            <mesh position={[w / 3, h / 4, d / 2 + 0.01]} material={chromeMat}>
              <boxGeometry args={[0.02, 0.06, 0.015]} />
            </mesh>
            {/* Celosías y portacandado Puerta Inferior */}
            <mesh position={[0, -h / 4 + 0.25, d / 2 + 0.004]} material={chromeMat}>
              <boxGeometry args={[0.12, 0.03, 0.002]} />
            </mesh>
            <mesh position={[w / 3, -h / 4, d / 2 + 0.01]} material={chromeMat}>
              <boxGeometry args={[0.02, 0.06, 0.015]} />
            </mesh>
            {/* Patas de elevación */}
            <mesh position={[-w / 2 + 0.03, -h / 2 + 0.05, -d / 2 + 0.03]} material={metalMat}>
              <boxGeometry args={[0.04, 0.1, 0.04]} />
            </mesh>
            <mesh position={[w / 2 - 0.03, -h / 2 + 0.05, -d / 2 + 0.03]} material={metalMat}>
              <boxGeometry args={[0.04, 0.1, 0.04]} />
            </mesh>
            <mesh position={[-w / 2 + 0.03, -h / 2 + 0.05, d / 2 - 0.03]} material={metalMat}>
              <boxGeometry args={[0.04, 0.1, 0.04]} />
            </mesh>
            <mesh position={[w / 2 - 0.03, -h / 2 + 0.05, d / 2 - 0.03]} material={metalMat}>
              <boxGeometry args={[0.04, 0.1, 0.04]} />
            </mesh>
          </group>
        );
      }

      case 'shelving-metal': {
        const postProfile = 0.04;
        const shelfThick = 0.025;
        const numShelves = 4;

        return (
          <group position={[0, h / 2, 0]}>
            {/* 4 Postes angulares ranurados */}
            <mesh position={[-w / 2 + postProfile / 2, 0, -d / 2 + postProfile / 2]} material={metalMat} castShadow>
              <boxGeometry args={[postProfile, h, postProfile]} />
            </mesh>
            <mesh position={[w / 2 - postProfile / 2, 0, -d / 2 + postProfile / 2]} material={metalMat} castShadow>
              <boxGeometry args={[postProfile, h, postProfile]} />
            </mesh>
            <mesh position={[-w / 2 + postProfile / 2, 0, d / 2 - postProfile / 2]} material={metalMat} castShadow>
              <boxGeometry args={[postProfile, h, postProfile]} />
            </mesh>
            <mesh position={[w / 2 - postProfile / 2, 0, d / 2 - postProfile / 2]} material={metalMat} castShadow>
              <boxGeometry args={[postProfile, h, postProfile]} />
            </mesh>

            {/* 4 Bandejas metálicas */}
            {Array.from({ length: numShelves }).map((_, idx) => {
              const yPos = -h / 2 + 0.1 + (idx * (h - 0.2)) / (numShelves - 1);
              return (
                <mesh key={`shelf-${idx}`} position={[0, yPos, 0]} material={metalMat} castShadow receiveShadow>
                  <boxGeometry args={[w, shelfThick, d]} />
                </mesh>
              );
            })}
          </group>
        );
      }

      case 'panel-divider': {
        const frameProfile = 0.04;

        return (
          <group position={[0, h / 2, 0]}>
            {/* Marco de aluminio perimetral */}
            <mesh material={metalMat} castShadow>
              <boxGeometry args={[w, h, d]} />
            </mesh>
            {/* Zócalo inferior electrificable */}
            <mesh position={[0, -h / 2 + 0.1, 0]} material={metalMat}>
              <boxGeometry args={[w - frameProfile * 2, 0.18, d + 0.004]} />
            </mesh>
            {/* Panel intermedio laminado/acústico */}
            <mesh position={[0, -0.15, 0]} material={screenMat} castShadow>
              <boxGeometry args={[w - frameProfile * 2, 0.7, d - 0.01]} />
            </mesh>
            {/* Kit superior de vidrio transparente */}
            <mesh position={[0, h / 2 - 0.35, 0]} material={glassMat}>
              <boxGeometry args={[w - frameProfile * 2, 0.6, 0.008]} />
            </mesh>
          </group>
        );
      }

      case 'table-cafe': {
        const topThick = 0.024;
        const legProfile = 0.04;

        return (
          <group>
            <mesh position={[0, h - topThick / 2, 0]} material={melamineMat} castShadow receiveShadow>
              <boxGeometry args={[w, topThick, d]} />
            </mesh>
            {/* 4 Patas rectas */}
            <mesh position={[-w / 2 + legProfile / 2 + 0.02, (h - topThick) / 2, -d / 2 + legProfile / 2 + 0.02]} material={metalMat} castShadow>
              <boxGeometry args={[legProfile, h - topThick, legProfile]} />
            </mesh>
            <mesh position={[w / 2 - legProfile / 2 - 0.02, (h - topThick) / 2, -d / 2 + legProfile / 2 + 0.02]} material={metalMat} castShadow>
              <boxGeometry args={[legProfile, h - topThick, legProfile]} />
            </mesh>
            <mesh position={[-w / 2 + legProfile / 2 + 0.02, (h - topThick) / 2, d / 2 - legProfile / 2 - 0.02]} material={metalMat} castShadow>
              <boxGeometry args={[legProfile, h - topThick, legProfile]} />
            </mesh>
            <mesh position={[w / 2 - legProfile / 2 - 0.02, (h - topThick) / 2, d / 2 - legProfile / 2 - 0.02]} material={metalMat} castShadow>
              <boxGeometry args={[legProfile, h - topThick, legProfile]} />
            </mesh>
          </group>
        );
      }

      case 'table-side': {
        const topThick = 0.024;
        const legProfile = 0.025;

        return (
          <group>
            <mesh position={[0, h - topThick / 2, 0]} material={melamineMat} castShadow receiveShadow>
              <boxGeometry args={[w, topThick, d]} />
            </mesh>
            {/* Marco de acero 25x25mm */}
            <mesh position={[-w / 2 + legProfile / 2, (h - topThick) / 2, 0]} material={metalMat} castShadow>
              <boxGeometry args={[legProfile, h - topThick, d]} />
            </mesh>
            <mesh position={[w / 2 - legProfile / 2, (h - topThick) / 2, 0]} material={metalMat} castShadow>
              <boxGeometry args={[legProfile, h - topThick, d]} />
            </mesh>
          </group>
        );
      }

      case 'chair-task-high':
      case 'chair-task-mid': {
        const isHigh = item.type === 'chair-task-high';
        const backH = isHigh ? 0.58 : 0.45;

        return (
          <group position={[0, 0, 0]}>
            {/* Base 5 aspas con ruedas */}
            <mesh position={[0, 0.06, 0]} material={metalMat} castShadow>
              <cylinderGeometry args={[0.3, 0.3, 0.03, 5]} />
            </mesh>
            {/* Cilindro de gas */}
            <mesh position={[0, 0.25, 0]} material={metalMat}>
              <cylinderGeometry args={[0.025, 0.025, 0.35, 16]} />
            </mesh>
            {/* Asiento inyectado acolchado */}
            <mesh position={[0, 0.44, 0]} material={chairMeshMat} castShadow receiveShadow>
              <boxGeometry args={[0.48, 0.07, 0.48]} />
            </mesh>
            {/* Respaldo ergonómico en malla */}
            <mesh position={[0, 0.48 + backH / 2, -0.22]} material={chairMeshMat} castShadow>
              <boxGeometry args={[0.45, backH, 0.03]} />
            </mesh>
            {/* Apoyabrazos ajustables */}
            <mesh position={[-0.26, 0.58, 0]} material={metalMat}>
              <boxGeometry args={[0.04, 0.2, 0.22]} />
            </mesh>
            <mesh position={[0.26, 0.58, 0]} material={metalMat}>
              <boxGeometry args={[0.04, 0.2, 0.22]} />
            </mesh>
          </group>
        );
      }

      case 'chair-visitor': {
        return (
          <group position={[0, 0, 0]}>
            {/* 4 Patas metálicas */}
            <mesh position={[-0.22, 0.22, -0.2]} material={metalMat} castShadow>
              <cylinderGeometry args={[0.012, 0.012, 0.44, 12]} />
            </mesh>
            <mesh position={[0.22, 0.22, -0.2]} material={metalMat} castShadow>
              <cylinderGeometry args={[0.012, 0.012, 0.44, 12]} />
            </mesh>
            <mesh position={[-0.24, 0.22, 0.2]} material={metalMat} castShadow>
              <cylinderGeometry args={[0.012, 0.012, 0.44, 12]} />
            </mesh>
            <mesh position={[0.24, 0.22, 0.2]} material={metalMat} castShadow>
              <cylinderGeometry args={[0.012, 0.012, 0.44, 12]} />
            </mesh>
            {/* Asiento tapizado */}
            <mesh position={[0, 0.44, 0]} material={chairMeshMat} castShadow receiveShadow>
              <boxGeometry args={[0.48, 0.05, 0.46]} />
            </mesh>
            {/* Respaldo ergonómico */}
            <mesh position={[0, 0.72, -0.2]} material={chairMeshMat} castShadow>
              <boxGeometry args={[0.44, 0.48, 0.02]} />
            </mesh>
          </group>
        );
      }

      case 'chair-cafe': {
        return (
          <group position={[0, 0, 0]}>
            {/* 4 Patas estructura */}
            <mesh position={[-0.18, 0.22, -0.18]} material={metalMat} castShadow>
              <cylinderGeometry args={[0.015, 0.012, 0.44, 12]} />
            </mesh>
            <mesh position={[0.18, 0.22, -0.18]} material={metalMat} castShadow>
              <cylinderGeometry args={[0.015, 0.012, 0.44, 12]} />
            </mesh>
            <mesh position={[-0.18, 0.22, 0.18]} material={metalMat} castShadow>
              <cylinderGeometry args={[0.015, 0.012, 0.44, 12]} />
            </mesh>
            <mesh position={[0.18, 0.22, 0.18]} material={metalMat} castShadow>
              <cylinderGeometry args={[0.015, 0.012, 0.44, 12]} />
            </mesh>
            {/* Monocasco asiento + respaldo */}
            <mesh position={[0, 0.44, 0]} material={chairMeshMat} castShadow receiveShadow>
              <boxGeometry args={[0.44, 0.03, 0.42]} />
            </mesh>
            <mesh position={[0, 0.65, -0.18]} material={chairMeshMat} castShadow>
              <boxGeometry args={[0.42, 0.38, 0.02]} />
            </mesh>
          </group>
        );
      }

      case 'chair-lounge': {
        return (
          <group position={[0, 0, 0]}>
            {/* 4 Patas de madera de haya */}
            <mesh position={[-0.2, 0.2, -0.2]} material={woodLegMat} rotation={[0.1, 0, -0.1]} castShadow>
              <cylinderGeometry args={[0.018, 0.014, 0.42, 12]} />
            </mesh>
            <mesh position={[0.2, 0.2, -0.2]} material={woodLegMat} rotation={[0.1, 0, 0.1]} castShadow>
              <cylinderGeometry args={[0.018, 0.014, 0.42, 12]} />
            </mesh>
            <mesh position={[-0.2, 0.2, 0.2]} material={woodLegMat} rotation={[-0.1, 0, -0.1]} castShadow>
              <cylinderGeometry args={[0.018, 0.014, 0.42, 12]} />
            </mesh>
            <mesh position={[0.2, 0.2, 0.2]} material={woodLegMat} rotation={[-0.1, 0, 0.1]} castShadow>
              <cylinderGeometry args={[0.018, 0.014, 0.42, 12]} />
            </mesh>
            {/* Casco tapizado envolvente */}
            <mesh position={[0, 0.46, 0]} material={chairMeshMat} castShadow receiveShadow>
              <boxGeometry args={[0.55, 0.12, 0.52]} />
            </mesh>
            <mesh position={[0, 0.72, -0.2]} material={chairMeshMat} castShadow>
              <boxGeometry args={[0.52, 0.45, 0.08]} />
            </mesh>
            <mesh position={[-0.25, 0.6, 0]} material={chairMeshMat} castShadow>
              <boxGeometry args={[0.08, 0.24, 0.48]} />
            </mesh>
            <mesh position={[0.25, 0.6, 0]} material={chairMeshMat} castShadow>
              <boxGeometry args={[0.08, 0.24, 0.48]} />
            </mesh>
          </group>
        );
      }

      default:
        return (
          <mesh position={[0, h / 2, 0]} material={melamineMat} castShadow receiveShadow>
            <boxGeometry args={[w, h, d]} />
          </mesh>
        );
    }
  };

  return (
    <group
      ref={ref}
      position={[item.position[0], 0, item.position[2]]}
      rotation={[0, item.rotation, 0]}
      onClick={(e) => {
        e.stopPropagation();
        if (onSelect) onSelect(e);
      }}
    >
      {renderGeometry()}

      {/* Indicador de Selección 3D (Marco naranja brillante) */}
      {isSelected && (
        <group position={[0, 0.01, 0]}>
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(w + 0.08, 0.02, d + 0.08)]} />
            <lineBasicMaterial color="#F97316" linewidth={3} />
          </lineSegments>
        </group>
      )}
    </group>
  );
});
OfficeFurniture3D.displayName = 'OfficeFurniture3D';
