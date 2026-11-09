import React, { useState, useCallback, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { ThreeEvent, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { ConcreteOpening, ConcreteWallTarget, useConcreteHouseStore } from '../../store/concreteHouseStore';
import { getOpeningAllowedRange, clampOpeningOffset } from '../../utils/concreteConfinement';

interface ConcreteInteractiveOpeningProps {
  opening: ConcreteOpening;
  wallTarget: ConcreteWallTarget;
  wallLengthCm: number;
  wallHeightCm: number;
  wallThicknessCm: number;
}

export function ConcreteInteractiveOpening({
  opening,
  wallTarget,
  wallLengthCm,
  wallHeightCm,
  wallThicknessCm,
}: ConcreteInteractiveOpeningProps) {
  const { camera, gl } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  const {
    openings,
    selectedOpeningId,
    setSelectedOpeningId,
    setIsDraggingOpening,
    updateOpening,
    removeOpening,
  } = useConcreteHouseStore();

  const [hovered, setHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const isSelected = selectedOpeningId === opening.id;

  const wCm = opening.width;
  const hCm = opening.height;
  const sillCm = opening.sillHeight;
  const offsetCm = opening.offsetAlongWall;

  // Filtrar todos los vanos del mismo muro para cálculo estricto de colisiones
  const sameWallOpenings = useMemo(() => {
    return openings.filter((op) => op.wall === wallTarget);
  }, [openings, wallTarget]);

  // Rango permitido para este vano
  const { minOffset, maxOffset } = useMemo(() => {
    return getOpeningAllowedRange(wallLengthCm, opening.id, wCm, sameWallOpenings, 20, 20);
  }, [wallLengthCm, opening.id, wCm, sameWallOpenings]);

  // Centro local del vano en el sistema de coordenadas del muro (X: -wallLength/2 .. +wallLength/2, Y: 0 .. wallHeight)
  const opXCenter = offsetCm + wCm / 2 - wallLengthCm / 2;
  const opYCenter = sillCm + hCm / 2;

  // Materiales de alta fidelidad arquitectónica (idénticos a estándar SIP)
  const materials = useMemo(() => {
    return {
      glassWindow: new THREE.MeshPhysicalMaterial({
        color: '#dbeafe',
        transmission: 0.92,
        opacity: 0.35,
        transparent: true,
        roughness: 0.08,
        ior: 1.52,
        depthWrite: false,
      }),
      pvcFrameBlack: new THREE.MeshStandardMaterial({
        color: '#18181b', // PVC Negro / Antracita
        roughness: 0.35,
        metalness: 0.2,
      }),
      pvcFrameWhite: new THREE.MeshStandardMaterial({
        color: '#f8fafc', // PVC Blanco
        roughness: 0.3,
        metalness: 0.1,
      }),
      pvcFrameWood: new THREE.MeshStandardMaterial({
        color: '#854d0e', // PVC Folio Madera Roble
        roughness: 0.5,
        metalness: 0.05,
      }),
      woodOak: new THREE.MeshStandardMaterial({
        color: '#b45309', // Madera Roble Natural
        roughness: 0.6,
        metalness: 0.05,
      }),
      aluminumRpt: new THREE.MeshStandardMaterial({
        color: '#334155', // Aluminio RPT Grafito
        roughness: 0.25,
        metalness: 0.85,
      }),
      aluminumSilver: new THREE.MeshStandardMaterial({
        color: '#94a3b8', // Aluminio Mate Anodizado
        roughness: 0.3,
        metalness: 0.8,
      }),
      doorLenga: new THREE.MeshStandardMaterial({
        color: '#a16207', // Madera Lenga Patagónica
        roughness: 0.55,
        metalness: 0.05,
      }),
      doorHardware: new THREE.MeshStandardMaterial({
        color: '#f1f5f9', // Acero Inoxidable Satinado
        roughness: 0.2,
        metalness: 0.9,
      }),
    };
  }, []);

  // Selección de Material para el Marco según configuración
  const frameMat = useMemo(() => {
    if (opening.frameMaterial === 'pvc_blanco') return materials.pvcFrameWhite;
    if (opening.frameMaterial === 'madera_roble' || opening.frameMaterial === 'madera_lenga') return materials.woodOak;
    if (opening.frameMaterial === 'pvc_folio_madera') return materials.pvcFrameWood;
    if (opening.frameMaterial === 'aluminio_mate' || opening.frameMaterial === 'aluminio_rtt') return materials.aluminumSilver;
    return materials.pvcFrameBlack;
  }, [opening.frameMaterial, materials]);

  const profileThick = 5.5; // 5.5 cm perfil de marco
  const frameDepth = wallThicknessCm + 1.6;

  // Manejador de Arrastre Global (Drag & Drop en 3D) con proyección en pantalla
  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      setSelectedOpeningId(opening.id);
      setIsDraggingOpening(true);
      setIsDragging(true);

      const startClientX = e.nativeEvent.clientX;
      const startClientY = e.nativeEvent.clientY;
      const startOffset = opening.offsetAlongWall || 50;

      // Calcular vector de dirección del muro (+X local) en el espacio de pantalla
      const worldPos0 = new THREE.Vector3();
      const worldPos1 = new THREE.Vector3();
      if (groupRef.current) {
        groupRef.current.getWorldPosition(worldPos0);
        const quat = groupRef.current.getWorldQuaternion(new THREE.Quaternion());
        const localX = new THREE.Vector3(1, 0, 0).applyQuaternion(quat).normalize();
        // Escala del grupo padre es 0.01 (1m = 100cm), 50cm = 0.50 unidades de mundo
        worldPos1.copy(worldPos0).addScaledVector(localX, 0.5);
      } else {
        worldPos0.set(0, 0, 0);
        worldPos1.set(0.5, 0, 0);
      }

      const p0 = worldPos0.clone().project(camera);
      const p1 = worldPos1.clone().project(camera);

      const rect = gl.domElement.getBoundingClientRect();
      const screenX0 = ((p0.x + 1) / 2) * rect.width;
      const screenY0 = ((1 - p0.y) / 2) * rect.height;
      const screenX1 = ((p1.x + 1) / 2) * rect.width;
      const screenY1 = ((1 - p1.y) / 2) * rect.height;

      const screenDx = screenX1 - screenX0;
      const screenDy = screenY1 - screenY0;
      const screenDist = Math.hypot(screenDx, screenDy);

      const dirX = screenDist > 0.5 ? screenDx / screenDist : 1;
      const dirY = screenDist > 0.5 ? screenDy / screenDist : 0;
      const pxPerCm = screenDist > 0.5 ? screenDist / 50 : 2;

      // Obtener los límites seguros calculados para este vano
      const bounds = getOpeningAllowedRange(wallLengthCm, opening.id, wCm, sameWallOpenings, 20, 20);

      const onPointerMoveWindow = (moveEvent: PointerEvent) => {
        const dx = moveEvent.clientX - startClientX;
        const dy = moveEvent.clientY - startClientY;

        // Proyección sobre el eje visual del muro en pantalla
        const dotProductPx = dx * dirX + dy * dirY;
        const deltaCm = Math.round(dotProductPx / pxPerCm);

        const nextOffset = startOffset + deltaCm;
        const snapped = Math.round(nextOffset / 5) * 5;
        const boundedOffset = Math.max(bounds.minOffset, Math.min(bounds.maxOffset, snapped));

        updateOpening(opening.id, { offsetAlongWall: boundedOffset });
      };

      const onPointerUpWindow = () => {
        window.removeEventListener('pointermove', onPointerMoveWindow);
        window.removeEventListener('pointerup', onPointerUpWindow);
        setIsDragging(false);
        setIsDraggingOpening(false);
      };

      window.addEventListener('pointermove', onPointerMoveWindow);
      window.addEventListener('pointerup', onPointerUpWindow);
    },
    [
      camera,
      gl,
      opening.id,
      opening.offsetAlongWall,
      wallLengthCm,
      wCm,
      sameWallOpenings,
      setIsDraggingOpening,
      setSelectedOpeningId,
      updateOpening,
    ]
  );

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      setSelectedOpeningId(opening.id);
    },
    [opening.id, setSelectedOpeningId]
  );

  const handleNudge = useCallback(
    (delta: number, e?: React.MouseEvent) => {
      e?.stopPropagation();
      const current = opening.offsetAlongWall || 50;
      const candidate = current + delta;
      const bounded = Math.max(minOffset, Math.min(maxOffset, candidate));
      updateOpening(opening.id, { offsetAlongWall: bounded });
    },
    [opening.id, opening.offsetAlongWall, minOffset, maxOffset, updateOpening]
  );

  const displayCode = opening.code || (opening.type === 'door' ? 'P' : 'V');

  return (
    <group
      ref={groupRef}
      position={[opXCenter, opYCenter, 0]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'grab';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        if (!isDragging) document.body.style.cursor = 'default';
      }}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
    >
      {/* 1. INDICADOR DE SELECCIÓN Y BADGE 3D INTERACTIVO */}
      {(isSelected || isDragging) && (
        <group>
          {/* Borde fluorescente de selección */}
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(wCm + 2, hCm + 2, wallThicknessCm + 4)]} />
            <lineBasicMaterial
              color="#38bdf8"
              linewidth={2}
            />
          </lineSegments>

          {/* Cartela Informativa / Badge 3D flotante activo con botón de cerrar */}
          <Html
            position={[0, hCm / 2 + 18, wallThicknessCm / 2 + 6]}
            center
            distanceFactor={12}
            className="select-none z-30 pointer-events-auto"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shadow-2xl border flex items-center gap-2 backdrop-blur-xl bg-slate-950/95 text-sky-200 border-sky-400/90 ring-2 ring-sky-500/30 transition-all scale-100"
            >
              <div className="flex items-center gap-1.5 cursor-grab active:cursor-grabbing">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                <span className="font-mono text-xs font-black tracking-wider text-white uppercase">
                  {displayCode}
                </span>
                <span className="text-slate-300 text-[11px] font-medium">
                  {Math.round(wCm)}×{Math.round(hCm)} cm
                </span>
              </div>

              {/* Botones de ajuste fino en el muro */}
              <div className="flex items-center gap-1 bg-white/10 p-0.5 rounded-lg pointer-events-auto">
                <button
                  type="button"
                  onClick={(e) => handleNudge(-10, e)}
                  className="px-1.5 py-0.5 bg-white/10 hover:bg-sky-500 hover:text-white rounded text-slate-200 font-mono text-[10px] transition-colors cursor-pointer"
                  title="Mover 10cm hacia la izquierda"
                >
                  ◀ -10
                </button>
                <span className="text-[10px] text-sky-300 font-mono font-bold px-1">
                  {opening.offsetAlongWall || 50} cm
                </span>
                <button
                  type="button"
                  onClick={(e) => handleNudge(10, e)}
                  className="px-1.5 py-0.5 bg-white/10 hover:bg-sky-500 hover:text-white rounded text-slate-200 font-mono text-[10px] transition-colors cursor-pointer"
                  title="Mover 10cm hacia la derecha"
                >
                  +10 ▶
                </button>
              </div>

              {isDragging ? (
                <span className="text-[10px] text-emerald-400 animate-pulse font-bold">
                  Arrastrando...
                </span>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedOpeningId(null);
                    setHovered(false);
                  }}
                  className="px-1.5 py-0.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 text-[10px] font-bold transition-all cursor-pointer"
                  title="Cerrar y Deseleccionar"
                >
                  ✕
                </button>
              )}
            </div>
          </Html>
        </group>
      )}

      {/* Hover sutil y discreto cuando no está seleccionado ni arrastrando */}
      {!isSelected && !isDragging && hovered && (
        <group>
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(wCm + 1, hCm + 1, wallThicknessCm + 2)]} />
            <lineBasicMaterial color="#f59e0b" linewidth={1.5} />
          </lineSegments>
          <Html
            position={[0, hCm / 2 + 14, wallThicknessCm / 2 + 4]}
            center
            distanceFactor={13}
            className="select-none pointer-events-none z-20"
          >
            <div className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-900/90 text-slate-200 border border-amber-500/40 shadow-lg backdrop-blur flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="font-mono uppercase text-amber-300">{displayCode}</span>
              <span>{Math.round(wCm)}×{Math.round(hCm)} cm</span>
            </div>
          </Html>
        </group>
      )}

      {/* 2. MARCO PERIMETRAL HUECO (4 PERFILES ESTRUCTURALES) */}
      <group>
        {/* Perfil Superior */}
        <mesh position={[0, (hCm - profileThick) / 2, 0]} material={frameMat} castShadow receiveShadow>
          <boxGeometry args={[wCm, profileThick, frameDepth]} />
        </mesh>
        {/* Perfil Inferior */}
        <mesh position={[0, -(hCm - profileThick) / 2, 0]} material={frameMat} castShadow receiveShadow>
          <boxGeometry args={[wCm, profileThick, frameDepth]} />
        </mesh>
        {/* Perfil Lateral Izquierdo */}
        <mesh
          position={[-(wCm - profileThick) / 2, 0, 0]}
          material={frameMat}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[profileThick, Math.max(1, hCm - 2 * profileThick), frameDepth]} />
        </mesh>
        {/* Perfil Lateral Derecho */}
        <mesh
          position={[(wCm - profileThick) / 2, 0, 0]}
          material={frameMat}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[profileThick, Math.max(1, hCm - 2 * profileThick), frameDepth]} />
        </mesh>
      </group>

      {/* 3. VENTANA ARQUITECTÓNICA TRASLÚCIDA TERMOPANEL (DVP) */}
      {opening.type === 'window' && (
        <group>
          {/* Vidrio Termopanel Central Traslúcido Cristalino */}
          <mesh position={[0, 0, 0]} material={materials.glassWindow}>
            <boxGeometry
              args={[
                Math.max(5, wCm - 2 * profileThick - 0.5),
                Math.max(5, hCm - 2 * profileThick - 0.5),
                1.4,
              ]}
            />
          </mesh>

          {/* Configuración según Ancho: Ventana Corredera de 2 Hojas o Proyectante */}
          {wCm > 105 ? (
            <group>
              {/* Travesaño central vertical / perfil de cruce de hojas */}
              <mesh position={[0, 0, 0.6]} material={frameMat} castShadow receiveShadow>
                <boxGeometry args={[4.5, Math.max(5, hCm - 2 * profileThick), 3.2]} />
              </mesh>
              {/* Tirador / Manilla central */}
              <mesh position={[2.2, 0, 2.4]} material={materials.doorHardware}>
                <boxGeometry args={[1.8, 14, 2.0]} />
              </mesh>
            </group>
          ) : (
            // Ventana Proyectante / Abatible
            <group>
              <mesh
                position={[0, -hCm / 2 + profileThick + 4, 1.8]}
                material={materials.doorHardware}
              >
                <boxGeometry args={[11, 1.8, 2.5]} />
              </mesh>
            </group>
          )}

          {/* Botaguas / Vierteaguas exterior inferior */}
          <mesh
            position={[0, -hCm / 2 - 1.2, wallThicknessCm / 2 + 2.0]}
            material={frameMat}
            castShadow
          >
            <boxGeometry args={[wCm + 6, 2.5, 5.0]} />
          </mesh>
        </group>
      )}

      {/* 4. PUERTA ARQUITECTÓNICA (MADERA MACIZA O VENTANAL CORREDERO TERRAZA) */}
      {opening.type === 'door' && (
        <group>
          {wCm > 135 ? (
            // Ventanal Corredero Terraza (2 Hojas Vidriadas Grandes)
            <group>
              {/* Vidrio Central Completo Traslúcido */}
              <mesh position={[0, 0, 0]} material={materials.glassWindow}>
                <boxGeometry
                  args={[
                    Math.max(5, wCm - 2 * profileThick - 0.5),
                    Math.max(5, hCm - 2 * profileThick - 0.5),
                    1.6,
                  ]}
                />
              </mesh>

              {/* Travesaño central vertical / Montante de encuentro */}
              <mesh position={[0, 0, 0]} material={frameMat} castShadow receiveShadow>
                <boxGeometry args={[5.0, Math.max(5, hCm - 2 * profileThick), 3.5]} />
              </mesh>

              {/* Manillones de Acero Inoxidable */}
              <mesh position={[2.5, 0, 3.0]} material={materials.doorHardware}>
                <boxGeometry args={[2.0, 42, 2.5]} />
              </mesh>
              <mesh position={[2.5, 0, -3.0]} material={materials.doorHardware}>
                <boxGeometry args={[2.0, 42, 2.5]} />
              </mesh>
            </group>
          ) : (
            // Puerta Maciza Panelada de Acceso
            <group>
              {/* Hoja de Puerta */}
              <mesh
                position={[0, 0, 0]}
                material={opening.frameMaterial === 'madera_lenga' ? materials.doorLenga : frameMat}
                castShadow
              >
                <boxGeometry
                  args={[
                    Math.max(5, wCm - 2 * profileThick - 1.0),
                    Math.max(5, hCm - 2 * profileThick - 1.0),
                    4.2,
                  ]}
                />
              </mesh>

              {/* Buñas y relieves horizontales de estilo contemporáneo */}
              {[-0.5, -0.15, 0.2, 0.55].map((relY, rIdx) => (
                <mesh
                  key={`door-panel-groove-${rIdx}`}
                  position={[0, (hCm - 10) * (relY / 2), 2.2]}
                  material={materials.doorHardware}
                >
                  <boxGeometry args={[Math.max(5, wCm - 18), 0.6, 0.3]} />
                </mesh>
              ))}

              {/* Manilla Ergonómica Exterior */}
              <group position={[wCm / 2 - profileThick - 8, 0, 2.5]}>
                <mesh rotation={[Math.PI / 2, 0, 0]} material={materials.doorHardware}>
                  <cylinderGeometry args={[2.6, 2.6, 0.6, 16]} />
                </mesh>
                <mesh position={[0, 0, 1.8]} rotation={[Math.PI / 2, 0, 0]} material={materials.doorHardware}>
                  <cylinderGeometry args={[0.8, 0.8, 3.0, 12]} />
                </mesh>
                <mesh position={[-4.5, 0, 3.0]} rotation={[0, 0, Math.PI / 2]} material={materials.doorHardware}>
                  <cylinderGeometry args={[0.8, 0.8, 11, 12]} />
                </mesh>
                <mesh position={[0, -7.0, 0]} rotation={[Math.PI / 2, 0, 0]} material={materials.doorHardware}>
                  <cylinderGeometry args={[1.5, 1.5, 0.5, 12]} />
                </mesh>
              </group>

              {/* Manilla Ergonómica Interior */}
              <group position={[wCm / 2 - profileThick - 8, 0, -2.5]}>
                <mesh rotation={[Math.PI / 2, 0, 0]} material={materials.doorHardware}>
                  <cylinderGeometry args={[2.6, 2.6, 0.6, 16]} />
                </mesh>
                <mesh position={[0, 0, -1.8]} rotation={[Math.PI / 2, 0, 0]} material={materials.doorHardware}>
                  <cylinderGeometry args={[0.8, 0.8, 3.0, 12]} />
                </mesh>
                <mesh position={[-4.5, 0, -3.0]} rotation={[0, 0, Math.PI / 2]} material={materials.doorHardware}>
                  <cylinderGeometry args={[0.8, 0.8, 11, 12]} />
                </mesh>
                <mesh position={[0, -7.0, 0]} rotation={[Math.PI / 2, 0, 0]} material={materials.doorHardware}>
                  <cylinderGeometry args={[1.5, 1.5, 0.5, 12]} />
                </mesh>
              </group>
            </group>
          )}
        </group>
      )}
    </group>
  );
}
