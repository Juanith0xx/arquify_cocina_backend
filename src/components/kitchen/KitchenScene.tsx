import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Edges, OrthographicCamera, PerspectiveCamera, OrbitControls, Environment, Grid, Line, Text } from '@react-three/drei';
import { preloadFont } from 'troika-three-text';
import * as THREE from 'three';

// Precarga silenciosa en segundo plano para eliminar la suspensión de Troika/Drei al insertar el primer mueble
try {
  preloadFont({ characters: '0123456789.,MODcmPtaCiegoABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz:+-×/ ⚠️✛' }, () => {});
} catch {
  // Ignorar en entornos sin soporte de workers
}
import { useKitchenStore } from '../../store/kitchenStore';
import { useStore } from '../../store';
import { Wall } from './Wall';
import { Cabinet } from './Cabinet';
import { KitchenSocle } from './KitchenSocle';
import { KitchenRunDimensions } from './KitchenRunDimensions';
import { KitchenSpatialDimensions } from './KitchenSpatialDimensions';
import { RoomFloorAndDimensions } from './RoomFloorAndDimensions';
import { ArchitecturalElementsRenderer } from './ArchitecturalElementsRenderer';
import { KitchenCountertop3D } from './KitchenCountertop3D';
import { KitchenIslandBackPanel } from './KitchenIslandBackPanel';
import { KitchenMepScene } from './KitchenMepScene';
import { StudioCapturePipeline } from '../common/StudioCapturePipeline';
import { resolvePlacement, getCabinetSpecsFromTool, getWallInwardNormal } from '../../utils/kitchenCollision';

function projectPointOntoWall(px: number, pz: number, walls: any[], maxDist: number = 25) {
  let bestProj: [number, number] | null = null;
  let bestDist = Infinity;
  let bestAngle = 0;
  let matchedWallId: string | null = null;

  for (const w of walls) {
    const [x1, z1] = w.start;
    const [x2, z2] = w.end;
    const dx = x2 - x1;
    const dz = z2 - z1;
    const lenSq = dx * dx + dz * dz;
    if (lenSq < 1) continue;
    const u = Math.max(0, Math.min(1, ((px - x1) * dx + (pz - z1) * dz) / lenSq));
    const projX = x1 + u * dx;
    const projZ = z1 + u * dz;
    const dist = Math.hypot(px - projX, pz - projZ);
    if (dist < maxDist && dist < bestDist) {
      bestDist = dist;
      bestProj = [Math.round(projX * 10) / 10, Math.round(projZ * 10) / 10];
      bestAngle = Math.atan2(dz, dx);
      matchedWallId = w.id;
    }
  }

  return bestProj ? { point: bestProj, angle: bestAngle, wallId: matchedWallId, dist: bestDist } : null;
}

