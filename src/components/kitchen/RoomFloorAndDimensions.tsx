import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useKitchenStore } from '../../store/kitchenStore';
import { analyzeRoomWalls, calculatePolygonArea } from '../../utils/roomGeometry';
import { FLOOR_TYPE_OPTIONS, generateFloorCanvasTexture } from '../../utils/kitchenMaterials';
import { getWallInwardNormal } from '../../utils/kitchenCollision';
import { Text, Line } from '@react-three/drei';

export function RoomFloorAndDimensions({ onPointerDown }: { onPointerDown?: (e: any) => void }) {
  const { roomConfig, viewMode, floorType } = useKitchenStore();
  const vertices = useMemo(() => {
    if (roomConfig?.vertices && roomConfig.vertices.length >= 3) {
      return roomConfig.vertices;
    }
    return [
      { id: 'v1', x: -250, y: -200 },
      { id: 'v2', x: 250, y: -200 },
      { id: 'v3', x: 250, y: 200 },
      { id: 'v4', x: -250, y: 200 },
    ];
  }, [roomConfig?.vertices]);
  const is2D = viewMode === '2d';

  const currentFloorOption = useMemo(() => {
    return FLOOR_TYPE_OPTIONS.find((f) => f.id === floorType) || FLOOR_TYPE_OPTIONS[0];
  }, [floorType]);

  const floorTexture = useMemo(() => {
    if (is2D) return null; // In 2D technical mode, keep clean surface without noise
    try {
      return generateFloorCanvasTexture(floorType || 'ceramic_white_60x60');
    } catch (e) {
      console.warn('Error loading floor texture', e);
      return null;
    }
  }, [floorType, is2D]);

  // Crear la geometría del piso poligonal de la cocina con mapeo UV métrico para baldosas reales
  const floorGeometry = useMemo(() => {
    if (!vertices || vertices.length < 3) return null;
    try {
      const shape = new THREE.Shape();
      shape.moveTo(vertices[0].x, -vertices[0].y);
      for (let i = 1; i < vertices.length; i++) {
        shape.lineTo(vertices[i].x, -vertices[i].y);
      }
      shape.closePath();
      const geom = new THREE.ShapeGeometry(shape);

      const posAttr = geom.attributes.position;
      const uvs = new Float32Array(posAttr.count * 2);
      const tileSizeCm = 60;
      for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i);
        const y = posAttr.getY(i);
        uvs[i * 2] = x / tileSizeCm;
        uvs[i * 2 + 1] = y / tileSizeCm;
      }
      geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      geom.computeVertexNormals();
      return geom;
    } catch (e) {
      console.warn('Error generating floor geometry', e);
      return null;
    }
  }, [vertices]);

  const wallSegments = useMemo(() => {
    if (!vertices || vertices.length < 3) return [];
    return analyzeRoomWalls(vertices);
  }, [vertices]);

  const areaM2 = useMemo(() => {
    if (!vertices || vertices.length < 3) return 0;
    return calculatePolygonArea(vertices);
  }, [vertices]);

  const perimeterCm = useMemo(() => {
    if (!wallSegments || wallSegments.length === 0) return 0;
    return wallSegments.reduce((sum, seg) => sum + seg.length, 0);
  }, [wallSegments]);

  // Centro de la estancia para el texto del área
  const center = useMemo(() => {
    if (!vertices || vertices.length === 0) return [0, 0];
    let sumX = 0;
    let sumY = 0;
    vertices.forEach((v) => {
      sumX += v.x;
      sumY += v.y;
    });
    return [sumX / vertices.length, sumY / vertices.length];
  }, [vertices]);

  // Bounding box para ubicar norte y escala
  const bounds = useMemo(() => {
    if (!vertices || vertices.length === 0) return { minX: -250, maxX: 250, minY: -200, maxY: 200 };
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    vertices.forEach((v) => {
      if (v.x < minX) minX = v.x;
      if (v.x > maxX) maxX = v.x;
      if (v.y < minY) minY = v.y;
      if (v.y > maxY) maxY = v.y;
    });
    return { minX, maxX, minY, maxY };
  }, [vertices]);

  // Puntos del contorno perimetral para el trazado interior de alta definición
  const contourPoints = useMemo(() => {
    if (!vertices || vertices.length < 3) return [];
    const pts: [number, number, number][] = vertices.map(v => [v.x, 0.2, v.y]);
    pts.push([vertices[0].x, 0.2, vertices[0].y]);
    return pts;
  }, [vertices]);

  if (!vertices || vertices.length < 3 || !floorGeometry) return null;

  return (
    <group name="roomFloorGroup">
      {/* 1. Suelo arquitectónico de la cocina */}
      <mesh
        geometry={floorGeometry}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.05, 0]}
        receiveShadow
        onPointerDown={(e) => {
          if (onPointerDown) {
            onPointerDown(e);
          } else {
            const state = useKitchenStore.getState();
            if (state.toolMode === 'select') {
              state.setActiveCabinet(null);
              state.setActiveArchElement(null);
            }
          }
        }}
      >
        <meshStandardMaterial
          map={floorTexture || undefined}
          color={is2D ? '#f8fafc' : (floorTexture ? '#ffffff' : currentFloorOption.primaryColor)}
          roughness={is2D ? 1.0 : currentFloorOption.roughness}
          metalness={is2D ? 0.0 : currentFloorOption.metalness}
          polygonOffset={true}
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
          depthWrite={true}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Contorno perimetral nítido en modo 2D */}
      {is2D && contourPoints.length > 0 && (
        <Line
          points={contourPoints}
          color="#334155"
          lineWidth={2}
          depthTest={false}
          renderOrder={500}
        />
      )}

      {/* 2. Visualización 2D: Cotas perimetrales de alto contraste, Cajetín de Visto Bueno, Norte y Escala */}
      {is2D && (
        <group position={[0, 1, 0]}>
          {/* Cajetín Central Técnico Arquitectónico (Visto Bueno / VB) */}
          <group position={[center[0], 2, center[1]]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1000}>
            {/* Fondo del cajetín */}
            <mesh position={[0, 0, 0]}>
              <planeGeometry args={[160, 68]} />
              <meshBasicMaterial color="#0f172a" transparent opacity={0.92} />
            </mesh>
            {/* Borde sutil del cajetín */}
            <Line
              points={[
                [-80, -34, 0.1],
                [80, -34, 0.1],
                [80, 34, 0.1],
                [-80, 34, 0.1],
                [-80, -34, 0.1],
              ]}
              color="#38bdf8"
              lineWidth={1.5}
              depthTest={false}
            />

            {/* Cabecera / Subtítulo */}
            <Text
              position={[0, 20, 0.2]}
              fontSize={7}
              color="#94a3b8"
              anchorX="center"
              anchorY="middle"
              material-toneMapped={false}
              material-depthTest={false}
              renderOrder={1001}
            >
              PLANO ARQUITECTÓNICO 2D • VB
            </Text>

            {/* Área principal destacada */}
            <Text
              position={[0, 4, 0.2]}
              fontSize={20}
              color="#38bdf8"
              anchorX="center"
              anchorY="middle"
              material-toneMapped={false}
              material-depthTest={false}
              renderOrder={1001}
            >
              {`${areaM2.toFixed(2)} m²`}
            </Text>

            {/* Datos complementarios: Perímetro y Altura */}
            <Text
              position={[0, -14, 0.2]}
              fontSize={7.5}
              color="#f8fafc"
              anchorX="center"
              anchorY="middle"
              material-toneMapped={false}
              material-depthTest={false}
              renderOrder={1001}
            >
              {`PERÍMETRO: ${(perimeterCm / 100).toFixed(2)} m  |  H: ${((roomConfig?.wallHeight || 250) / 100).toFixed(2)} m`}
            </Text>

            <Text
              position={[0, -25, 0.2]}
              fontSize={6}
              color="#f59e0b"
              anchorX="center"
              anchorY="middle"
              material-toneMapped={false}
              material-depthTest={false}
              renderOrder={1001}
            >
              {`DISTRIBUCIÓN: ${roomConfig?.type === 'l_shape' ? 'FORMA L' : roomConfig?.type === 'u_shape' ? 'FORMA U' : roomConfig?.type === 'five_corners' ? '5 ESQUINAS' : 'RECTANGULAR'}`}
            </Text>
          </group>

          {/* Cotas exteriores y Letras A, B, C, D... con badges de alto contraste */}
          {wallSegments.map((seg) => {
            const p1 = [seg.start.x, seg.start.y];
            const p2 = [seg.end.x, seg.end.y];
            const dx = p2[0] - p1[0];
            const dz = p2[1] - p1[1];
            const len = Math.hypot(dx, dz);
            if (len === 0) return null;

            const poly = vertices.map((v) => [v.x, v.y] as [number, number]);
            const [inwardX, inwardZ] = getWallInwardNormal(p1[0], p1[1], p2[0], p2[1], poly);
            const outX = -inwardX;
            const outZ = -inwardZ;

            const midX = (p1[0] + p2[0]) / 2;
            const midZ = (p1[1] + p2[1]) / 2;

            const cotaDist = (roomConfig?.wallThickness || 20) / 2 + 35;
            const labelDist = cotaDist + 36;

            const c1: [number, number, number] = [p1[0] + outX * cotaDist, 2, p1[1] + outZ * cotaDist];
            const c2: [number, number, number] = [p2[0] + outX * cotaDist, 2, p2[1] + outZ * cotaDist];
            const labelPos: [number, number, number] = [midX + outX * labelDist, 2, midZ + outZ * labelDist];
            const textPos: [number, number, number] = [(c1[0] + c2[0]) / 2, 2, (c1[2] + c2[2]) / 2];

            // Dirección perpendicular y tangencial de la línea de cota para ticks arquitectónicos a 45°
            const dirX = dx / len;
            const dirZ = dz / len;
            const tickSize = 6;
            const tick1Start: [number, number, number] = [
              c1[0] - (dirX + outX) * (tickSize / 2),
              2,
              c1[2] - (dirZ + outZ) * (tickSize / 2),
            ];
            const tick1End: [number, number, number] = [
              c1[0] + (dirX + outX) * (tickSize / 2),
              2,
              c1[2] + (dirZ + outZ) * (tickSize / 2),
            ];
            const tick2Start: [number, number, number] = [
              c2[0] - (dirX + outX) * (tickSize / 2),
              2,
              c2[2] - (dirZ + outZ) * (tickSize / 2),
            ];
            const tick2End: [number, number, number] = [
              c2[0] + (dirX + outX) * (tickSize / 2),
              2,
              c2[2] + (dirZ + outZ) * (tickSize / 2),
            ];

            return (
              <group key={`dim_2d_${seg.index}`}>
                {/* Línea de cota principal en color naranja técnico */}
                <Line points={[c1, c2]} color="#ea580c" lineWidth={2} depthTest={false} renderOrder={999} material-toneMapped={false} />
                
                {/* Líneas auxiliares de cota */}
                <Line
                  points={[
                    [p1[0] + outX * 6, 2, p1[1] + outZ * 6],
                    [p1[0] + outX * (cotaDist + 10), 2, p1[1] + outZ * (cotaDist + 10)],
                  ]}
                  color="#ea580c"
                  lineWidth={1.5}
                  depthTest={false}
                  renderOrder={999}
                  material-toneMapped={false}
                />
                <Line
                  points={[
                    [p2[0] + outX * 6, 2, p2[1] + outZ * 6],
                    [p2[0] + outX * (cotaDist + 10), 2, p2[1] + outZ * (cotaDist + 10)],
                  ]}
                  color="#ea580c"
                  lineWidth={1.5}
                  depthTest={false}
                  renderOrder={999}
                  material-toneMapped={false}
                />

                {/* Ticks terminales arquitectónicos a 45° */}
                <Line points={[tick1Start, tick1End]} color="#ea580c" lineWidth={2.5} depthTest={false} renderOrder={1000} material-toneMapped={false} />
                <Line points={[tick2Start, tick2End]} color="#ea580c" lineWidth={2.5} depthTest={false} renderOrder={1000} material-toneMapped={false} />

                {/* Badge de Letra de Muro (A, B, C...) con círculo de alto contraste */}
                <group position={labelPos} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1001}>
                  <mesh position={[0, 0, 0]}>
                    <circleGeometry args={[11, 24]} />
                    <meshBasicMaterial color="#0f172a" />
                  </mesh>
                  <mesh position={[0, 0, 0.05]}>
                    <ringGeometry args={[9.5, 11, 24]} />
                    <meshBasicMaterial color="#ea580c" />
                  </mesh>
                  <Text
                    position={[0, 0, 0.1]}
                    fontSize={12}
                    color="#ffffff"
                    anchorX="center"
                    anchorY="middle"
                    material-toneMapped={false}
                    material-depthTest={false}
                    renderOrder={1002}
                  >
                    {seg.label}
                  </Text>
                </group>

                {/* Badge de Longitud Numérica con fondo oscuro contrastado */}
                <group position={textPos} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1001}>
                  <mesh position={[0, 0, 0]}>
                    <planeGeometry args={[56, 18]} />
                    <meshBasicMaterial color="#0f172a" />
                  </mesh>
                  <Line
                    points={[
                      [-28, -9, 0.05],
                      [28, -9, 0.05],
                      [28, 9, 0.05],
                      [-28, 9, 0.05],
                      [-28, -9, 0.05],
                    ]}
                    color="#38bdf8"
                    lineWidth={1.5}
                    depthTest={false}
                  />
                  <Text
                    position={[0, 0, 0.1]}
                    fontSize={10.5}
                    color="#38bdf8"
                    anchorX="center"
                    anchorY="middle"
                    material-toneMapped={false}
                    material-depthTest={false}
                    renderOrder={1002}
                  >
                    {`${seg.length.toFixed(1)} cm`}
                  </Text>
                </group>
              </group>
            );
          })}

          {/* Rosa de los Vientos / Indicador de Norte en esquina superior */}
          <group position={[bounds.minX - 70, 2, bounds.minY - 70]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1000}>
            <mesh position={[0, 0, 0]}>
              <circleGeometry args={[20, 32]} />
              <meshBasicMaterial color="#0f172a" transparent opacity={0.85} />
            </mesh>
            <Line
              points={[
                [-20, 0, 0.05],
                [20, 0, 0.05],
              ]}
              color="#475569"
              lineWidth={1}
              depthTest={false}
            />
            <Line
              points={[
                [0, -20, 0.05],
                [0, 20, 0.05],
              ]}
              color="#475569"
              lineWidth={1}
              depthTest={false}
            />
            {/* Flecha Norte apuntando hacia arriba */}
            <mesh position={[0, 6, 0.1]}>
              <coneGeometry args={[4, 12, 3]} />
              <meshBasicMaterial color="#ef4444" />
            </mesh>
            <Text
              position={[0, 15, 0.2]}
              fontSize={8}
              color="#f8fafc"
              anchorX="center"
              anchorY="middle"
              material-toneMapped={false}
              material-depthTest={false}
              renderOrder={1002}
            >
              NORTE
            </Text>
          </group>

          {/* Escala Gráfica Arquitectónica Dinámica (0 - 1m - 2m) */}
          <group position={[bounds.minX, 2, bounds.maxY + 85]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1000}>
            {/* Fondo de la escala */}
            <mesh position={[50, 0, 0]}>
              <planeGeometry args={[130, 26]} />
              <meshBasicMaterial color="#0f172a" transparent opacity={0.88} />
            </mesh>
            <Line
              points={[
                [-15, -13, 0.05],
                [115, -13, 0.05],
                [115, 13, 0.05],
                [-15, 13, 0.05],
                [-15, -13, 0.05],
              ]}
              color="#64748b"
              lineWidth={1}
              depthTest={false}
            />
            {/* Segmento 0 - 100 cm (Negro/Gris) */}
            <mesh position={[25, -2, 0.1]}>
              <planeGeometry args={[50, 4]} />
              <meshBasicMaterial color="#38bdf8" />
            </mesh>
            {/* Segmento 100 - 200 cm (Blanco) */}
            <mesh position={[75, -2, 0.1]}>
              <planeGeometry args={[50, 4]} />
              <meshBasicMaterial color="#f8fafc" />
            </mesh>
            {/* Rótulos de escala */}
            <Text position={[0, 5, 0.2]} fontSize={6} color="#94a3b8" anchorX="center" anchorY="middle" material-toneMapped={false} material-depthTest={false}>
              0m
            </Text>
            <Text position={[50, 5, 0.2]} fontSize={6} color="#94a3b8" anchorX="center" anchorY="middle" material-toneMapped={false} material-depthTest={false}>
              1.0m
            </Text>
            <Text position={[100, 5, 0.2]} fontSize={6} color="#94a3b8" anchorX="center" anchorY="middle" material-toneMapped={false} material-depthTest={false}>
              2.0m
            </Text>
            <Text position={[50, -8, 0.2]} fontSize={5} color="#94a3b8" anchorX="center" anchorY="middle" material-toneMapped={false} material-depthTest={false}>
              ESCALA MÉTRICA GRÁFICA (cm)
            </Text>
          </group>
        </group>
      )}
    </group>
  );
}
