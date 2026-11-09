import JSZip from 'jszip';
import { CncMachinedPart } from './kitchenCncMachining';

/**
 * Generador de archivos DXF ASCII (AutoCAD R12 / AC1009) para mecanizado CNC en centros de corte.
 * Compatible con WoodWOP (Homag), BiesseWorks, Masterwood, TpaCAD, CutMaster, Aspire y AlphaCAM.
 */
export function generatePartDxf(part: CncMachinedPart): string {
  const w = part.width;
  const l = part.length;

  let dxf = '';

  // 1. HEADER SECTION
  dxf += '0\nSECTION\n2\nHEADER\n';
  dxf += '9\n$ACADVER\n1\nAC1009\n';
  dxf += '9\n$INSUNITS\n70\n4\n'; // 4 = Millimeters
  dxf += '9\n$EXTMIN\n10\n-50.0\n20\n-50.0\n30\n0.0\n';
  dxf += `9\n$EXTMAX\n10\n${w + 50}.0\n20\n${l + 50}.0\n30\n0.0\n`;
  dxf += '0\nENDSEC\n';

  // 2. TABLES SECTION (LAYERS DEFINITION WITH CNC COLORS)
  dxf += '0\nSECTION\n2\nTABLES\n';
  dxf += '0\nTABLE\n2\nLAYER\n70\n9\n';

  // Layer CUT_EXTERIOR (Color 7: Blanco / Corte perimetral con fresa)
  dxf += '0\nLAYER\n2\nCUT_EXTERIOR\n70\n0\n62\n7\n6\nCONTINUOUS\n';
  // Layer DRILL_FACE_35 (Color 1: Rojo / Cazoletas de bisagra Ø35mm)
  dxf += '0\nLAYER\n2\nDRILL_FACE_35\n70\n0\n62\n1\n6\nCONTINUOUS\n';
  // Layer DRILL_FACE_15 (Color 3: Verde / Cajas Minifix Ø15mm)
  dxf += '0\nLAYER\n2\nDRILL_FACE_15\n70\n0\n62\n3\n6\nCONTINUOUS\n';
  // Layer DRILL_FACE_5 (Color 5: Azul / Correderas y Sistema 32 Ø5mm)
  dxf += '0\nLAYER\n2\nDRILL_FACE_5\n70\n0\n62\n5\n6\nCONTINUOUS\n';
  // Layer DRILL_FACE_8 (Color 6: Magenta / Pernos y tarugos Ø8mm)
  dxf += '0\nLAYER\n2\nDRILL_FACE_8\n70\n0\n62\n6\n6\nCONTINUOUS\n';
  // Layer DRILL_HANDLE (Color 4: Cian / Perforaciones pasantes de tirador Ø4.5mm)
  dxf += '0\nLAYER\n2\nDRILL_HANDLE\n70\n0\n62\n4\n6\nCONTINUOUS\n';
  // Layer GROOVE_BACK (Color 2: Amarillo / Ranura de fondo 4mm x 8mm)
  dxf += '0\nLAYER\n2\nGROOVE_BACK\n70\n0\n62\n2\n6\nCONTINUOUS\n';
  // Layer POCKET_GOLA (Color 30: Naranja / Destaje de perfiles Gola L y C)
  dxf += '0\nLAYER\n2\nPOCKET_GOLA\n70\n0\n62\n30\n6\nCONTINUOUS\n';
  // Layer TEXT_INFO (Color 8: Gris oscuro / Rotulado de taller)
  dxf += '0\nLAYER\n2\nTEXT_INFO\n70\n0\n62\n8\n6\nCONTINUOUS\n';

  dxf += '0\nENDTAB\n';
  dxf += '0\nENDSEC\n';

  // 3. ENTITIES SECTION
  dxf += '0\nSECTION\n2\nENTITIES\n';

  // 3.1 Contorno exterior de corte (CUT_EXTERIOR - 4 líneas cerradas a 90°)
  const corners = [
    { x1: 0, y1: 0, x2: w, y2: 0 },
    { x1: w, y1: 0, x2: w, y2: l },
    { x1: w, y1: l, x2: 0, y2: l },
    { x1: 0, y1: l, x2: 0, y2: 0 },
  ];

  corners.forEach(c => {
    dxf += '0\nLINE\n8\nCUT_EXTERIOR\n';
    dxf += `10\n${c.x1.toFixed(3)}\n20\n${c.y1.toFixed(3)}\n30\n0.0\n`;
    dxf += `11\n${c.x2.toFixed(3)}\n21\n${c.y2.toFixed(3)}\n31\n0.0\n`;
  });

  // 3.2 Perforaciones circulares (DRILL_FACE_* y DRILL_HANDLE)
  part.drills.forEach(drill => {
    let layer = 'DRILL_FACE_5';
    if (drill.type === 'handle_hole' || drill.label?.toLowerCase().includes('tirador')) {
      layer = 'DRILL_HANDLE';
    } else if (drill.diameter >= 30) {
      layer = 'DRILL_FACE_35';
    } else if (drill.diameter >= 14) {
      layer = 'DRILL_FACE_15';
    } else if (drill.diameter >= 7) {
      layer = 'DRILL_FACE_8';
    }

    const radius = (drill.diameter / 2).toFixed(3);

    dxf += '0\nCIRCLE\n';
    dxf += `8\n${layer}\n`;
    dxf += `10\n${drill.x.toFixed(3)}\n`;
    dxf += `20\n${drill.y.toFixed(3)}\n`;
    dxf += '30\n0.0\n';
    dxf += `40\n${radius}\n`;
  });

  // 3.3 Ranuras de fondo (GROOVE_BACK)
  part.grooves.forEach(grv => {
    // Línea central de recorrido de fresa
    dxf += '0\nLINE\n8\nGROOVE_BACK\n';
    dxf += `10\n${grv.x1.toFixed(3)}\n20\n${grv.y1.toFixed(3)}\n30\n0.0\n`;
    dxf += `11\n${grv.x2.toFixed(3)}\n21\n${grv.y2.toFixed(3)}\n31\n0.0\n`;

    // Líneas laterales indicando el ancho de ranura
    const halfWidth = grv.width / 2;
    const isVertical = Math.abs(grv.x1 - grv.x2) < 1;
    if (isVertical) {
      dxf += '0\nLINE\n8\nGROOVE_BACK\n';
      dxf += `10\n${(grv.x1 - halfWidth).toFixed(3)}\n20\n${grv.y1.toFixed(3)}\n30\n0.0\n`;
      dxf += `11\n${(grv.x1 - halfWidth).toFixed(3)}\n21\n${grv.y2.toFixed(3)}\n31\n0.0\n`;

      dxf += '0\nLINE\n8\nGROOVE_BACK\n';
      dxf += `10\n${(grv.x1 + halfWidth).toFixed(3)}\n20\n${grv.y1.toFixed(3)}\n30\n0.0\n`;
      dxf += `11\n${(grv.x1 + halfWidth).toFixed(3)}\n21\n${grv.y2.toFixed(3)}\n31\n0.0\n`;
    }
  });

  // 3.4 Destajes Gola (POCKET_GOLA)
  part.pockets.forEach(pkt => {
    const px1 = pkt.x;
    const py1 = pkt.y;
    const px2 = pkt.x + pkt.width;
    const py2 = pkt.y + pkt.height;

    const pktCorners = [
      { x1: px1, y1: py1, x2: px2, y2: py1 },
      { x1: px2, y1: py1, x2: px2, y2: py2 },
      { x1: px2, y1: py2, x2: px1, y2: py2 },
      { x1: px1, y1: py2, x2: px1, y2: py1 },
    ];

    pktCorners.forEach(c => {
      dxf += '0\nLINE\n8\nPOCKET_GOLA\n';
      dxf += `10\n${c.x1.toFixed(3)}\n20\n${c.y1.toFixed(3)}\n30\n0.0\n`;
      dxf += `11\n${c.x2.toFixed(3)}\n21\n${c.y2.toFixed(3)}\n31\n0.0\n`;
    });
  });

  // 3.5 Textos informativos de identificación para operador CNC
  dxf += '0\nTEXT\n8\nTEXT_INFO\n';
  dxf += `10\n${Math.round(w / 2)}\n20\n${Math.round(l / 2)}\n30\n0.0\n`;
  dxf += '40\n18.0\n'; // Altura de texto
  dxf += `1\n${part.partCode} - ${part.partName} [${w}x${l}x${part.thickness}mm]\n`;

  dxf += '0\nTEXT\n8\nTEXT_INFO\n';
  dxf += `10\n${Math.round(w / 2)}\n20\n${Math.round(l / 2) - 25}\n30\n0.0\n`;
  dxf += '40\n12.0\n';
  dxf += `1\nMODULO: ${part.moduleName} | MATERIAL: ${part.material}\n`;

  dxf += '0\nENDSEC\n';
  dxf += '0\nEOF\n';

  return dxf;
}

