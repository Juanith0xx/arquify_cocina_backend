import React, { useMemo } from 'react';
import * as THREE from 'three';
import {
  useConcreteHouseStore,
  ConcreteWallTarget,
  RoomBlock,
} from '../../store/concreteHouseStore';
import { ConcreteWall3D } from './ConcreteWall3D';
import { getConcreteTextures } from '../../utils/concreteTextures';
import { getSpanPillars } from '../../utils/concreteConfinement';

export function ConcreteHouse3D() {
  const {
    dimensions,
    wallThicknessMm,
    meshType,
    foundationType,
    slabType,
    wallSystemType = 'hormigon_armado_total',
    mezzanineSystemType = 'losa_hormigon_armado',
    roofStructureType = 'dos_aguas_hormigon',
    renderMode,
    openings,
    interiorWalls,
    roomBlocks = [],
    showRebarMesh,
    showEdgeReinforcement,
    showOpeningReinforcement,
    showSpacers,
    showRoof,
    showFoundation,
    showFormworkTieHoles,
    showPergola,
    pergolaWidthCm,
    pergolaLengthCm,
    pergolaHeightCm,
    showBarbecueCounter,
    hasCentralPatio,
    centralPatioOffsetCm,
    centralPatioLengthCm,
    selectedWall,
    setSelectedWall,
    setSelectedOpeningId,
  } = useConcreteHouseStore();

  const {
    width: widthCm,
    length: lengthCm,
    wallHeight: wallHeightCm,
    levels,
    overhangCm,
    roofRidgeHeightCm = 175,
    roofType = 'dos_aguas_hormigon',
  } = dimensions;
  const wallThicknessCm = wallThicknessMm / 10;
  const safeRidgeH = Math.max(80, roofRidgeHeightCm || 175);
  const effectivePatio = Boolean(hasCentralPatio && widthCm >= 450 && lengthCm >= 1200);

  // Filtrar vanos por muro
  const frontOpenings = useMemo(() => openings.filter((o) => o.wall === 'front'), [openings]);
  const backOpenings = useMemo(() => openings.filter((o) => o.wall === 'back'), [openings]);
  const leftOpenings = useMemo(() => openings.filter((o) => o.wall === 'left'), [openings]);
  const rightOpenings = useMemo(() => openings.filter((o) => o.wall === 'right'), [openings]);

  // Texturas y Materiales
  const { brickTexture, brickBumpMap, timberTexture } = useMemo(() => getConcreteTextures(), []);

  // Material de Ladrillo para Muros Interiores en Albañilería
  const brickMat = useMemo(() => {
    if (renderMode === 'xray') {
      return new THREE.MeshStandardMaterial({
        color: '#c2410c',
        roughness: 0.4,
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
      });
    }
    const map = brickTexture.clone();
    const bump = brickBumpMap.clone();
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    bump.wrapS = THREE.RepeatWrapping;
    bump.wrapT = THREE.RepeatWrapping;
    map.repeat.set(Math.max(1, widthCm / 120), Math.max(1, wallHeightCm / 120));
    bump.repeat.set(Math.max(1, widthCm / 120), Math.max(1, wallHeightCm / 120));
    map.needsUpdate = true;
    bump.needsUpdate = true;
    return new THREE.MeshStandardMaterial({
      map,
      bumpMap: bump,
      bumpScale: 0.1,
      roughness: 0.88,
      metalness: 0.02,
    });
  }, [renderMode, brickTexture, brickBumpMap, widthCm, wallHeightCm]);

  // Material de Madera para Vigas de Entrepiso y Cerchas de Techumbre
  const timberStructureMat = useMemo(() => {
    if (renderMode === 'xray') {
      return new THREE.MeshStandardMaterial({
        color: '#d97706',
        roughness: 0.4,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
      });
    }
    const map = timberTexture.clone();
    map.repeat.set(1, 1);
    map.needsUpdate = true;
    return new THREE.MeshStandardMaterial({
      map,
      roughness: 0.75,
      metalness: 0.05,
      color: '#c29b68',
    });
  }, [renderMode, timberTexture]);

  // Materiales de Fundación, Losa y Techo
  const concreteMat = useMemo(() => {
    if (renderMode === 'xray') {
      return new THREE.MeshStandardMaterial({
        color: '#94a3b8',
        roughness: 0.3,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
      });
    }
    if (renderMode === 'formwork') {
      return new THREE.MeshStandardMaterial({
        color: '#ca8a04',
        roughness: 0.5,
      });
    }

    const { slabTexture, slabBumpMap, slabRoughnessMap } = getConcreteTextures();
    const map = slabTexture.clone();
    const bump = slabBumpMap.clone();
    const rough = slabRoughnessMap.clone();

    const repX = Math.max(1, widthCm / 200);
    const repZ = Math.max(1, lengthCm / 200);
    map.repeat.set(repX, repZ);
    bump.repeat.set(repX, repZ);
    rough.repeat.set(repX, repZ);
    map.needsUpdate = true;
    bump.needsUpdate = true;
    rough.needsUpdate = true;

    return new THREE.MeshStandardMaterial({
      map,
      bumpMap: bump,
      bumpScale: 0.05,
      roughnessMap: rough,
      roughness: 0.85,
      metalness: 0.03,
      color: '#edf0f4',
    });
  }, [renderMode, widthCm, lengthCm]);

  const ceilingConcreteMat = useMemo(() => {
    if (renderMode === 'xray') {
      return new THREE.MeshStandardMaterial({
        color: '#94a3b8',
        roughness: 0.3,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
      });
    }
    if (renderMode === 'formwork') {
      return new THREE.MeshStandardMaterial({
        color: '#ca8a04',
        roughness: 0.5,
      });
    }

    const { ceilingTexture, wallBumpMap } = getConcreteTextures();
    const map = ceilingTexture.clone();
    const bump = wallBumpMap.clone();

    const repX = Math.max(1, widthCm / 240);
    const repZ = Math.max(1, lengthCm / 240);
    map.repeat.set(repX, repZ);
    bump.repeat.set(repX, repZ);
    map.needsUpdate = true;
    bump.needsUpdate = true;

    return new THREE.MeshStandardMaterial({
      map,
      bumpMap: bump,
      bumpScale: 0.04,
      roughness: 0.88,
      metalness: 0.02,
      color: '#f1f3f7',
    });
  }, [renderMode, widthCm, lengthCm]);

  const leanConcreteMat = useMemo(() => {
    const { leanConcreteTexture } = getConcreteTextures();
    return new THREE.MeshStandardMaterial({
      map: leanConcreteTexture,
      roughness: 0.95,
      metalness: 0.02,
      color: '#e4e7eb',
    });
  }, []);

  const steelStructureMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#1e2024',
        roughness: 0.35,
        metalness: 0.7,
      }),
    []
  );

  const timberSlatMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#a07855', // Madera tratada / lapacho / pino impregnado
        roughness: 0.7,
        metalness: 0.05,
      }),
    []
  );

  const barbecueBrickMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#b45309', // Ladrillo refractario
        roughness: 0.85,
      }),
    []
  );

  const roofMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#27272a',
        roughness: 0.5,
      }),
    []
  );

  const rebarFoundationMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#3b82f6',
        metalness: 0.85,
        roughness: 0.3,
      }),
    []
  );

  // Geometría del hastial triangular (Gable / Tímpano) para dos aguas
  const gableGeometry = useMemo(() => {
    const halfW = widthCm / 2;
    const ridgeH = safeRidgeH;
    const shape = new THREE.Shape();
    shape.moveTo(-halfW, 0);
    shape.lineTo(halfW, 0);
    shape.lineTo(0, ridgeH);
    shape.closePath();

    const extrudeSettings = {
      depth: wallThicknessCm,
      bevelEnabled: false,
    };
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, [widthCm, safeRidgeH, wallThicknessCm]);

  const masonryGableGeometry = useMemo(() => {
    const halfW = widthCm / 2;
    const ridgeH = safeRidgeH;
    const shape = new THREE.Shape();
    shape.moveTo(-halfW, 0);
    shape.lineTo(halfW, 0);
    shape.lineTo(0, ridgeH);
    shape.closePath();

    const extrudeSettings = {
      depth: 14,
      bevelEnabled: false,
    };
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, [widthCm, safeRidgeH]);

  // Cálculo de pendiente y dimensiones de la losa inclinada
  const { roofAngle, roofSlopeLength } = useMemo(() => {
    const halfW = widthCm / 2 + overhangCm;
    const ridgeH = safeRidgeH;
    const slopeLen = Math.sqrt(halfW * halfW + ridgeH * ridgeH);
    const angle = Math.atan2(ridgeH, halfW);
    return { roofAngle: angle, roofSlopeLength: slopeLen };
  }, [widthCm, overhangCm, safeRidgeH]);

  const isMasonryGlobal = wallSystemType === 'albanileria_confinada';
  const effectiveGableThickness = isMasonryGlobal ? 14 : wallThicknessCm;

  const renderGable = (pos: [number, number, number], keySuffix: string) => {
    const halfW = widthCm / 2;
    const mat = isMasonryGlobal ? brickMat : ceilingConcreteMat;
    const geom = isMasonryGlobal ? masonryGableGeometry : gableGeometry;

    return (
      <group key={`gable-${keySuffix}`} position={pos}>
        {/* Paño Triangular del Tímpano/Frontón */}
        <mesh
          geometry={geom}
          material={mat}
          castShadow
          receiveShadow
        />

        {/* Si es Albañilería Confinada: Marco Estructural de Confinamiento H20 per NCh2123 */}
        {isMasonryGlobal && renderMode !== 'rebar_only' && (
          <group position={[0, 0, effectiveGableThickness / 2]}>
            {/* 1. Cadena Basal Horizontal de Coronación */}
            <mesh position={[0, 7.5, 0]} material={concreteMat} castShadow receiveShadow>
              <boxGeometry args={[widthCm, 15, effectiveGableThickness + 0.6]} />
            </mesh>

            {/* 2. Pilar Central de Cumbrera (Pilar Vertical H.A.) */}
            <mesh position={[0, safeRidgeH / 2, 0]} material={concreteMat} castShadow receiveShadow>
              <boxGeometry args={[15, safeRidgeH, effectiveGableThickness + 0.6]} />
            </mesh>

            {/* 3. Cadenas Inclinadas de Coronación (Dos Aguas) */}
            <mesh
              position={[-halfW / 2, safeRidgeH / 2, 0]}
              rotation={[0, 0, roofAngle]}
              material={concreteMat}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[roofSlopeLength, 15, effectiveGableThickness + 0.6]} />
            </mesh>
            <mesh
              position={[halfW / 2, safeRidgeH / 2, 0]}
              rotation={[0, 0, -roofAngle]}
              material={concreteMat}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[roofSlopeLength, 15, effectiveGableThickness + 0.6]} />
            </mesh>

            {/* 4. Pilaretes Laterales en los Extremos */}
            <mesh position={[-halfW + 7.5, 15, 0]} material={concreteMat} castShadow receiveShadow>
              <boxGeometry args={[15, 30, effectiveGableThickness + 0.6]} />
            </mesh>
            <mesh position={[halfW - 7.5, 15, 0]} material={concreteMat} castShadow receiveShadow>
              <boxGeometry args={[15, 30, effectiveGableThickness + 0.6]} />
            </mesh>
          </group>
        )}
      </group>
    );
  };

  return (
    <group position={[0, 0, 0]}>
      {/* 1. FUNDACIONES */}
      {showFoundation && renderMode !== 'rebar_only' && (
        <group position={[0, 0, 0]}>
          {foundationType === 'losa_fundacion_suples' ? (
            <group>
              {/* Losa de Fundación e=15cm */}
              <mesh position={[0, -7.5, 0]} material={concreteMat} receiveShadow>
                <boxGeometry args={[widthCm, 15, lengthCm]} />
              </mesh>

              {/* Viga de borde perimetral */}
              <mesh position={[0, -20, 0]} material={concreteMat}>
                <boxGeometry args={[widthCm + 20, 15, lengthCm + 20]} />
              </mesh>

              {/* Emplantillado e=5cm */}
              <mesh position={[0, -30, 0]} material={leanConcreteMat} receiveShadow>
                <boxGeometry args={[widthCm + 40, 5, lengthCm + 40]} />
              </mesh>

              {/* Losa de Terraza para Pérgola si está activa */}
              {showPergola && (
                <mesh
                  position={[widthCm / 2 + pergolaWidthCm / 2, -5, -lengthCm / 2 + pergolaLengthCm / 2 + 100]}
                  material={concreteMat}
                  receiveShadow
                >
                  <boxGeometry args={[pergolaWidthCm, 10, pergolaLengthCm + 40]} />
                </mesh>
              )}
            </group>
          ) : (
            <group>
              {/* Radier interior e=10cm */}
              <mesh position={[0, -5, 0]} material={concreteMat} receiveShadow>
                <boxGeometry args={[widthCm - wallThicknessCm * 2, 10, lengthCm - wallThicknessCm * 2]} />
              </mesh>

              {/* Cimiento corrido perimetral */}
              <mesh position={[0, -35, lengthCm / 2 - 20]} material={concreteMat}>
                <boxGeometry args={[widthCm, 60, 40]} />
              </mesh>
              <mesh position={[0, -35, -lengthCm / 2 + 20]} material={concreteMat}>
                <boxGeometry args={[widthCm, 60, 40]} />
              </mesh>
              <mesh position={[-widthCm / 2 + 20, -35, 0]} material={concreteMat}>
                <boxGeometry args={[40, 60, lengthCm - 80]} />
              </mesh>
              <mesh position={[widthCm / 2 - 20, -35, 0]} material={concreteMat}>
                <boxGeometry args={[40, 60, lengthCm - 80]} />
              </mesh>

              {/* Emplantillado 5cm */}
              <mesh position={[0, -67.5, 0]} material={leanConcreteMat} receiveShadow>
                <boxGeometry args={[widthCm + 20, 5, lengthCm + 20]} />
              </mesh>
            </group>
          )}
        </group>
      )}

      {/* Armadura 3D en Fundación en modo Rayos X */}
      {(renderMode === 'xray' || renderMode === 'rebar_only') && showFoundation && (
        <group position={[0, -10, 0]}>
          {Array.from({ length: Math.floor(widthCm / 25) }).map((_, i) => (
            <mesh key={`rebar-found-x-${i}`} position={[-widthCm / 2 + (i + 1) * 25, 0, 0]} material={rebarFoundationMat}>
              <boxGeometry args={[0.8, 0.8, lengthCm - 10]} />
            </mesh>
          ))}
          {Array.from({ length: Math.floor(lengthCm / 25) }).map((_, i) => (
            <mesh key={`rebar-found-z-${i}`} position={[0, 0.8, -lengthCm / 2 + (i + 1) * 25]} material={rebarFoundationMat}>
              <boxGeometry args={[widthCm - 10, 0.8, 0.8]} />
            </mesh>
          ))}
        </group>
      )}

      {/* 2. MUROS (Nivel 1) */}
      <group position={[0, 0, 0]}>
        {roomBlocks && roomBlocks.length > 0 ? (
          /* Renderizado dinámico exacto según el plano 2D de recintos (roomBlocks) */
          <group>
            {roomBlocks.map((block) => {
              const bWidth = block.width;
              const bLength = block.length;
              // b.x y b.z en el plano 2D van de 0 a widthCm / lengthCm
              // En Three.js el centro de la vivienda está en (0, 0, 0), por lo que X va de -widthCm/2 a +widthCm/2 y Z va de -lengthCm/2 a +lengthCm/2
              const bCenterX = block.x + bWidth / 2 - widthCm / 2;
              const bCenterZ = block.z + bLength / 2 - lengthCm / 2;
              const isOutdoor = block.category === 'patio' || block.category === 'terrace';
              const blockWallH = block.category === 'patio' ? 120 : wallHeightCm;
              const isMasonry = wallSystemType === 'albanileria_confinada' || block.wallType === 'masonry_140';
              const isDrywall = !isMasonry && block.wallType === 'drywall_90';
              const blockMat = isMasonry ? brickMat : isDrywall ? ceilingConcreteMat : concreteMat;
              const bWallThick = isMasonry ? 14 : block.wallType === 'concrete_200' ? 20 : isDrywall ? 9 : wallThicknessCm;
              const pillarSize = isMasonry ? 15 : 0;

              return (
                <group key={block.id} position={[bCenterX, 0, bCenterZ]}>
                  {/* Losa de piso del recinto */}
                  {renderMode !== 'rebar_only' && (
                    <mesh position={[0, -2.5, 0]} material={isOutdoor ? leanConcreteMat : concreteMat} receiveShadow>
                      <boxGeometry args={[bWidth, 5, bLength]} />
                    </mesh>
                  )}

                  {/* 4 Muros perimetrales del recinto */}
                  {/* Muro Frontal (Sur, Z = +bLength/2) */}
                  <mesh
                    position={[0, blockWallH / 2, bLength / 2 - bWallThick / 2]}
                    material={blockMat}
                    castShadow
                    receiveShadow
                  >
                    <boxGeometry args={[bWidth, blockWallH, bWallThick]} />
                  </mesh>

                  {/* Muro Posterior (Norte, Z = -bLength/2) */}
                  <mesh
                    position={[0, blockWallH / 2, -bLength / 2 + bWallThick / 2]}
                    material={blockMat}
                    castShadow
                    receiveShadow
                  >
                    <boxGeometry args={[bWidth, blockWallH, bWallThick]} />
                  </mesh>

                  {/* Muro Lateral Izquierdo (Oeste, X = -bWidth/2) */}
                  <mesh
                    position={[-bWidth / 2 + bWallThick / 2, blockWallH / 2, 0]}
                    material={blockMat}
                    castShadow
                    receiveShadow
                  >
                    <boxGeometry args={[bWallThick, blockWallH, bLength - bWallThick * 2]} />
                  </mesh>

                  {/* Muro Lateral Derecho (Este, X = +bWidth/2) */}
                  <mesh
                    position={[bWidth / 2 - bWallThick / 2, blockWallH / 2, 0]}
                    material={blockMat}
                    castShadow
                    receiveShadow
                  >
                    <boxGeometry args={[bWallThick, blockWallH, bLength - bWallThick * 2]} />
                  </mesh>

                  {/* En Albañilería Confinada: Sistema Completo de Confinamiento H20 per NCh2123 / NCh1928 */}
                  {renderMode !== 'rebar_only' && isMasonry && (
                    <group>
                      {/* 1. Pilares Verticales de Confinamiento (Esquinas + Intermedios <= 2.80m) */}
                      {(() => {
                        const xPillars = getSpanPillars(bWidth, pillarSize, 280);
                        const zPillars = getSpanPillars(bLength, pillarSize, 280);
                        const intermediateZ = zPillars.slice(1, -1);

                        return (
                          <group>
                            {/* Pilares a lo largo del Muro Frontal (Sur) */}
                            {xPillars.map((px, idx) => (
                              <mesh
                                key={`col-f-${idx}`}
                                position={[px, blockWallH / 2, bLength / 2 - bWallThick / 2]}
                                material={concreteMat}
                                castShadow
                                receiveShadow
                              >
                                <boxGeometry args={[pillarSize, blockWallH, bWallThick + 0.6]} />
                              </mesh>
                            ))}

                            {/* Pilares a lo largo del Muro Posterior (Norte) */}
                            {xPillars.map((px, idx) => (
                              <mesh
                                key={`col-b-${idx}`}
                                position={[px, blockWallH / 2, -bLength / 2 + bWallThick / 2]}
                                material={concreteMat}
                                castShadow
                                receiveShadow
                              >
                                <boxGeometry args={[pillarSize, blockWallH, bWallThick + 0.6]} />
                              </mesh>
                            ))}

                            {/* Pilares Intermedios Muro Lateral Izquierdo (Oeste) */}
                            {intermediateZ.map((pz, idx) => (
                              <mesh
                                key={`col-l-${idx}`}
                                position={[-bWidth / 2 + bWallThick / 2, blockWallH / 2, pz]}
                                material={concreteMat}
                                castShadow
                                receiveShadow
                              >
                                <boxGeometry args={[bWallThick + 0.6, blockWallH, pillarSize]} />
                              </mesh>
                            ))}

                            {/* Pilares Intermedios Muro Lateral Derecho (Este) */}
                            {intermediateZ.map((pz, idx) => (
                              <mesh
                                key={`col-r-${idx}`}
                                position={[bWidth / 2 - bWallThick / 2, blockWallH / 2, pz]}
                                material={concreteMat}
                                castShadow
                                receiveShadow
                              >
                                <boxGeometry args={[bWallThick + 0.6, blockWallH, pillarSize]} />
                              </mesh>
                            ))}
                          </group>
                        );
                      })()}

                      {/* 2. Cadena de Sobrecimiento / Fundación Inferior (H = 20 cm) */}
                      <group>
                        <mesh position={[0, 10, bLength / 2 - bWallThick / 2]} material={concreteMat} castShadow receiveShadow>
                          <boxGeometry args={[bWidth, 20, bWallThick + 0.6]} />
                        </mesh>
                        <mesh position={[0, 10, -bLength / 2 + bWallThick / 2]} material={concreteMat} castShadow receiveShadow>
                          <boxGeometry args={[bWidth, 20, bWallThick + 0.6]} />
                        </mesh>
                        <mesh position={[-bWidth / 2 + bWallThick / 2, 10, 0]} material={concreteMat} castShadow receiveShadow>
                          <boxGeometry args={[bWallThick + 0.6, 20, bLength - bWallThick * 2]} />
                        </mesh>
                        <mesh position={[bWidth / 2 - bWallThick / 2, 10, 0]} material={concreteMat} castShadow receiveShadow>
                          <boxGeometry args={[bWallThick + 0.6, 20, bLength - bWallThick * 2]} />
                        </mesh>
                      </group>

                      {/* 3. Cadena Intermedia / Dintel (H = 15 cm a Y = 210 cm si blockWallH >= 260 cm) */}
                      {blockWallH >= 260 && (
                        <group>
                          <mesh position={[0, 210, bLength / 2 - bWallThick / 2]} material={concreteMat} castShadow receiveShadow>
                            <boxGeometry args={[bWidth, 15, bWallThick + 0.6]} />
                          </mesh>
                          <mesh position={[0, 210, -bLength / 2 + bWallThick / 2]} material={concreteMat} castShadow receiveShadow>
                            <boxGeometry args={[bWidth, 15, bWallThick + 0.6]} />
                          </mesh>
                          <mesh position={[-bWidth / 2 + bWallThick / 2, 210, 0]} material={concreteMat} castShadow receiveShadow>
                            <boxGeometry args={[bWallThick + 0.6, 15, bLength - bWallThick * 2]} />
                          </mesh>
                          <mesh position={[bWidth / 2 - bWallThick / 2, 210, 0]} material={concreteMat} castShadow receiveShadow>
                            <boxGeometry args={[bWallThick + 0.6, 15, bLength - bWallThick * 2]} />
                          </mesh>
                        </group>
                      )}

                      {/* 4. Cadena de Coronación Superior (H = 20 cm) */}
                      <group>
                        <mesh position={[0, blockWallH - 10, bLength / 2 - bWallThick / 2]} material={concreteMat} castShadow receiveShadow>
                          <boxGeometry args={[bWidth, 20, bWallThick + 0.6]} />
                        </mesh>
                        <mesh position={[0, blockWallH - 10, -bLength / 2 + bWallThick / 2]} material={concreteMat} castShadow receiveShadow>
                          <boxGeometry args={[bWidth, 20, bWallThick + 0.6]} />
                        </mesh>
                        <mesh position={[-bWidth / 2 + bWallThick / 2, blockWallH - 10, 0]} material={concreteMat} castShadow receiveShadow>
                          <boxGeometry args={[bWallThick + 0.6, 20, bLength - bWallThick * 2]} />
                        </mesh>
                        <mesh position={[bWidth / 2 - bWallThick / 2, blockWallH - 10, 0]} material={concreteMat} castShadow receiveShadow>
                          <boxGeometry args={[bWallThick + 0.6, 20, bLength - bWallThick * 2]} />
                        </mesh>
                      </group>
                    </group>
                  )}

                  {/* Viga Corona / Losa de cielo para recintos de Hormigón Armado Total */}
                  {renderMode !== 'rebar_only' && !isMasonry && !isOutdoor && block.hasSlabCover && (
                    <mesh position={[0, blockWallH - 10, 0]} material={concreteMat}>
                      <boxGeometry args={[bWidth, 20, bLength]} />
                    </mesh>
                  )}
                </group>
              );
            })}
          </group>
        ) : (
          /* Renderizado paramétrico estándar monolítico */
          <group>
            {/* Front Wall (Z = +length/2) */}
            <group position={[0, 0, lengthCm / 2 - wallThicknessCm / 2]}>
              <ConcreteWall3D
                wallTarget="front"
                wallLengthCm={widthCm}
                wallHeightCm={wallHeightCm}
                wallThicknessMm={wallThicknessMm}
                meshType={meshType}
                renderMode={renderMode}
                openings={frontOpenings}
                wallSystemType={wallSystemType}
                showRebarMesh={showRebarMesh}
                showEdgeReinforcement={showEdgeReinforcement}
                showOpeningReinforcement={showOpeningReinforcement}
                showSpacers={showSpacers}
                showFormworkTieHoles={showFormworkTieHoles}
                isSelected={selectedWall === 'front'}
                onSelectWall={() => setSelectedWall('front')}
                onSelectOpening={setSelectedOpeningId}
              />
              {/* Marquesina / Visera de acceso principal */}
              {renderMode !== 'rebar_only' && (
                <group position={[120 / 2 + 20 - widthCm / 2, 245, wallThicknessCm / 2 + 50]}>
                  <mesh material={steelStructureMat}>
                    <boxGeometry args={[180, 8, 100]} />
                  </mesh>
                  {/* Tensores metálicos */}
                  <mesh position={[-80, 30, -40]} rotation={[0.6, 0, 0]} material={steelStructureMat}>
                    <cylinderGeometry args={[0.6, 0.6, 70, 8]} />
                  </mesh>
                  <mesh position={[80, 30, -40]} rotation={[0.6, 0, 0]} material={steelStructureMat}>
                    <cylinderGeometry args={[0.6, 0.6, 70, 8]} />
                  </mesh>
                </group>
              )}
            </group>

            {/* Back Wall (Z = -length/2) */}
            <group position={[0, 0, -lengthCm / 2 + wallThicknessCm / 2]} rotation={[0, Math.PI, 0]}>
              <ConcreteWall3D
                wallTarget="back"
                wallLengthCm={widthCm}
                wallHeightCm={wallHeightCm}
                wallThicknessMm={wallThicknessMm}
                meshType={meshType}
                renderMode={renderMode}
                openings={backOpenings}
                wallSystemType={wallSystemType}
                showRebarMesh={showRebarMesh}
                showEdgeReinforcement={showEdgeReinforcement}
                showOpeningReinforcement={showOpeningReinforcement}
                showSpacers={showSpacers}
                showFormworkTieHoles={showFormworkTieHoles}
                isSelected={selectedWall === 'back'}
                onSelectWall={() => setSelectedWall('back')}
                onSelectOpening={setSelectedOpeningId}
              />
            </group>

            {/* Left Wall (X = -width/2) */}
            <group position={[-widthCm / 2 + wallThicknessCm / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
              <ConcreteWall3D
                wallTarget="left"
                wallLengthCm={lengthCm - wallThicknessCm * 2}
                wallHeightCm={wallHeightCm}
                wallThicknessMm={wallThicknessMm}
                meshType={meshType}
                renderMode={renderMode}
                openings={leftOpenings}
                wallSystemType={wallSystemType}
                showRebarMesh={showRebarMesh}
                showEdgeReinforcement={showEdgeReinforcement}
                showOpeningReinforcement={showOpeningReinforcement}
                showSpacers={showSpacers}
                showFormworkTieHoles={showFormworkTieHoles}
                isSelected={selectedWall === 'left'}
                onSelectWall={() => setSelectedWall('left')}
                onSelectOpening={setSelectedOpeningId}
              />
            </group>

            {/* Right Wall (X = +width/2) */}
            <group position={[widthCm / 2 - wallThicknessCm / 2, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
              <ConcreteWall3D
                wallTarget="right"
                wallLengthCm={lengthCm - wallThicknessCm * 2}
                wallHeightCm={wallHeightCm}
                wallThicknessMm={wallThicknessMm}
                meshType={meshType}
                renderMode={renderMode}
                openings={rightOpenings}
                wallSystemType={wallSystemType}
                showRebarMesh={showRebarMesh}
                showEdgeReinforcement={showEdgeReinforcement}
                showOpeningReinforcement={showOpeningReinforcement}
                showSpacers={showSpacers}
                showFormworkTieHoles={showFormworkTieHoles}
                isSelected={selectedWall === 'right'}
                onSelectWall={() => setSelectedWall('right')}
                onSelectOpening={setSelectedOpeningId}
              />
            </group>
          </group>
        )}

        {/* Muros Interiores (solo en modo paramétrico estándar cuando no hay plano de recintos 2D) */}
        {renderMode !== 'rebar_only' &&
          (!roomBlocks || roomBlocks.length === 0) &&
          interiorWalls.map((iw) => {
            const wThickness = (iw.thicknessMm || 150) / 10;
            const mat = wallSystemType === 'albanileria_confinada' ? brickMat : ceilingConcreteMat;

            // Ancho del paño transversal ajustado al ancho libre interior
            const spanX = widthCm - wallThicknessCm * 2;
            const rawZ = (iw.startZ !== undefined ? iw.startZ : lengthCm / 2) - lengthCm / 2;

            // Clamping defensivo para garantizar que nunca sobresalga del perímetro
            const maxZ = lengthCm / 2 - wallThicknessCm - wThickness / 2;
            const minZ = -lengthCm / 2 + wallThicknessCm + wThickness / 2;
            const zPos = Math.max(minZ, Math.min(maxZ, rawZ));

            return (
              <mesh key={iw.id} position={[0, wallHeightCm / 2, zPos]} material={mat} castShadow>
                <boxGeometry args={[spanX, wallHeightCm, wThickness]} />
              </mesh>
            );
          })}
      </group>

      {/* 2.5. SISTEMA DE ENTREPISO Y NIVEL 2 (Si levels === 2) */}
      {levels === 2 && (
        <group position={[0, wallHeightCm, 0]}>
          {/* Estructura de Entrepiso (Losa H.A. vs Envigado Madera) */}
          {renderMode !== 'rebar_only' && (
            <group position={[0, 0, 0]}>
              {mezzanineSystemType === 'losa_hormigon_armado' ? (
                /* Losa de Hormigón Armado e=12cm */
                <mesh position={[0, 6, 0]} material={ceilingConcreteMat} castShadow receiveShadow>
                  <boxGeometry args={[widthCm, 12, lengthCm]} />
                </mesh>
              ) : (
                /* Entrepiso Liviano de Madera: Vigas 3x8" @ 40cm + Placa Colaborante */
                <group>
                  {/* Vigas de Madera Transversales */}
                  {Array.from({ length: Math.floor(lengthCm / 40) + 1 }).map((_, idx) => {
                    const zPos = -lengthCm / 2 + idx * 40;
                    return (
                      <mesh key={`joist-${idx}`} position={[0, 10, zPos]} material={timberStructureMat} castShadow>
                        <boxGeometry args={[widthCm - wallThicknessCm * 2, 20, 7.5]} />
                      </mesh>
                    );
                  })}
                  {/* Vigas Maestras / Soleras de Borde */}
                  <mesh position={[-widthCm / 2 + wallThicknessCm, 10, 0]} material={timberStructureMat}>
                    <boxGeometry args={[10, 20, lengthCm]} />
                  </mesh>
                  <mesh position={[widthCm / 2 - wallThicknessCm, 10, 0]} material={timberStructureMat}>
                    <boxGeometry args={[10, 20, lengthCm]} />
                  </mesh>
                  {/* Tablero Estructural de Piso / Placa e=2.5cm */}
                  <mesh position={[0, 21.25, 0]} material={timberSlatMat} receiveShadow>
                    <boxGeometry args={[widthCm, 2.5, lengthCm]} />
                  </mesh>
                </group>
              )}
            </group>
          )}

          {/* Muros del Nivel 2 */}
          <group position={[0, mezzanineSystemType === 'losa_hormigon_armado' ? 12 : 22.5, 0]}>
            {/* Front Wall N2 */}
            <group position={[0, 0, lengthCm / 2 - wallThicknessCm / 2]}>
              <ConcreteWall3D
                wallTarget="front"
                wallLengthCm={widthCm}
                wallHeightCm={wallHeightCm}
                wallThicknessMm={wallThicknessMm}
                meshType={meshType}
                renderMode={renderMode}
                openings={[]}
                wallSystemType={wallSystemType}
                showRebarMesh={showRebarMesh}
                showEdgeReinforcement={showEdgeReinforcement}
                showOpeningReinforcement={showOpeningReinforcement}
                showSpacers={showSpacers}
                showFormworkTieHoles={showFormworkTieHoles}
              />
            </group>
            {/* Back Wall N2 */}
            <group position={[0, 0, -lengthCm / 2 + wallThicknessCm / 2]} rotation={[0, Math.PI, 0]}>
              <ConcreteWall3D
                wallTarget="back"
                wallLengthCm={widthCm}
                wallHeightCm={wallHeightCm}
                wallThicknessMm={wallThicknessMm}
                meshType={meshType}
                renderMode={renderMode}
                openings={[]}
                wallSystemType={wallSystemType}
                showRebarMesh={showRebarMesh}
                showEdgeReinforcement={showEdgeReinforcement}
                showOpeningReinforcement={showOpeningReinforcement}
                showSpacers={showSpacers}
                showFormworkTieHoles={showFormworkTieHoles}
              />
            </group>
            {/* Left Wall N2 */}
            <group position={[-widthCm / 2 + wallThicknessCm / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
              <ConcreteWall3D
                wallTarget="left"
                wallLengthCm={lengthCm - wallThicknessCm * 2}
                wallHeightCm={wallHeightCm}
                wallThicknessMm={wallThicknessMm}
                meshType={meshType}
                renderMode={renderMode}
                openings={[]}
                wallSystemType={wallSystemType}
                showRebarMesh={showRebarMesh}
                showEdgeReinforcement={showEdgeReinforcement}
                showOpeningReinforcement={showOpeningReinforcement}
                showSpacers={showSpacers}
                showFormworkTieHoles={showFormworkTieHoles}
              />
            </group>
            {/* Right Wall N2 */}
            <group position={[widthCm / 2 - wallThicknessCm / 2, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
              <ConcreteWall3D
                wallTarget="right"
                wallLengthCm={lengthCm - wallThicknessCm * 2}
                wallHeightCm={wallHeightCm}
                wallThicknessMm={wallThicknessMm}
                meshType={meshType}
                renderMode={renderMode}
                openings={[]}
                wallSystemType={wallSystemType}
                showRebarMesh={showRebarMesh}
                showEdgeReinforcement={showEdgeReinforcement}
                showOpeningReinforcement={showOpeningReinforcement}
                showSpacers={showSpacers}
                showFormworkTieHoles={showFormworkTieHoles}
              />
            </group>
          </group>
        </group>
      )}

      {/* 3. PÉRGOLA EXTERIOR & ASADOR / QUINCHO (Casa TT) */}
      {showPergola && renderMode !== 'rebar_only' && (
        <group position={[widthCm / 2, 0, -lengthCm / 2 + 100]}>
          {/* Columnas Metálicas de la Pérgola */}
          {[0, pergolaLengthCm / 2, pergolaLengthCm].map((zOffset, idx) => (
            <mesh
              key={`pergola-col-${idx}`}
              position={[pergolaWidthCm, pergolaHeightCm / 2, zOffset]}
              material={steelStructureMat}
              castShadow
            >
              <boxGeometry args={[12, pergolaHeightCm, 12]} />
            </mesh>
          ))}

          {/* Viga Longitudinal Principal */}
          <mesh
            position={[pergolaWidthCm, pergolaHeightCm, pergolaLengthCm / 2]}
            material={steelStructureMat}
            castShadow
          >
            <boxGeometry args={[14, 20, pergolaLengthCm + 30]} />
          </mesh>

          {/* Viga de Anclaje al Muro */}
          <mesh
            position={[0, pergolaHeightCm, pergolaLengthCm / 2]}
            material={steelStructureMat}
          >
            <boxGeometry args={[8, 16, pergolaLengthCm]} />
          </mesh>

          {/* Tirantes Transversales */}
          {Array.from({ length: 9 }).map((_, i) => (
            <mesh
              key={`pergola-beam-${i}`}
              position={[pergolaWidthCm / 2, pergolaHeightCm + 8, (i * pergolaLengthCm) / 8]}
              material={steelStructureMat}
              castShadow
            >
              <boxGeometry args={[pergolaWidthCm + 20, 10, 8]} />
            </mesh>
          ))}

          {/* Listones de Sombra de Madera (Louvers) */}
          {Array.from({ length: 28 }).map((_, i) => (
            <mesh
              key={`pergola-slat-${i}`}
              position={[pergolaWidthCm / 2, pergolaHeightCm + 15, (i * pergolaLengthCm) / 27]}
              material={timberSlatMat}
              castShadow
            >
              <boxGeometry args={[pergolaWidthCm, 4, 3]} />
            </mesh>
          ))}

          {/* Mueble / Asador y Mesada de Hormigón Exterior */}
          {showBarbecueCounter && (
            <group position={[pergolaWidthCm - 45, 0, pergolaLengthCm - 160]}>
              {/* Mesada de hormigón visto */}
              <mesh position={[0, 45, 0]} material={concreteMat} castShadow receiveShadow>
                <boxGeometry args={[80, 90, 320]} />
              </mesh>
              {/* Nicho de fuego con ladrillo refractario */}
              <mesh position={[5, 100, 60]} material={barbecueBrickMat} castShadow>
                <boxGeometry args={[70, 40, 120]} />
              </mesh>
              {/* Campana y Chimenea metálica negra */}
              <mesh position={[5, 140, 60]} material={steelStructureMat} castShadow>
                <boxGeometry args={[74, 50, 124]} />
              </mesh>
              <mesh position={[5, 200, 60]} material={steelStructureMat}>
                <cylinderGeometry args={[14, 14, 80, 16]} />
              </mesh>
            </group>
          )}
        </group>
      )}

      {/* 4. CUBIERTA SUPERIOR & HASTIALES (Paso 3: Dos Aguas H.A., Losa Plana H.A., o Techumbre Liviana Madera) */}
      {showRoof && renderMode !== 'rebar_only' && (
        <group position={[0, wallHeightCm * levels + (levels === 2 ? (mezzanineSystemType === 'losa_hormigon_armado' ? 12 : 22.5) : 0), 0]}>
          {(dimensions.roofType === 'dos_aguas_hormigon' || roofStructureType === 'dos_aguas_hormigon') && dimensions.roofType !== 'losa_plana' ? (
            <group>
              {/* 1. Hastial Frontal Triangular (Sur) */}
              {renderGable([0, 0, lengthCm / 2 - effectiveGableThickness], 'front')}

              {/* 2. Hastial Posterior Triangular (Norte) */}
              {renderGable([0, 0, -lengthCm / 2], 'back')}

              {/* 3 y 4. Hastiales Interiores hacia el Patio Central (Casa TT) */}
              {effectivePatio && (() => {
                const safePatioOffset = Math.min(Math.max(200, centralPatioOffsetCm), lengthCm - 350);
                const safePatioLen = Math.min(Math.max(150, centralPatioLengthCm), lengthCm - safePatioOffset - 100);
                const patioEnd = safePatioOffset + safePatioLen;

                return (
                  <group>
                    {/* Hastial Pabellón 1 hacia Patio (Sur del Pabellón 1) */}
                    {renderGable([0, 0, -lengthCm / 2 + safePatioOffset - effectiveGableThickness], 'patio-pav1')}

                    {/* Hastial Pabellón 2 hacia Patio (Norte del Pabellón 2) */}
                    {renderGable([0, 0, -lengthCm / 2 + patioEnd], 'patio-pav2')}
                  </group>
                );
              })()}

              {/* Si hay patio central, dividimos el techo en 2 pabellones con corte al centro */}
              {effectivePatio ? (
                <group>
                  {/* Pabellón 1 */}
                  {(() => {
                    const safePatioOffset = Math.min(Math.max(200, centralPatioOffsetCm), lengthCm - 350);
                    const pav1Len = safePatioOffset;
                    const pav1CenterZ = -lengthCm / 2 + pav1Len / 2;
                    const halfW = widthCm / 2 + overhangCm;
                    const halfSlopeX = (halfW / 2);

                    return (
                      <group position={[0, 0, pav1CenterZ]}>
                        <mesh
                          position={[-halfSlopeX, safeRidgeH / 2, 0]}
                          rotation={[0, 0, roofAngle]}
                          material={ceilingConcreteMat}
                          castShadow
                        >
                          <boxGeometry args={[roofSlopeLength, 15, pav1Len]} />
                        </mesh>
                        <mesh
                          position={[halfSlopeX, safeRidgeH / 2, 0]}
                          rotation={[0, 0, -roofAngle]}
                          material={ceilingConcreteMat}
                          castShadow
                        >
                          <boxGeometry args={[roofSlopeLength, 15, pav1Len]} />
                        </mesh>
                      </group>
                    );
                  })()}

                  {/* Pabellón 2 */}
                  {(() => {
                    const safePatioOffset = Math.min(Math.max(200, centralPatioOffsetCm), lengthCm - 350);
                    const safePatioLen = Math.min(Math.max(150, centralPatioLengthCm), lengthCm - safePatioOffset - 100);
                    const patioEnd = safePatioOffset + safePatioLen;
                    const pav2Len = Math.max(80, lengthCm - patioEnd);
                    const pav2CenterZ = -lengthCm / 2 + patioEnd + pav2Len / 2;
                    const halfW = widthCm / 2 + overhangCm;
                    const halfSlopeX = (halfW / 2);

                    return (
                      <group position={[0, 0, pav2CenterZ]}>
                        <mesh
                          position={[-halfSlopeX, safeRidgeH / 2, 0]}
                          rotation={[0, 0, roofAngle]}
                          material={ceilingConcreteMat}
                          castShadow
                        >
                          <boxGeometry args={[roofSlopeLength, 15, pav2Len]} />
                        </mesh>
                        <mesh
                          position={[halfSlopeX, safeRidgeH / 2, 0]}
                          rotation={[0, 0, -roofAngle]}
                          material={ceilingConcreteMat}
                          castShadow
                        >
                          <boxGeometry args={[roofSlopeLength, 15, pav2Len]} />
                        </mesh>
                        {/* Lucarna cenital */}
                        <mesh
                          position={[-halfSlopeX * 0.7, safeRidgeH * 0.75 + 10, pav2Len * 0.3]}
                          material={steelStructureMat}
                        >
                          <boxGeometry args={[90, 20, 110]} />
                        </mesh>
                      </group>
                    );
                  })()}
                </group>
              ) : (
                /* Cubierta continua sin patio */
                <group>
                  <mesh
                    position={[-(widthCm / 2 + overhangCm) / 2, safeRidgeH / 2, 0]}
                    rotation={[0, 0, roofAngle]}
                    material={ceilingConcreteMat}
                    castShadow
                  >
                    <boxGeometry args={[roofSlopeLength, 15, lengthCm + overhangCm * 2]} />
                  </mesh>
                  <mesh
                    position={[(widthCm / 2 + overhangCm) / 2, safeRidgeH / 2, 0]}
                    rotation={[0, 0, -roofAngle]}
                    material={ceilingConcreteMat}
                    castShadow
                  >
                    <boxGeometry args={[roofSlopeLength, 15, lengthCm + overhangCm * 2]} />
                  </mesh>
                </group>
              )}
            </group>
          ) : roofStructureType === 'losa_plana_hormigon' ? (
            <group>
              {/* Losa Plana de Hormigón Armado e=12cm */}
              <mesh position={[0, 6, 0]} material={ceilingConcreteMat} castShadow receiveShadow>
                <boxGeometry args={[widthCm + overhangCm * 2, 12, lengthCm + overhangCm * 2]} />
              </mesh>
              {/* Parapeto / Antepecho perimetral de H.A. h=25cm */}
              <mesh position={[0, 24.5, (lengthCm + overhangCm * 2) / 2 - 5]} material={concreteMat}>
                <boxGeometry args={[widthCm + overhangCm * 2, 25, 10]} />
              </mesh>
              <mesh position={[0, 24.5, -(lengthCm + overhangCm * 2) / 2 + 5]} material={concreteMat}>
                <boxGeometry args={[widthCm + overhangCm * 2, 25, 10]} />
              </mesh>
              <mesh position={[-(widthCm + overhangCm * 2) / 2 + 5, 24.5, 0]} material={concreteMat}>
                <boxGeometry args={[10, 25, lengthCm + overhangCm * 2 - 20]} />
              </mesh>
              <mesh position={[(widthCm + overhangCm * 2) / 2 - 5, 24.5, 0]} material={concreteMat}>
                <boxGeometry args={[10, 25, lengthCm + overhangCm * 2 - 20]} />
              </mesh>
            </group>
          ) : (
            /* Techumbre Liviana de Madera (Cerchas de pino + costaneras + cubierta zinc/teja) */
            <group>
              {/* Hastiales de Cierre Estructural (Frontal, Posterior y Patio) */}
              {renderGable([0, 0, lengthCm / 2 - effectiveGableThickness], 'timber-front')}
              {renderGable([0, 0, -lengthCm / 2], 'timber-back')}
              {effectivePatio && (() => {
                const safePatioOffset = Math.min(Math.max(200, centralPatioOffsetCm), lengthCm - 350);
                const safePatioLen = Math.min(Math.max(150, centralPatioLengthCm), lengthCm - safePatioOffset - 100);
                const patioEnd = safePatioOffset + safePatioLen;

                return (
                  <group>
                    {renderGable([0, 0, -lengthCm / 2 + safePatioOffset - effectiveGableThickness], 'timber-patio-pav1')}
                    {renderGable([0, 0, -lengthCm / 2 + patioEnd], 'timber-patio-pav2')}
                  </group>
                );
              })()}

              {/* Cadena de coronación perimetral de Hormigón Armado */}
              <mesh position={[0, 10, lengthCm / 2 - wallThicknessCm / 2]} material={concreteMat}>
                <boxGeometry args={[widthCm, 20, wallThicknessCm]} />
              </mesh>
              <mesh position={[0, 10, -lengthCm / 2 + wallThicknessCm / 2]} material={concreteMat}>
                <boxGeometry args={[widthCm, 20, wallThicknessCm]} />
              </mesh>
              <mesh position={[-widthCm / 2 + wallThicknessCm / 2, 10, 0]} material={concreteMat}>
                <boxGeometry args={[wallThicknessCm, 20, lengthCm - wallThicknessCm * 2]} />
              </mesh>
              <mesh position={[widthCm / 2 - wallThicknessCm / 2, 10, 0]} material={concreteMat}>
                <boxGeometry args={[wallThicknessCm, 20, lengthCm - wallThicknessCm * 2]} />
              </mesh>

              {/* Cerchas / Tijerales de Madera Estructural cada 90cm */}
              {Array.from({ length: Math.floor(lengthCm / 90) + 1 }).map((_, idx) => {
                const zPos = -lengthCm / 2 + idx * 90;
                return (
                  <group key={`truss-${idx}`} position={[0, 20, zPos]}>
                    {/* Tirante inferior de madera */}
                    <mesh position={[0, 2.5, 0]} material={timberStructureMat}>
                      <boxGeometry args={[widthCm, 5, 5]} />
                    </mesh>
                    {/* Par izquierdo de cercha */}
                    <mesh
                      position={[-(widthCm / 2) / 2, roofRidgeHeightCm / 2, 0]}
                      rotation={[0, 0, roofAngle]}
                      material={timberStructureMat}
                    >
                      <boxGeometry args={[roofSlopeLength, 10, 5]} />
                    </mesh>
                    {/* Par derecho de cercha */}
                    <mesh
                      position={[(widthCm / 2) / 2, roofRidgeHeightCm / 2, 0]}
                      rotation={[0, 0, -roofAngle]}
                      material={timberStructureMat}
                    >
                      <boxGeometry args={[roofSlopeLength, 10, 5]} />
                    </mesh>
                    {/* Pendolón central */}
                    <mesh position={[0, roofRidgeHeightCm / 2, 0]} material={timberStructureMat}>
                      <boxGeometry args={[5, roofRidgeHeightCm, 5]} />
                    </mesh>
                  </group>
                );
              })}

              {/* Cubierta Liviana Superior Inclinada (Teja Asfáltica / Zinc Ondulado) */}
              <group position={[0, 20, 0]}>
                <mesh
                  position={[-(widthCm / 2 + overhangCm) / 2, roofRidgeHeightCm / 2 + 5, 0]}
                  rotation={[0, 0, roofAngle]}
                  material={roofMat}
                  castShadow
                >
                  <boxGeometry args={[roofSlopeLength, 4, lengthCm + overhangCm * 2]} />
                </mesh>
                <mesh
                  position={[(widthCm / 2 + overhangCm) / 2, roofRidgeHeightCm / 2 + 5, 0]}
                  rotation={[0, 0, -roofAngle]}
                  material={roofMat}
                  castShadow
                >
                  <boxGeometry args={[roofSlopeLength, 4, lengthCm + overhangCm * 2]} />
                </mesh>
                {/* Caballete / Cumbrera de zinc */}
                <mesh position={[0, roofRidgeHeightCm + 8, 0]} material={steelStructureMat}>
                  <boxGeometry args={[20, 3, lengthCm + overhangCm * 2 + 4]} />
                </mesh>
              </group>
            </group>
          )}
        </group>
      )}
    </group>
  );
}
