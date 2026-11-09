import React, { useMemo } from 'react';
import * as THREE from 'three';
import {
  ConcreteOpening,
  WallThicknessMm,
  WallMeshType,
  ConcreteRenderMode,
  ConcreteWallTarget,
  WallSystemType,
} from '../../store/concreteHouseStore';
import { ConcreteRebar3D } from './ConcreteRebar3D';
import { ConcreteInteractiveOpening } from './ConcreteInteractiveOpening';
import { getConcreteTextures } from '../../utils/concreteTextures';
import { getWallConfinementElements } from '../../utils/concreteConfinement';

/**
 * Genera BoxGeometry con coordenadas UV proporcionales al tamaño métrico real
 * y alineadas al sistema de coordenadas global del muro (u = x_abs / tileW, v = y_abs / tileH).
 * Esto garantiza continuidad absoluta entre tramos de muro, antepechos y dinteles
 * sin desfases ni efecto mosaico al añadir puertas o ventanas.
 */
function createWorldUvBoxGeometry(
  sizeX: number,
  sizeY: number,
  sizeZ: number,
  xStart: number,
  yStart: number,
  tileW = 240,
  tileH = 240
): THREE.BufferGeometry {
  const geom = new THREE.BoxGeometry(sizeX, sizeY, sizeZ);
  const uvAttr = geom.attributes.uv;
  if (!uvAttr) return geom;

  const u0 = xStart / tileW;
  const u1 = (xStart + sizeX) / tileW;
  const v0 = yStart / tileH;
  const v1 = (yStart + sizeY) / tileH;

  const uSide0 = 0;
  const uSide1 = sizeZ / tileW;
  const vTop0 = 0;
  const vTop1 = sizeZ / tileH;

  // Face +X (derecha, índices 0..3)
  uvAttr.setXY(0, uSide0, v1);
  uvAttr.setXY(1, uSide1, v1);
  uvAttr.setXY(2, uSide0, v0);
  uvAttr.setXY(3, uSide1, v0);

  // Face -X (izquierda, índices 4..7)
  uvAttr.setXY(4, uSide0, v1);
  uvAttr.setXY(5, uSide1, v1);
  uvAttr.setXY(6, uSide0, v0);
  uvAttr.setXY(7, uSide1, v0);

  // Face +Y (superior, índices 8..11)
  uvAttr.setXY(8, u0, vTop1);
  uvAttr.setXY(9, u1, vTop1);
  uvAttr.setXY(10, u0, vTop0);
  uvAttr.setXY(11, u1, vTop0);

  // Face -Y (inferior, índices 12..15)
  uvAttr.setXY(12, u0, vTop1);
  uvAttr.setXY(13, u1, vTop1);
  uvAttr.setXY(14, u0, vTop0);
  uvAttr.setXY(15, u1, vTop0);

  // Face +Z (Frontal, índices 16..19)
  uvAttr.setXY(16, u0, v1);
  uvAttr.setXY(17, u1, v1);
  uvAttr.setXY(18, u0, v0);
  uvAttr.setXY(19, u1, v0);

  // Face -Z (Posterior, índices 20..23)
  uvAttr.setXY(20, u1, v1);
  uvAttr.setXY(21, u0, v1);
  uvAttr.setXY(22, u1, v0);
  uvAttr.setXY(23, u0, v0);

  uvAttr.needsUpdate = true;
  return geom;
}

interface ConcreteWall3DProps {
  wallTarget: ConcreteWallTarget;
  wallLengthCm: number;
  wallHeightCm: number;
  wallThicknessMm: WallThicknessMm;
  meshType: WallMeshType;
  renderMode: ConcreteRenderMode;
  openings: ConcreteOpening[];
  wallSystemType?: WallSystemType;
  showRebarMesh?: boolean;
  showEdgeReinforcement?: boolean;
  showOpeningReinforcement?: boolean;
  showSpacers?: boolean;
  showFormworkTieHoles?: boolean;
  isSelected?: boolean;
  onSelectWall?: () => void;
  onSelectOpening?: (id: string) => void;
}

