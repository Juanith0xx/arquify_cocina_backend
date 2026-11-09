import React, { useMemo, useState, useRef } from 'react';
import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import {
  useHplBathroomStore,
  JNF_FINISHES,
  HPL_STANDARD_COLORS,
  UrinalScreenConfig,
  FootModel,
  HingeModel,
  LockModel,
  HandleModel,
  HookModel,
  WallFixingModel,
} from '../../store/hplBathroomStore';
import { Move, RotateCw, Trash2 } from 'lucide-react';

interface HplBathroom3DProps {
  batteryOriginX: number;
  batteryOriginZ: number;
  urinalsWallZ: number;
}

// Fallback texture loader safe component
function SafeTextureMesh({
  url,
  colorHex,
  geometryArgs,
  position,
  rotation,
  castShadow = true,
  receiveShadow = true,
}: {
  url?: string | null;
  colorHex: string;
  geometryArgs: [number, number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
  castShadow?: boolean;
  receiveShadow?: boolean;
}) {
  const texture = useMemo(() => {
    if (!url) return null;
    const loader = new THREE.TextureLoader();
    const tex = loader.load(url);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1.5, 1.5);
    return tex;
  }, [url]);

  return (
    <mesh position={position} rotation={rotation} castShadow={castShadow} receiveShadow={receiveShadow}>
      <boxGeometry args={geometryArgs} />
      <meshStandardMaterial
        color={colorHex}
        map={texture || undefined}
        roughness={0.4}
        metalness={0.05}
      />
    </mesh>
  );
}

// Escuadra JNF SM.004 en 3D (Ángulo 90° colocado estrictamente en la cara posterior de la pilastra)
function JnfCornerBracket({
  position,
  side = 'left',
  material,
}: {
  position: [number, number, number];
  side?: 'left' | 'right';
  material: THREE.Material;
}) {
  const isLeft = side === 'left';
  const xDir = isLeft ? -1 : 1;
  const bracketThick = 0.003;
  const wingWidth = 0.026;
  const wingDepth = 0.026;
  const bracketHeight = 0.04;

  return (
    <group position={position}>
      {/* Ala fijada a la cara posterior de la pilastra (plana contra la pilastra, orientada en -Z desde el contacto) */}
      <mesh material={material} position={[xDir * (wingWidth / 2), 0, -bracketThick / 2]}>
        <boxGeometry args={[wingWidth, bracketHeight, bracketThick]} />
      </mesh>
      {/* Ala fijada al lateral del separador (plana contra el separador, extendiéndose hacia atrás en -Z) */}
      <mesh material={material} position={[0, 0, -wingDepth / 2]}>
        <boxGeometry args={[bracketThick, bracketHeight, wingDepth]} />
      </mesh>
      {/* Tornillos simulados en cara posterior */}
      <mesh position={[xDir * (wingWidth * 0.6), 0.01, -bracketThick]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.003, 0.003, 0.002, 8]} />
        <meshStandardMaterial color="#94A3B8" metalness={0.9} />
      </mesh>
      <mesh position={[xDir * (wingWidth * 0.6), -0.01, -bracketThick]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.003, 0.003, 0.002, 8]} />
        <meshStandardMaterial color="#94A3B8" metalness={0.9} />
      </mesh>
      {/* Tornillos simulados en el lateral del separador */}
      <mesh position={[xDir * bracketThick, 0.01, -wingDepth * 0.6]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.003, 0.003, 0.002, 8]} />
        <meshStandardMaterial color="#94A3B8" metalness={0.9} />
      </mesh>
      <mesh position={[xDir * bracketThick, -0.01, -wingDepth * 0.6]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.003, 0.003, 0.002, 8]} />
        <meshStandardMaterial color="#94A3B8" metalness={0.9} />
      </mesh>
    </group>
  );
}

