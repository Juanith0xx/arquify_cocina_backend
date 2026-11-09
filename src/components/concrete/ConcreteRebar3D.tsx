import React, { useMemo } from 'react';
import * as THREE from 'three';
import {
  ConcreteOpening,
  WallThicknessMm,
  WallMeshType,
  WallSystemType,
  ConcreteFoundationType,
} from '../../store/concreteHouseStore';
import { getConfinedPillarXPositions } from '../../utils/concreteConfinement';

interface ConcreteRebar3DProps {
  wallTarget: 'front' | 'back' | 'left' | 'right';
  wallLengthCm: number;
  wallHeightCm: number;
  wallThicknessMm: WallThicknessMm;
  meshType: WallMeshType;
  meshDiameterMm?: number;
  meshSpacingCm?: number;
  openings: ConcreteOpening[];
  wallSystemType?: WallSystemType;
  showRebarMesh?: boolean;
  showEdgeReinforcement?: boolean;
  showOpeningReinforcement?: boolean;
  showSpacers?: boolean;
}

export function ConcreteRebar3D({
  wallTarget,
  wallLengthCm,
  wallHeightCm,
  wallThicknessMm,
  meshType,
  meshDiameterMm = 5.0,
  meshSpacingCm = 15,
  openings,
  wallSystemType = 'hormigon_armado_total',
  showRebarMesh = true,
  showEdgeReinforcement = true,
  showOpeningReinforcement = true,
  showSpacers = true,
}: ConcreteRebar3DProps) {
  const wallThicknessCm = wallThicknessMm / 10;
  const coverCm = wallThicknessMm <= 100 ? 2.0 : 2.5; // Recubrimiento normativo ICH
  const isMasonry = wallSystemType === 'albanileria_confinada';

  // Materiales de acero y separadores
  const steelMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#b06b2e', // Tono acero oxidado / corrugado de obra o #4a5568 metálico
        metalness: 0.85,
        roughness: 0.35,
      }),
    []
  );

  const mainBarMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#3b82f6', // Azul acero dulce / A630 para barras longitudinales
        metalness: 0.9,
        roughness: 0.3,
      }),
    []
  );

  const tieBarMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#10b981', // Verde para estribos y trabas
        metalness: 0.8,
        roughness: 0.4,
      }),
    []
  );

  const diagonalBarMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#f59e0b', // Ámbar para diagonales sísmicas a 45°
        metalness: 0.85,
        roughness: 0.35,
      }),
    []
  );

  const spacerPlasticMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#e2e8f0', // Plástico blanco / gris de separador
        roughness: 0.6,
      }),
    []
  );

  // Determinar planos de malla Z
  const meshZPositions = useMemo(() => {
    if (meshType === 'malla_central') {
      return [0]; // Plano central
    } else {
      const zOffset = (wallThicknessCm / 2) - coverCm;
      return [-zOffset, zOffset];
    }
  }, [meshType, wallThicknessCm, coverCm]);

  // Verificar si un punto (x, y) cae dentro de algún vano
  const isInsideOpening = (x: number, y: number): boolean => {
    return openings.some((op) => {
      const opMinX = op.offsetAlongWall - wallLengthCm / 2;
      const opMaxX = opMinX + op.width;
      const opMinY = op.sillHeight;
      const opMaxY = opMinY + op.height;
      return x >= opMinX && x <= opMaxX && y >= opMinY && y <= opMaxY;
    });
  };

  // 1. Barras de la malla electrosoldada (Verticales y Horizontales)
  // En Albañilería Confinada NO HAY MALLA sobre los ladrillos; solo en Hormigón Armado Total
  const meshBars = useMemo(() => {
    if (!showRebarMesh || isMasonry) return [];
    const bars: { pos: [number, number, number]; size: [number, number, number]; rot?: [number, number, number] }[] = [];
    const barRadius = (meshDiameterMm / 10) / 2; // cm
    const step = meshSpacingCm; // ej. 15cm

    meshZPositions.forEach((zPos) => {
      // Barras Verticales
      for (let x = -wallLengthCm / 2 + step; x < wallLengthCm / 2 - 5; x += step) {
        let currentY = 5;
        const topY = wallHeightCm - 5;
        let segStart = currentY;
        let inVoid = false;

        for (let y = currentY; y <= topY; y += 5) {
          const inOp = isInsideOpening(x, y);
          if (inOp && !inVoid) {
            if (y - segStart > 10) {
              const h = y - segStart;
              bars.push({
                pos: [x, segStart + h / 2, zPos],
                size: [barRadius * 2, h, barRadius * 2],
              });
            }
            inVoid = true;
          } else if (!inOp && inVoid) {
            segStart = y;
            inVoid = false;
          }
        }

        if (!inVoid && topY - segStart > 10) {
          const h = topY - segStart;
          bars.push({
            pos: [x, segStart + h / 2, zPos],
            size: [barRadius * 2, h, barRadius * 2],
          });
        }
      }

      // Barras Horizontales
      for (let y = step; y < wallHeightCm - 5; y += step) {
        let segStartX = -wallLengthCm / 2 + 5;
        const endX = wallLengthCm / 2 - 5;
        let inVoid = false;

        for (let x = segStartX; x <= endX; x += 5) {
          const inOp = isInsideOpening(x, y);
          if (inOp && !inVoid) {
            if (x - segStartX > 10) {
              const w = x - segStartX;
              bars.push({
                pos: [segStartX + w / 2, y, zPos],
                size: [w, barRadius * 2, barRadius * 2],
              });
            }
            inVoid = true;
          } else if (!inOp && inVoid) {
            segStartX = x;
            inVoid = false;
          }
        }

        if (!inVoid && endX - segStartX > 10) {
          const w = endX - segStartX;
          bars.push({
            pos: [segStartX + w / 2, y, zPos],
            size: [w, barRadius * 2, barRadius * 2],
          });
        }
      }
    });

    return bars;
  }, [showRebarMesh, isMasonry, wallLengthCm, wallHeightCm, meshSpacingCm, meshDiameterMm, meshZPositions, openings]);

  // 2. Refuerzos de Confinamiento para Albañilería Confinada (Pilares y Cadenas NCh2123)
  const confinedMasonryRebar = useMemo(() => {
    if (!isMasonry || !showEdgeReinforcement) return { bars: [], stirrups: [], ladderBars: [] };

    const bars: { pos: [number, number, number]; radius: number; length: number; rotation: [number, number, number] }[] = [];
    const stirrups: { pos: [number, number, number]; size: [number, number, number] }[] = [];
    const ladderBars: { pos: [number, number, number]; size: [number, number, number] }[] = [];

    const colWidth = 20; // cm
    const beamHeight = 20; // cm
    const barRadius = 0.55; // Ø10 o Ø12
    const stirrupRadius = 0.35; // Ø6 o Ø8

    // Posiciones X de pilares de confinamiento sin colisión con vanos
    const colXPositions = getConfinedPillarXPositions(wallLengthCm, openings, colWidth);

    const zOffsets = [-(wallThicknessCm / 2 - 2.5), wallThicknessCm / 2 - 2.5];
    const pilarHeight = wallHeightCm - beamHeight;

    // A. Armadura de Pilares de Confinamiento (4 barras Ø10/12 + Estribos cerrados)
    colXPositions.forEach((colX) => {
      const xOffsets = [colX - 6, colX + 6];

      // 4 Barras Verticales por Pilar
      xOffsets.forEach((bx) => {
        zOffsets.forEach((bz) => {
          bars.push({
            pos: [bx, pilarHeight / 2, bz],
            radius: barRadius,
            length: pilarHeight - 2,
            rotation: [0, 0, 0],
          });
        });
      });

      // Estribos rectangulares cerrados (@ 10cm en extremos confinados, @ 20cm al centro)
      for (let y = 10; y < pilarHeight; y += (y < 60 || y > pilarHeight - 60 ? 10 : 20)) {
        stirrups.push({
          pos: [colX, y, 0],
          size: [14, stirrupRadius * 2, wallThicknessCm - 3],
        });
      }
    });

    // B. Armadura de Cadena de Coronación Superior (4 barras corridas Ø10/12 + Estribos @ 15cm)
    const chainCenterY = wallHeightCm - beamHeight / 2;
    const chainYOffsets = [chainCenterY - 6, chainCenterY + 6];

    chainYOffsets.forEach((by) => {
      zOffsets.forEach((bz) => {
        bars.push({
          pos: [0, by, bz],
          radius: barRadius,
          length: wallLengthCm - 4,
          rotation: [0, 0, Math.PI / 2],
        });
      });
    });

    // Estribos de cadena a lo largo del muro cada 15cm
    for (let x = -wallLengthCm / 2 + 10; x < wallLengthCm / 2 - 10; x += 15) {
      stirrups.push({
        pos: [x, chainCenterY, 0],
        size: [stirrupRadius * 2, 14, wallThicknessCm - 3],
      });
    }

    // C. Escalerillas electro-soldadas de tendel (en juntas de mortero cada ~60cm de altura)
    for (let y = 60; y < pilarHeight - 20; y += 60) {
      ladderBars.push({
        pos: [0, y, 0],
        size: [wallLengthCm - 10, 0.42, wallThicknessCm * 0.55],
      });
    }

    return { bars, stirrups, ladderBars };
  }, [isMasonry, showEdgeReinforcement, wallLengthCm, wallHeightCm, wallThicknessCm]);

  // 3. Refuerzos de Borde y Esquinas para Hormigón Armado Total
  const edgeReinforcements = useMemo(() => {
    if (isMasonry || !showEdgeReinforcement) return { bars: [], ties: [] };
    const bars: {
      pos: [number, number, number];
      radius: number;
      length: number;
      rotation: [number, number, number];
    }[] = [];
    const ties: { pos: [number, number, number]; size: [number, number, number] }[] = [];

    const mainRadius = 0.6;
    const tieRadius = 0.4;

    const xOffsets = [
      -wallLengthCm / 2 + coverCm + 2,
      wallLengthCm / 2 - coverCm - 2,
    ];

    xOffsets.forEach((xPos) => {
      const zOffsets = meshType === 'malla_doble' 
        ? [-(wallThicknessCm / 2 - coverCm - 0.5), (wallThicknessCm / 2 - coverCm - 0.5)]
        : [-1.5, 1.5];

      zOffsets.forEach((zPos) => {
        bars.push({
          pos: [xPos, wallHeightCm / 2, zPos],
          radius: mainRadius,
          length: Math.max(10, wallHeightCm - coverCm * 2 - 2),
          rotation: [0, 0, 0],
        });
      });

      const tieWidthZ = Math.max(1.5, wallThicknessCm - coverCm * 2);
      for (let y = 15; y < wallHeightCm - 10; y += 15) {
        ties.push({
          pos: [xPos, y, 0],
          size: [4, tieRadius * 2, tieWidthZ],
        });
      }
    });

    const zTopOffsets = meshType === 'malla_doble'
      ? [-(wallThicknessCm / 2 - coverCm - 0.5), (wallThicknessCm / 2 - coverCm - 0.5)]
      : [0];

    zTopOffsets.forEach((zPos) => {
      bars.push({
        pos: [0, wallHeightCm - coverCm - 2, zPos],
        radius: mainRadius,
        length: Math.max(10, wallLengthCm - coverCm * 2 - 4),
        rotation: [0, 0, Math.PI / 2],
      });
    });

    return { bars, ties };
  }, [isMasonry, showEdgeReinforcement, wallLengthCm, wallHeightCm, wallThicknessCm, coverCm, meshType]);

  // 4. Refuerzos Sísmicos en Vanos (Dinteles y Diagonales 45°)
  const openingReinforcements = useMemo(() => {
    if (!showOpeningReinforcement) return { lintels: [], diagonals: [] };
    const lintels: { pos: [number, number, number]; len: number }[] = [];
    const diagonals: { pos: [number, number, number]; rotZ: number }[] = [];

    const leftLimit = -wallLengthCm / 2 + coverCm + 2;
    const rightLimit = wallLengthCm / 2 - coverCm - 2;

    openings.forEach((op) => {
      const opLeft = op.offsetAlongWall - wallLengthCm / 2;
      const opRight = opLeft + op.width;
      const opCenterX = (opLeft + opRight) / 2;

      const startX = Math.max(leftLimit, opLeft - 35);
      const endX = Math.min(rightLimit, opRight + 35);
      const lintelLen = Math.max(10, endX - startX);
      const lintelX = (startX + endX) / 2;

      const lintelY = Math.min(wallHeightCm - coverCm - 4, op.sillHeight + op.height + 4);

      lintels.push({
        pos: [lintelX, lintelY, 0],
        len: lintelLen,
      });

      if (op.type === 'window' && op.sillHeight > 0) {
        const sillY = Math.max(coverCm + 4, op.sillHeight - 4);
        lintels.push({
          pos: [lintelX, sillY, 0],
          len: lintelLen,
        });
      }

      // En Hormigón Armado Total se agregan diagonales a 45°; en albañilería el vano se confina con pilaretes/cadenas
      if (!isMasonry && op.hasDiagonalRebar !== false) {
        const halfW = op.width / 2;
        const halfH = op.height / 2;
        const opCenterY = op.sillHeight + halfH;

        diagonals.push({
          pos: [opCenterX - halfW - 2, opCenterY + halfH + 2, 0],
          rotZ: Math.PI / 4,
        });
        diagonals.push({
          pos: [opCenterX + halfW + 2, opCenterY + halfH + 2, 0],
          rotZ: -Math.PI / 4,
        });
        if (op.type === 'window') {
          diagonals.push({
            pos: [opCenterX - halfW - 2, opCenterY - halfH - 2, 0],
            rotZ: -Math.PI / 4,
          });
          diagonals.push({
            pos: [opCenterX + halfW + 2, opCenterY - halfH - 2, 0],
            rotZ: Math.PI / 4,
          });
        }
      }
    });

    return { lintels, diagonals };
  }, [showOpeningReinforcement, isMasonry, openings, wallLengthCm, wallHeightCm, coverCm]);

  // 5. Separadores plásticos (solo para Hormigón Armado Total)
  const spacers = useMemo(() => {
    if (!showSpacers || isMasonry) return [];
    const items: [number, number, number][] = [];
    const stepX = 120;
    const stepY = 80;

    for (let x = -wallLengthCm / 2 + 40; x < wallLengthCm / 2 - 40; x += stepX) {
      for (let y = 40; y < wallHeightCm - 30; y += stepY) {
        if (!isInsideOpening(x, y)) {
          items.push([x, y, 0]);
        }
      }
    }
    return items;
  }, [showSpacers, isMasonry, wallLengthCm, wallHeightCm, openings]);

  return (
    <group>
      {/* 1. Mallas Electrosoldadas (Hormigón Armado) */}
      {meshBars.map((bar, idx) => (
        <mesh key={`mesh-bar-${idx}`} position={bar.pos} material={steelMaterial}>
          <boxGeometry args={bar.size} />
        </mesh>
      ))}

      {/* 2. Refuerzos de Confinamiento (Albañilería Confinada NCh2123) */}
      {isMasonry && (
        <group>
          {confinedMasonryRebar.bars.map((bar, idx) => (
            <mesh
              key={`mas-bar-${idx}`}
              position={bar.pos}
              rotation={bar.rotation}
              material={mainBarMaterial}
            >
              <cylinderGeometry args={[bar.radius, bar.radius, bar.length, 8]} />
            </mesh>
          ))}
          {confinedMasonryRebar.stirrups.map((st, idx) => (
            <mesh key={`mas-stirrup-${idx}`} position={st.pos} material={tieBarMaterial}>
              <boxGeometry args={st.size} />
            </mesh>
          ))}
          {confinedMasonryRebar.ladderBars.map((lb, idx) => (
            <mesh key={`mas-ladder-${idx}`} position={lb.pos} material={steelMaterial}>
              <boxGeometry args={lb.size} />
            </mesh>
          ))}
        </group>
      )}

      {/* 3. Refuerzos de Borde y Esquinas (Hormigón Armado Total) */}
      {!isMasonry && (
        <group>
          {edgeReinforcements.bars.map((bar, idx) => (
            <mesh
              key={`edge-bar-${idx}`}
              position={bar.pos}
              rotation={bar.rotation}
              material={mainBarMaterial}
            >
              <cylinderGeometry args={[bar.radius, bar.radius, bar.length, 8]} />
            </mesh>
          ))}
          {edgeReinforcements.ties.map((tie, idx) => (
            <mesh key={`tie-${idx}`} position={tie.pos} material={tieBarMaterial}>
              <boxGeometry args={tie.size} />
            </mesh>
          ))}
        </group>
      )}

      {/* 4. Dinteles y Refuerzos de Vanos */}
      {openingReinforcements.lintels.map((lintel, idx) => (
        <mesh
          key={`lintel-${idx}`}
          position={lintel.pos}
          rotation={[0, 0, Math.PI / 2]}
          material={mainBarMaterial}
        >
          <cylinderGeometry args={[0.6, 0.6, lintel.len, 8]} />
        </mesh>
      ))}

      {/* Diagonales Sísmicas a 45° */}
      {openingReinforcements.diagonals.map((diag, idx) => (
        <mesh
          key={`diag-${idx}`}
          position={diag.pos}
          rotation={[0, 0, diag.rotZ]}
          material={diagonalBarMaterial}
        >
          <cylinderGeometry args={[0.5, 0.5, 45, 8]} />
        </mesh>
      ))}

      {/* 5. Ruedas Separadoras Plásticas (ICH) */}
      {spacers.map((pos, idx) => (
        <group key={`spacer-${idx}`} position={pos}>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={spacerPlasticMaterial}>
            <torusGeometry args={[wallThicknessCm / 2 - 0.2, 0.3, 8, 16]} />
          </mesh>
          <mesh rotation={[0, 0, 0]} material={spacerPlasticMaterial}>
            <cylinderGeometry args={[0.2, 0.2, wallThicknessCm - 0.4, 6]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

