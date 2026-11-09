import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useKitchenStore } from '../../store/kitchenStore';
import { MEP_TYPE_CONFIGS, MepPoint } from '../../types/mep';
import { detectMepClashes } from '../../utils/mepClashDetection';
import { KitchenMepDimensionsRenderer } from './KitchenMepDimensionsRenderer';

export const KitchenMepScene: React.FC = () => {
  const {
    mepPoints,
    showMep,
    showMepClashes,
    activeMepId,
    setActiveMepId,
    cabinets,
    countertopConfig,
    viewMode,
  } = useKitchenStore();

  const is2D = viewMode === '2d';

  // Detección reactiva de interferencias
  const clashes = useMemo(() => {
    return detectMepClashes(mepPoints, cabinets, countertopConfig);
  }, [mepPoints, cabinets, countertopConfig]);

  // Mapa de colisiones por mepPointId
  const clashMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const c of clashes) {
      if (!map.has(c.mepPointId)) {
        map.set(c.mepPointId, []);
      }
      map.get(c.mepPointId)!.push(c.title);
      if (c.relatedMepPointId) {
        if (!map.has(c.relatedMepPointId)) {
          map.set(c.relatedMepPointId, []);
        }
        map.get(c.relatedMepPointId)!.push(c.title);
      }
    }
    return map;
  }, [clashes]);

  if (!showMep || mepPoints.length === 0) return null;

  return (
    <group name="kitchen-mep-layer">
      {mepPoints.map((point) => {
        const config = MEP_TYPE_CONFIGS[point.type];
        const isSelected = activeMepId === point.id;
        const pointClashes = clashMap.get(point.id);
        const hasClash = showMepClashes && pointClashes && pointClashes.length > 0;

        return (
          <group
            key={point.id}
            position={[point.position[0], point.position[1], point.position[2]]}
            rotation={[0, point.rotation, 0]}
            onClick={(e) => {
              e.stopPropagation();
              setActiveMepId(point.id);
            }}
          >
            {/* Geometría 3D según especialidad */}
            {is2D ? (
              // Modo 2D: Marcador circular técnico con cota
              <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[4, 16]} />
                <meshBasicMaterial color={config.colorHex} />
              </mesh>
            ) : (
              // Modo 3D: Modelo detallado según tipo
              <Mep3DGeometry point={point} isSelected={isSelected} hasClash={hasClash} />
            )}

            {/* Halo de advertencia de interferencia si hay colisión */}
            {hasClash && !is2D && (
              <mesh position={[0, 0, 4]}>
                <sphereGeometry args={[7, 16, 16]} />
                <meshBasicMaterial
                  color="#ef4444"
                  transparent
                  opacity={0.35}
                  wireframe
                />
              </mesh>
            )}

            {/* Marcador técnico Flotante / Etiqueta BIM */}
            <Html
              position={[0, is2D ? 0 : 8, 4]}
              center
              distanceFactor={80}
              zIndexRange={[100, 0]}
              style={{ pointerEvents: 'auto' }}
            >
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMepId(point.id);
                }}
                className={`flex flex-col items-center cursor-pointer transition-all transform select-none ${
                  isSelected ? 'scale-110 z-50' : 'hover:scale-105'
                }`}
              >
                {/* Badge principal */}
                <div
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded shadow-lg text-[10px] font-bold tracking-tight whitespace-nowrap border ${
                    isSelected
                      ? 'ring-2 ring-white ring-offset-1 border-white text-white'
                      : 'border-slate-700/60 text-white'
                  }`}
                  style={{
                    backgroundColor: config.colorHex,
                    boxShadow: isSelected
                      ? '0 0 12px rgba(255,255,255,0.4)'
                      : '0 2px 6px rgba(0,0,0,0.35)',
                  }}
                >
                  <span>{config.standardSymbol}</span>
                  <span>{config.shortLabel}</span>
                  <span className="opacity-90 font-mono text-[9px] bg-black/30 px-1 rounded">
                    +{point.elevation}
                  </span>
                </div>

                {/* Tag de colisión / alerta si existe */}
                {hasClash && (
                  <div className="mt-0.5 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded shadow-md border border-white/80 animate-pulse flex items-center gap-1">
                    <span>⚠️</span>
                    <span>Interferencia</span>
                  </div>
                )}
              </div>
            </Html>
          </group>
        );
      })}
      <KitchenMepDimensionsRenderer />
    </group>
  );
};

interface Mep3DGeometryProps {
  point: MepPoint;
  isSelected: boolean;
  hasClash: boolean;
}

const Mep3DGeometry: React.FC<Mep3DGeometryProps> = ({ point, isSelected, hasClash }) => {
  const config = MEP_TYPE_CONFIGS[point.type];

  // Material de caño / terminal según tipo
  switch (point.type) {
    case 'water_cold':
    case 'water_hot': {
      const isCold = point.type === 'water_cold';
      return (
        <group>
          {/* Tubería saliendo del muro */}
          <mesh position={[0, 0, 3]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[1.2, 1.2, 6, 16]} />
            <meshStandardMaterial
              color={isCold ? '#0284c7' : '#e11d48'}
              roughness={0.3}
              metalness={0.7}
            />
          </mesh>
          {/* Llave de paso angular cromada */}
          <mesh position={[0, 0, 6.5]}>
            <boxGeometry args={[2.5, 3.5, 2.5]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.2} metalness={0.9} />
          </mesh>
          {/* Maneta de la llave angular (azul o roja) */}
          <mesh position={[0, 2, 6.5]}>
            <cylinderGeometry args={[1.4, 1.4, 0.8, 12]} />
            <meshStandardMaterial color={isCold ? '#0284c7' : '#e11d48'} />
          </mesh>
          {/* Salida de flexible hacia abajo */}
          <mesh position={[0, -2.5, 6.5]} rotation={[0, 0, 0]}>
            <cylinderGeometry args={[0.7, 0.7, 3, 12]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.4} />
          </mesh>
        </group>
      );
    }

    case 'drain': {
      // Descarga sanitaria PVC Ø50mm
      return (
        <group>
          {/* Tubo de PVC gris saliendo del muro */}
          <mesh position={[0, 0, 3.5]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[2.5, 2.5, 7, 24]} />
            <meshStandardMaterial color="#475569" roughness={0.5} metalness={0.1} />
          </mesh>
          {/* Codo o campana frontal de PVC */}
          <mesh position={[0, 0, 7]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[2.8, 2.8, 1.5, 24]} />
            <meshStandardMaterial color="#334155" roughness={0.5} />
          </mesh>
          {/* Tapa de registro o entrada sifón */}
          <mesh position={[0, 0, 7.8]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[2.1, 2.1, 0.4, 24]} />
            <meshStandardMaterial color="#1e293b" roughness={0.8} />
          </mesh>
        </group>
      );
    }

    case 'electric_socket': {
      // Placa de enchufe doble embutida sobre salpicadero
      return (
        <group>
          {/* Placa frontal blanca/marfil */}
          <mesh position={[0, 0, 0.6]}>
            <boxGeometry args={[11.5, 7.5, 1.2]} />
            <meshStandardMaterial
              color="#f8fafc"
              roughness={0.2}
              metalness={0.1}
            />
          </mesh>
          {/* Alveolos toma 1 */}
          <mesh position={[-2.8, 0, 1.25]}>
            <boxGeometry args={[2.5, 4, 0.2]} />
            <meshStandardMaterial color="#1e293b" roughness={0.9} />
          </mesh>
          {/* Alveolos toma 2 */}
          <mesh position={[2.8, 0, 1.25]}>
            <boxGeometry args={[2.5, 4, 0.2]} />
            <meshStandardMaterial color="#1e293b" roughness={0.9} />
          </mesh>
        </group>
      );
    }

    case 'electric_power': {
      // Toma de fuerza 16A/20A para horno o encimera
      return (
        <group>
          {/* Caja estanca o placa industrial naranja/roja */}
          <mesh position={[0, 0, 1]}>
            <boxGeometry args={[9, 9, 2]} />
            <meshStandardMaterial color="#f97316" roughness={0.4} />
          </mesh>
          {/* Conector redondo de fuerza con tapa */}
          <mesh position={[0, 0, 2.2]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[2.6, 2.6, 0.6, 20]} />
            <meshStandardMaterial color="#ea580c" roughness={0.3} />
          </mesh>
        </group>
      );
    }

    case 'gas': {
      // Cañería de cobre con llave de paso de bola (maneta amarilla)
      return (
        <group>
          {/* Cañería de cobre saliendo del muro */}
          <mesh position={[0, 0, 3]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[1.2, 1.2, 6, 16]} />
            <meshStandardMaterial color="#b45309" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Cuerpo de la válvula de gas en latón */}
          <mesh position={[0, 0, 6.5]}>
            <boxGeometry args={[3, 3, 3]} />
            <meshStandardMaterial color="#ca8a04" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Palanca / maneta amarilla de seguridad */}
          <mesh position={[0, 2.2, 7.5]} rotation={[0, 0, 0.4]}>
            <boxGeometry args={[1.2, 5, 0.5]} />
            <meshStandardMaterial color="#eab308" roughness={0.4} />
          </mesh>
        </group>
      );
    }

    default:
      return null;
  }
};