// Patas Regulables JNF en 3D
function JnfFoot3D({
  footHeightM,
  material,
  model = 'sm_017',
}: {
  footHeightM: number;
  material: THREE.Material;
  model?: FootModel;
}) {
  if (model === 'sm_070') {
    // Pata cuadrada 20x20mm
    return (
      <group position={[0, 0, 0]}>
        <mesh material={material} position={[0, -footHeightM / 2, 0]}>
          <boxGeometry args={[0.02, footHeightM, 0.02]} />
        </mesh>
        <mesh material={material} position={[0, -footHeightM + 0.004, 0]}>
          <boxGeometry args={[0.042, 0.008, 0.042]} />
        </mesh>
      </group>
    );
  }
  if (model === 'sm_017_xl') {
    // Pata reforzada Ø22mm con base escalonada
    return (
      <group position={[0, 0, 0]}>
        <mesh material={material} position={[0, -footHeightM / 2, 0]}>
          <cylinderGeometry args={[0.022, 0.028, footHeightM, 16]} />
        </mesh>
        <mesh material={material} position={[0, -footHeightM + 0.006, 0]}>
          <cylinderGeometry args={[0.042, 0.042, 0.012, 20]} />
        </mesh>
      </group>
    );
  }
  // SM.017 estándar
  return (
    <group position={[0, 0, 0]}>
      <mesh material={material} position={[0, -footHeightM / 2, 0]}>
        <cylinderGeometry args={[0.018, 0.024, footHeightM, 16]} />
      </mesh>
      <mesh material={material} position={[0, -footHeightM + 0.005, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.01, 20]} />
      </mesh>
    </group>
  );
}

// Bisagras JNF en 3D
function JnfHinge3D({
  isLeftHinge,
  material,
  model = 'sm_005_c_spring',
}: {
  isLeftHinge: boolean;
  material: THREE.Material;
  model?: HingeModel;
}) {
  const leafX = isLeftHinge ? 0.02 : -0.02;

  if (model === 'sm_005_e_spring_cover') {
    return (
      <group>
        <mesh material={material} position={[leafX, 0, 0]}>
          <boxGeometry args={[0.04, 0.09, 0.016]} />
        </mesh>
      </group>
    );
  }
  if (model === 'sm_006_b') {
    return (
      <group>
        <mesh material={material} position={[0, 0, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.095, 16]} />
        </mesh>
        <mesh material={material} position={[leafX, 0, 0]}>
          <boxGeometry args={[0.045, 0.09, 0.004]} />
        </mesh>
      </group>
    );
  }
  if (model === 'sm_005_b_free') {
    return (
      <group>
        <mesh material={material} position={[0, 0, 0]}>
          <cylinderGeometry args={[0.009, 0.009, 0.08, 16]} />
        </mesh>
        <mesh material={material} position={[leafX, 0, 0]}>
          <boxGeometry args={[0.035, 0.07, 0.004]} />
        </mesh>
      </group>
    );
  }
  // SM.005.C con muelle ajustable
  return (
    <group>
      <mesh material={material}>
        <cylinderGeometry args={[0.013, 0.013, 0.09, 16]} />
      </mesh>
      <mesh material={material} position={[leafX, 0, 0]}>
        <boxGeometry args={[0.04, 0.08, 0.006]} />
      </mesh>
    </group>
  );
}

// Cerrojo con Indicador JNF en 3D
function JnfLock3D({
  isClosed,
  thickDoorM,
  material,
  model = 'sm_031_easyfix',
}: {
  isClosed: boolean;
  thickDoorM: number;
  material: THREE.Material;
  model?: LockModel;
}) {
  const indicatorColor = isClosed ? '#EF4444' : '#22C55E';

  if (model === 'sm_060_two_in_one') {
    return (
      <group>
        <mesh material={material} position={[0, 0, -thickDoorM / 2 - 0.025]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.01, 0.01, 0.11, 16]} />
        </mesh>
        <mesh material={material} position={[0, 0, -thickDoorM / 2 - 0.01]}>
          <boxGeometry args={[0.03, 0.07, 0.015]} />
        </mesh>
        <mesh material={material} position={[0, 0, thickDoorM / 2 + 0.005]}>
          <boxGeometry args={[0.035, 0.08, 0.008]} />
        </mesh>
        <mesh position={[0, 0.015, thickDoorM / 2 + 0.009]}>
          <boxGeometry args={[0.018, 0.018, 0.002]} />
          <meshStandardMaterial color={indicatorColor} roughness={0.2} />
        </mesh>
      </group>
    );
  }

  if (model === 'sm_035_slide') {
    return (
      <group>
        <mesh material={material} position={[0, 0, -thickDoorM / 2 - 0.012]}>
          <boxGeometry args={[0.09, 0.035, 0.018]} />
        </mesh>
        <mesh material={material} position={[0, 0, thickDoorM / 2 + 0.004]}>
          <boxGeometry args={[0.05, 0.03, 0.006]} />
        </mesh>
        <mesh position={[0, 0, thickDoorM / 2 + 0.007]}>
          <boxGeometry args={[0.025, 0.012, 0.002]} />
          <meshStandardMaterial color={indicatorColor} roughness={0.2} />
        </mesh>
      </group>
    );
  }

  if (model === 'sm_030_indicator') {
    return (
      <group>
        <mesh material={material} position={[0, 0, -thickDoorM / 2 - 0.015]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.025, 16]} />
        </mesh>
        <mesh position={[0, 0, thickDoorM / 2 + 0.004]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.022, 0.022, 0.006, 16]} />
          <meshStandardMaterial color={indicatorColor} roughness={0.3} />
        </mesh>
        <mesh material={material} position={[0, 0, thickDoorM / 2 + 0.007]}>
          <ringGeometry args={[0.022, 0.028, 24]} />
        </mesh>
      </group>
    );
  }

  // SM.031 Easyfix
  return (
    <group>
      <mesh material={material} position={[0, 0, -thickDoorM / 2 - 0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.04, 16]} />
      </mesh>
      <mesh position={[0, 0, thickDoorM / 2 + 0.005]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.006, 16]} />
        <meshStandardMaterial color={indicatorColor} roughness={0.3} />
      </mesh>
      <mesh material={material} position={[0, 0, thickDoorM / 2 + 0.008]}>
        <ringGeometry args={[0.022, 0.028, 24]} />
      </mesh>
    </group>
  );
}

