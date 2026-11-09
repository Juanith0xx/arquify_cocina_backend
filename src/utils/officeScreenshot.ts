import { PlacedOfficeItem, UnderlayFloorPlan } from '../types/office';
import { MELAMINE_FINISHES, SCREEN_FABRICS } from '../store/officeStore';

/**
 * Genera una imagen PNG nítida de la planta 2D a partir de los datos geométricos del plano y los muebles.
 */
export async function generateOfficeFloorPlanImage(
  items: PlacedOfficeItem[],
  floorPlan: UnderlayFloorPlan,
  width: number = 1000,
  height: number = 700
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Fondo blanco técnico
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Calcular límites espaciales para centrar el encuadre
  let minX = -4;
  let maxX = 4;
  let minZ = -3;
  let maxZ = 3;

  if (floorPlan.fileUrl && floorPlan.realWidthMeters > 0 && floorPlan.realHeightMeters > 0) {
    minX = Math.min(minX, -floorPlan.realWidthMeters / 2 + floorPlan.offsetX);
    maxX = Math.max(maxX, floorPlan.realWidthMeters / 2 + floorPlan.offsetX);
    minZ = Math.min(minZ, -floorPlan.realHeightMeters / 2 + floorPlan.offsetY);
    maxZ = Math.max(maxZ, floorPlan.realHeightMeters / 2 + floorPlan.offsetY);
  }

  items.forEach((item) => {
    const halfW = (item.dimensionsCm.width / 100) / 2;
    const halfD = (item.dimensionsCm.depth / 100) / 2;
    const rad = Math.hypot(halfW, halfD);
    minX = Math.min(minX, item.position[0] - rad);
    maxX = Math.max(maxX, item.position[0] + rad);
    minZ = Math.min(minZ, item.position[2] - rad);
    maxZ = Math.max(maxZ, item.position[2] + rad);
  });

  // Margen de seguridad del 15%
  const spanX = Math.max(1, maxX - minX) * 1.25;
  const spanZ = Math.max(1, maxZ - minZ) * 1.25;
  const midX = (minX + maxX) / 2;
  const midZ = (minZ + maxZ) / 2;

  const scale = Math.min(width / spanX, height / spanZ);

  const worldToCanvas = (wx: number, wz: number) => ({
    cx: width / 2 + (wx - midX) * scale,
    cy: height / 2 + (wz - midZ) * scale,
  });

  // Si hay plano PDF/imagen rasterizada de arquitectura cargada, dibujarla con su opacidad
  if (floorPlan.fileUrl) {
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = floorPlan.fileUrl;
      });

      const planW = floorPlan.realWidthMeters * scale;
      const planH = floorPlan.realHeightMeters * scale;
      const planCenter = worldToCanvas(floorPlan.offsetX, floorPlan.offsetY);

      ctx.save();
      ctx.globalAlpha = Math.max(0.4, floorPlan.opacity);
      ctx.translate(planCenter.cx, planCenter.cy);
      ctx.rotate(((floorPlan.rotationDeg || 0) * Math.PI) / 180);
      ctx.drawImage(img, -planW / 2, -planH / 2, planW, planH);
      ctx.restore();
    } catch {
      // Si falla la carga de imagen externa, continuar con dibujo vectorial
    }
  }

  // Grilla técnica sutil
  ctx.strokeStyle = '#F1F5F9';
  ctx.lineWidth = 1;
  const gridStepMeters = 1;
  const startGridX = Math.floor((midX - spanX / 2) / gridStepMeters) * gridStepMeters;
  const endGridX = Math.ceil((midX + spanX / 2) / gridStepMeters) * gridStepMeters;
  const startGridZ = Math.floor((midZ - spanZ / 2) / gridStepMeters) * gridStepMeters;
  const endGridZ = Math.ceil((midZ + spanZ / 2) / gridStepMeters) * gridStepMeters;

  ctx.beginPath();
  for (let x = startGridX; x <= endGridX; x += gridStepMeters) {
    const p1 = worldToCanvas(x, midZ - spanZ / 2);
    const p2 = worldToCanvas(x, midZ + spanZ / 2);
    ctx.moveTo(p1.cx, p1.cy);
    ctx.lineTo(p2.cx, p2.cy);
  }
  for (let z = startGridZ; z <= endGridZ; z += gridStepMeters) {
    const p1 = worldToCanvas(midX - spanX / 2, z);
    const p2 = worldToCanvas(midX + spanX / 2, z);
    ctx.moveTo(p1.cx, p1.cy);
    ctx.lineTo(p2.cx, p2.cy);
  }
  ctx.stroke();

  // Ejes de origen discretos
  const origin = worldToCanvas(0, 0);
  ctx.strokeStyle = '#FDBA74';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(origin.cx, 0);
  ctx.lineTo(origin.cx, height);
  ctx.moveTo(0, origin.cy);
  ctx.lineTo(width, origin.cy);
  ctx.stroke();
  ctx.setLineDash([]);

  // Dibujar cada módulo de mobiliario en 2D
  items.forEach((item) => {
    const pos = worldToCanvas(item.position[0], item.position[2]);
    const wPx = (item.dimensionsCm.width / 100) * scale;
    const dPx = (item.dimensionsCm.depth / 100) * scale;

    ctx.save();
    ctx.translate(pos.cx, pos.cy);
    ctx.rotate(item.rotation);

    // Zona de holgura / circulación
    ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.fillRect(-wPx / 2, dPx / 2, wPx, 0.6 * scale);
    ctx.strokeRect(-wPx / 2, dPx / 2, wPx, 0.6 * scale);
    ctx.setLineDash([]);

    // Cuerpo principal del mueble
    const isChair = item.category === 'chairs' || item.type.startsWith('chair-');
    const itemColor = isChair
      ? (SCREEN_FABRICS.find((s) => s.id === item.screenFinish)?.hex || item.chairFabricColor || '#374151')
      : (MELAMINE_FINISHES.find((m) => m.id === item.melamineFinish)?.hex || '#E2DAD0');

    ctx.fillStyle = itemColor;
    ctx.fillRect(-wPx / 2, -dPx / 2, wPx, dPx);
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(-wPx / 2, -dPx / 2, wPx, dPx);

    // Detalle retorno L si corresponde
    if (item.type === 'desk-executive-l' || item.type === 'desk-open-l') {
      const retW = ((item.dimensionsCm.returnDepth || 45) / 100) * scale;
      const retH = ((item.dimensionsCm.returnWidth || 80) / 100) * scale;
      const retX = item.returnSide !== 'left' ? wPx / 2 - retW : -wPx / 2;
      ctx.fillStyle = '#CBB297';
      ctx.fillRect(retX, -dPx / 2, retW, retH);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.strokeRect(retX, -dPx / 2, retW, retH);
    }

    // Flecha de orientación frontal
    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -dPx / 4);
    ctx.lineTo(0, dPx / 3);
    ctx.lineTo(-3, dPx / 3 - 4);
    ctx.moveTo(0, dPx / 3);
    ctx.lineTo(3, dPx / 3 - 4);
    ctx.stroke();

    // Etiqueta de nombre y dimensión
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const shortName = item.name.length > 16 ? item.name.substring(0, 14) + '..' : item.name;
    ctx.fillText(shortName, 0, 0);

    // Cotas de medida
    ctx.fillStyle = '#64748B';
    ctx.font = 'bold 8px monospace';
    ctx.fillText(`${item.dimensionsCm.width}cm`, 0, -dPx / 2 - 4);

    ctx.restore();
  });

  // Marco perimetral y sello técnico 2D
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('PLANTA TÉCNICA 2D - DISTRIBUCIÓN DE MOBILIARIO', 14, 20);

  ctx.fillStyle = '#64748B';
  ctx.font = '9px monospace';
  ctx.fillText(`Módulos totales: ${items.length} | Escala: Automática`, 14, 34);

  return canvas.toDataURL('image/jpeg', 0.92);
}

/**
 * Captura el canvas 3D activo de WebGL si está en pantalla o renderizado.
 */
export function captureOffice3DCanvas(): string | null {
  try {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (canvas && canvas.width > 0 && canvas.height > 0) {
      return canvas.toDataURL('image/jpeg', 0.92);
    }
  } catch (e) {
    console.warn('Error al capturar canvas 3D:', e);
  }
  return null;
}
