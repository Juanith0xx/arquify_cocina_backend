import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  RoomVertex,
  WallSegmentData,
  analyzeRoomWalls,
  calculatePolygonArea,
  calculatePolygonPerimeter,
  distanceBetween,
  moveWallSegmentOrthogonal,
  moveVertexOrthogonal,
  orthogonalizePolygon,
} from '../../utils/roomGeometry';

interface RoomPlannerCanvasProps {
  vertices: RoomVertex[];
  wallThickness: number;
  wallHeight: number;
  isFreehandMode?: boolean;
  onVerticesChange: (newVertices: RoomVertex[]) => void;
  selectedVertexIndex: number | null;
  onSelectVertexIndex: (index: number | null) => void;
  onFinishFreehand?: () => void;
}

export function RoomPlannerCanvas({
  vertices,
  wallThickness,
  wallHeight,
  isFreehandMode = false,
  onVerticesChange,
  selectedVertexIndex,
  onSelectVertexIndex,
  onFinishFreehand,
}: RoomPlannerCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingVertexIndex, setDraggingVertexIndex] = useState<number | null>(null);
  const [draggingWallIndex, setDraggingWallIndex] = useState<number | null>(null);
  const [hoveredWallIndex, setHoveredWallIndex] = useState<number | null>(null);
  const [orthoMode, setOrthoMode] = useState<boolean>(true);
  const [freehandHoverPos, setFreehandHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredTargetVertexIndex, setHoveredTargetVertexIndex] = useState<number | null>(null);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoomFactor, setZoomFactor] = useState<number>(1.0);

  // Dimensiones del SVG y escala
  const viewBoxSize = 1000;
  const padding = 140;

  // Calcular límites geométricos para auto-centrar y escalar el SVG
  const bounds = useMemo(() => {
    if (isFreehandMode || vertices.length === 0) {
      // En modo dibujo libre usaremos un área fija amplia de 20x20 metros (-1000cm a +1000cm)
      return { minX: -1000, maxX: 1000, minY: -1000, maxY: 1000, width: 2000, height: 2000 };
    }
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    vertices.forEach((v) => {
      if (v.x < minX) minX = v.x;
      if (v.x > maxX) maxX = v.x;
      if (v.y < minY) minY = v.y;
      if (v.y > maxY) maxY = v.y;
    });

    const width = Math.max(100, maxX - minX);
    const height = Math.max(100, maxY - minY);
    return { minX, maxX, minY, maxY, width, height };
  }, [vertices, isFreehandMode]);

  // Escala para mapear de coordenadas en cm a coordenadas del SVG
  const scale = useMemo(() => {
    if (isFreehandMode) {
      // Escala estricta y fija durante el dibujo libre para evitar desfasajes del cursor
      return 0.42 * zoomFactor;
    }
    const availableW = viewBoxSize - padding * 2;
    const availableH = viewBoxSize - padding * 2;
    const sX = availableW / (bounds.width + wallThickness * 2 + 80);
    const sY = availableH / (bounds.height + wallThickness * 2 + 80);
    return Math.min(sX, sY, 1.4) * zoomFactor;
  }, [bounds, wallThickness, isFreehandMode, zoomFactor]);

  const centerOffset = useMemo(() => {
    if (isFreehandMode) {
      return {
        x: viewBoxSize / 2 + panOffset.x,
        y: viewBoxSize / 2 + panOffset.y,
      };
    }
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cy = (bounds.minY + bounds.maxY) / 2;
    return {
      x: viewBoxSize / 2 - cx * scale + panOffset.x,
      y: viewBoxSize / 2 - cy * scale + panOffset.y,
    };
  }, [bounds, scale, isFreehandMode, panOffset]);

  // Convertir coordenada de cm a punto en SVG
  const toSvgPoint = (pt: { x: number; y: number }) => ({
    x: pt.x * scale + centerOffset.x,
    y: pt.y * scale + centerOffset.y,
  });

  // Convertir coordenada de evento del mouse (clientX, clientY) a cm usando la CTM nativa del SVG (precisión 100%)
  const toCmCoords = (e: React.MouseEvent<SVGSVGElement> | MouseEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const ctm = svgRef.current.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };

    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(ctm.inverse());

    const cmX = (svgP.x - centerOffset.x) / scale;
    const cmY = (svgP.y - centerOffset.y) / scale;

    // Snap a rejilla de 5cm
    return {
      x: Math.round(cmX / 5) * 5,
      y: Math.round(cmY / 5) * 5,
    };
  };

  // Manejadores de arrastre de vértice
  const handleVertexMouseDown = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggingVertexIndex(index);
    onSelectVertexIndex(index);
  };

  // Manejador de arrastre de pared completa
  const handleWallMouseDown = (index: number, e: React.MouseEvent) => {
    if (isFreehandMode) return;
    e.stopPropagation();
    setDraggingWallIndex(index);
    onSelectVertexIndex(index);
  };

  // Manejador de rueda del mouse para Zoom In / Zoom Out
  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    const delta = e.deltaY < 0 ? 1.1 : 0.9;
    setZoomFactor((prev) => Math.min(Math.max(prev * delta, 0.25), 3.5));
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const cmPos = toCmCoords(e);

    // Auto-Pan cuando el mouse se acerca a los bordes del canvas en modo dibujo libre
    if (isFreehandMode && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const edgeThreshold = 55; // px de tolerancia desde el borde
      let panDx = 0;
      let panDy = 0;

      if (e.clientX - rect.left < edgeThreshold) {
        panDx = 22; // Desplaza lienzo a la derecha
      } else if (rect.right - e.clientX < edgeThreshold) {
        panDx = -22; // Desplaza lienzo a la izquierda
      }

      if (e.clientY - rect.top < edgeThreshold) {
        panDy = 22; // Desplaza lienzo hacia abajo
      } else if (rect.bottom - e.clientY < edgeThreshold) {
        panDy = -22; // Desplaza lienzo hacia arriba
      }

      if (panDx !== 0 || panDy !== 0) {
        setPanOffset((prev) => ({ x: prev.x + panDx, y: prev.y + panDy }));
      }
    }

    if (draggingWallIndex !== null) {
      // Arrastre directo de muro a 90°
      const updated = moveWallSegmentOrthogonal(vertices, draggingWallIndex, cmPos, 5);
      onVerticesChange(updated);
    } else if (draggingVertexIndex !== null) {
      let updated: RoomVertex[];
      if (orthoMode && !isFreehandMode && vertices.length >= 3) {
        // En modo ORTHO, mueve el vértice preservando las escuadras de los muros vecinos
        updated = moveVertexOrthogonal(vertices, draggingVertexIndex, cmPos, 5);
      } else {
        // Arrastre libre con rejilla
        updated = [...vertices];
        updated[draggingVertexIndex] = {
          ...updated[draggingVertexIndex],
          x: cmPos.x,
          y: cmPos.y,
        };
      }
      onVerticesChange(updated);
    } else if (isFreehandMode) {
      if (vertices.length > 0) {
        const last = vertices[vertices.length - 1];
        let snappedX = cmPos.x;
        let snappedY = cmPos.y;
        let isSnappedToOrtho = false;
        let foundHoverIdx: number | null = null;

        // Verificar si el cursor se apoya exactamente sobre un vértice existente (iluminar punto de empalme)
        for (let i = 0; i < vertices.length; i++) {
          const v = vertices[i];
          const dist = Math.hypot(v.x - cmPos.x, v.y - cmPos.y);
          if (dist <= 25) { // Umbral claro al posar el mouse sobre un nodo
            foundHoverIdx = i;
            snappedX = v.x;
            snappedY = v.y;
            break;
          }
        }

        setHoveredTargetVertexIndex(foundHoverIdx);

        // Si no está posado sobre un nodo existente, aplicar guía ortogonal a 90° respecto al último muro
        if (foundHoverIdx === null) {
          const dx = cmPos.x - last.x;
          const dy = cmPos.y - last.y;

          if (Math.abs(dy) <= 25) {
            snappedY = last.y;
            isSnappedToOrtho = true;
          } else if (Math.abs(dx) <= 25) {
            snappedX = last.x;
            isSnappedToOrtho = true;
          }
        }

        const isSnapToOrigin = foundHoverIdx === 0 && vertices.length >= 3;

        setFreehandHoverPos({
          x: snappedX,
          y: snappedY,
          isSnappedToOrtho,
          isSnapToOrigin,
        } as any);
      } else {
        setFreehandHoverPos(cmPos);
        setHoveredTargetVertexIndex(null);
      }
    }
  };

  const handleMouseUp = () => {
    setDraggingVertexIndex(null);
    setDraggingWallIndex(null);
  };

  // Manejador de click en modo diseño libre para añadir puntos
  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isFreehandMode) return;
    
    let targetX = freehandHoverPos ? freehandHoverPos.x : toCmCoords(e).x;
    let targetY = freehandHoverPos ? freehandHoverPos.y : toCmCoords(e).y;

    // Si el usuario hace clic sobre el punto inicial (iluminado), se cierra el área de la habitación
    if (hoveredTargetVertexIndex === 0 && vertices.length >= 3) {
      if (onFinishFreehand) {
        onFinishFreehand();
      } else {
        onSelectVertexIndex(null);
      }
      setHoveredTargetVertexIndex(null);
      return;
    }

    // Si hace clic en otro vértice existente iluminado, empalmar en esa posición
    if (hoveredTargetVertexIndex !== null) {
      targetX = vertices[hoveredTargetVertexIndex].x;
      targetY = vertices[hoveredTargetVertexIndex].y;
    }

    const newVertex: RoomVertex = {
      id: `v_${Date.now()}_${vertices.length}`,
      x: targetX,
      y: targetY,
    };
    onVerticesChange([...vertices, newVertex]);
    onSelectVertexIndex(vertices.length);
  };

  // En modo dibujo libre se analizan ÚNICAMENTE los muros colocados (línea abierta).
  // Solo cuando la habitación está cerrada (isFreehandMode = false) se analiza la lista completa en bucle cerrado.
  const wallSegments = useMemo(() => {
    if (isFreehandMode) {
      if (vertices.length < 2) return [];
      const openSegs: WallSegmentData[] = [];
      for (let i = 0; i < vertices.length - 1; i++) {
        const start = vertices[i];
        const end = vertices[i + 1];
        const length = Math.round(distanceBetween(start, end) * 10) / 10;
        openSegs.push({
          index: i,
          label: String.fromCharCode(65 + i),
          start,
          end,
          length,
          angleWithNext: 90,
        });
      }
      return openSegs;
    }
    return analyzeRoomWalls(vertices);
  }, [vertices, isFreehandMode]);

  const areaM2 = useMemo(() => calculatePolygonArea(vertices), [vertices]);
  const perimeterM = useMemo(() => calculatePolygonPerimeter(vertices), [vertices]);

  // Centro geométrico del polígono
  const polyCenter = useMemo(() => {
    if (vertices.length === 0) return { x: viewBoxSize / 2, y: viewBoxSize / 2 };
    let sumX = 0;
    let sumY = 0;
    vertices.forEach((v) => {
      const svgP = toSvgPoint(v);
      sumX += svgP.x;
      sumY += svgP.y;
    });
    return {
      x: sumX / vertices.length,
      y: sumY / vertices.length,
    };
  }, [vertices, toSvgPoint]);

  // Path SVG para el polígono del interior de la habitación
  const polygonPath = useMemo(() => {
    if (vertices.length === 0) return '';
    return (
      vertices
        .map((v, i) => {
          const p = toSvgPoint(v);
          return `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
        })
        .join(' ') + ' Z'
    );
  }, [vertices, toSvgPoint]);

  return (
    <div className="relative w-full h-full bg-[#F4F4F5] select-none overflow-hidden flex items-center justify-center">
      {/* Cuadrícula técnica de fondo */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        className="w-full h-full max-h-[85vh] cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
        onWheel={handleWheel}
      >
        <defs>
          <pattern id="grid-sub" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E4E4E7" strokeWidth="0.75" />
          </pattern>
          <pattern id="grid-main" width="100" height="100" patternUnits="userSpaceOnUse">
            <rect width="100" height="100" fill="url(#grid-sub)" />
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#D4D4D8" strokeWidth="1.2" />
          </pattern>

          {/* Marcadores de flechas para cotas en azul */}
          <marker id="arrow-start" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 8 1 L 2 5 L 8 9" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </marker>
          <marker id="arrow-end" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 2 1 L 8 5 L 2 9" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </marker>
        </defs>

        {/* Fondo con rejilla arquitectónica */}
        <rect width={viewBoxSize} height={viewBoxSize} fill="url(#grid-main)" />

        {/* Superficie interna de la habitación (solo cuando el polígono está cerrado) */}
        {!isFreehandMode && vertices.length >= 3 && (
          <path d={polygonPath} fill="#FFFFFF" stroke="none" fillOpacity={0.95} />
        )}

        {/* 1. Muros Dobles con Grosor y Arrastre Directo de Pared (Edge Dragging) */}
        {wallSegments.map((seg) => {
          const p1 = toSvgPoint(seg.start);
          const p2 = toSvgPoint(seg.end);
          const thicknessSvg = Math.max(8, wallThickness * scale);

          // Vector dirección y vector normal perpendicular
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const len = Math.hypot(dx, dy);
          if (len === 0) return null;

          const nx = -dy / len;
          const ny = dx / len;

          const wHalf = thicknessSvg / 2;

          // Esquinas del muro rectangular
          const cornerA = { x: p1.x + nx * wHalf, y: p1.y + ny * wHalf };
          const cornerB = { x: p2.x + nx * wHalf, y: p2.y + ny * wHalf };
          const cornerC = { x: p2.x - nx * wHalf, y: p2.y - ny * wHalf };
          const cornerD = { x: p1.x - nx * wHalf, y: p1.y - ny * wHalf };

          const wallPath = `M ${cornerA.x} ${cornerA.y} L ${cornerB.x} ${cornerB.y} L ${cornerC.x} ${cornerC.y} L ${cornerD.x} ${cornerD.y} Z`;

          const isHorizontal = Math.abs(dx) >= Math.abs(dy);
          const isHovered = hoveredWallIndex === seg.index;
          const isDraggingThis = draggingWallIndex === seg.index;

          const midWallX = (p1.x + p2.x) / 2;
          const midWallY = (p1.y + p2.y) / 2;

          return (
            <g
              key={`wall_poly_${seg.index}`}
              className={`cursor-${isHorizontal ? 'ns' : 'ew'}-resize group`}
              onMouseEnter={() => setHoveredWallIndex(seg.index)}
              onMouseLeave={() => setHoveredWallIndex(null)}
              onMouseDown={(e) => handleWallMouseDown(seg.index, e)}
            >
              {/* Relleno del muro constructivo */}
              <path
                d={wallPath}
                fill={isDraggingThis ? '#FEF08A' : isHovered ? '#FEF9C3' : '#F8FAFC'}
                stroke={isDraggingThis ? '#EA580C' : isHovered ? '#2563EB' : '#334155'}
                strokeWidth={isHovered || isDraggingThis ? 3 : 2.2}
                strokeLinejoin="round"
                className="transition-colors duration-100"
              />

              {/* Indicador visual de arrastre de muro al pasar el mouse */}
              {(isHovered || isDraggingThis) && (
                <g transform={`translate(${midWallX}, ${midWallY})`} className="pointer-events-none">
                  <circle r="13" fill="#2563EB" fillOpacity="0.9" />
                  {isHorizontal ? (
                    <>
                      <polygon points="0,-7 -4,-2 4,-2" fill="#FFFFFF" />
                      <polygon points="0,7 -4,2 4,2" fill="#FFFFFF" />
                    </>
                  ) : (
                    <>
                      <polygon points="-7,0 -2,-4 -2,4" fill="#FFFFFF" />
                      <polygon points="7,0 2,-4 2,4" fill="#FFFFFF" />
                    </>
                  )}
                </g>
              )}
            </g>
          );
        })}

        {/* 2. Líneas de Cota Exteriores en Azul (Identidad estética Imagen 1) */}
        {wallSegments.map((seg) => {
          const p1 = toSvgPoint(seg.start);
          const p2 = toSvgPoint(seg.end);
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const len = Math.hypot(dx, dy);
          if (len === 0) return null;

          // Vector normal hacia el exterior
          const nx = -dy / len;
          const ny = dx / len;

          // Test de orientación hacia afuera respecto al centro
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;
          const toCenterX = polyCenter.x - midX;
          const toCenterY = polyCenter.y - midY;
          const dot = nx * toCenterX + ny * toCenterY;
          const outFactor = dot > 0 ? -1 : 1;

          const cotaOffset = (wallThickness * scale) / 2 + 34;
          const c1 = { x: p1.x + nx * outFactor * cotaOffset, y: p1.y + ny * outFactor * cotaOffset };
          const c2 = { x: p2.x + nx * outFactor * cotaOffset, y: p2.y + ny * outFactor * cotaOffset };

          // Líneas testigo de extensión
          const ext1Start = { x: p1.x + nx * outFactor * 6, y: p1.y + ny * outFactor * 6 };
          const ext1End = { x: p1.x + nx * outFactor * (cotaOffset + 8), y: p1.y + ny * outFactor * (cotaOffset + 8) };

          const ext2Start = { x: p2.x + nx * outFactor * 6, y: p2.y + ny * outFactor * 6 };
          const ext2End = { x: p2.x + nx * outFactor * (cotaOffset + 8), y: p2.y + ny * outFactor * (cotaOffset + 8) };

          // Posición de la letra de la pared (A, B, C...)
          const labelDist = cotaOffset + 28;
          const labelPos = { x: midX + nx * outFactor * labelDist, y: midY + ny * outFactor * labelDist };

          // Posición del texto numérico de la cota
          const textPos = { x: (c1.x + c2.x) / 2, y: (c1.y + c2.y) / 2 };

          // Ángulo para rotar el texto si es vertical
          let textAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
          if (textAngle > 90 || textAngle < -90) textAngle += 180;

          return (
            <g key={`cota_${seg.index}`} className="pointer-events-none">
              {/* Líneas testigo */}
              <line x1={ext1Start.x} y1={ext1Start.y} x2={ext1End.x} y2={ext1End.y} stroke="#2563EB" strokeWidth="1.2" strokeOpacity={0.8} />
              <line x1={ext2Start.x} y1={ext2Start.y} x2={ext2End.x} y2={ext2End.y} stroke="#2563EB" strokeWidth="1.2" strokeOpacity={0.8} />

              {/* Línea principal de cota con terminadores en flecha/ticks */}
              <line
                x1={c1.x}
                y1={c1.y}
                x2={c2.x}
                y2={c2.y}
                stroke="#2563EB"
                strokeWidth="1.6"
                markerStart="url(#arrow-start)"
                markerEnd="url(#arrow-end)"
              />

              {/* Letra identificadora de la pared (A, B, C...) */}
              <text
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#18181B"
                fontSize="22"
                fontWeight="900"
                fontFamily="system-ui, sans-serif"
              >
                {seg.label}
              </text>

              {/* Valor numérico de la cota (ej. 500.0 cm) */}
              <g transform={`translate(${textPos.x}, ${textPos.y}) rotate(${textAngle})`}>
                <rect x="-38" y="-11" width="76" height="22" fill="#FFFFFF" rx="4" fillOpacity={0.9} />
                <text
                  x="0"
                  y="0"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#2563EB"
                  fontSize="12.5"
                  fontWeight="700"
                  fontFamily="system-ui, monospace"
                >
                  {seg.length.toFixed(1)} cm
                </text>
              </g>
            </g>
          );
        })}

        {/* 3. Arcos de Ángulo en cada Vértice (90°, 135°, etc.) */}
        {wallSegments.map((seg) => {
          const currentP = toSvgPoint(seg.end);
          const prevIndex = (seg.index + vertices.length) % vertices.length;
          const nextIndex = (seg.index + 2) % vertices.length;
          const prevP = toSvgPoint(vertices[seg.index]);
          const nextP = toSvgPoint(vertices[nextIndex]);

          const v1 = { x: prevP.x - currentP.x, y: prevP.y - currentP.y };
          const v2 = { x: nextP.x - currentP.x, y: nextP.y - currentP.y };

          const a1 = Math.atan2(v1.y, v1.x);
          const a2 = Math.atan2(v2.y, v2.x);

          const r = 24;
          const arcStartX = currentP.x + Math.cos(a1) * r;
          const arcStartY = currentP.y + Math.sin(a1) * r;
          const arcEndX = currentP.x + Math.cos(a2) * r;
          const arcEndY = currentP.y + Math.sin(a2) * r;

          // Punto medio para la etiqueta de ángulo
          let midAngle = (a1 + a2) / 2;
          if (Math.abs(a2 - a1) > Math.PI) midAngle += Math.PI;
          const labelR = r + 14;
          const angleLabelX = currentP.x + Math.cos(midAngle) * labelR;
          const angleLabelY = currentP.y + Math.sin(midAngle) * labelR;

          return (
            <g key={`angle_arc_${seg.index}`} className="pointer-events-none">
              <path
                d={`M ${arcStartX} ${arcStartY} A ${r} ${r} 0 0 1 ${arcEndX} ${arcEndY}`}
                fill="none"
                stroke="#2563EB"
                strokeWidth="1.4"
                strokeDasharray="2.5 1.5"
              />
              <text
                x={angleLabelX}
                y={angleLabelY}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#2563EB"
                fontSize="11"
                fontWeight="700"
                fontFamily="system-ui, sans-serif"
              >
                {seg.angleWithNext}°
              </text>
            </g>
          );
        })}

        {/* 4. Display Central de Superficie en m² (Estilo exacto Imagen 1 - solo cuando la habitación está cerrada) */}
        {!isFreehandMode && vertices.length >= 3 && (
          <g transform={`translate(${polyCenter.x}, ${polyCenter.y})`} className="pointer-events-none">
            <rect x="-90" y="-32" width="180" height="64" fill="#FFFFFF" rx="8" fillOpacity={0.8} />
            <text
              x="0"
              y="-4"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#2563EB"
              fontSize="34"
              fontWeight="900"
              fontFamily="system-ui, sans-serif"
              letterSpacing="-0.5px"
            >
              {areaM2.toFixed(2)} m²
            </text>
            <text
              x="0"
              y="20"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#64748B"
              fontSize="11.5"
              fontWeight="600"
              fontFamily="system-ui, sans-serif"
            >
              Perímetro: {perimeterM.toFixed(2)} m
            </text>
          </g>
        )}

        {/* 5. Nodos Interactivos de Vértice con Flechas Direccionales (Verde azulado) */}
        {vertices.map((v, i) => {
          const pt = toSvgPoint(v);
          const isSelected = selectedVertexIndex === i;
          const isDragging = draggingVertexIndex === i;

          return (
            <g
              key={v.id}
              transform={`translate(${pt.x}, ${pt.y})`}
              className="cursor-move group"
              onMouseDown={(e) => handleVertexMouseDown(i, e)}
            >
              {/* Halo exterior al pasar el ratón o seleccionar */}
              <circle
                r={isSelected || isDragging ? 26 : 20}
                fill="#0D9488"
                fillOpacity={isSelected || isDragging ? 0.45 : 0.2}
                className="transition-all duration-150"
              />

              {/* Círculo central verde azulado (#0D9488 / #10B981) */}
              <circle
                r={isDragging ? 12 : 10}
                fill="#0D9488"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                className="shadow-md transition-all duration-150"
              />

              {/* 4 Flechas Direccionales Triangulares (Identidad Imagen 1) */}
              {/* Arriba */}
              <polygon points="0,-18 -4,-13 4,-13" fill="none" stroke="#0D9488" strokeWidth="1.6" />
              {/* Abajo */}
              <polygon points="0,18 -4,13 4,13" fill="none" stroke="#0D9488" strokeWidth="1.6" />
              {/* Izquierda */}
              <polygon points="-18,0 -13,-4 -13,4" fill="none" stroke="#0D9488" strokeWidth="1.6" />
              {/* Derecha */}
              <polygon points="18,0 13,-4 13,4" fill="none" stroke="#0D9488" strokeWidth="1.6" />
            </g>
          );
        })}

        {/* 6. Modo Diseño Libre: Lienzo limpio, guía ortogonal a 90°, imán de cierre y preview de punto */}
        {isFreehandMode && (
          <g className="pointer-events-none">
            {/* Banner guía cuando el plano está totalmente vacío (0 vértices) */}
            {vertices.length === 0 && (
              <g transform={`translate(${viewBoxSize / 2}, ${viewBoxSize / 2 - 80})`}>
                <rect x="-260" y="-28" width="520" height="56" fill="#18181B" rx="12" fillOpacity={0.92} />
                <text
                  x="0"
                  y="-4"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#FACC15"
                  fontSize="15"
                  fontWeight="800"
                  fontFamily="system-ui, sans-serif"
                >
                  🖱️ HAZ CLIC PARA UBICAR EL INICIO DEL PRIMER MURO
                </text>
                <text
                  x="0"
                  y="16"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#E4E4E7"
                  fontSize="11.5"
                  fontWeight="500"
                  fontFamily="system-ui, sans-serif"
                >
                  Dibuja la planta de tu casa muro a muro con encuadre automático a 90°
                </text>
              </g>
            )}

            {freehandHoverPos && (
              <>
                {/* Línea elástica hacia el cursor */}
                {vertices.length > 0 && (
                  <>
                    <line
                      x1={toSvgPoint(vertices[vertices.length - 1]).x}
                      y1={toSvgPoint(vertices[vertices.length - 1]).y}
                      x2={toSvgPoint(freehandHoverPos).x}
                      y2={toSvgPoint(freehandHoverPos).y}
                      stroke={(freehandHoverPos as any).isSnapToOrigin ? '#10B981' : (freehandHoverPos as any).isSnappedToOrtho ? '#2563EB' : '#F97316'}
                      strokeWidth={(freehandHoverPos as any).isSnappedToOrtho ? '3' : '2'}
                      strokeDasharray={(freehandHoverPos as any).isSnappedToOrtho ? 'none' : '4 4'}
                    />

                    {/* Badge indicador de ortogonalidad (🔒 90°) */}
                    {(freehandHoverPos as any).isSnappedToOrtho && !(freehandHoverPos as any).isSnapToOrigin && (
                      <g
                        transform={`translate(${
                          (toSvgPoint(vertices[vertices.length - 1]).x + toSvgPoint(freehandHoverPos).x) / 2
                        }, ${
                          (toSvgPoint(vertices[vertices.length - 1]).y + toSvgPoint(freehandHoverPos).y) / 2 - 16
                        })`}
                      >
                        <rect x="-32" y="-10" width="64" height="20" fill="#2563EB" rx="4" fillOpacity={0.95} />
                        <text x="0" y="0" textAnchor="middle" dominantBaseline="central" fill="#FFFFFF" fontSize="10" fontWeight="900">
                          🔒 90°
                        </text>
                      </g>
                    )}
                  </>
                )}

                {/* Nodo de posición actual del cursor */}
                <circle
                  cx={toSvgPoint(freehandHoverPos).x}
                  cy={toSvgPoint(freehandHoverPos).y}
                  r={(freehandHoverPos as any).isSnapToOrigin ? 12 : 8}
                  fill={(freehandHoverPos as any).isSnapToOrigin ? '#10B981' : (freehandHoverPos as any).isSnappedToOrtho ? '#2563EB' : '#F97316'}
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                />

                {/* Resaltado e iluminación táctil de nodos al posar el cursor sobre un punto de empalme */}
                {hoveredTargetVertexIndex !== null && vertices[hoveredTargetVertexIndex] && (
                  <g transform={`translate(${toSvgPoint(vertices[hoveredTargetVertexIndex]).x}, ${toSvgPoint(vertices[hoveredTargetVertexIndex]).y})`}>
                    <circle r="30" fill={hoveredTargetVertexIndex === 0 ? "#10B981" : "#2563EB"} fillOpacity={0.4} className="animate-ping" />
                    <circle r="15" fill={hoveredTargetVertexIndex === 0 ? "#10B981" : "#2563EB"} stroke="#FFFFFF" strokeWidth="3" />
                    <rect
                      x="-75"
                      y="-44"
                      width="150"
                      height="26"
                      fill={hoveredTargetVertexIndex === 0 ? "#10B981" : "#2563EB"}
                      rx="6"
                    />
                    <text x="0" y="-31" textAnchor="middle" dominantBaseline="central" fill="#FFFFFF" fontSize="11" fontWeight="900">
                      {hoveredTargetVertexIndex === 0 ? "🎯 CERRAR ÁREA" : "🎯 EMPALMAR MURO"}
                    </text>
                  </g>
                )}

                {/* Etiqueta de longitud en cm */}
                {vertices.length > 0 && !(freehandHoverPos as any).isSnapToOrigin && (
                  <g transform={`translate(${toSvgPoint(freehandHoverPos).x + 14}, ${toSvgPoint(freehandHoverPos).y - 14})`}>
                    <rect x="0" y="-12" width="85" height="22" fill="#18181B" rx="4" fillOpacity={0.9} />
                    <text
                      x="42.5"
                      y="-1"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#FACC15"
                      fontSize="12"
                      fontWeight="800"
                      fontFamily="system-ui, monospace"
                    >
                      {Math.round(distanceBetween(vertices[vertices.length - 1], freehandHoverPos))} cm
                    </text>
                  </g>
                )}
              </>
            )}
          </g>
        )}
      </svg>

      {/* Barra de control inferior: Estado de ortogonalidad, escuadras y ayuda */}
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto bg-white/95 backdrop-blur-sm border border-slate-200 shadow-md px-3 py-1.5 rounded-lg text-xs text-slate-700 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOrthoMode(!orthoMode)}
            className={`px-2.5 py-1 rounded font-bold text-[11px] transition-colors flex items-center gap-1.5 ${
              orthoMode
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
            title="Bloquea los muros y vértices a ángulos rectos de 90° sin deformar las esquinas"
          >
            <span>{orthoMode ? '🔒 MODO ORTOGONAL (90° ACTIVO)' : '🔓 MODO LIBRE'}</span>
          </button>
          <span className="text-slate-300">|</span>
          <button
            type="button"
            onClick={() => onVerticesChange(orthogonalizePolygon(vertices, 5))}
            className="px-2.5 py-1 rounded font-bold text-[11px] bg-slate-100 hover:bg-amber-100 text-slate-800 hover:text-amber-800 transition-colors border border-slate-200"
            title="Alinear y cuadrar automáticamente todos los muros a 90°"
          >
            📐 Restaurar Escuadras (90°)
          </button>
        </div>

        <div className="bg-white/90 backdrop-blur-sm border border-slate-200 shadow-sm px-3 py-1.5 rounded-md text-[11px] text-slate-600 flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
            Arrastra muros directamente
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            Nodos esquineros
          </span>
          <span className="text-slate-300">|</span>
          <span>Rejilla a 5 cm</span>
        </div>
      </div>
    </div>
  );
}