// Tirador JNF en 3D
function JnfHandle3D({
  thickDoorM,
  material,
  model = 'in_75_050_d',
}: {
  thickDoorM: number;
  material: THREE.Material;
  model?: HandleModel;
}) {
  if (model === 'in_75_051_d') {
    return (
      <group>
        <mesh material={material} position={[0, 0, thickDoorM / 2 + 0.002]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.004, 20]} />
        </mesh>
        <mesh material={material} position={[0, 0, -thickDoorM / 2 - 0.002]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.004, 20]} />
        </mesh>
      </group>
    );
  }
  if (model === 'in_75_040') {
    return (
      <group>
        <mesh material={material} position={[0, 0, thickDoorM / 2 + 0.02]}>
          <boxGeometry args={[0.015, 0.16, 0.02]} />
        </mesh>
        <mesh material={material} position={[0, 0, -thickDoorM / 2 - 0.02]}>
          <boxGeometry args={[0.015, 0.16, 0.02]} />
        </mesh>
      </group>
    );
  }
  if (model === 'in_75_041') {
    return (
      <group>
        <mesh material={material} position={[0, 0, thickDoorM / 2 + 0.018]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 0.032, 16]} />
        </mesh>
        <mesh material={material} position={[0, 0, -thickDoorM / 2 - 0.018]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 0.032, 16]} />
        </mesh>
      </group>
    );
  }
  // IN.75.050.D
  return (
    <group>
      <mesh material={material} position={[0, 0, thickDoorM / 2 + 0.02]}>
        <boxGeometry args={[0.025, 0.16, 0.018]} />
      </mesh>
      <mesh material={material} position={[0, 0, -thickDoorM / 2 - 0.02]}>
        <boxGeometry args={[0.025, 0.16, 0.018]} />
      </mesh>
    </group>
  );
}

// Percha / Colgador JNF en 3D
function JnfHook3D({
  material,
  model = 'sm_008_stopper',
}: {
  material: THREE.Material;
  model?: HookModel;
}) {
  if (model === 'in_14_010') {
    return (
      <mesh material={material} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.045, 16]} />
      </mesh>
    );
  }
  if (model === 'in_14_020') {
    return (
      <mesh material={material}>
        <boxGeometry args={[0.018, 0.018, 0.045]} />
      </mesh>
    );
  }
  if (model === 'in_14_546') {
    return (
      <group>
        <mesh material={material} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.007, 0.007, 0.045, 12]} />
        </mesh>
        <mesh material={material} position={[0, 0.02, -0.02]}>
          <cylinderGeometry args={[0.006, 0.006, 0.03, 12]} />
        </mesh>
      </group>
    );
  }
  // SM.008 con tope
  return (
    <group>
      <mesh material={material} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.05, 12]} />
      </mesh>
      <mesh position={[0, 0, -0.025]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.008, 12]} />
        <meshStandardMaterial color="#262626" roughness={0.9} />
      </mesh>
    </group>
  );
}

// Fijación a Muro Posterior JNF en 3D
function JnfWallClamp3D({
  material,
  model = 'sm_024_clamp',
}: {
  material: THREE.Material;
  model?: WallFixingModel;
}) {
  if (model === 'sm_004_bracket') {
    return (
      <group>
        <mesh material={material} position={[0.01, 0, 0]}>
          <boxGeometry args={[0.025, 0.04, 0.004]} />
        </mesh>
        <mesh material={material} position={[0, 0, 0.01]}>
          <boxGeometry args={[0.004, 0.04, 0.025]} />
        </mesh>
      </group>
    );
  }
  if (model === 'sm_065_clamp') {
    return (
      <mesh material={material} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.02, 0.04, 16]} />
      </mesh>
    );
  }
  // SM.024 pinza rectangular
  return (
    <mesh material={material}>
      <boxGeometry args={[0.035, 0.05, 0.03]} />
    </mesh>
  );
}