/**
 * Estructura de paquete DXF agrupado por mueble/gabinete
 */
export interface CabinetDxfPackageGroup {
  folderName: string;
  cabinetTag: string;
  cabinetName: string;
  parts: CncMachinedPart[];
}

/**
 * Descarga directamente un archivo DXF individual al navegador del usuario
 */
export function downloadPartDxfFile(part: CncMachinedPart): void {
  const dxfContent = generatePartDxf(part);
  const blob = new Blob([dxfContent], { type: 'application/dxf;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const cleanName = part.partName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  link.href = url;
  link.download = `CNC_${part.partCode}_${cleanName}.dxf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Descarga un archivo comprimido (.ZIP) con los planos DXF estructurados
 * en subcarpetas independientes por cada mueble (número, tipo y dimensiones).
 */
export async function downloadKitchenDxfZip(
  groups: CabinetDxfPackageGroup[],
  projectName: string = 'Cocina_Modular'
): Promise<void> {
  if (groups.length === 0) return;

  const zip = new JSZip();

  // 1. Archivo técnico LEAME en la raíz con especificaciones y mapeo de capas CNC
  const dateStr = new Date().toLocaleDateString('es-CL');
  const timeStr = new Date().toLocaleTimeString('es-CL');
  const totalParts = groups.reduce((acc, g) => acc + g.parts.length, 0);

  const readmeContent = `================================================================================
ESPECIFICACIONES DE PLANOS CAD/DXF PARA CENTRO DE CORTE Y MECANIZADO CNC
PROYECTO: ${projectName.replace(/_/g, ' ')}
FECHA: ${dateStr} - ${timeStr}
TOTAL MUEBLES: ${groups.length} | TOTAL PIEZAS: ${totalParts}
================================================================================

FORMATO DE ARCHIVO: DXF ASCII AutoCAD R12 / AC1009 (Unidades: Milímetros)
COMPATIBILIDAD CAM/CNC: 
  - Homag / Weeke: WoodWOP
  - Biesse: BiesseWorks / bSolid
  - SCM / Morbidelli: Maestro / Xilog Plus
  - TpaCAD, CutMaster, Aspire, Vectric, AlphaCAM

MAPEO DE CAPAS CAD/CNC ESTÁNDAR:
--------------------------------------------------------------------------------
1. CUT_EXTERIOR    | Color 7 (Blanco)    | Contorneado y corte perimetral con fresa
2. DRILL_FACE_35   | Color 1 (Rojo)      | Cazoleta para bisagras ocultas Ø35mm x 12.5mm
3. DRILL_FACE_15   | Color 3 (Verde)     | Cajas de ensamble Minifix / Rastex Ø15mm x 13.5mm
4. DRILL_FACE_8    | Color 6 (Magenta)   | Pernos de unión y tarugos espiga guía Ø8mm
5. DRILL_FACE_5    | Color 5 (Azul)      | Correderas de cajón, cremallera Sistema 32, tornillos Spax Ø5mm
6. DRILL_HANDLE    | Color 4 (Cian)      | Perforaciones pasantes de tirador Ø4.5mm
7. GROOVE_BACK     | Color 2 (Amarillo)  | Ranura de fondo Durolac / MDF 4mm (8mm profundidad)
8. POCKET_GOLA     | Color 30 (Naranja)  | Rebaje/destaje perfiles Gola L (58x26) y C (68x26)
9. TEXT_INFO       | Color 8 (Gris)      | Rotulado de taller y marcas de referencia (no mecanizar)

ESTRUCTURA DE CARPETAS EN ESTE PAQUETE:
--------------------------------------------------------------------------------
${groups.map(g => `- ${g.folderName} (${g.parts.length} piezas DXF)`).join('\n')}

================================================================================
`;
  zip.file('LEAME_CAPAS_CNC.txt', readmeContent);

  // 2. Inserción de carpetas por cada mueble con sus respectivos archivos DXF
  groups.forEach(group => {
    const folder = zip.folder(group.folderName);
    if (!folder) return;

    group.parts.forEach((part, pIdx) => {
      const dxfContent = generatePartDxf(part);
      const cleanName = part.partName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
      const pNum = (pIdx + 1).toString().padStart(2, '0');
      const tagPrefix = (part.moduleTag || group.cabinetTag).replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `CNC_${tagPrefix}_P${pNum}_${cleanName}.dxf`;
      folder.file(filename, dxfContent);
    });
  });

  // 3. Generación y descarga automática del archivo ZIP
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeProjectName = projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
  link.href = url;
  link.download = `DXF_CNC_${safeProjectName}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Descarga empaquetada en ZIP de todos los archivos DXF organizados automáticamente por mueble
 */
export async function downloadAllPartsDxf(parts: CncMachinedPart[]): Promise<void> {
  if (parts.length === 0) return;
  
  // Agrupar piezas por módulo
  const groupsMap = new Map<string, CncMachinedPart[]>();
  parts.forEach(part => {
    const key = part.moduleTag || part.moduleName || 'MODULO_GENERAL';
    if (!groupsMap.has(key)) {
      groupsMap.set(key, []);
    }
    groupsMap.get(key)!.push(part);
  });

  const groups: CabinetDxfPackageGroup[] = Array.from(groupsMap.entries()).map(([key, groupParts], idx) => {
    const num = (idx + 1).toString().padStart(2, '0');
    const safeTag = key.replace(/[^a-zA-Z0-9_-]/g, '_');
    return {
      folderName: `${num}_MUEBLE_${safeTag}`,
      cabinetTag: key,
      cabinetName: groupParts[0]?.moduleName || key,
      parts: groupParts
    };
  });

  await downloadKitchenDxfZip(groups, 'Cocina_Mecanizados_CNC');
}