function SceneContent({ theme = 'dark' }: { theme?: 'dark' | 'light' }) {
  const { viewMode, toolMode, walls, cabinets, addWall, drawingStart, setDrawingStart, addCabinet, setToolMode, setActiveCabinet, roomConfig, activeCabinetId, addArchitecturalElement, draggingArchElementId, draggingCabinetId, setDraggingCabinetId, updateCabinet, architecturalElements, activeArchElementId, setActiveArchElement, setActiveWall, activeWallId, draggingWallId, setDraggingWallId, updateWall } = useKitchenStore();
  const [currentMousePos, setCurrentMousePos] = useState<[number, number] | null>(null);
  const lastMousePosRef = useRef<[number, number] | null>(null);
  const [isShiftDown, setIsShiftDown] = useState(false);
  const [ghostCabinet, setGhostCabinet] = useState<{pos: [number,number,number], rot: number, isColliding?: boolean} | null>(null);

  useEffect(() => {
    const handleShift = (e: KeyboardEvent) => setIsShiftDown(e.shiftKey);
    window.addEventListener('keydown', handleShift);
    window.addEventListener('keyup', handleShift);
    return () => {
      window.removeEventListener('keydown', handleShift);
      window.removeEventListener('keyup', handleShift);
    };
  }, []);
  const { camera, raycaster, pointer, scene, size } = useThree();

  const is2D = viewMode === '2d';
  const controls2dRef = useRef<any>(null);
  const controls3dRef = useRef<any>(null);

  const roomBounds = React.useMemo(() => {
    const vertices = roomConfig?.vertices && roomConfig.vertices.length >= 3
      ? roomConfig.vertices
      : [
          { id: 'v1', x: -250, y: -200 },
          { id: 'v2', x: 250, y: -200 },
          { id: 'v3', x: 250, y: 200 },
          { id: 'v4', x: -250, y: 200 },
        ];
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    vertices.forEach((v) => {
      if (v.x < minX) minX = v.x;
      if (v.x > maxX) maxX = v.x;
      if (v.y < minY) minY = v.y;
      if (v.y > maxY) maxY = v.y;
    });
    const centerX = (minX + maxX) / 2;
    const centerZ = (minY + maxY) / 2;
    const width = maxX - minX;
    const height = maxY - minY;
    return { minX, maxX, minY, maxY, centerX, centerZ, width, height };
  }, [roomConfig?.vertices]);

  const ideal2DZoom = React.useMemo(() => {
    const contentW = (roomBounds.width || 500) + 180;
    const contentH = (roomBounds.height || 400) + 190;
    const w = size.width || 1200;
    const h = size.height || 800;
    const fitFactor = 0.82;
    const zX = (w / contentW) * fitFactor;
    const zY = (h / contentH) * fitFactor;
    return Math.max(0.4, Math.min(2.5, Math.min(zX, zY)));
  }, [roomBounds.width, roomBounds.height, size.width, size.height]);

  useEffect(() => {
    if (camera) {
      camera.far = 40000;
      if (is2D) {
        camera.position.set(roomBounds.centerX, 1500, roomBounds.centerZ);
        camera.up.set(0, 0, -1);
        camera.lookAt(roomBounds.centerX, 0, roomBounds.centerZ);
        if ((camera as any).isOrthographicCamera) {
          (camera as THREE.OrthographicCamera).zoom = ideal2DZoom;
        }
        if (controls2dRef.current) {
          controls2dRef.current.target.set(roomBounds.centerX, 0, roomBounds.centerZ);
          controls2dRef.current.update();
        }
      }
      camera.updateProjectionMatrix();
    }
  }, [is2D, roomBounds.centerX, roomBounds.centerZ, ideal2DZoom, camera]);

  const dynamicGroundSize = React.useMemo(() => {
    const baseW = Math.max(roomBounds.width || 500, 500);
    const baseH = Math.max(roomBounds.height || 400, 400);
    const maxDim = Math.max(baseW, baseH);
    return Math.max(15000, maxDim * 4);
  }, [roomBounds.width, roomBounds.height]);

  const groundPlaneMath = React.useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const intersectPoint = React.useMemo(() => new THREE.Vector3(), []);

  const effectiveWalls = React.useMemo(() => {
    if (walls && walls.length > 0) return walls;
    if (roomConfig?.vertices && roomConfig.vertices.length >= 3) {
      return roomConfig.vertices.map((v, i, arr) => {
        const next = arr[(i + 1) % arr.length];
        return {
          id: `wall_v_${i}`,
          start: [v.x, v.y] as [number, number],
          end: [next.x, next.y] as [number, number],
          thickness: roomConfig.wallThickness || 20,
          height: roomConfig.wallHeight || 250,
        };
      });
    }
    return [];
  }, [walls, roomConfig]);

  // Clamping y alineación no-rebote contra muros perimetrales exteriores con contacto a ras
  const clampWallAgainstPerimeters = React.useCallback((
    start: [number, number],
    end: [number, number],
    thickness: number
  ): { start: [number, number]; end: [number, number] } => {
    const perimeterWalls = effectiveWalls.filter(
      (w) => !w.isInterior && (w.id.startsWith('wall_v_') || /^wall_\d+_/.test(w.id))
    );
    const halfThick = thickness / 2;
    const poly = roomConfig?.vertices?.map((v) => [v.x, v.y] as [number, number]) || [];

    const dx = end[0] - start[0];
    const dz = end[1] - start[1];
    const wLen = Math.hypot(dx, dz);
    if (wLen < 1) return { start, end };

    const uX = dx / wLen;
    const uZ = dz / wLen;
    const nX = -uZ;
    const nZ = uX;

    let clampedStart: [number, number] = [start[0], start[1]];
    let clampedEnd: [number, number] = [end[0], end[1]];

    for (const pw of perimeterWalls) {
      const [px1, pz1] = pw.start;
      const [px2, pz2] = pw.end;
      const pwLen = Math.hypot(px2 - px1, pz2 - pz1);
      if (pwLen < 1) continue;
      const pwUx = (px2 - px1) / pwLen;
      const pwUz = (pz2 - pz1) / pwLen;
      const [pwnX, pwnZ] = getWallInwardNormal(px1, pz1, px2, pz2, poly);
      const pwThick = pw.thickness || 20;
      const reqClearance = pwThick / 2;

      const testCorners: [number, number][] = [
        [clampedStart[0] + nX * halfThick, clampedStart[1] + nZ * halfThick],
        [clampedStart[0] - nX * halfThick, clampedStart[1] - nZ * halfThick],
        [clampedEnd[0] + nX * halfThick, clampedEnd[1] + nZ * halfThick],
        [clampedEnd[0] - nX * halfThick, clampedEnd[1] - nZ * halfThick],
      ];

      let maxPenetration = 0;
      let minDistToInnerFace = Infinity;

      for (const [tcX, tcZ] of testCorners) {
        const s = (tcX - px1) * pwUx + (tcZ - pz1) * pwUz;
        if (s >= -10 && s <= pwLen + 10) {
          const normDist = (tcX - px1) * pwnX + (tcZ - pz1) * pwnZ;
          if (normDist < reqClearance) {
            const pen = reqClearance - normDist;
            if (pen > maxPenetration) {
              maxPenetration = pen;
            }
          } else {
            const distToFace = normDist - reqClearance;
            if (distToFace < minDistToInnerFace) {
              minDistToInnerFace = distToFace;
            }
          }
        }
      }

      if (maxPenetration > 0) {
        clampedStart[0] += maxPenetration * pwnX;
        clampedStart[1] += maxPenetration * pwnZ;
        clampedEnd[0] += maxPenetration * pwnX;
        clampedEnd[1] += maxPenetration * pwnZ;
      } else if (minDistToInnerFace >= 0 && minDistToInnerFace <= 3.0) {
        clampedStart[0] -= minDistToInnerFace * pwnX;
        clampedStart[1] -= minDistToInnerFace * pwnZ;
        clampedEnd[0] -= minDistToInnerFace * pwnX;
        clampedEnd[1] -= minDistToInnerFace * pwnZ;
      }
    }

    return { start: clampedStart, end: clampedEnd };
  }, [effectiveWalls, roomConfig]);

  // Al activar la herramienta "Mover", situar de inmediato el ghost y la flecha sobre el mueble activo
  useEffect(() => {
    if (toolMode === 'move_active') {
      if (activeCabinetId) {
        const activeCab = useKitchenStore.getState().cabinets.find(c => c.id === activeCabinetId);
        if (activeCab && Array.isArray(activeCab.position)) {
          setGhostCabinet({
            pos: [Number(activeCab.position[0]) || 0, Number(activeCab.position[1]) || 40, Number(activeCab.position[2]) || 0],
            rot: Number(activeCab.rotation) || 0,
            isColliding: false,
          });
        } else {
          setGhostCabinet({
            pos: [0, 40, 0],
            rot: 0,
            isColliding: false,
          });
        }
      } else if (activeArchElementId) {
        const activeArch = useKitchenStore.getState().architecturalElements.find(a => a.id === activeArchElementId);
        if (activeArch && Array.isArray(activeArch.position)) {
          setGhostCabinet({
            pos: [Number(activeArch.position[0]) || 0, Number(activeArch.position[1]) || (activeArch.elevation + activeArch.height / 2), Number(activeArch.position[2]) || 0],
            rot: Number(activeArch.rotation) || 0,
            isColliding: false,
          });
        } else {
          setGhostCabinet({
            pos: [0, 120, 0],
            rot: 0,
            isColliding: false,
          });
        }
      } else if (activeWallId) {
        setGhostCabinet(null);
      }
    } else if (!toolMode.startsWith('place_')) {
      setGhostCabinet(null);
    }
  }, [toolMode, activeCabinetId, activeArchElementId, activeWallId]);

  const dragInfoRef = useRef<{ id: string; startPointerX: number; startOffset: number } | null>(null);
  const cabinetDragRef = useRef<{
    id: string;
    startPointer: { x: number; y: number };
    startFloorHit: [number, number];
    startCabPos: [number, number, number];
    startRot: number;
    hasMovedPastThreshold: boolean;
  } | null>(null);
  const wallDragRef = useRef<{
    id: string;
    startPointer: { x: number; y: number };
    startFloorHit: [number, number];
    startWallStart: [number, number];
    startWallEnd: [number, number];
    hasMovedPastThreshold: boolean;
  } | null>(null);

  useEffect(() => {
    const handleGlobalPointerUp = () => {
      const state = useKitchenStore.getState();
      if (state.draggingCabinetId) {
        const dragId = state.draggingCabinetId;
        const cab = state.cabinets.find((c) => c.id === dragId);
        if (cab) {
          state.updateCabinet(dragId, {
            position: cab.position,
            rotation: cab.rotation,
          });
        }
        state.setDraggingCabinetId(null);
      }
      cabinetDragRef.current = null;
      if (state.draggingWallId) {
        state.setDraggingWallId(null);
      }
      wallDragRef.current = null;
      if (state.draggingArchElementId) {
        const dragId = state.draggingArchElementId;
        const el = state.architecturalElements.find((a) => a.id === dragId);
        if (el) {
          state.updateArchitecturalElement(dragId, {
            position: el.position,
            rotation: el.rotation,
            wallId: el.wallId,
            offset: el.offset,
          });
        }
        state.setDraggingArchElementId(null);
        setGhostCabinet(null);
      }
    };
    window.addEventListener('pointerup', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
    };
  }, []);

  useFrame(() => {
    const draggingCabinetId = useKitchenStore.getState().draggingCabinetId;
    if (draggingCabinetId) {
       raycaster.setFromCamera(pointer, camera);
       const hit = raycaster.ray.intersectPlane(groundPlaneMath, intersectPoint);
       if (hit) {
          const currentCabinets = useKitchenStore.getState().cabinets;
          const cab = currentCabinets.find(c => c.id === draggingCabinetId);
          if (cab) {
             if (!cabinetDragRef.current || cabinetDragRef.current.id !== draggingCabinetId) {
                cabinetDragRef.current = {
                   id: draggingCabinetId,
                   startPointer: { x: pointer.x, y: pointer.y },
                   startFloorHit: [intersectPoint.x, intersectPoint.z],
                   startCabPos: [cab.position[0], cab.position[1], cab.position[2]],
                   startRot: cab.rotation || 0,
                   hasMovedPastThreshold: false,
                };
             }

             const drag = cabinetDragRef.current;
             const pointerDist = Math.hypot(pointer.x - drag.startPointer.x, pointer.y - drag.startPointer.y);

             // Umbral mínimo de movimiento para diferenciar un clic de un arrastre intencional
             if (!drag.hasMovedPastThreshold) {
                if (pointerDist > 0.015) {
                   drag.hasMovedPastThreshold = true;
                } else {
                   return; // Si no se ha superado el umbral, es un clic simple: NO mover el mueble
                }
             }

             // Desplazamiento relativo desde el punto de inicio de agarre
             const deltaX = intersectPoint.x - drag.startFloorHit[0];
             const deltaZ = intersectPoint.z - drag.startFloorHit[1];
             const targetX = Math.round((drag.startCabPos[0] + deltaX) * 2) / 2;
             const targetZ = Math.round((drag.startCabPos[2] + deltaZ) * 2) / 2;

             const result = resolvePlacement({
                mouseX: targetX,
                mouseZ: targetZ,
                cabWidth: cab.width,
                cabHeight: cab.height,
                cabDepth: cab.depth,
                cabType: cab.type,
                variant: cab.variant,
                customY: Array.isArray(cab.position) ? cab.position[1] : undefined,
                preferredRot: drag.startRot,
                cabinets: currentCabinets,
                ignoreId: cab.id,
                walls: effectiveWalls,
                roomVertices: roomConfig?.vertices,
                architecturalElements,
             });

             if (!result.isColliding && (result.position[0] !== cab.position[0] || result.position[2] !== cab.position[2] || result.rotation !== cab.rotation)) {
                useKitchenStore.getState().moveCabinetTransient(draggingCabinetId, {
                   position: result.position,
                   rotation: result.rotation,
                });
             }
          }
       }
       return;
    } else {
       if (cabinetDragRef.current) {
          cabinetDragRef.current = null;
       }
    }

    const draggingArchElementId = useKitchenStore.getState().draggingArchElementId;
    if (draggingArchElementId) {
       const architecturalElements = useKitchenStore.getState().architecturalElements;
       const updateArchitecturalElement = useKitchenStore.getState().updateArchitecturalElement;
       const el = architecturalElements.find(e => e.id === draggingArchElementId);
       if (el) {
          const effectiveWalls = walls && walls.length > 0 ? walls : (roomConfig?.vertices && roomConfig.vertices.length >= 3 ? roomConfig.vertices.map((v, i, arr) => {
             const next = arr[(i + 1) % arr.length];
             return { id: `wall_v_${i}`, start: [v.x, v.y], end: [next.x, next.y], thickness: 20, height: 240 };
          }) : []);

          const wall = effectiveWalls.find(w => w.id === el.wallId) || effectiveWalls[0];
          if (wall) {
             const [x1, z1] = wall.start;
             const [x2, z2] = wall.end;
             const wLen = Math.hypot(x2 - x1, z2 - z1);
             if (wLen >= 10) {
                const uX = (x2 - x1) / wLen;
                const uZ = (z2 - z1) / wLen;

                if (!dragInfoRef.current || dragInfoRef.current.id !== draggingArchElementId) {
                   dragInfoRef.current = {
                      id: draggingArchElementId,
                      startPointerX: pointer.x,
                      startOffset: el.offset || 0,
                   };
                }

                const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
                const dot = uX * camRight.x + uZ * camRight.z;
                const sign = dot >= 0 ? 1 : -1;

                const deltaX = -(pointer.x - dragInfoRef.current.startPointerX);
                const sensitivity = wLen * 1.2;
                const rawNewOffset = dragInfoRef.current.startOffset + deltaX * sensitivity * sign;

                const minS = -wLen / 2 + el.width / 2 + 2;
                const maxS = wLen / 2 - el.width / 2 - 2;
                let clampedOffset = Math.max(minS, Math.min(maxS, rawNewOffset));

                // Overlap prevention with other elements on the same wall
                const otherElements = architecturalElements.filter(other => other.id !== el.id && (other.wallId === wall.id || (!other.wallId && Math.abs(other.position[0] - (x1+x2)/2) < wLen)));
                for (const other of otherElements) {
                   const otherOffset = other.offset || 0;
                   const otherHalf = other.width / 2 + 2;
                   const myHalf = el.width / 2;

                   if (clampedOffset > otherOffset && dragInfoRef.current.startOffset <= otherOffset) {
                      const limit = otherOffset - otherHalf - myHalf;
                      if (clampedOffset > limit) clampedOffset = limit;
                   } else if (clampedOffset < otherOffset && dragInfoRef.current.startOffset >= otherOffset) {
                      const limit = otherOffset + otherHalf + myHalf;
                      if (clampedOffset < limit) clampedOffset = limit;
                   }
                }

                clampedOffset = Math.max(minS, Math.min(maxS, clampedOffset));

                const sClamped = clampedOffset + wLen / 2;
                const pX = x1 + sClamped * uX;
                const pZ = z1 + sClamped * uZ;
                const bestPos: [number, number, number] = [pX, el.elevation + el.height / 2, pZ];
                const bestRot = Math.atan2(x1 - x2, z1 - z2);

                updateArchitecturalElement(draggingArchElementId, {
                  wallId: wall.id || el.wallId,
                  offset: clampedOffset,
                  position: bestPos,
                  rotation: bestRot,
                });
             }
          }
       }
       return;
    } else {
       if (dragInfoRef.current) {
          dragInfoRef.current = null;
       }
    }

    const draggingWallId = useKitchenStore.getState().draggingWallId;
    if (draggingWallId) {
       raycaster.setFromCamera(pointer, camera);
       const hit = raycaster.ray.intersectPlane(groundPlaneMath, intersectPoint);
       if (hit) {
          const state = useKitchenStore.getState();
          const currentWalls = state.walls;
          const targetWall = currentWalls.find((w) => w.id === draggingWallId);
          if (targetWall) {
             if (!wallDragRef.current || wallDragRef.current.id !== draggingWallId) {
                wallDragRef.current = {
                   id: draggingWallId,
                   startPointer: { x: pointer.x, y: pointer.y },
                   startFloorHit: [intersectPoint.x, intersectPoint.z],
                   startWallStart: [targetWall.start[0], targetWall.start[1]],
                   startWallEnd: [targetWall.end[0], targetWall.end[1]],
                   hasMovedPastThreshold: false,
                };
             }

             const drag = wallDragRef.current;
             const pointerDist = Math.hypot(pointer.x - drag.startPointer.x, pointer.y - drag.startPointer.y);
             if (!drag.hasMovedPastThreshold) {
                if (pointerDist > 0.012) {
                   drag.hasMovedPastThreshold = true;
                } else {
                   return;
                }
             }

             const rawDeltaX = intersectPoint.x - drag.startFloorHit[0];
             const rawDeltaZ = intersectPoint.z - drag.startFloorHit[1];

             let newStart: [number, number] = [drag.startWallStart[0] + rawDeltaX, drag.startWallStart[1] + rawDeltaZ];
             let newEnd: [number, number] = [drag.startWallEnd[0] + rawDeltaX, drag.startWallEnd[1] + rawDeltaZ];

             const wallThick = targetWall.thickness || 15;
             const { start: clampedStart, end: clampedEnd } = clampWallAgainstPerimeters(
                newStart,
                newEnd,
                wallThick
             );

             const finalStart: [number, number] = [
                Math.round(clampedStart[0] * 2) / 2,
                Math.round(clampedStart[1] * 2) / 2,
             ];
             const finalEnd: [number, number] = [
                Math.round(clampedEnd[0] * 2) / 2,
                Math.round(clampedEnd[1] * 2) / 2,
             ];

             if (
                finalStart[0] !== targetWall.start[0] ||
                finalStart[1] !== targetWall.start[1] ||
                finalEnd[0] !== targetWall.end[0] ||
                finalEnd[1] !== targetWall.end[1]
             ) {
                const shiftX = finalStart[0] - targetWall.start[0];
                const shiftZ = finalStart[1] - targetWall.start[1];

                state.updateWall(draggingWallId, {
                   start: finalStart,
                   end: finalEnd,
                });

                // Desplazar solidariamente los vanos (puertas/ventanas) alojados en este muro
                const archElements = state.architecturalElements;
                for (const el of archElements) {
                   if (el.wallId === draggingWallId) {
                      state.updateArchitecturalElement(el.id, {
                         position: [
                            el.position[0] + shiftX,
                            el.position[1],
                            el.position[2] + shiftZ,
                         ],
                      });
                   }
                }
             }
          }
       }
       return;
    } else {
       if (wallDragRef.current) {
          wallDragRef.current = null;
       }
    }

    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.ray.intersectPlane(groundPlaneMath, intersectPoint);
    if (!hit) return;

    if (toolMode === 'draw_wall') {
      const rx = intersectPoint.x;
      const rz = intersectPoint.z;

      const updateMousePos = (pos: [number, number]) => {
        if (!lastMousePosRef.current || Math.abs(lastMousePosRef.current[0] - pos[0]) > 0.1 || Math.abs(lastMousePosRef.current[1] - pos[1]) > 0.1) {
          lastMousePosRef.current = pos;
          setCurrentMousePos(pos);
        }
      };

      if (!drawingStart) {
        // Point is hovering before click: snap to nearby wall or clean 5cm grid
        const wallSnap = projectPointOntoWall(rx, rz, effectiveWalls, 25);
        if (wallSnap) {
          updateMousePos(wallSnap.point);
        } else {
          updateMousePos([Math.round(rx / 5) * 5, Math.round(rz / 5) * 5]);
        }
      } else {
        // We are currently drawing a wall from drawingStart to cursor:
        // Calculate snap point with 90° ortho & source wall perpendicular alignment
        const [x0, z0] = drawingStart;
        const dx = rx - x0;
        const dz = rz - z0;
        const dist = Math.hypot(dx, dz);

        if (dist > 5) {
          const currentAngle = Math.atan2(dz, dx);
          const sourceWallInfo = projectPointOntoWall(x0, z0, effectiveWalls, 35);

          // Candidate angles for 90° escuadra
          const candidateAngles: number[] = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
          if (sourceWallInfo) {
            candidateAngles.push(
              sourceWallInfo.angle + Math.PI / 2,
              sourceWallInfo.angle - Math.PI / 2,
              sourceWallInfo.angle,
              sourceWallInfo.angle + Math.PI
            );
          }

          let bestAngle: number | null = null;
          let minAngleDiff = Infinity;
          for (const cand of candidateAngles) {
            const diff = Math.abs(Math.atan2(Math.sin(currentAngle - cand), Math.cos(currentAngle - cand)));
            if (diff < minAngleDiff) {
              minAngleDiff = diff;
              bestAngle = cand;
            }
          }

          // Angle snap tolerance ~15 degrees (or unconditional if Shift key)
          const angleTolerance = isShiftDown ? Infinity : (15 * Math.PI) / 180;
          let snappedPos: [number, number];

          if (bestAngle !== null && minAngleDiff < angleTolerance) {
            const isHorizontal = Math.abs(Math.sin(bestAngle)) < 0.05;
            const isVertical = Math.abs(Math.cos(bestAngle)) < 0.05;

            if (isHorizontal) {
              snappedPos = [x0 + Math.round(dx / 5) * 5, z0];
            } else if (isVertical) {
              snappedPos = [x0, z0 + Math.round(dz / 5) * 5];
            } else {
              const snappedDist = Math.round(dist / 5) * 5;
              snappedPos = [
                Math.round((x0 + snappedDist * Math.cos(bestAngle)) * 10) / 10,
                Math.round((z0 + snappedDist * Math.sin(bestAngle)) * 10) / 10,
              ];
            }
          } else {
            snappedPos = [Math.round(rx / 5) * 5, Math.round(rz / 5) * 5];
          }

          // Also check if end point snaps onto another target wall
          const targetWallSnap = projectPointOntoWall(snappedPos[0], snappedPos[1], effectiveWalls, 18);
          if (targetWallSnap && Math.hypot(targetWallSnap.point[0] - x0, targetWallSnap.point[1] - z0) > 10) {
            snappedPos = targetWallSnap.point;
          }

          updateMousePos(snappedPos);
        } else {
          updateMousePos([Math.round(rx / 5) * 5, Math.round(rz / 5) * 5]);
        }
      }
    } else if (toolMode.startsWith('place_') || toolMode === 'move_active') {
      const rawX = Math.round(intersectPoint.x * 2) / 2;
      const rawZ = Math.round(intersectPoint.z * 2) / 2;
      
      let cabWidth = 60;
      let cabDepth = 60;
      let cabHeight = 80;
      let cabType = 'base';
      let cabVariant = '1_door';
      let cabRot = 0;
      let customY: number | undefined = undefined;
      const activeCabId = useKitchenStore.getState().activeCabinetId;
      const activeArchId = useKitchenStore.getState().activeArchElementId;
      const draggingArchId = useKitchenStore.getState().draggingArchElementId;
      const targetArchId = draggingArchId || (toolMode === 'move_active' ? activeArchId : null);

      if (targetArchId) {
         const activeArch = architecturalElements.find(e => e.id === targetArchId);
         if (activeArch) {
            const archWidth = activeArch.width;
            const archHeight = activeArch.height;
            const archElevation = activeArch.elevation || 0;
            const defaultY = archElevation + archHeight / 2;

            let bestPos: [number, number, number] = [rawX, defaultY, rawZ];
            let bestRot = activeArch.rotation || 0;
            let bestWallId = activeArch.wallId || '';
            let bestOffset = activeArch.offset || 0;
            let bestWallThick = 20;

            const effectiveWalls = walls && walls.length > 0 ? walls : (roomConfig?.vertices && roomConfig.vertices.length >= 3 ? roomConfig.vertices.map((v, i, arr) => {
               const next = arr[(i + 1) % arr.length];
               return { id: `wall_v_${i}`, start: [v.x, v.y], end: [next.x, next.y], thickness: 20, height: 240 };
            }) : []);

            let minDist = Infinity;
            if (effectiveWalls.length > 0) {
               const poly = roomConfig?.vertices?.map(v => [v.x, v.y] as [number, number]) || [];
               const camPos = camera.position;

               // 1. Raycast contra el plano vertical de cada muro
               for (const w of effectiveWalls) {
                  const [x1, z1] = w.start;
                  const [x2, z2] = w.end;
                  const wLen = Math.hypot(x2 - x1, z2 - z1);
                  if (wLen < 10) continue;

                  const inwardNormal = getWallInwardNormal(x1, z1, x2, z2, poly);
                  const cx = (x1 + x2) / 2;
                  const cz = (z1 + z2) / 2;

                  const wallPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(
                     new THREE.Vector3(inwardNormal[0], 0, inwardNormal[1]),
                     new THREE.Vector3(cx, defaultY, cz)
                  );
                  const planeHit = new THREE.Vector3();
                  if (raycaster.ray.intersectPlane(wallPlane, planeHit)) {
                     const uX = (x2 - x1) / wLen;
                     const uZ = (z2 - z1) / wLen;
                     const s = (planeHit.x - x1) * uX + (planeHit.z - z1) * uZ;
                     if (s >= -20 && s <= wLen + 20 && planeHit.y >= -10 && planeHit.y <= 300) {
                        const sClamped = Math.max(archWidth / 2 + 2, Math.min(wLen - archWidth / 2 - 2, s));
                        const pX = x1 + sClamped * uX;
                        const pZ = z1 + sClamped * uZ;
                        const dist = Math.hypot(planeHit.x - pX, planeHit.z - pZ);
                        if (dist < minDist) {
                           minDist = dist;
                           bestRot = Math.atan2(x1 - x2, z1 - z2);
                           bestPos = [pX, defaultY, pZ];
                           bestWallId = w.id || `wall_${Math.random()}`;
                           bestOffset = sClamped - wLen / 2;
                           bestWallThick = w.thickness || 20;
                        }
                     }
                  }
               }

               // 2. Si no intersectó planos verticales directos, proyectar desde el suelo
               if (minDist === Infinity) {
                  for (const w of effectiveWalls) {
                     const [x1, z1] = w.start;
                     const [x2, z2] = w.end;
                     const wLen = Math.hypot(x2 - x1, z2 - z1);
                     if (wLen < 10) continue;
                     const uX = (x2 - x1) / wLen;
                     const uZ = (z2 - z1) / wLen;

                     const s = (rawX - x1) * uX + (rawZ - z1) * uZ;
                     const sClamped = Math.max(archWidth / 2 + 2, Math.min(wLen - archWidth / 2 - 2, s));

                     const pX = x1 + sClamped * uX;
                     const pZ = z1 + sClamped * uZ;
                     const dist = Math.hypot(rawX - pX, rawZ - pZ);

                     if (dist < minDist) {
                        minDist = dist;
                        bestRot = Math.atan2(x1 - x2, z1 - z2);
                        bestPos = [pX, defaultY, pZ];
                        bestWallId = w.id || `wall_${Math.random()}`;
                        bestOffset = sClamped - wLen / 2;
                        bestWallThick = w.thickness || 20;
                     }
                  }
               }
            }

            // Actualización instantánea en el store: el muro recalcula wallOpenings y abre el vano en vivo
            useKitchenStore.getState().moveArchElementTransient(targetArchId, {
               position: bestPos,
               rotation: bestRot,
               wallId: bestWallId,
               offset: bestOffset,
            });

            setGhostCabinet({
               pos: bestPos,
               rot: bestRot,
               isColliding: false,
               wallThickness: bestWallThick,
            } as any);
            return;
         }
      }

      if (toolMode === 'move_active') {
         const currentActiveWallId = useKitchenStore.getState().activeWallId;
         const isCurrentlyDragging = Boolean(useKitchenStore.getState().draggingWallId);
         if (currentActiveWallId && !isCurrentlyDragging) {
            const targetWall = walls.find(w => w.id === currentActiveWallId);
            if (targetWall) {
               const wDx = targetWall.end[0] - targetWall.start[0];
               const wDz = targetWall.end[1] - targetWall.start[1];
               const halfDx = wDx / 2;
               const halfDz = wDz / 2;
               let newStart: [number, number] = [rawX - halfDx, rawZ - halfDz];
               let newEnd: [number, number] = [rawX + halfDx, rawZ + halfDz];
               const wallThick = targetWall.thickness || 15;

               const { start: clampedStart, end: clampedEnd } = clampWallAgainstPerimeters(
                  newStart,
                  newEnd,
                  wallThick
               );

               const finalStart: [number, number] = [
                  Math.round(clampedStart[0] * 2) / 2,
                  Math.round(clampedStart[1] * 2) / 2,
               ];
               const finalEnd: [number, number] = [
                  Math.round(clampedEnd[0] * 2) / 2,
                  Math.round(clampedEnd[1] * 2) / 2,
               ];

               if (
                  finalStart[0] !== targetWall.start[0] ||
                  finalStart[1] !== targetWall.start[1] ||
                  finalEnd[0] !== targetWall.end[0] ||
                  finalEnd[1] !== targetWall.end[1]
               ) {
                  const shiftX = finalStart[0] - targetWall.start[0];
                  const shiftZ = finalStart[1] - targetWall.start[1];
                  useKitchenStore.getState().updateWall(currentActiveWallId, {
                     start: finalStart,
                     end: finalEnd,
                  });
                  const archElements = useKitchenStore.getState().architecturalElements;
                  for (const el of archElements) {
                     if (el.wallId === currentActiveWallId) {
                        useKitchenStore.getState().updateArchitecturalElement(el.id, {
                           position: [
                              el.position[0] + shiftX,
                              el.position[1],
                              el.position[2] + shiftZ,
                           ],
                        });
                     }
                  }
               }
            }
            return;
         }

         const activeCab = cabinets.find(c => c.id === activeCabId) || null;
         if (activeCab) {
            cabWidth = Number(activeCab.width) || 60;
            cabDepth = Number(activeCab.depth) || 60;
            cabHeight = Number(activeCab.height) || 80;
            cabType = activeCab.type || 'base';
            cabVariant = activeCab.variant || '1_door';
            cabRot = Number(activeCab.rotation) || 0;
            customY = Array.isArray(activeCab.position) ? Number(activeCab.position[1]) || 40 : undefined;
         }

         const result = resolvePlacement({
           mouseX: rawX,
           mouseZ: rawZ,
           cabWidth,
           cabHeight,
           cabDepth,
           cabType,
           variant: cabVariant,
           customY,
           preferredRot: cabRot,
           cabinets,
           ignoreId: activeCabId,
           walls,
           roomVertices: roomConfig?.vertices,
           architecturalElements,
         });

         setGhostCabinet({ pos: result.position, rot: result.rotation, isColliding: result.isColliding });
         return;
      } else if (toolMode.startsWith('place_arch_')) {
         const archType = toolMode === 'place_arch_door' ? 'door' : toolMode === 'place_arch_window' ? 'window' : 'pillar';
         const archWidth = archType === 'door' ? 90 : archType === 'window' ? 120 : 40;
         const archHeight = archType === 'door' ? 205 : archType === 'window' ? 100 : 240;
         const archElevation = archType === 'window' ? 90 : 0;
         const defaultY = archElevation + archHeight / 2;

         let bestPos: [number, number, number] = [rawX, defaultY, rawZ];
         let bestRot = 0;

         const effectiveWalls = walls && walls.length > 0 ? walls : (roomConfig?.vertices && roomConfig.vertices.length >= 3 ? roomConfig.vertices.map((v, i, arr) => {
            const next = arr[(i + 1) % arr.length];
            return { id: `wall_v_${i}`, start: [v.x, v.y], end: [next.x, next.y], thickness: 20, height: 240 };
         }) : []);

         let minDist = Infinity;
         if (effectiveWalls.length > 0) {
            const poly = roomConfig?.vertices?.map(v => [v.x, v.y] as [number, number]) || [];
            const camPos = camera.position;

            let bestWallThick = 20;

            // 1. Raycast contra el plano vertical de cada muro
            for (const w of effectiveWalls) {
               const [x1, z1] = w.start;
               const [x2, z2] = w.end;
               const wLen = Math.hypot(x2 - x1, z2 - z1);
               if (wLen < 10) continue;

               const inwardNormal = getWallInwardNormal(x1, z1, x2, z2, poly);
               const cx = (x1 + x2) / 2;
               const cz = (z1 + z2) / 2;

               const wallPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(
                  new THREE.Vector3(inwardNormal[0], 0, inwardNormal[1]),
                  new THREE.Vector3(cx, defaultY, cz)
               );
               const planeHit = new THREE.Vector3();
               if (raycaster.ray.intersectPlane(wallPlane, planeHit)) {
                  const uX = (x2 - x1) / wLen;
                  const uZ = (z2 - z1) / wLen;
                  const s = (planeHit.x - x1) * uX + (planeHit.z - z1) * uZ;
                  if (s >= -20 && s <= wLen + 20 && planeHit.y >= -10 && planeHit.y <= 300) {
                     const sClamped = Math.max(archWidth / 2 + 2, Math.min(wLen - archWidth / 2 - 2, s));
                     const pX = x1 + sClamped * uX;
                     const pZ = z1 + sClamped * uZ;
                     const dist = Math.hypot(planeHit.x - pX, planeHit.z - pZ);
                     if (dist < minDist) {
                        minDist = dist;
                        bestRot = Math.atan2(x1 - x2, z1 - z2);
                        bestPos = [pX, defaultY, pZ];
                        bestWallThick = w.thickness || 20;
                     }
                  }
               }
            }

            // 2. Si no intersectó planos verticales directos, proyectar desde el suelo
            if (minDist === Infinity) {
               for (const w of effectiveWalls) {
                  const [x1, z1] = w.start;
                  const [x2, z2] = w.end;
                  const wLen = Math.hypot(x2 - x1, z2 - z1);
                  if (wLen < 10) continue;
                  const uX = (x2 - x1) / wLen;
                  const uZ = (z2 - z1) / wLen;

                  const s = (rawX - x1) * uX + (rawZ - z1) * uZ;
                  const sClamped = Math.max(archWidth / 2 + 2, Math.min(wLen - archWidth / 2 - 2, s));

                  const pX = x1 + sClamped * uX;
                  const pZ = z1 + sClamped * uZ;
                  const dist = Math.hypot(rawX - pX, rawZ - pZ);

                  if (dist < minDist) {
                     minDist = dist;
                     bestRot = Math.atan2(x1 - x2, z1 - z2);
                     bestPos = [pX, defaultY, pZ];
                     bestWallThick = w.thickness || 20;
                  }
               }
            }

            setGhostCabinet({ pos: bestPos, rot: bestRot, isColliding: false, wallThickness: bestWallThick } as any);
            return;
         }

         setGhostCabinet({ pos: bestPos, rot: bestRot, isColliding: false });
         return;
      } else {
        const specs = getCabinetSpecsFromTool(toolMode, cabinets);
        cabType = specs.type;
        cabVariant = specs.variant;
        cabWidth = specs.width;
        cabHeight = specs.height;
        cabDepth = specs.depth;
        customY = specs.defaultY;
        if (cabType === 'island') {
          const existingIsland = cabinets.find((c) => c.type === 'island');
          if (existingIsland && existingIsland.rotation !== undefined) {
            cabRot = existingIsland.rotation;
          }
        }
      }

      const result = resolvePlacement({
        mouseX: rawX,
        mouseZ: rawZ,
        cabWidth,
        cabHeight,
        cabDepth,
        cabType,
        variant: cabVariant,
        customY,
        preferredRot: cabRot,
        cabinets,
        ignoreId: null,
        walls,
        roomVertices: roomConfig?.vertices,
        architecturalElements,
      });

      setGhostCabinet({ pos: result.position, rot: result.rotation, isColliding: result.isColliding });
    }
  });

  const handlePointerDown = (e: any) => {
    if (toolMode === 'select') {
      setActiveCabinet(null);
      setActiveArchElement(null);
      setActiveWall(null);
      return;
    }
    e.stopPropagation();

    if (toolMode === 'draw_wall') {
      const pt = currentMousePos || [Math.round(e.point.x / 5) * 5, Math.round(e.point.z / 5) * 5];
      if (!drawingStart) {
        setDrawingStart(pt);
      } else {
        const wallLen = Math.hypot(pt[0] - drawingStart[0], pt[1] - drawingStart[1]);
        if (wallLen >= 15) {
          const newWallId = crypto.randomUUID();
          addWall({
            id: newWallId,
            start: drawingStart,
            end: pt,
            thickness: 15,
            height: 240,
            isInterior: true,
          });
          setActiveWall(newWallId);
        }
        setDrawingStart(null); 
      }
      return;
    } else if (toolMode.startsWith('place_arch_')) {
      const type = toolMode === 'place_arch_door' ? 'door' : toolMode === 'place_arch_window' ? 'window' : 'pillar';
      const name = type === 'door' ? 'Puerta' : type === 'window' ? 'Ventana' : 'Pilar / Muro Corto';
      const width = type === 'door' ? 90 : type === 'window' ? 120 : 40;
      const height = type === 'door' ? 205 : type === 'window' ? 100 : 240;
      const elevation = type === 'window' ? 90 : 0;
      const depth = 20;

      const targetPos = ghostCabinet ? ghostCabinet.pos : [e.point.x, elevation + height / 2, e.point.z];
      const effectiveWalls = walls && walls.length > 0 ? walls : (roomConfig?.vertices && roomConfig.vertices.length >= 3 ? roomConfig.vertices.map((v, i, arr) => {
         const next = arr[(i + 1) % arr.length];
         return { id: `wall_v_${i}`, start: [v.x, v.y], end: [next.x, next.y], thickness: 20, height: 240 };
      }) : []);

      let bestWallId = effectiveWalls[0]?.id || 'wall_0';
      let bestOffset = 0;
      let bestPos: [number, number, number] = targetPos as [number, number, number];
      let bestRot = ghostCabinet ? ghostCabinet.rot : 0;
      let minDist = Infinity;

      for (const w of effectiveWalls) {
         const [x1, z1] = w.start;
         const [x2, z2] = w.end;
         const wLen = Math.hypot(x2 - x1, z2 - z1);
         if (wLen < 10) continue;
         const uX = (x2 - x1) / wLen;
         const uZ = (z2 - z1) / wLen;
         const s = (targetPos[0] - x1) * uX + (targetPos[2] - z1) * uZ;
         const sClamped = Math.max(width / 2 + 2, Math.min(wLen - width / 2 - 2, s));
         const pX = x1 + sClamped * uX;
         const pZ = z1 + sClamped * uZ;
         const dist = Math.hypot(targetPos[0] - pX, targetPos[2] - pZ);

         if (dist < minDist) {
            minDist = dist;
            bestWallId = w.id || `wall_${Math.random()}`;
            bestOffset = sClamped - wLen / 2;
            bestPos = [pX, elevation + height / 2, pZ];
            bestRot = Math.atan2(x1 - x2, z1 - z2);
         }
      }

      addArchitecturalElement({
        id: crypto.randomUUID(),
        wallId: bestWallId,
        offset: bestOffset,
        type,
        name,
        width,
        height,
        elevation,
        depth,
        position: bestPos,
        rotation: bestRot,
      });
      setToolMode('select');
    } else if (toolMode === 'move_active') {
        if (useKitchenStore.getState().activeWallId) {
          setToolMode('select');
          return;
        }
        if (!ghostCabinet || !ghostCabinet.pos || ghostCabinet.isColliding) return;
        const activeCabId = useKitchenStore.getState().activeCabinetId;
        const activeArchId = useKitchenStore.getState().activeArchElementId;
        if (activeCabId) {
           const safePosX = Number(ghostCabinet.pos[0]) || 0;
           const safePosY = Number(ghostCabinet.pos[1]) || 40;
           const safePosZ = Number(ghostCabinet.pos[2]) || 0;
           const safeRot = Number(ghostCabinet.rot) || 0;
           useKitchenStore.getState().updateCabinet(activeCabId, {
             position: [safePosX, safePosY, safePosZ],
             rotation: safeRot,
           });
        } else if (activeArchId) {
           const activeArch = useKitchenStore.getState().architecturalElements.find(e => e.id === activeArchId);
           if (activeArch) {
              const effectiveWalls = walls && walls.length > 0 ? walls : (roomConfig?.vertices && roomConfig.vertices.length >= 3 ? roomConfig.vertices.map((v, i, arr) => {
                 const next = arr[(i + 1) % arr.length];
                 return { id: `wall_v_${i}`, start: [v.x, v.y], end: [next.x, next.y], thickness: 20, height: 240 };
              }) : []);

              let bestWallId = effectiveWalls[0]?.id || 'wall_0';
              let bestOffset = 0;
              let minDist = Infinity;

              for (const w of effectiveWalls) {
                 const [x1, z1] = w.start;
                 const [x2, z2] = w.end;
                 const wLen = Math.hypot(x2 - x1, z2 - z1);
                 if (wLen < 10) continue;
                 const uX = (x2 - x1) / wLen;
                 const uZ = (z2 - z1) / wLen;
                 const s = (ghostCabinet.pos[0] - x1) * uX + (ghostCabinet.pos[2] - z1) * uZ;
                 const sClamped = Math.max(activeArch.width / 2 + 2, Math.min(wLen - activeArch.width / 2 - 2, s));
                 const pX = x1 + sClamped * uX;
                 const pZ = z1 + sClamped * uZ;
                 const dist = Math.hypot(ghostCabinet.pos[0] - pX, ghostCabinet.pos[2] - pZ);

                 if (dist < minDist) {
                    minDist = dist;
                    bestWallId = w.id || `wall_${Math.random()}`;
                    bestOffset = sClamped - wLen / 2;
                 }
              }

              useKitchenStore.getState().updateArchitecturalElement(activeArchId, {
                position: ghostCabinet.pos as [number, number, number],
                rotation: ghostCabinet.rot,
                wallId: bestWallId,
                offset: bestOffset,
              });
           }
        }
        setToolMode('select');
    } else if (toolMode.startsWith('place_') && ghostCabinet && !ghostCabinet.isColliding) {
      const specs = getCabinetSpecsFromTool(toolMode, cabinets);
      const cabType = specs.type;
      const cabVariant = specs.variant;
      const cabWidth = specs.width;
      const cabHeight = specs.height;
      const cabDepth = specs.depth;

      const newId = crypto.randomUUID();
      const gState = useStore.getState();
      addCabinet({
         id: newId,
         type: cabType,
         variant: cabVariant,
         width: cabWidth,
         height: cabHeight,
         depth: cabDepth,
         position: ghostCabinet.pos,
         rotation: ghostCabinet.rot,
         color: '#f8fafc',
         structureColor: gState.structureColor || '#f8fafc',
         doorColor: gState.doorColor || '#f8fafc',
         drawerFrontColor: gState.drawerFrontColor || gState.doorColor || '#f8fafc',
         drawerInnerColor: gState.drawerInnerColor || '#f8fafc',
         shelfColor: gState.shelfColor || '#f8fafc',
         backColor: gState.backColor || '#f8fafc',
         socleColor: gState.socleColor || '#111',
         structureMaterial: gState.structureMaterial,
         doorMaterial: gState.doorMaterial,
         drawerFrontMaterial: gState.drawerFrontMaterial,
         drawerInnerMaterial: gState.drawerInnerMaterial,
         shelfMaterial: gState.shelfMaterial,
         socleMaterial: gState.socleMaterial,
      });
      const isDeco = cabType === 'decoration' || cabVariant.startsWith('deco_');
      if (!isDeco) {
        setActiveCabinet(newId);
      } else {
        setActiveCabinet(null);
      }
      setToolMode('select');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
         setDrawingStart(null);
         setActiveWall(null);
         setToolMode('select');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setDrawingStart, setToolMode, setActiveWall]);

  const isLight = theme === 'light';

  return (
    <>
      <color attach="background" args={[isLight ? '#e2e8f0' : '#1a1a1a']} />
      <ambientLight intensity={isLight ? 0.65 : 0.55} />
      <directionalLight
        position={[200, 350, 250]}
        castShadow
        intensity={1.1}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
        shadow-normalBias={0.04}
        shadow-camera-near={10}
        shadow-camera-far={1500}
        shadow-camera-left={-500}
        shadow-camera-right={500}
        shadow-camera-top={500}
        shadow-camera-bottom={-500}
      />
      <directionalLight position={[-250, 250, -200]} intensity={0.35} />
      <hemisphereLight args={[isLight ? '#f8fafc' : '#e0f2fe', isLight ? '#94a3b8' : '#334155', 0.45]} />

      {is2D ? (
        <OrthographicCamera 
          key="camera-2d"
          makeDefault 
          position={[roomBounds.centerX, 1000, roomBounds.centerZ]} 
          up={[0, 0, -1]} 
          zoom={ideal2DZoom} 
          near={1} 
          far={3000} 
        />
      ) : (
        <PerspectiveCamera 
          key="camera-3d"
          makeDefault 
          position={[460, 390, 560]} 
          fov={45} 
          near={1} 
          far={3000} 
        />
      )}
      
      {(() => {
        const isInteracting = Boolean(
          draggingArchElementId ||
          draggingCabinetId ||
          draggingWallId ||
          (activeWallId && toolMode === 'move_active')
        );
        return is2D ? (
          <OrbitControls 
            key="controls-2d"
            ref={controls2dRef}
            enableRotate={false}
            enableZoom={!isInteracting}
            enablePan={!isInteracting}
            screenSpacePanning={true}
            target={[roomBounds.centerX, 0, roomBounds.centerZ]}
          />
        ) : (
          <OrbitControls 
            key="controls-3d"
            ref={controls3dRef}
            enableRotate={!isInteracting} 
            enableZoom={!isInteracting}
            enablePan={!isInteracting}
            minPolarAngle={0} 
            maxPolarAngle={Math.PI / 2 - 0.05} 
            target={[0, 30, 0]}
            maxDistance={40000}
            minDistance={5}
          />
        );
      })()}

      <group name="kitchenGroup">
        {/* Ground Plane (fondo exterior separado verticalmente para evitar z-fighting, ampliado a 200m x 200m) */}
        <mesh name="groundPlane" rotation={[-Math.PI/2, 0, 0]} position={[0, -1, 0]} receiveShadow onPointerDown={handlePointerDown}>
          <planeGeometry args={[20000, 20000]} />
          <meshStandardMaterial color={isLight ? '#cbd5e1' : '#1e2022'} roughness={0.9} />
        </mesh>
        
        {is2D && (
          <Grid 
            position={[0, 0.1, 0]} 
            args={[20000, 20000]} 
            infiniteGrid 
            fadeDistance={10000} 
            sectionColor={isLight ? '#94a3b8' : '#666'} 
            cellColor={isLight ? '#cbd5e1' : '#333'} 
          />
        )}

        <RoomFloorAndDimensions onPointerDown={handlePointerDown} />
        {effectiveWalls.map((wall, idx) => <Wall key={wall.id} {...wall} index={idx} />)}
        <React.Suspense fallback={null}>
          {cabinets.map((cab, idx) => {
            if (toolMode === 'move_active' && cab.id === useKitchenStore.getState().activeCabinetId) return null;
            return <Cabinet key={cab.id} {...cab} index={idx} />;
          })}
          {!draggingCabinetId && (
            <>
              <KitchenSocle />
              <KitchenCountertop3D />
              <KitchenIslandBackPanel />
              <KitchenRunDimensions />
              <KitchenSpatialDimensions />
              <KitchenMepScene />
            </>
          )}
          <ArchitecturalElementsRenderer />
          <StudioCapturePipeline />
        </React.Suspense>

        {/* Drawing Preview */}
        {toolMode === 'draw_wall' && drawingStart && currentMousePos && (
          <WallPreview start={drawingStart} end={currentMousePos} thickness={15} height={240} />
        )}

        {/* Cabinet Preview */}
        {(toolMode.startsWith('place_') || toolMode === 'move_active') && ghostCabinet && !is2D && (() => {
           if (!ghostCabinet || !ghostCabinet.pos) return null;
           let previewW = 60;
           let previewH = 80;
           let previewD = 60;
           let isArch = false;
           let archType = '';

           const activeCab = useKitchenStore.getState().cabinets.find(c => c.id === useKitchenStore.getState().activeCabinetId);
           const activeArch = useKitchenStore.getState().architecturalElements.find(a => a.id === useKitchenStore.getState().activeArchElementId);
           if (toolMode === 'move_active' && activeCab) {
              previewW = activeCab.width;
              previewH = activeCab.height;
              previewD = activeCab.depth;
           } else if (toolMode === 'move_active' && activeArch) {
              isArch = true;
              archType = activeArch.type;
              previewW = activeArch.width;
              previewH = activeArch.height;
              previewD = activeArch.type === 'pillar' ? (activeArch.depth ?? 20) : (activeArch.depth ?? 16);
           } else if (toolMode.startsWith('place_arch_')) {
              isArch = true;
              archType = toolMode === 'place_arch_door' ? 'door' : toolMode === 'place_arch_window' ? 'window' : 'pillar';
              previewW = archType === 'door' ? 90 : archType === 'window' ? 120 : 40;
              previewH = archType === 'door' ? 205 : archType === 'window' ? 100 : 240;
              previewD = archType === 'pillar' ? 20 : 16;
           } else if (toolMode.startsWith('place_')) {
              const specs = getCabinetSpecsFromTool(toolMode, cabinets);
              previewW = specs.width;
              previewH = specs.height;
              previewD = specs.depth;
           }

           const wallThickness = (ghostCabinet as any).wallThickness || 20;
           const casingDepth = Math.max(previewD, wallThickness + 4);
           const posX = ghostCabinet.pos[0];
           const posY = isArch ? (archType === 'window' ? 90 + previewH / 2 : previewH / 2) : ghostCabinet.pos[1];
           const posZ = ghostCabinet.pos[2];

           return (
             <group position={[posX, posY, posZ]} rotation={[0, isArch ? ghostCabinet.rot + Math.PI / 2 : ghostCabinet.rot, 0]}>
               {isArch ? (
                 <group>
                   {archType === 'door' && (
                     <group>
                       {/* Marco perimetral abrazando el espesor del muro */}
                       <mesh position={[0, 0, 0]}>
                         <boxGeometry args={[previewW, previewH, casingDepth]} />
                         <meshStandardMaterial color="#38bdf8" transparent opacity={0.35} side={THREE.DoubleSide} />
                         <Edges scale={1.0} color="#0284c7" renderOrder={2000} />
                       </mesh>
                       {/* Tapajuntas frontal cara interior */}
                       <mesh position={[0, 0, casingDepth / 2 + 0.6]}>
                         <boxGeometry args={[previewW + 8, previewH + 4, 1.2]} />
                         <meshStandardMaterial color="#0284c7" transparent opacity={0.7} side={THREE.DoubleSide} />
                         <Edges scale={1.0} color="#0369a1" renderOrder={2001} />
                       </mesh>
                       {/* Tapajuntas trasero cara exterior */}
                       <mesh position={[0, 0, -casingDepth / 2 - 0.6]}>
                         <boxGeometry args={[previewW + 8, previewH + 4, 1.2]} />
                         <meshStandardMaterial color="#0284c7" transparent opacity={0.7} side={THREE.DoubleSide} />
                         <Edges scale={1.0} color="#0369a1" renderOrder={2001} />
                       </mesh>
                       {/* Hoja de puerta interior */}
                       <mesh position={[0, 0, 0]}>
                         <boxGeometry args={[previewW - 8, previewH - 6, 3.8]} />
                         <meshStandardMaterial color="#cbd5e1" transparent opacity={0.65} side={THREE.DoubleSide} />
                       </mesh>
                     </group>
                   )}
                   {archType === 'window' && (
                     <group>
                       {/* Marco perimetral abrazando el espesor del muro */}
                       <mesh position={[0, 0, 0]}>
                         <boxGeometry args={[previewW, previewH, casingDepth]} />
                         <meshStandardMaterial color="#38bdf8" transparent opacity={0.35} side={THREE.DoubleSide} />
                         <Edges scale={1.0} color="#0284c7" renderOrder={2000} />
                       </mesh>
                       {/* Chambrana frontal cara interior */}
                       <mesh position={[0, 0, casingDepth / 2 + 0.6]}>
                         <boxGeometry args={[previewW + 8, previewH + 8, 1.2]} />
                         <meshStandardMaterial color="#0284c7" transparent opacity={0.7} side={THREE.DoubleSide} />
                         <Edges scale={1.0} color="#0369a1" renderOrder={2001} />
                       </mesh>
                       {/* Chambrana trasera cara exterior */}
                       <mesh position={[0, 0, -casingDepth / 2 - 0.6]}>
                         <boxGeometry args={[previewW + 8, previewH + 8, 1.2]} />
                         <meshStandardMaterial color="#0284c7" transparent opacity={0.7} side={THREE.DoubleSide} />
                         <Edges scale={1.0} color="#0369a1" renderOrder={2001} />
                       </mesh>
                       {/* Vidrio central */}
                       <mesh position={[0, 0, 0]}>
                         <boxGeometry args={[previewW - 10, previewH - 10, 1.5]} />
                         <meshStandardMaterial color="#bae6fd" transparent opacity={0.5} side={THREE.DoubleSide} />
                       </mesh>
                     </group>
                   )}
                   {archType === 'pillar' && (
                     <mesh position={[0, 0, 0]}>
                       <boxGeometry args={[previewW, previewH, previewD]} />
                       <meshStandardMaterial color="#38bdf8" transparent opacity={0.6} side={THREE.DoubleSide} />
                       <Edges scale={1.0} color="#0284c7" renderOrder={2000} />
                     </mesh>
                   )}
                 </group>
               ) : (
                 <mesh>
                   <boxGeometry args={[previewW, previewH, previewD]} />
                   <meshStandardMaterial color={ghostCabinet.isColliding ? '#ef4444' : '#f97316'} transparent opacity={0.45} />
                   <Edges scale={1.0} color={ghostCabinet.isColliding ? '#ef4444' : '#f97316'} />
                 </mesh>
               )}
               {toolMode === 'move_active' && (
                 <MoveArrowGizmo height={previewH} width={previewW} depth={previewD} isColliding={ghostCabinet.isColliding} />
               )}
             </group>
           );
        })()}
      </group>
    </>
  )
}