// Componente Draggable para Separadores de Urinarios en el área de baño
function DraggableUrinalScreen({
  u,
  idx,
  hardwareMaterial,
  activeTextureUrl,
  baseColorHex,
  thickUrinalM,
  roomWidthM,
  roomLengthM,
  showFixtures,
}: {
  u: UrinalScreenConfig;
  idx: number;
  hardwareMaterial: THREE.Material;
  activeTextureUrl: string | null;
  baseColorHex: string;
  thickUrinalM: number;
  roomWidthM: number;
  roomLengthM: number;
  showFixtures: boolean;
}) {
  const { moveUrinalScreen, updateUrinalScreen, removeUrinalScreen } = useHplBathroomStore();
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragPlaneRef = useRef<THREE.Mesh>(null);

  const uWidthM = u.width / 1000;
  const uHeightM = u.height / 1000;
  const uClearanceM = u.clearanceFloor / 1000;

  // Convertir coordenadas del cuarto (mm desde esquina) a coordenadas Three.js centradas
  const posX = u.posX ?? u.positionX ?? (3800 - idx * 800);
  const posZ = u.posZ ?? 1400;

  const threeX = -roomWidthM / 2 + posX / 1000;
  const threeZ = -roomLengthM / 2 + posZ / 1000;
  const threeY = uClearanceM + uHeightM / 2;
  const rotY = u.rotationY ?? (u.wallAttachment === 'right_wall' ? Math.PI / 2 : 0);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsDragging(true);
    (e.target as HTMLElement)?.setPointerCapture?.(e.pointerId);
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    if (isDragging) {
      e.stopPropagation();
      setIsDragging(false);
      (e.target as HTMLElement)?.releasePointerCapture?.(e.pointerId);
    }
  };

  const handlePlanePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!isDragging) return;
    e.stopPropagation();
    const point = e.point;
    // Transformar de Three.js coords a mm en la sala
    let newX_mm = (point.x + roomWidthM / 2) * 1000;
    let newZ_mm = (point.z + roomLengthM / 2) * 1000;

    // Limitar al perímetro de la sala de baño
    newX_mm = Math.max(200, Math.min(roomWidthM * 1000 - 200, newX_mm));
    newZ_mm = Math.max(200, Math.min(roomLengthM * 1000 - 200, newZ_mm));

    moveUrinalScreen(u.id, Math.round(newX_mm), Math.round(newZ_mm));
  };

  const rotateScreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextRot = ((u.rotationY || 0) + Math.PI / 2) % (Math.PI * 2);
    updateUrinalScreen(u.id, { rotationY: nextRot });
  };

  return (
    <group>
      {/* Plano invisible de arrastre que captura el puntero durante el drag */}
      {isDragging && (
        <mesh
          ref={dragPlaneRef}
          visible={false}
          position={[0, uClearanceM + uHeightM / 2, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          onPointerMove={handlePlanePointerMove}
          onPointerUp={handlePointerUp}
        >
          <planeGeometry args={[roomWidthM * 2, roomLengthM * 2]} />
        </mesh>
      )}

      <group
        position={[threeX, threeY, threeZ]}
        rotation={[0, rotY, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setIsHovered(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          if (!isDragging) setIsHovered(false);
        }}
      >
        {/* Panel Fenólico de Urinario con realce interactivo */}
        <group onPointerDown={handlePointerDown}>
          <SafeTextureMesh
            url={activeTextureUrl}
            colorHex={isDragging ? '#38BDF8' : isHovered ? '#7DD3FC' : baseColorHex}
            geometryArgs={[thickUrinalM, uHeightM, uWidthM]}
          />

          {/* Borde sutil oscuro fenólico */}
          <mesh position={[0, 0, uWidthM / 2]}>
            <boxGeometry args={[thickUrinalM + 0.002, uHeightM, 0.002]} />
            <meshStandardMaterial color="#1C1917" roughness={0.7} />
          </mesh>

          {/* Pinzas de fijación a muro JNF SM.024 (3 unidades en altura) */}
          {[-uHeightM / 3, 0, uHeightM / 3].map((yOffset, pIdx) => (
            <mesh
              key={`urinal_clamp_${pIdx}`}
              material={hardwareMaterial}
              position={[0, yOffset, -uWidthM / 2 + 0.015]}
            >
              <boxGeometry args={[0.035, 0.05, 0.03]} />
            </mesh>
          ))}
        </group>

        {/* Artefacto Cerámico de Urinario acompañante en el área */}
        {showFixtures && (
          <group position={[-0.32, -uHeightM / 2 + 0.25, -uWidthM / 2 + 0.22]}>
            {/* Taza cerámica mural */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.34, 0.55, 0.28]} />
              <meshStandardMaterial color="#FFFFFF" roughness={0.15} metalness={0.05} />
            </mesh>
            {/* Válvula fluxómetro superior cromada */}
            <mesh position={[0, 0.38, -0.05]}>
              <cylinderGeometry args={[0.015, 0.015, 0.2, 12]} />
              <meshStandardMaterial color="#CBD5E1" metalness={0.95} roughness={0.15} />
            </mesh>
            <mesh position={[0, 0.48, -0.05]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.035, 0.035, 0.08, 16]} />
              <meshStandardMaterial color="#CBD5E1" metalness={0.95} roughness={0.15} />
            </mesh>
          </group>
        )}

        {/* UI Flotante de Drag & Drop y Controles en 3D */}
        {(isHovered || isDragging) && (
          <Html position={[0, uHeightM / 2 + 0.15, 0]} center distanceFactor={8}>
            <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-sky-500/60 px-2.5 py-1.5 rounded-xl shadow-2xl text-[11px] text-white whitespace-nowrap select-none pointer-events-auto">
              <div
                className="flex items-center gap-1 cursor-grab active:cursor-grabbing text-sky-400 font-bold"
                title="Arrastra para mover en el baño"
              >
                <Move size={12} className="animate-pulse" />
                <span>{u.name}</span>
              </div>
              <span className="text-slate-500 font-mono text-[10px]">
                ({Math.round(posX)}, {Math.round(posZ)})
              </span>
              <button
                onClick={rotateScreen}
                className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
                title="Rotar 90°"
              >
                <RotateCw size={11} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeUrinalScreen(u.id);
                }}
                className="p-1 hover:bg-rose-500/30 rounded text-rose-400 hover:text-rose-300 transition-colors"
                title="Eliminar separador"
              >
                <Trash2 size={11} />
              </button>
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}

export const HplBathroom3D: React.FC<HplBathroom3DProps> = ({
  batteryOriginX,
  batteryOriginZ,
  urinalsWallZ,
}) => {
  const state = useHplBathroomStore();

  const finishInfo = JNF_FINISHES[state.hardwareFinish];
  const colorObj = HPL_STANDARD_COLORS.find((c) => c.id === state.selectedColorId);
  const baseColorHex = colorObj?.hex || '#F3F4F6';
  const activeTextureUrl = state.customTextureUrl || colorObj?.textureUrl || null;

  // Material de herrajes JNF (Inox Satinado o PVD Titanio)
  const hardwareMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: finishInfo.colorHex,
      metalness: finishInfo.metalness,
      roughness: finishInfo.roughness,
    });
  }, [finishInfo]);

  // Dimensiones en metros
  const footHeightM = state.footHeight / 1000;
  const panelHeightM = state.panelHeight / 1000;
  const dividerHeightM = (state.dividerHeight || state.panelHeight) / 1000;
  const totalHeightM = footHeightM + panelHeightM;
  // Para que el nivel superior siempre coincida con la cota superior total (totalHeightM),
  // el pie del separador lateral se ubica a: dividerBottomYM = totalHeightM - dividerHeightM
  // y la pata del separador mide: dividerFootHeightM = totalHeightM - dividerHeightM (o mínimo 0)
  const dividerCenterYM = totalHeightM - dividerHeightM / 2;
  const dividerFootHeightM = Math.max(0.01, totalHeightM - dividerHeightM);

  const thickDoorM = state.thicknessDoor / 1000;
  const thickPilasterM = state.thicknessPilaster / 1000;
  const thickDividerM = state.thicknessDivider / 1000;
  const thickUrinalM = state.thicknessUrinal / 1000;

  const roomWidthM = state.room.roomWidth / 1000;
  const roomLengthM = state.room.roomLength / 1000;

  // =========================================================================
  // CÁLCULO DE FRENTES: CADA CUBÍCULO TIENE SU PUERTA Y SU PILASTRA FRONTAL
  // Los separadores laterales se unen AL CENTRO de la pilastra frontal con escuadras
  // =========================================================================
  let currentX = batteryOriginX;

  const cubicleFrontModules = state.cubicles.map((cab, idx) => {
    const widthM = cab.cubicleWidth / 1000;
    const depthM = cab.cubicleDepth / 1000;
    const doorWidthM = cab.doorWidth / 1000;

    const startX = currentX;
    const endX = currentX + widthM;
    currentX = endX;

    // En los frentes siempre hay una puerta y una pilastra
    const pilasterW = Math.max(0.08, widthM - doorWidthM);
    const isLeftHinge = cab.doorOpening.startsWith('left');

    // Distribución:
    // Si la bisagra es izquierda: Puerta a la izquierda [startX, startX + doorWidthM], Pilastra a la derecha [startX + doorWidthM, endX]
    // Si la bisagra es derecha: Pilastra a la izquierda [startX, startX + pilasterW], Puerta a la derecha [startX + pilasterW, endX]
    const doorStartX = isLeftHinge ? startX : startX + pilasterW;
    const pilasterStartX = isLeftHinge ? startX + doorWidthM : startX;
    const pilasterCenterX = pilasterStartX + pilasterW / 2;

    return {
      cab,
      idx,
      startX,
      endX,
      widthM,
      depthM,
      doorWidthM,
      pilasterW,
      doorStartX,
      pilasterStartX,
      pilasterCenterX,
      isLeftHinge,
    };
  });

  const batteryTotalWidthM = currentX - batteryOriginX;

  return (
    <group name="HplBathroomPartitionSystem">
      {/* ============================================================== */}
      {/* 1. SEPARADORES LATERALES / DIVISIONES FIJADOS AL CENTRO CON ESCUADRAS */}
      {/* ============================================================== */}
      {/* Separador extremo izquierdo si es isla o abierto */}
      {(state.batteryLayout === 'island' || state.batteryLayout === 'inline_wall_right') && (
        <group position={[batteryOriginX, dividerCenterYM, batteryOriginZ - (state.cubicles[0]?.cubicleDepth || 1400) / 2000]}>
          <SafeTextureMesh
            url={activeTextureUrl}
            colorHex={baseColorHex}
            geometryArgs={[thickDividerM, dividerHeightM, (state.cubicles[0]?.cubicleDepth || 1400) / 1000]}
          />
          {/* Patas JNF regulables que ajustan la parte inferior */}
          <group position={[0, -dividerHeightM / 2, (state.cubicles[0]?.cubicleDepth || 1400) / 4000]}>
            <JnfFoot3D footHeightM={dividerFootHeightM} material={hardwareMaterial} model={state.footModel} />
          </group>
        </group>
      )}

      {/* Separadores divisorios intermedios entre cubículos */}
      {cubicleFrontModules.map(({ cab, idx, depthM, pilasterCenterX }) => {
        if (idx >= state.cubicles.length - 1) return null;
        const nextDepthM = state.cubicles[idx + 1].cubicleDepth / 1000;
        const sepDepthM = Math.max(depthM, nextDepthM);
        // El separador lateral se posiciona en el centro de la pilastra frontal (X = pilasterCenterX)
        const sepCenterX = pilasterCenterX;
        const sepCenterZ = batteryOriginZ - sepDepthM / 2;

        return (
          <group key={`divider_${cab.id}`} position={[sepCenterX, dividerCenterYM, sepCenterZ]}>
            {/* Panel divisor fenólico HPL */}
            <SafeTextureMesh
              url={activeTextureUrl}
              colorHex={baseColorHex}
              geometryArgs={[thickDividerM, dividerHeightM, sepDepthM]}
            />

            {/* Borde fenólico oscuro simulado (dark core) */}
            <mesh position={[0, 0, sepDepthM / 2]}>
              <boxGeometry args={[thickDividerM + 0.001, dividerHeightM, 0.002]} />
              <meshStandardMaterial color="#1C1917" roughness={0.7} />
            </mesh>

            {/* ESCUADRAS DE FIJACIÓN JNF SM.004 EN LA CARA POSTERIOR DE LA PILASTRA (NO VISIBLES POR EL FRENTE) */}
            {[0.2, dividerHeightM / 2, dividerHeightM - 0.2].map((yOffset, eIdx) => (
              <group key={`bracket_junction_${eIdx}`} position={[0, -dividerHeightM / 2 + yOffset, sepDepthM / 2]}>
                {/* Escuadra lado izquierdo (cabina actual) */}
                <JnfCornerBracket
                  position={[-thickDividerM / 2, 0, 0]}
                  side="left"
                  material={hardwareMaterial}
                />
                {/* Escuadra lado derecho (cabina contigua) */}
                <JnfCornerBracket
                  position={[thickDividerM / 2, 0, 0]}
                  side="right"
                  material={hardwareMaterial}
                />
              </group>
            ))}

            {/* Fijaciones a muro posterior (3 unidades en altura) */}
            {[0.2, dividerHeightM / 2, dividerHeightM - 0.2].map((yOffset, bIdx) => (
              <group
                key={`bracket_wall_${bIdx}`}
                position={[0, -dividerHeightM / 2 + yOffset, -sepDepthM / 2 + 0.015]}
              >
                <JnfWallClamp3D material={hardwareMaterial} model={state.wallFixingModel} />
              </group>
            ))}

            {/* Patas regulables JNF (2 por separador) */}
            <group position={[0, -dividerHeightM / 2, sepDepthM / 4]}>
              <JnfFoot3D footHeightM={dividerFootHeightM} material={hardwareMaterial} model={state.footModel} />
            </group>
            <group position={[0, -dividerHeightM / 2, -sepDepthM / 4]}>
              <JnfFoot3D footHeightM={dividerFootHeightM} material={hardwareMaterial} model={state.footModel} />
            </group>
          </group>
        );
      })}

      {/* Separador extremo derecho si es isla o abierto a la izquierda */}
      {(state.batteryLayout === 'island' || state.batteryLayout === 'inline_wall_left') && (
        <group
          position={[
            batteryOriginX + batteryTotalWidthM,
            dividerCenterYM,
            batteryOriginZ - (state.cubicles[state.cubicles.length - 1]?.cubicleDepth || 1400) / 2000,
          ]}
        >
          <SafeTextureMesh
            url={activeTextureUrl}
            colorHex={baseColorHex}
            geometryArgs={[
              thickDividerM,
              dividerHeightM,
              (state.cubicles[state.cubicles.length - 1]?.cubicleDepth || 1400) / 1000,
            ]}
          />
          {/* Patas regulables */}
          <group position={[0, -dividerHeightM / 2, (state.cubicles[state.cubicles.length - 1]?.cubicleDepth || 1400) / 4000]}>
            <JnfFoot3D footHeightM={dividerFootHeightM} material={hardwareMaterial} model={state.footModel} />
          </group>
        </group>
      )}

      {/* ============================================================== */}
      {/* 2. FRENTES MODULARES: PUERTA + PILASTRA POR CADA CUBÍCULO */}
      {/* ============================================================== */}
      {cubicleFrontModules.map(
        ({
          cab,
          doorWidthM,
          pilasterW,
          doorStartX,
          pilasterCenterX,
          isLeftHinge,
        }) => {
          // Apertura de puerta
          let openAngle = 0;
          if (cab.doorState === 'open_45') openAngle = Math.PI / 4;
          if (cab.doorState === 'open_90') openAngle = Math.PI / 2;

          const opensOutward = cab.doorOpening.endsWith('out');
          const actualAngle = opensOutward ? openAngle : -openAngle;
          const signAngle = isLeftHinge ? actualAngle : -actualAngle;

          const doorPivotX = isLeftHinge ? doorStartX + 0.005 : doorStartX + doorWidthM - 0.005;

          return (
            <group key={`front_module_${cab.id}`}>
              {/* PILASTRA FRONTAL OBLIGATORIA DEL CUBÍCULO */}
              <group position={[pilasterCenterX, footHeightM + panelHeightM / 2, batteryOriginZ]}>
                <SafeTextureMesh
                  url={activeTextureUrl}
                  colorHex={baseColorHex}
                  geometryArgs={[pilasterW, panelHeightM, thickPilasterM]}
                />
                {/* Pata regulable JNF bajo la pilastra frontal */}
                <group position={[0, -panelHeightM / 2, 0]}>
                  <JnfFoot3D footHeightM={footHeightM} material={hardwareMaterial} model={state.footModel} />
                </group>
              </group>

              {/* PUERTA DEL CUBÍCULO CON PIVOTE DE BISAGRA */}
              <group position={[doorPivotX, footHeightM + panelHeightM / 2, batteryOriginZ]} rotation={[0, signAngle, 0]}>
                {/* Hoja de la puerta HPL */}
                <SafeTextureMesh
                  url={activeTextureUrl}
                  colorHex={baseColorHex}
                  geometryArgs={[doorWidthM - 0.01, panelHeightM - 0.02, thickDoorM]}
                  position={[isLeftHinge ? (doorWidthM - 0.01) / 2 : -(doorWidthM - 0.01) / 2, 0, 0]}
                />

                {/* BISAGRAS JNF (3 en altura) */}
                {[0.18, panelHeightM / 2, panelHeightM - 0.22].map((yOffset, hIdx) => (
                  <group key={`hinge_${hIdx}`} position={[0, -panelHeightM / 2 + yOffset, 0]}>
                    <JnfHinge3D
                      isLeftHinge={isLeftHinge}
                      material={hardwareMaterial}
                      model={state.hingeModel}
                    />
                  </group>
                ))}

                {/* CERROJO DE BAÑO CON INDICADOR ROJO/VERDE */}
                <group position={[isLeftHinge ? doorWidthM - 0.08 : -doorWidthM + 0.08, 0, 0]}>
                  <JnfLock3D
                    isClosed={cab.doorState === 'closed'}
                    thickDoorM={thickDoorM}
                    material={hardwareMaterial}
                    model={state.lockModel}
                  />
                </group>

                {/* TIRADOR DOBLE ANTIVANDÁLICO JNF */}
                <group position={[isLeftHinge ? doorWidthM - 0.08 : -doorWidthM + 0.08, -0.15, 0]}>
                  <JnfHandle3D
                    thickDoorM={thickDoorM}
                    material={hardwareMaterial}
                    model={state.handleModel}
                  />
                </group>

                {/* PERCHA / COLGADOR CON TOPE EN PARTE SUPERIOR INTERIOR */}
                <group position={[isLeftHinge ? (doorWidthM - 0.01) / 2 : -(doorWidthM - 0.01) / 2, panelHeightM / 2 - 0.25, -thickDoorM / 2 - 0.025]}>
                  <JnfHook3D
                    material={hardwareMaterial}
                    model={state.hookModel}
                  />
                </group>
              </group>
            </group>
          );
        }
      )}

      {/* ============================================================== */}
      {/* 3. ESTRUCTURA AÉREA SUPERIOR DE ESTABILIZACIÓN JNF */}
      {/* ============================================================== */}
      {state.stabilizerSystem === 'round_19' && (
        <group position={[batteryOriginX + batteryTotalWidthM / 2, totalHeightM + 0.015, batteryOriginZ]}>
          <mesh material={hardwareMaterial} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.0095, 0.0095, batteryTotalWidthM + 0.06, 20]} />
          </mesh>
          {cubicleFrontModules.map(({ pilasterCenterX }, idx) => (
            <mesh
              key={`upper_clamp_${idx}`}
              material={hardwareMaterial}
              position={[pilasterCenterX - batteryOriginX - batteryTotalWidthM / 2, -0.015, 0]}
            >
              <boxGeometry args={[0.035, 0.045, 0.04]} />
            </mesh>
          ))}
        </group>
      )}

      {state.stabilizerSystem === 'square_20' && (
        <group position={[batteryOriginX + batteryTotalWidthM / 2, totalHeightM + 0.012, batteryOriginZ]}>
          <mesh material={hardwareMaterial} castShadow>
            <boxGeometry args={[batteryTotalWidthM + 0.06, 0.02, 0.02]} />
          </mesh>
          {cubicleFrontModules.map(({ pilasterCenterX }, idx) => (
            <mesh
              key={`upper_clamp_sq_${idx}`}
              material={hardwareMaterial}
              position={[pilasterCenterX - batteryOriginX - batteryTotalWidthM / 2, -0.015, 0]}
            >
              <boxGeometry args={[0.032, 0.038, 0.032]} />
            </mesh>
          ))}
        </group>
      )}

      {state.stabilizerSystem === 'u_profile' && (
        <group position={[batteryOriginX + batteryTotalWidthM / 2, totalHeightM, batteryOriginZ]}>
          <mesh material={hardwareMaterial} castShadow>
            <boxGeometry args={[batteryTotalWidthM + 0.02, 0.025, 0.02]} />
          </mesh>
        </group>
      )}

      {/* ============================================================== */}
      {/* 4. SEPARADORES DE URINARIOS (DRAG & DROP EN EL ÁREA DEL BAÑO) */}
      {/* ============================================================== */}
      {state.urinalScreens.map((u, idx) => (
        <DraggableUrinalScreen
          key={`urinal_screen_drag_${u.id}`}
          u={u}
          idx={idx}
          hardwareMaterial={hardwareMaterial}
          activeTextureUrl={activeTextureUrl}
          baseColorHex={baseColorHex}
          thickUrinalM={thickUrinalM}
          roomWidthM={roomWidthM}
          roomLengthM={roomLengthM}
          showFixtures={state.room.showFixtures}
        />
      ))}
    </group>
  );
};
