import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useKitchenStore } from '../../store/kitchenStore';
import { useStore } from '../../store';
import { detectContinuousCabinetRuns } from '../../utils/countertopNesting';
import { Board } from '../Board';
import { Edges } from '@react-three/drei';

export function KitchenIslandBackPanel() {
  const isTransparent = useStore((s) => s.isTransparent);
  const cabinets = useKitchenStore((s) => s.cabinets);
  const countertopConfig = useKitchenStore((s) => s.countertopConfig);
  const islandBackConfig = useKitchenStore((s) => s.islandBackConfig);
  const qstoneCatalog = useKitchenStore((s) => s.qstoneCatalog);
  const walls = useKitchenStore((s) => s.walls);
  const architecturalElements = useKitchenStore((s) => s.architecturalElements);
  const roomConfig = useKitchenStore((s) => s.roomConfig);
  const socleHeight = useKitchenStore((s) => s.socleHeight ?? 10);
  const socleFinish = useKitchenStore((s) => s.socleFinish || 'aluminum');

  const islandRuns = useMemo(() => {
    if (!islandBackConfig?.enabled) return [];
    return detectContinuousCabinetRuns(cabinets, countertopConfig, walls, architecturalElements, roomConfig)
      .filter((r) => r.type === 'island');
  }, [cabinets, countertopConfig, islandBackConfig?.enabled, walls, architecturalElements, roomConfig]);

  const product = useMemo(() => {
    return qstoneCatalog.find((p) => p.id === countertopConfig.selectedProductId) || qstoneCatalog[0];
  }, [qstoneCatalog, countertopConfig.selectedProductId]);

  const stoneTexture = useMemo(() => {
    if (!product?.textureUrl || product.textureUrl.startsWith('#')) return null;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    const tex = loader.load(product.textureUrl);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1.5, 1.5);
    return tex;
  }, [product?.textureUrl]);

  if (!islandBackConfig?.enabled || islandRuns.length === 0) {
    return null;
  }

  const isCountertopMaterial = islandBackConfig.materialType === 'countertop';
  // Regla estricta: Si es cubierta, forzar hasta el piso
  const effectiveHeightMode = isCountertopMaterial ? 'to_floor' : islandBackConfig.heightMode;

  const stoneColor = product?.colorHex || '#F4F5F8';
  const stoneRoughness = product?.materialType === 'quarzo' ? 0.18 : 0.4;
  const stoneThicknessCm = (product?.thicknessMm || 20) / 10;

  return (
    <group name="kitchenIslandBackPanels">
      {islandRuns.map((run) => {
        const totalLengthCm = run.totalLengthMm / 10;
        const cabDepthCm = run.cabinets[0]?.depth || 60;
        const cabTopY = (run.heightMm || 850) / 10;

        let panelHeightCm: number;
        let panelCenterY: number;

        if (effectiveHeightMode === 'to_floor') {
          // Cubre completo desde el suelo (Y=0) hasta la cara inferior de la cubierta
          panelHeightCm = cabTopY;
          panelCenterY = panelHeightCm / 2;
        } else {
          // Con zócalo libre calibrado dinámicamente según altura global
          const socleGapCm = socleHeight;
          panelHeightCm = Math.max(10, cabTopY - socleGapCm);
          panelCenterY = socleGapCm + panelHeightCm / 2;
        }

        const thicknessCm = isCountertopMaterial
          ? stoneThicknessCm
          : (islandBackConfig.thicknessCm || 1.8);

        // Posición local relativa al centro de la corrida (run.centerWorld)
        // La cara posterior de los gabinetes está en Z = -cabDepthCm / 2
        const localZ = -cabDepthCm / 2 - thicknessCm / 2;

        const maxMonolithicLenCm = isCountertopMaterial ? 320 : 244;
        const needsSplits = totalLengthCm > maxMonolithicLenCm;

        return (
          <group
            key={`island-back-${run.id}`}
            position={[run.centerWorld[0], 0, run.centerWorld[2]]}
            rotation={[0, run.rotation, 0]}
          >
            {isCountertopMaterial ? (
              // === TERMINACIÓN CUBIERTA (CUARZO / PIEDRA SINTERIZADA QSTONE) ===
              needsSplits ? (
                // Si excede 320cm, seccionado limpio según los módulos o tramos simétricos
                (() => {
                  let accumulatedX = -totalLengthCm / 2;
                  return run.cabinets.map((cab, idx) => {
                    const segLen = cab.width;
                    const segCenterX = accumulatedX + segLen / 2;
                    accumulatedX += segLen;
                    return (
                      <group key={`stone-seg-${cab.id}-${idx}`} position={[segCenterX, panelCenterY, localZ]}>
                        <mesh castShadow={!isTransparent} receiveShadow={!isTransparent}>
                          <boxGeometry args={[segLen - 0.04, panelHeightCm, thicknessCm]} />
                          <meshStandardMaterial
                            key={isTransparent ? 'transp' : 'solid'}
                            color={isTransparent ? '#cbd5e1' : (stoneTexture ? '#ffffff' : stoneColor)}
                            map={isTransparent ? null : stoneTexture}
                            roughness={isTransparent ? 0.1 : stoneRoughness}
                            metalness={0.05}
                            transparent={isTransparent}
                            opacity={isTransparent ? 0.3 : 1}
                            depthWrite={!isTransparent}
                          />
                          <Edges threshold={25} color={isTransparent ? '#555555' : '#94a3b8'} />
                        </mesh>
                      </group>
                    );
                  });
                })()
              ) : (
                // Monolítico continuo de una sola pieza (<= 3200 mm)
                <mesh position={[0, panelCenterY, localZ]} castShadow={!isTransparent} receiveShadow={!isTransparent}>
                  <boxGeometry args={[totalLengthCm, panelHeightCm, thicknessCm]} />
                  <meshStandardMaterial
                    key={isTransparent ? 'transp' : 'solid'}
                    color={isTransparent ? '#cbd5e1' : (stoneTexture ? '#ffffff' : stoneColor)}
                    map={isTransparent ? null : stoneTexture}
                    roughness={isTransparent ? 0.1 : stoneRoughness}
                    metalness={0.05}
                    transparent={isTransparent}
                    opacity={isTransparent ? 0.3 : 1}
                    depthWrite={!isTransparent}
                  />
                  <Edges threshold={25} color={isTransparent ? '#555555' : '#94a3b8'} />
                </mesh>
              )
            ) : (
              // === TERMINACIÓN DECORATIVA (MELAMINA / HPL DEL CONFIGURADOR) ===
              needsSplits ? (
                // Si excede 244cm, seccionado continuo en los módulos con el mismo decorativo
                (() => {
                  let accumulatedX = -totalLengthCm / 2;
                  return run.cabinets.map((cab, idx) => {
                    const segLen = cab.width;
                    const segCenterX = accumulatedX + segLen / 2;
                    accumulatedX += segLen;
                    return (
                      <Board
                        key={`dec-seg-${cab.id}-${idx}`}
                        position={[segCenterX, panelCenterY, localZ]}
                        args={[segLen - 0.02, panelHeightCm, thicknessCm]}
                        color={islandBackConfig.decorativeColor}
                        textureUrl={
                          islandBackConfig.decorativeColor.startsWith('#')
                            ? undefined
                            : islandBackConfig.decorativeColor
                        }
                        materialType={islandBackConfig.decorativeMaterial}
                        isFrontPanel={true}
                        grainDirection={islandBackConfig.grainDirection || 'vertical'}
                      />
                    );
                  });
                })()
              ) : (
                // Monolítico continuo de una sola pieza corrida (<= 2440 mm)
                <Board
                  position={[0, panelCenterY, localZ]}
                  args={[totalLengthCm, panelHeightCm, thicknessCm]}
                  color={islandBackConfig.decorativeColor}
                  textureUrl={
                    islandBackConfig.decorativeColor.startsWith('#')
                      ? undefined
                      : islandBackConfig.decorativeColor
                  }
                  materialType={islandBackConfig.decorativeMaterial}
                  isFrontPanel={true}
                  grainDirection={islandBackConfig.grainDirection || 'vertical'}
                />
              )
            )}

            {/* Zócalo trasero continuo cuando se selecciona trasera con decorativo y opción "Con zócalo" */}
            {effectiveHeightMode === 'with_socle' && (() => {
              const isBlack = socleFinish === 'black';
              const defaultSocleColor = isBlack ? '#18181b' : '#e2e8f0';
              const socleColor = isBlack ? '#18181b' : (socleFinish === 'aluminum' ? '#e2e8f0' : (run.cabinets[0]?.socleColor || defaultSocleColor));
              const socleMetalness = isBlack ? 0.25 : 0.40;
              const socleRoughness = isBlack ? 0.70 : 0.28;
              const socleThickness = 1.2;
              const socleH = socleHeight;
              const socleZ = -cabDepthCm / 2 + 2;
              return (
                <group position={[0, socleH / 2, socleZ]}>
                  {socleColor.startsWith('#') ? (
                    <mesh castShadow={!isTransparent} receiveShadow={!isTransparent}>
                      <boxGeometry args={[totalLengthCm, socleH, socleThickness]} />
                      <meshStandardMaterial
                        color={socleColor}
                        metalness={socleMetalness}
                        roughness={socleRoughness}
                        transparent={isTransparent}
                        opacity={isTransparent ? 0.3 : 1}
                        depthWrite={!isTransparent}
                      />
                      {isTransparent && <Edges threshold={25} color="#555555" />}
                    </mesh>
                  ) : (
                    <Board
                      position={[0, 0, 0]}
                      args={[totalLengthCm, socleH, socleThickness]}
                      color="#ffffff"
                      textureUrl={socleColor}
                      materialType={run.cabinets[0]?.socleMaterial || 'melamina'}
                    />
                  )}
                </group>
              );
            })()}

            {/* === COSTADOS / LATERALES DECORATIVOS DE ISLA (MELAMINA / HPL / MDF LAMINADO) === */}
            {!isCountertopMaterial && islandBackConfig.sidesEnabled && (() => {
              const sideLeft = islandBackConfig.sideLeftEnabled !== false && !countertopConfig.waterfallLeft;
              const sideRight = islandBackConfig.sideRightEnabled !== false && !countertopConfig.waterfallRight;
              const sideDepthCm = islandBackConfig.sideDepthCm ?? cabDepthCm;
              const sideHeightMode = islandBackConfig.sideHeightMode || effectiveHeightMode;

              let sideHeightCm: number;
              let sideCenterY: number;

              if (sideHeightMode === 'to_floor') {
                sideHeightCm = cabTopY;
                sideCenterY = sideHeightCm / 2;
              } else {
                const socleGapCm = socleHeight;
                sideHeightCm = Math.max(10, cabTopY - socleGapCm);
                sideCenterY = socleGapCm + sideHeightCm / 2;
              }

              // Posición Z: El frente del mueble está en +cabDepthCm/2 y el panel corre hacia el fondo
              const localSideZ = (cabDepthCm / 2) - (sideDepthCm / 2);
              const localLeftX = -totalLengthCm / 2 - thicknessCm / 2;
              const localRightX = totalLengthCm / 2 + thicknessCm / 2;

              return (
                <group name="islandDecorativeSidePanels">
                  {sideLeft && (
                    <Board
                      position={[localLeftX, sideCenterY, localSideZ]}
                      args={[thicknessCm, sideHeightCm, sideDepthCm]}
                      color={islandBackConfig.decorativeColor}
                      textureUrl={
                        islandBackConfig.decorativeColor.startsWith('#')
                          ? undefined
                          : islandBackConfig.decorativeColor
                      }
                      materialType={islandBackConfig.decorativeMaterial}
                      isFrontPanel={true}
                      grainDirection={islandBackConfig.grainDirection || 'vertical'}
                    />
                  )}

                  {sideRight && (
                    <Board
                      position={[localRightX, sideCenterY, localSideZ]}
                      args={[thicknessCm, sideHeightCm, sideDepthCm]}
                      color={islandBackConfig.decorativeColor}
                      textureUrl={
                        islandBackConfig.decorativeColor.startsWith('#')
                          ? undefined
                          : islandBackConfig.decorativeColor
                      }
                      materialType={islandBackConfig.decorativeMaterial}
                      isFrontPanel={true}
                      grainDirection={islandBackConfig.grainDirection || 'vertical'}
                    />
                  )}
                </group>
              );
            })()}
          </group>
        );
      })}
    </group>
  );
}