export function ConcreteWall3D({
  wallTarget,
  wallLengthCm,
  wallHeightCm,
  wallThicknessMm,
  meshType,
  renderMode,
  openings,
  wallSystemType = 'hormigon_armado_total',
  showRebarMesh = true,
  showEdgeReinforcement = true,
  showOpeningReinforcement = true,
  showSpacers = true,
  showFormworkTieHoles = true,
  isSelected = false,
  onSelectWall,
  onSelectOpening,
}: ConcreteWall3DProps) {
  const wallThicknessCm = wallThicknessMm / 10;

  // Material de Hormigón según el modo de visualización
  const concreteMaterial = useMemo(() => {
    if (renderMode === 'xray') {
      return new THREE.MeshStandardMaterial({
        color: '#94a3b8',
        roughness: 0.3,
        metalness: 0.1,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
      });
    }

    if (renderMode === 'formwork') {
      return new THREE.MeshStandardMaterial({
        color: '#ca8a04', // Tablero fenólico amarillo / encofrado industrial
        roughness: 0.5,
        metalness: 0.1,
      });
    }

    const { wallTexture, wallBumpMap, wallRoughnessMap } = getConcreteTextures();

    // Mapeo UV métrico directo 1:1 para evitar multiplicaciones o efecto mosaico
    const map = wallTexture.clone();
    const bump = wallBumpMap.clone();
    const rough = wallRoughnessMap.clone();

    map.repeat.set(1, 1);
    bump.repeat.set(1, 1);
    rough.repeat.set(1, 1);
    map.needsUpdate = true;
    bump.needsUpdate = true;
    rough.needsUpdate = true;

    // Modo sólido normal: Hormigón visto arquitectónico idéntico a referencia
    return new THREE.MeshStandardMaterial({
      map,
      bumpMap: bump,
      bumpScale: 0.08,
      roughnessMap: rough,
      roughness: 0.82,
      metalness: 0.04,
      color: isSelected ? '#ffffff' : '#f0f2f5',
    });
  }, [renderMode, isSelected]);

  // Material de Ladrillo / Albañilería Confinada (NCh2123)
  const brickMaterial = useMemo(() => {
    if (renderMode === 'xray') {
      return new THREE.MeshStandardMaterial({
        color: '#c2410c',
        roughness: 0.4,
        metalness: 0.1,
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
      });
    }

    const { brickTexture, brickBumpMap } = getConcreteTextures();
    const map = brickTexture.clone();
    const bump = brickBumpMap.clone();

    map.repeat.set(1, 1);
    bump.repeat.set(1, 1);
    map.needsUpdate = true;
    bump.needsUpdate = true;

    return new THREE.MeshStandardMaterial({
      map,
      bumpMap: bump,
      bumpScale: 0.12,
      roughness: 0.88,
      metalness: 0.02,
      color: isSelected ? '#fed7aa' : '#ffffff',
    });
  }, [renderMode, isSelected]);

  // Material de Carpinterías (Marcos de puertas y ventanas)
  const frameMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#18181b', // PVC Antracita / Negro
        roughness: 0.4,
        metalness: 0.2,
      }),
    []
  );

  const glassMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#bae6fd',
        transmission: 0.85,
        opacity: 0.4,
        transparent: true,
        roughness: 0.1,
        ior: 1.5,
      }),
    []
  );

  const tieHoleMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#3f3f46',
        roughness: 0.9,
      }),
    []
  );

  // Generación sustractiva de bloques de hormigón para dejar vanos limpios
  // Dividimos el muro en secciones verticales según los vanos
  const wallSlices = useMemo(() => {
    // Ordenar vanos por offset
    const sortedOps = [...openings].sort((a, b) => a.offsetAlongWall - b.offsetAlongWall);
    const slices: { pos: [number, number, number]; size: [number, number, number] }[] = [];

    let currentLeft = 0;

    sortedOps.forEach((op) => {
      const opLeft = Math.max(0, op.offsetAlongWall);
      const opRight = Math.min(wallLengthCm, op.offsetAlongWall + op.width);
      const opW = opRight - opLeft;

      // 1. Bloque a la izquierda del vano (altura completa)
      if (opLeft > currentLeft) {
        const segW = opLeft - currentLeft;
        const centerX = currentLeft + segW / 2 - wallLengthCm / 2;
        slices.push({
          pos: [centerX, wallHeightCm / 2, 0],
          size: [segW, wallHeightCm, wallThicknessCm],
        });
      }

      // 2. Bloque antepecho (debajo del vano si sillHeight > 0)
      if (op.sillHeight > 0) {
        const sillH = op.sillHeight;
        const centerX = opLeft + opW / 2 - wallLengthCm / 2;
        slices.push({
          pos: [centerX, sillH / 2, 0],
          size: [opW, sillH, wallThicknessCm],
        });
      }

      // 3. Bloque dintel (sobre el vano)
      const topY = op.sillHeight + op.height;
      if (topY < wallHeightCm) {
        const lintelH = wallHeightCm - topY;
        const centerX = opLeft + opW / 2 - wallLengthCm / 2;
        slices.push({
          pos: [centerX, topY + lintelH / 2, 0],
          size: [opW, lintelH, wallThicknessCm],
        });
      }

      currentLeft = Math.max(currentLeft, opRight);
    });

    // Segmento final después del último vano
    if (currentLeft < wallLengthCm) {
      const segW = wallLengthCm - currentLeft;
      const centerX = currentLeft + segW / 2 - wallLengthCm / 2;
      slices.push({
        pos: [centerX, wallHeightCm / 2, 0],
        size: [segW, wallHeightCm, wallThicknessCm],
      });
    }

    return slices;
  }, [openings, wallLengthCm, wallHeightCm, wallThicknessCm]);

  // Agujeros de pasamuros/agujas de encofrado (Tie Rod Holes) - alineados a la modulación real
  const tieHoles = useMemo(() => {
    if (wallSystemType !== 'hormigon_armado_total' || !showFormworkTieHoles || renderMode === 'rebar_only') return [];
    const holes: [number, number, number][] = [];
    const panelCount = Math.ceil(wallLengthCm / 120);

    for (let p = 0; p < panelCount; p++) {
      for (const colOff of [20, 100]) {
        const x = p * 120 + colOff;
        if (x > wallLengthCm - 5) continue;

        for (let baseH = 0; baseH < wallHeightCm; baseH += 240) {
          for (const rowOff of [35, 120, 205]) {
            const y = baseH + rowOff;
            if (y > wallHeightCm - 10) continue;

            // Comprobar que no esté en vano
            const inOp = openings.some(
              (op) =>
                x >= op.offsetAlongWall &&
                x <= op.offsetAlongWall + op.width &&
                y >= op.sillHeight &&
                y <= op.sillHeight + op.height
            );
            if (!inOp) {
              const posX = x - wallLengthCm / 2;
              holes.push([posX, y, wallThicknessCm / 2 + 0.1]);
              holes.push([posX, y, -wallThicknessCm / 2 - 0.1]);
            }
          }
        }
      }
    }
    return holes;
  }, [wallSystemType, showFormworkTieHoles, renderMode, wallLengthCm, wallHeightCm, wallThicknessCm, openings]);

  // Elementos de Confinamiento de Hormigón Armado para Albañilería Confinada (NCh2123 / NCh1928)
  const confinedElements = useMemo(() => {
    if (wallSystemType !== 'albanileria_confinada') return { pilares: [], cadenas: [] };
    return getWallConfinementElements(
      wallLengthCm,
      wallHeightCm,
      wallThicknessCm,
      openings,
      15, // Ancho pilar
      20  // Altura viga/cadena coronación y sobrecimiento
    );
  }, [wallSystemType, wallLengthCm, wallHeightCm, wallThicknessCm, openings]);

  // Geometrías UV del mundo para evitar distorsión de ladrillos u hormigón
  const sliceGeometries = useMemo(() => {
    const tileW = wallSystemType === 'albanileria_confinada' ? 120 : 240;
    const tileH = wallSystemType === 'albanileria_confinada' ? 120 : 240;
    return wallSlices.map((slice) => {
      const xStart = slice.pos[0] - slice.size[0] / 2 + wallLengthCm / 2;
      const yStart = slice.pos[1] - slice.size[1] / 2;
      return createWorldUvBoxGeometry(slice.size[0], slice.size[1], slice.size[2], xStart, yStart, tileW, tileH);
    });
  }, [wallSlices, wallLengthCm, wallSystemType]);

  // Selección de material base del paño según el sistema estructural
  const wallBaseMaterial = wallSystemType === 'albanileria_confinada' ? brickMaterial : concreteMaterial;

  return (
    <group onClick={(e) => { e.stopPropagation(); onSelectWall?.(); }}>
      {/* 1. Malla y Enfierradura Estructural 3D (Siempre visible o en Rayos X) */}
      {(renderMode === 'xray' || renderMode === 'rebar_only') && (
        <ConcreteRebar3D
          wallTarget={wallTarget}
          wallLengthCm={wallLengthCm}
          wallHeightCm={wallHeightCm}
          wallThicknessMm={wallThicknessMm}
          meshType={meshType}
          openings={openings}
          wallSystemType={wallSystemType}
          showRebarMesh={showRebarMesh}
          showEdgeReinforcement={showEdgeReinforcement}
          showOpeningReinforcement={showOpeningReinforcement}
          showSpacers={showSpacers}
        />
      )}

      {/* 2. Geometría Sólida / Translúcida del Muro */}
      {renderMode !== 'rebar_only' && (
        <group>
          {/* Paños de Muro con mapeo UV métrico proporcional continuo */}
          {wallSlices.map((slice, idx) => (
            <mesh
              key={`slice-${idx}`}
              position={slice.pos}
              geometry={sliceGeometries[idx]}
              material={wallBaseMaterial}
              castShadow
              receiveShadow
            />
          ))}

          {/* Pilares y Cadenas de Confinamiento de Hormigón Armado (Albañilería Confinada NCh2123) */}
          {wallSystemType === 'albanileria_confinada' && (
            <group>
              {confinedElements.pilares.map((col, idx) => (
                <mesh key={`pilar-${idx}`} position={col.pos} material={concreteMaterial} castShadow receiveShadow>
                  <boxGeometry args={col.size} />
                </mesh>
              ))}
              {confinedElements.cadenas.map((cad, idx) => (
                <mesh key={`cadena-${idx}`} position={cad.pos} material={concreteMaterial} castShadow receiveShadow>
                  <boxGeometry args={cad.size} />
                </mesh>
              ))}
            </group>
          )}

          {/* Tapones cónicos de agujas de encofrado (solo en H.A. total) */}
          {tieHoles.map((pos, idx) => (
            <mesh key={`tie-hole-${idx}`} position={pos} material={tieHoleMaterial} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[1.0, 1.2, 0.4, 12]} />
            </mesh>
          ))}
        </group>
      )}

      {/* 3. Marcos y Cristales de Vanos Arquitectónicos Interactivos (Drag & Drop) */}
      {renderMode !== 'rebar_only' &&
        openings.map((op) => (
          <ConcreteInteractiveOpening
            key={op.id}
            opening={op}
            wallTarget={wallTarget}
            wallLengthCm={wallLengthCm}
            wallHeightCm={wallHeightCm}
            wallThicknessCm={wallThicknessCm}
          />
        ))}
    </group>
  );
}
