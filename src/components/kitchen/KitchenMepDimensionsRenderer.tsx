import React, { useMemo } from 'react';
import { useKitchenStore, WallType } from '../../store/kitchenStore';
import { DimensionCota } from '../DimensionCota';
import { getWallInwardNormal } from '../../utils/kitchenCollision';

export const KitchenMepDimensionsRenderer: React.FC = () => {
  const {
    mepPoints,
    walls,
    roomConfig,
    showMep,
    showMepDimensions,
    activeMepId,
    viewMode,
  } = useKitchenStore();

  const is2D = viewMode === '2d';

  const roomPoly = useMemo(() => {
    return roomConfig?.vertices?.map((v) => [v.x, v.y] as [number, number]) || [];
  }, [roomConfig?.vertices]);

  // Obtener muros efectivos
  const effectiveWalls = useMemo(() => {
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

  if (!showMep || !showMepDimensions || mepPoints.length === 0 || effectiveWalls.length === 0) {
    return null;
  }

  // Agrupar puntos por muro
  const pointsByWall = new Map<string, typeof mepPoints>();
  for (const pt of mepPoints) {
    const wId = pt.wallId || effectiveWalls[0]?.id;
    if (!wId) continue;
    if (!pointsByWall.has(wId)) {
      pointsByWall.set(wId, []);
    }
    pointsByWall.get(wId)!.push(pt);
  }

  return (
    <group name="kitchen-mep-dimensions-group">
      {Array.from(pointsByWall.entries()).map(([wallId, points]) => {
        const wallIndex = effectiveWalls.findIndex((w) => w.id === wallId);
        const wall = wallIndex >= 0 ? effectiveWalls[wallIndex] : effectiveWalls[0];
        if (!wall) return null;

        const [x1, z1] = wall.start;
        const [x2, z2] = wall.end;
        const wLen = Math.hypot(x2 - x1, z2 - z1);
        if (wLen < 5) return null;

        const uX = (x2 - x1) / wLen;
        const uZ = (z2 - z1) / wLen;
        
        // Normal interior del muro
        const [normX, normZ] = getWallInwardNormal(x1, z1, x2, z2, roomPoly);
        const wallThick = wall.thickness || roomConfig?.wallThickness || 20;
        
        // La cara frontal del muro (frente de muro visible al interior)
        const wallFrontDist = wallThick / 2;
        // Distancia para renderizado de cota (ligeramente al frente de la cara para evitar solapes)
        const cotaOffsetDist = wallFrontDist + (is2D ? 2 : 1.5);

        // Muros adyacentes para calcular las esquinas interiores reales
        const prevWall = effectiveWalls[(wallIndex - 1 + effectiveWalls.length) % effectiveWalls.length];
        const nextWall = effectiveWalls[(wallIndex + 1) % effectiveWalls.length];
        const prevThick = prevWall?.thickness || wallThick;
        const nextThick = nextWall?.thickness || wallThick;

        // Frente del muro perpendicular en la esquina inicial y final (la cara interior terminada de la esquina)
        const startCornerInnerOffset = prevThick / 2;
        const endCornerInnerOffset = nextThick / 2;

        // Ordenar puntos por offset a lo largo del muro
        const sortedPoints = [...points].sort((a, b) => (a.wallOffset || 0) - (b.wallOffset || 0));

        return (
          <group key={`mep_wall_dims_${wall.id}`}>
            {sortedPoints.map((pt) => {
              const offset = Math.max(0, Math.min(wLen, pt.wallOffset || 0));
              const elev = pt.elevation || 0;
              const isSelected = activeMepId === pt.id;

              // Coordenadas base en el frente del muro
              const baseX = x1 + offset * uX + normX * cotaOffsetDist;
              const baseZ = z1 + offset * uZ + normZ * cotaOffsetDist;

              // 1. Cota vertical: Parte en el piso AL FRENTE DEL MURO y termina en la cota de elevación del elemento
              const verticalCota = (
                <DimensionCota
                  key={`elev_${pt.id}`}
                  start={[baseX, 0, baseZ]}
                  end={[baseX, elev, baseZ]}
                  label={`${Math.round(elev)} cm`}
                  color={isSelected ? '#38bdf8' : '#0284c7'}
                  fontSize={isSelected ? 5.2 : 4.4}
                  lineWidth={isSelected ? 2.0 : 1.5}
                  tickDirection="auto"
                  textOffset={[normX * 2.5, 0, normZ * 2.5]}
                />
              );

              // 2. Cota horizontal: Medida desde la cara interior (frente) del muro perpendicular más cercano
              const distToStartCorner = Math.max(0, offset - startCornerInnerOffset);
              const distToEndCorner = Math.max(0, (wLen - offset) - endCornerInnerOffset);
              const isCloserToStart = distToStartCorner <= distToEndCorner;
              const nearestDist = isCloserToStart ? distToStartCorner : distToEndCorner;

              // Coordenadas del extremo en la cara interior de la esquina (frente del muro perpendicular)
              const cornerX = isCloserToStart
                ? x1 + startCornerInnerOffset * uX + normX * cotaOffsetDist
                : x2 - endCornerInnerOffset * uX + normX * cotaOffsetDist;
              const cornerZ = isCloserToStart
                ? z1 + startCornerInnerOffset * uZ + normZ * cotaOffsetDist
                : z2 - endCornerInnerOffset * uZ + normZ * cotaOffsetDist;

              const horizontalCotaY = is2D ? 2 : elev;

              const nearestWallCota = (
                <DimensionCota
                  key={`nearest_wall_${pt.id}`}
                  start={[cornerX, horizontalCotaY, cornerZ]}
                  end={[baseX, horizontalCotaY, baseZ]}
                  label={`${Math.round(nearestDist)} cm`}
                  color={isSelected ? '#34d399' : '#059669'}
                  fontSize={isSelected ? 5.2 : 4.4}
                  lineWidth={isSelected ? 2.0 : 1.5}
                  tickDirection="y"
                  textOffset={[normX * 2.5, is2D ? 0 : 2, normZ * 2.5]}
                />
              );

              return (
                <React.Fragment key={`dims_fragment_${pt.id}`}>
                  {verticalCota}
                  {nearestWallCota}
                </React.Fragment>
              );
            })}
          </group>
        );
      })}
    </group>
  );
};
