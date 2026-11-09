import React, { useMemo } from 'react';
import { useKitchenStore } from '../../store/kitchenStore';
import { Edges } from '@react-three/drei';
import { ArchitecturalDoor } from './ArchitecturalDoor';
import { ArchitecturalWindow } from './ArchitecturalWindow';

export function ArchitecturalElementsRenderer() {
  const { architecturalElements, activeArchElementId, setActiveArchElement, setDraggingArchElementId, wallColor, toolMode, viewMode } = useKitchenStore();
  const walls = useKitchenStore((s) => s.walls);
  const roomConfig = useKitchenStore((s) => s.roomConfig);

  const effectiveWallIds = useMemo(() => {
    const ids = new Set<string>();
    (walls || []).forEach(w => {
      if (w.id) {
        ids.add(w.id);
        ids.add(`wall_${w.id}`);
      }
    });
    if (roomConfig?.vertices && roomConfig.vertices.length >= 3) {
      roomConfig.vertices.forEach((_, i) => {
        ids.add(`wall_v_${i}`);
      });
    }
    return ids;
  }, [walls, roomConfig]);

  // Elements with a valid wallId are rendered inside Wall components; standalone or orphaned elements render here
  const standaloneElements = architecturalElements?.filter(el => !el.wallId || !effectiveWallIds.has(el.wallId)) || [];

  if (standaloneElements.length === 0) return null;

  return (
    <group name="architecturalElementsGroup">
      {standaloneElements.map((el) => {
        if (toolMode === 'move_active' && el.id === activeArchElementId) return null;
        const isSelected = el.id === activeArchElementId;
        const [x, , z] = el.position;
        const y = el.elevation + el.height / 2;
        const rot = el.rotation || 0;
        const depth = el.depth || 16; // Wall thickness match

        return (
          <group
            key={el.id}
            position={[x, y, z]}
            rotation={[0, rot + Math.PI / 2, 0]}
            onPointerDown={(e) => {
              e.stopPropagation();
              if (e.nativeEvent && e.nativeEvent.stopImmediatePropagation) {
                e.nativeEvent.stopImmediatePropagation();
              }
              setActiveArchElement(el.id);
              setDraggingArchElementId(el.id);
            }}
            onClick={(e) => {
              e.stopPropagation();
              setActiveArchElement(el.id);
            }}
          >
            {el.type === 'door' && (
              <ArchitecturalDoor
                width={el.width}
                height={el.height}
                depth={depth}
                isSelected={isSelected}
                viewMode={viewMode}
                isOpen={el.isOpen}
                hingeSide={el.hingeSide}
              />
            )}

            {el.type === 'window' && (
              <ArchitecturalWindow
                width={el.width}
                height={el.height}
                depth={depth}
                isSelected={isSelected}
                viewMode={viewMode}
                isOpen={el.isOpen}
              />
            )}

            {el.type === 'pillar' && (
              <group name="archRealPillar">
                <mesh castShadow receiveShadow position={[0, 0, 0]}>
                  <boxGeometry args={[el.width, el.height, depth]} />
                  <meshStandardMaterial
                    color={wallColor || '#cbd5e1'}
                    roughness={0.7}
                    metalness={0.05}
                  />
                  <Edges scale={1} threshold={15} color={isSelected ? '#0284c7' : '#64748b'} />
                </mesh>
              </group>
            )}

            {/* Indicador de Selección rectangular sutil */ }
            {isSelected && (
              <group position={[0, -el.height / 2 + 0.5, 0]}>
                <mesh position={[0, 0, (depth + 1.6) / 2]}>
                  <boxGeometry args={[el.width + 2, 0.4, 0.8]} />
                  <meshBasicMaterial color="#0284c7" />
                </mesh>
                <mesh position={[0, 0, -(depth + 1.6) / 2]}>
                  <boxGeometry args={[el.width + 2, 0.4, 0.8]} />
                  <meshBasicMaterial color="#0284c7" />
                </mesh>
                <mesh position={[-(el.width + 1.6) / 2, 0, 0]}>
                  <boxGeometry args={[0.8, 0.4, depth + 0.8]} />
                  <meshBasicMaterial color="#0284c7" />
                </mesh>
                <mesh position={[(el.width + 1.6) / 2, 0, 0]}>
                  <boxGeometry args={[0.8, 0.4, depth + 0.8]} />
                  <meshBasicMaterial color="#0284c7" />
                </mesh>
              </group>
            )}
          </group>
        );
      })}
    </group>
  );
}
