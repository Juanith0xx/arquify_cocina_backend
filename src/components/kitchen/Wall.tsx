import React, { useRef, useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { WallType, useKitchenStore } from '../../store/kitchenStore';
import { useAdminStore } from '../../store/adminStore';
import { useStore } from '../../store';
import { Edges, Line, Text, Billboard } from '@react-three/drei';
import { getWallInwardNormal } from '../../utils/kitchenCollision';
import { ArchitecturalDoor } from './ArchitecturalDoor';
import { ArchitecturalWindow } from './ArchitecturalWindow';
import { getWallLabel } from '../../utils/roomGeometry';

export function Wall({ id, start, end, thickness, height, isInterior, index }: WallType & { id?: string; index?: number }) {
   const length = Math.hypot(end[0] - start[0], end[1] - start[1]);
   const cx = (start[0] + end[0]) / 2;
   const cz = (start[1] + end[1]) / 2;
   const rotY = Math.atan2(start[0] - end[0], start[1] - end[1]);
   const showDimensions = useStore((s) => s.showDimensions);
   const wallColor = useKitchenStore((s) => s.wallColor) || '#E2E8F0';
   const viewMode = useKitchenStore((s) => s.viewMode);
   const roomConfig = useKitchenStore((s) => s.roomConfig);
   const architecturalElements = useKitchenStore((s) => s.architecturalElements);
   const activeArchElementId = useKitchenStore((s) => s.activeArchElementId);
   const setActiveArchElement = useKitchenStore((s) => s.setActiveArchElement);
   const setDraggingArchElementId = useKitchenStore((s) => s.setDraggingArchElementId);
   const activeWallId = useKitchenStore((s) => s.activeWallId);
   const setActiveWall = useKitchenStore((s) => s.setActiveWall);
   const setDraggingWallId = useKitchenStore((s) => s.setDraggingWallId);
   const toolMode = useKitchenStore((s) => s.toolMode);
   const spaceDecoration = useKitchenStore((s) => s.spaceDecoration);
   const supplies = useAdminStore((s) => s.supplies);
   const activeDecoWallId = useKitchenStore((s) => s.activeDecoWallId);
   const setActiveDecoWallId = useKitchenStore((s) => s.setActiveDecoWallId);
   const isWallDecoTabOpen = useKitchenStore((s) => s.isWallDecoTabOpen);

   // Obtener acabado decorativo específico asignado a este muro en el menú Deco
   const wallDeco = useMemo(() => {
      if (!id || !spaceDecoration?.wallDecorations) return undefined;
      // 1. Coincidencia exacta de ID
      if (spaceDecoration.wallDecorations[id]) {
         return spaceDecoration.wallDecorations[id];
      }
      // 2. Coincidencia por índice numérico (ej: wall_0_v1_v2 <-> wall_v_0 <-> wall_0)
      const idMatch = id.match(/wall_v?_?(\d+)/i) || id.match(/\d+/);
      if (idMatch) {
         const idx = idMatch[1] || idMatch[0];
         for (const [key, val] of Object.entries(spaceDecoration.wallDecorations)) {
            const keyMatch = key.match(/wall_v?_?(\d+)/i) || key.match(/\d+/);
            if (keyMatch && (keyMatch[1] || keyMatch[0]) === idx) {
               return val;
            }
         }
      }
      return undefined;
   }, [id, spaceDecoration]);

   const activeSupply = useMemo(() => {
      if (!wallDeco?.supplyId) return undefined;
      return supplies?.find((s) => s.id === wallDeco.supplyId);
   }, [wallDeco, supplies]);

   const effectiveDecoImage = wallDeco?.imageUrl || activeSupply?.imageUrl;
   const isHexOrColor = Boolean(
      effectiveDecoImage &&
      (effectiveDecoImage.startsWith('#') || effectiveDecoImage.startsWith('rgb'))
   );

   const [wallTexture, setWallTexture] = useState<THREE.Texture | null>(null);

   useEffect(() => {
      if (!effectiveDecoImage || isHexOrColor) {
         if (wallTexture) {
            wallTexture.dispose();
            setWallTexture(null);
         }
         return;
      }

      let isMounted = true;
      const loader = new THREE.TextureLoader();
      loader.load(
         effectiveDecoImage,
         (tex) => {
            if (!isMounted) {
               tex.dispose();
               return;
            }
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(Math.max(1, length / 100), Math.max(1, height / 100));
            tex.needsUpdate = true;
            setWallTexture(tex);
         },
         undefined,
         () => {
            if (isMounted) setWallTexture(null);
         }
      );

      return () => {
         isMounted = false;
      };
   }, [effectiveDecoImage, isHexOrColor, length, height]);

   const wall3DColor = wallTexture
      ? '#ffffff'
      : (isHexOrColor && effectiveDecoImage ? effectiveDecoImage : wallColor);

   // Cálculo de índice y letra normalizada del muro (A, B, C, D, E...)
   const wallIndex = useMemo(() => {
      if (index !== undefined) return index;
      const idMatch = id?.match(/wall_v?_?(\d+)/i) || id?.match(/\d+/);
      return idMatch ? parseInt(idMatch[1] || idMatch[0], 10) : 0;
   }, [index, id]);

   const wallLabel = useMemo(() => getWallLabel(wallIndex), [wallIndex]);

   const isThisDecoWallSelected = useMemo(() => {
      if (!activeDecoWallId || !id) return false;
      if (activeDecoWallId === id) return true;
      const idMatch = id.match(/wall_v?_?(\d+)/i) || id.match(/\d+/);
      const activeMatch = activeDecoWallId.match(/wall_v?_?(\d+)/i) || activeDecoWallId.match(/\d+/);
      if (idMatch && activeMatch && (idMatch[1] || idMatch[0]) === (activeMatch[1] || activeMatch[0])) {
         return true;
      }
      return false;
   }, [id, activeDecoWallId]);

   const isHighlightedInDeco = isWallDecoTabOpen && isThisDecoWallSelected;

   // Solo los muros creados por el usuario (interiores) son interactivos y seleccionables.
   // Los muros perimetrales exteriores quedan protegidos.
   const isInteriorWall = Boolean(isInterior || (id && !id.startsWith('wall_v_') && !/^wall_\d+_/.test(id)));
   const isWallSelected = isInteriorWall && !!id && activeWallId === id;

   const groupRef = useRef<THREE.Group>(null);
   const wallBodyRef = useRef<THREE.Group>(null);
   const pointerDownPosRef = useRef<{ x: number; y: number } | null>(null);

   const wallElements = useMemo(() => {
      return architecturalElements.filter(el => {
         if (id && (el.wallId === id || el.wallId === `wall_${id}` || `wall_${el.wallId}` === id)) return true;
         const dist = Math.hypot(el.position[0] - cx, el.position[2] - cz);
         return !el.wallId && dist < length / 2 + 30;
      });
   }, [architecturalElements, id, cx, cz, length]);

   const wallOpenings = useMemo(() => {
      return wallElements.filter(el => el.type === 'door' || el.type === 'window');
   }, [wallElements]);

   const wallSegments = useMemo(() => {
      if (wallOpenings.length === 0) return null;

      const effectiveColor = isWallSelected
         ? (viewMode === '2d' ? '#ea580c' : '#fb923c')
         : (viewMode === '2d' ? '#334155' : wall3DColor);
      const effectiveMap = viewMode === '2d' ? null : wallTexture;
      const effectiveEdgeColor = isWallSelected ? '#f97316' : (viewMode === '2d' ? '#0f172a' : '#94a3b8');

      // Sort openings along local Z (centerZ = -offset)
      const sorted = [...wallOpenings]
         .map(el => {
            const centerZ = -(el.offset || 0);
            const halfW = el.width / 2;
            return {
               el,
               centerZ,
               halfW,
               zStart: Math.max(-length / 2, centerZ - halfW),
               zEnd: Math.min(length / 2, centerZ + halfW),
               elev: el.elevation || 0,
               openingH: el.height,
            };
         })
         .sort((a, b) => a.zStart - b.zStart);

      const elements: React.ReactNode[] = [];
      let currentZ = -length / 2;

      sorted.forEach((op, idx) => {
         // Solid wall segment before opening
         if (op.zStart > currentZ + 0.1) {
            const segLen = op.zStart - currentZ;
            const segCenterZ = currentZ + segLen / 2;
            elements.push(
               <mesh key={`solid-${idx}`} position={[0, 0, segCenterZ]} castShadow receiveShadow>
                  <boxGeometry args={[thickness, height, segLen]} />
                  <meshStandardMaterial color={effectiveColor} map={effectiveMap} roughness={0.85} metalness={0.05} />
                  <Edges scale={1} threshold={15} color={effectiveEdgeColor} />
               </mesh>
            );
         }

         // Under window sill (antepecho)
         const opLen = op.zEnd - Math.max(currentZ, op.zStart);
         if (opLen > 0.1) {
            const opCenterZ = (Math.max(currentZ, op.zStart) + op.zEnd) / 2;

            if (op.el.type === 'window' && op.elev > 0.1) {
               elements.push(
                  <mesh key={`under-${idx}`} position={[0, -height / 2 + op.elev / 2, opCenterZ]} castShadow receiveShadow>
                     <boxGeometry args={[thickness, op.elev, opLen]} />
                     <meshStandardMaterial color={effectiveColor} map={effectiveMap} roughness={0.85} metalness={0.05} />
                     <Edges scale={1} threshold={15} color={effectiveEdgeColor} />
                  </mesh>
               );
            }

            // Above door/window lintel (dintel)
            const topSpace = height - (op.elev + op.openingH);
            if (topSpace > 0.1) {
               elements.push(
                  <mesh key={`over-${idx}`} position={[0, height / 2 - topSpace / 2, opCenterZ]} castShadow receiveShadow>
                     <boxGeometry args={[thickness, topSpace, opLen]} />
                     <meshStandardMaterial color={effectiveColor} map={effectiveMap} roughness={0.85} metalness={0.05} />
                     <Edges scale={1} threshold={15} color={effectiveEdgeColor} />
                  </mesh>
               );
            }
         }

         currentZ = Math.max(currentZ, op.zEnd);
      });

      // Tail solid wall segment
      if (currentZ < length / 2 - 0.1) {
         const segLen = length / 2 - currentZ;
         const segCenterZ = currentZ + segLen / 2;
         elements.push(
            <mesh key="solid-tail" position={[0, 0, segCenterZ]} castShadow receiveShadow>
               <boxGeometry args={[thickness, height, segLen]} />
               <meshStandardMaterial color={effectiveColor} map={effectiveMap} roughness={0.85} metalness={0.05} />
               <Edges scale={1} threshold={15} color={effectiveEdgeColor} />
            </mesh>
         );
      }

      return elements;
   }, [wallOpenings, length, thickness, height, wallColor, viewMode, isWallSelected, wall3DColor, wallTexture]);

   // Vector normal hacia el interior de la habitación
   const inwardNormal = useMemo(() => {
      const poly = roomConfig?.vertices?.map(v => [v.x, v.y] as [number, number]) || [];
      return getWallInwardNormal(start[0], start[1], end[0], end[1], poly);
   }, [start, end, roomConfig]);

   // Ocultación dinámica inteligente (Camera Occlusion / Cutaway Wall)
   useFrame(({ camera }) => {
      if (!wallBodyRef.current) return;
      
      if (viewMode === '2d') {
         wallBodyRef.current.visible = true;
         if (isInteriorWall) {
            wallBodyRef.current.traverse((child: any) => {
               if (child.isMesh && child.material && !child.material.wireframe) {
                  child.material.transparent = false;
                  child.material.opacity = 1.0;
                  child.material.depthWrite = true;
               }
            });
         }
         return;
      }

      const camX = camera.position.x;
      const camZ = camera.position.z;
      const vCamX = camX - cx;
      const vCamZ = camZ - cz;

      const dot = vCamX * inwardNormal[0] + vCamZ * inwardNormal[1];

      if (!isInteriorWall) {
         // Muros exteriores perimetrales: corte tradicional (se ocultan si la cámara está afuera)
         wallBodyRef.current.visible = dot > -5;
      } else {
         // Muros interiores: NUNCA se apagan para no perder el contexto ni dejar muebles flotando
         wallBodyRef.current.visible = true;

         // Cuando el muro queda frente a la cámara interponiéndose en la visual,
         // pasa a modo transparente (opacity: 0.25) para que los muebles apoyados se entiendan claramente
         const isOccluding = dot <= -2;
         wallBodyRef.current.traverse((child: any) => {
            if (child.isMesh && child.material && !child.material.wireframe) {
               if (isOccluding) {
                  child.material.transparent = true;
                  child.material.opacity = 0.25;
                  child.material.depthWrite = false;
                  child.castShadow = false;
               } else {
                  child.material.transparent = false;
                  child.material.opacity = 1.0;
                  child.material.depthWrite = true;
                  child.castShadow = true;
               }
            }
         });
      }
   });

   return (
     <group ref={groupRef} name="wallGroup" position={[cx, height/2, cz]} rotation={[0, rotY, 0]}>
       <group 
         ref={wallBodyRef} 
         name="wallBodyGroup"
         onPointerDown={(e) => {
           if (e.button === 0) {
             pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
             if (isInteriorWall && id && (toolMode === 'select' || toolMode === 'move_active')) {
               e.stopPropagation();
               setActiveWall(id);
               setDraggingWallId(id);
             }
           }
         }}
         onPointerUp={(e) => {
           if (e.button !== 0) return;
           const currentDragging = useKitchenStore.getState().draggingWallId;
           if (currentDragging === id) {
             setDraggingWallId(null);
           }
           if (!pointerDownPosRef.current) return;
           const dx = e.clientX - pointerDownPosRef.current.x;
           const dy = e.clientY - pointerDownPosRef.current.y;
           const dist = Math.hypot(dx, dy);
           pointerDownPosRef.current = null;

           if (dist > 5) return;

           // Solo los muros interiores creados pueden seleccionarse
           if (isInteriorWall && toolMode === 'select' && id) {
             e.stopPropagation();
             setActiveWall(id);
           }
           if (isWallDecoTabOpen && id) {
             e.stopPropagation();
             setActiveDecoWallId(id);
           }
         }}
       >
         {wallOpenings.length === 0 ? (
           <mesh name="wall" castShadow receiveShadow>
             <boxGeometry args={[thickness, height, length]} />
             <meshStandardMaterial 
               color={isWallSelected ? (viewMode === '2d' ? '#ea580c' : '#fb923c') : (viewMode === '2d' ? '#334155' : wall3DColor)} 
               map={viewMode === '2d' ? null : wallTexture} 
               roughness={0.85} 
               metalness={0.05} 
             />
             <Edges scale={1} threshold={15} color={isWallSelected || isHighlightedInDeco ? '#f97316' : (viewMode === '2d' ? '#0f172a' : '#94a3b8')} />
           </mesh>
         ) : (
           <group name="segmentedWall">
             {wallSegments}
           </group>
         )}

         {/* Visual outline and bounding highlight when wall is selected */}
         {(isWallSelected || isHighlightedInDeco) && (
           <group position={[0, 0, 0]}>
             <mesh position={[0, 0, 0]}>
               <boxGeometry args={[thickness + 1.2, height + 1.2, length + 1.2]} />
               <meshBasicMaterial color="#f97316" wireframe transparent opacity={0.6} />
             </mesh>
           </group>
         )}
       </group>

       {wallElements.map((el) => {
         if (toolMode === 'move_active' && el.id === activeArchElementId) return null;
         const isSelected = el.id === activeArchElementId;
         const yLocal = el.elevation + el.height / 2 - height / 2;
         const zLocal = el.offset !== undefined ? -el.offset : 0;
         const elDepth = el.type === 'pillar' ? (el.depth ?? thickness) : thickness;
         const inwardSign = (-(end[1] - start[1]) * inwardNormal[0] + (end[0] - start[0]) * inwardNormal[1]) >= 0 ? 1 : -1;
         const pillarZ = el.type === 'pillar' ? (inwardSign * (elDepth - thickness) / 2) : 0;

         return (
           <group
             key={el.id}
             position={[pillarZ, yLocal, zLocal]}
             rotation={[0, Math.PI / 2, 0]}
             onClick={(e) => {
               e.stopPropagation();
               setActiveArchElement(el.id);
             }}
             onPointerDown={(e) => {
               e.stopPropagation();
               if (e.nativeEvent && e.nativeEvent.stopImmediatePropagation) {
                 e.nativeEvent.stopImmediatePropagation();
               }
               setActiveArchElement(el.id);
               setDraggingArchElementId(el.id);
             }}
            >
              {el.type === 'door' && (
                <ArchitecturalDoor
                  width={el.width}
                  height={el.height}
                  depth={elDepth}
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
                 depth={elDepth}
                 isSelected={isSelected}
                 viewMode={viewMode}
                 isOpen={el.isOpen}
               />
             )}

             {el.type === 'pillar' && (
               <group name="archRealPillar">
                 <mesh castShadow receiveShadow position={[0, 0, pillarZ]}>
                   <boxGeometry args={[el.width, el.height, elDepth]} />
                   <meshStandardMaterial color={wallColor || '#cbd5e1'} roughness={0.7} metalness={0.05} />
                   <Edges scale={1} threshold={15} color={isSelected ? '#0284c7' : '#64748b'} />
                 </mesh>

                  {/* Representacion 2D de Pilar: Aspa estructural en X */}
                  {viewMode === "2d" && (
                    <group renderOrder={1005} position={[0, el.height / 2 + 2, pillarZ]}>
                      <Line points={[[-el.width / 2, 0, -elDepth / 2], [el.width / 2, 0, elDepth / 2]]} color="#64748b" lineWidth={1.5} depthTest={false} material-toneMapped={false} />
                      <Line points={[[-el.width / 2, 0, elDepth / 2], [el.width / 2, 0, -elDepth / 2]]} color="#64748b" lineWidth={1.5} depthTest={false} material-toneMapped={false} />
                    </group>
                  )}
               </group>
             )}

             {isSelected && (
               <group position={[0, -el.height / 2 + 0.5, pillarZ]}>
                 <mesh position={[0, 0, (elDepth + 1.6) / 2]}>
                   <boxGeometry args={[el.width + 2, 0.4, 0.8]} />
                   <meshBasicMaterial color="#0284c7" />
                 </mesh>
                 <mesh position={[0, 0, -(elDepth + 1.6) / 2]}>
                   <boxGeometry args={[el.width + 2, 0.4, 0.8]} />
                   <meshBasicMaterial color="#0284c7" />
                 </mesh>
                 <mesh position={[-(el.width + 1.6) / 2, 0, 0]}>
                   <boxGeometry args={[0.8, 0.4, elDepth + 0.8]} />
                   <meshBasicMaterial color="#0284c7" />
                 </mesh>
                 <mesh position={[(el.width + 1.6) / 2, 0, 0]}>
                   <boxGeometry args={[0.8, 0.4, elDepth + 0.8]} />
                   <meshBasicMaterial color="#0284c7" />
                 </mesh>
               </group>
             )}
           </group>
         );
       })}

       {(showDimensions || isWallSelected) && (
         <group position={[0, height / 2 + 10, 0]} renderOrder={999}>
           <Line points={[[0, 0, -length / 2], [0, 0, length / 2]]} color="#f97316" lineWidth={isWallSelected ? 3 : 2} depthTest={false} renderOrder={999} />
           <Line points={[[-3, 0, -length / 2], [3, 0, -length / 2]]} color="#f97316" lineWidth={isWallSelected ? 3 : 2} depthTest={false} renderOrder={999} />
           <Line points={[[-3, 0, length / 2], [3, 0, length / 2]]} color="#f97316" lineWidth={isWallSelected ? 3 : 2} depthTest={false} renderOrder={999} />
           <Billboard follow={true}>
             <mesh position={[0, 4, -0.05]} renderOrder={999}>
               <planeGeometry args={[isWallSelected ? 48 : 34, 12]} />
               <meshBasicMaterial color="#090d16" transparent opacity={0.92} depthTest={false} />
             </mesh>
             <Text position={[0, 4, 0]} fontSize={isWallSelected ? 8.5 : 7} color="#f97316" anchorX="center" anchorY="middle" fontWeight="bold" outlineWidth={0.5} outlineColor="#000000" material-depthTest={false} material-toneMapped={false} renderOrder={1000}>
               {isWallSelected ? `${Math.round(length)} cm · Esp: ${thickness} cm` : `${Math.round(length)} cm`}
             </Text>
           </Billboard>
         </group>
       )}

       {/* Rótulo 3D identificador de muro (A, B, C...) activo en menú Deco Muros */}
       {isWallDecoTabOpen && viewMode !== '2d' && (
         <group 
           position={[0, height / 2 + 18, 0]} 
           renderOrder={1002}
           onClick={(e) => {
             e.stopPropagation();
             if (id) setActiveDecoWallId(id);
           }}
         >
           {/* Poste / Línea conectora hacia el centro superior del muro */}
           <Line 
             points={[[0, 0, 0], [0, -18, 0]]} 
             color={isThisDecoWallSelected ? '#f97316' : '#64748b'} 
             lineWidth={isThisDecoWallSelected ? 3 : 1.5} 
             depthTest={false} 
             renderOrder={1002} 
           />
           
           {/* Viñeta técnica flotante orientada siempre a la cámara */}
           <Billboard follow={true}>
             {/* Placa de fondo */}
             <mesh position={[0, 0, 0]} renderOrder={1003}>
               <planeGeometry args={[isThisDecoWallSelected ? 34 : 26, isThisDecoWallSelected ? 20 : 16]} />
               <meshBasicMaterial 
                 color={isThisDecoWallSelected ? '#f97316' : '#090d16'} 
                 transparent 
                 opacity={isThisDecoWallSelected ? 0.98 : 0.88} 
                 depthTest={false} 
               />
             </mesh>

             {/* Borde sutil para muro no seleccionado */}
             {!isThisDecoWallSelected && (
               <Edges 
                 scale={1} 
                 color="#475569" 
                 renderOrder={1004} 
               />
             )}

             {/* Letra principal normalizada del muro (A, B, C, D...) */}
             <Text 
               position={[0, isThisDecoWallSelected ? 2.5 : 2, 0.05]} 
               fontSize={isThisDecoWallSelected ? 10.5 : 8.5} 
               color={isThisDecoWallSelected ? '#000000' : '#ffffff'} 
               anchorX="center" 
               anchorY="middle" 
               fontWeight="bold" 
               outlineWidth={isThisDecoWallSelected ? 0 : 0.3} 
               outlineColor="#000000" 
               material-depthTest={false} 
               material-toneMapped={false} 
               renderOrder={1005}
             >
               {wallLabel}
             </Text>

             {/* Subtítulo indicando número de muro */}
             <Text 
               position={[0, isThisDecoWallSelected ? -5.5 : -4.5, 0.05]} 
               fontSize={isThisDecoWallSelected ? 4.4 : 3.6} 
               color={isThisDecoWallSelected ? '#18181b' : '#94a3b8'} 
               anchorX="center" 
               anchorY="middle" 
               fontWeight="bold" 
               material-depthTest={false} 
               material-toneMapped={false} 
               renderOrder={1005}
             >
               {`MURO ${wallIndex + 1}`}
             </Text>
           </Billboard>
         </group>
       )}
     </group>
   );
}