export function KitchenScene({ theme = 'dark' }: { theme?: 'dark' | 'light' }) {
  return (
    <Canvas 
      shadows={{ type: THREE.PCFSoftShadowMap }}
      camera={{ far: 40000 }}
      gl={{ 
        antialias: true, 
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true,
      }}
      onPointerMissed={() => {
        const state = useKitchenStore.getState();
        if (state.toolMode === 'select') {
          state.setActiveCabinet(null);
          state.setActiveArchElement(null);
        }
      }}
    >
      <React.Suspense fallback={null}>
        <SceneContent theme={theme} />
      </React.Suspense>
    </Canvas>
  )
}

function MoveArrowGizmo({ height, width, depth, isColliding }: { height: number; width: number; depth: number; isColliding?: boolean }) {
  const groupRef = React.useRef<THREE.Group>(null);
  const color = isColliding ? '#ef4444' : '#f97316';
  const glowColor = isColliding ? '#fca5a5' : '#fed7aa';

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.position.y = height / 2 + 18 + Math.sin(t * 5) * 2.5;
  });

  const arrowArm = Math.max(25, Math.min(45, width * 0.4));

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Flechas cardinales en el piso/base del mueble indicando traslación */}
      <group position={[0, -height / 2 + 0.5, 0]}>
        {/* Eje X (Izquierda / Derecha) */}
        <Line points={[[-arrowArm, 0, 0], [arrowArm, 0, 0]]} color={color} lineWidth={3} depthTest={false} renderOrder={1001} />
        <mesh position={[arrowArm, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[2.5, 5, 8]} />
          <meshBasicMaterial color={color} depthTest={false} />
        </mesh>
        <mesh position={[-arrowArm, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[2.5, 5, 8]} />
          <meshBasicMaterial color={color} depthTest={false} />
        </mesh>

        {/* Eje Z (Adelante / Atrás) */}
        <Line points={[[0, 0, -arrowArm], [0, 0, arrowArm]]} color={color} lineWidth={3} depthTest={false} renderOrder={1001} />
        <mesh position={[0, 0, arrowArm]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[2.5, 5, 8]} />
          <meshBasicMaterial color={color} depthTest={false} />
        </mesh>
        <mesh position={[0, 0, -arrowArm]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[2.5, 5, 8]} />
          <meshBasicMaterial color={color} depthTest={false} />
        </mesh>
      </group>

      {/* 2. Flecha / Cursor 3D vertical descendente situada directamente sobre el mueble */}
      <group ref={groupRef} position={[0, height / 2 + 18, 0]}>
        {/* Fuste cilíndrico de la flecha */}
        <mesh position={[0, 6, 0]}>
          <cylinderGeometry args={[1.2, 1.2, 12, 16]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} roughness={0.2} metalness={0.8} />
        </mesh>
        {/* Punta cónica de la flecha apuntando hacia abajo al mueble */}
        <mesh position={[0, 0, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[4.5, 9, 24]} />
          <meshStandardMaterial color={color} emissive={glowColor} emissiveIntensity={0.8} roughness={0.2} metalness={0.8} />
        </mesh>

        {/* Anillo de enfoque / halo luminoso */}
        <mesh position={[0, 12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[5, 0.6, 12, 24]} />
          <meshBasicMaterial color={color} />
        </mesh>

        {/* Rótulo 3D flotante */}
        <group position={[0, 16, 0]}>
          <Text
            fontSize={6.5}
            color={color}
            anchorX="center"
            anchorY="bottom"
            material-depthTest={false}
            material-toneMapped={false}
            renderOrder={1002}
          >
            {isColliding ? '⚠️ POSICIÓN BLOQUEADA' : '✛ MOVER ELEMENTO'}
          </Text>
          <Text
            position={[0, -4.5, 0]}
            fontSize={4}
            color="#ffffff"
            anchorX="center"
            anchorY="bottom"
            material-depthTest={false}
            material-toneMapped={false}
            renderOrder={1002}
          >
            Clic en muro o piso para fijar
          </Text>
        </group>
      </group>
    </group>
  );
}

function WallPreview({start, end, thickness, height}: any) {
  const length = Math.hypot(end[0] - start[0], end[1] - start[1]);
  const cx = (start[0] + end[0]) / 2;
  const cz = (start[1] + end[1]) / 2;
  const rotY = Math.atan2(start[0] - end[0], start[1] - end[1]);

  return (
    <group position={[cx, height/2, cz]} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[thickness, height, length]} />
        <meshStandardMaterial color="#f97316" transparent opacity={0.65} roughness={0.7} />
      </mesh>
      <group position={[0, height / 2 + 10, 0]} renderOrder={999}>
        <Line points={[[0, 0, -length / 2], [0, 0, length / 2]]} color="#f97316" lineWidth={2.5} depthTest={false} renderOrder={999} />
        <Line points={[[-3, 0, -length / 2], [3, 0, -length / 2]]} color="#f97316" lineWidth={2.5} depthTest={false} renderOrder={999} />
        <Line points={[[-3, 0, length / 2], [3, 0, length / 2]]} color="#f97316" lineWidth={2.5} depthTest={false} renderOrder={999} />
        <Text position={[0, 4, 0]} rotation={[0, Math.PI / 2, 0]} fontSize={8} color="#f97316" anchorX="center" anchorY="bottom" material-depthTest={false} material-toneMapped={false} renderOrder={1000}>
          {`${Math.round(length)} cm`}
        </Text>
      </group>
    </group>
  );
}
