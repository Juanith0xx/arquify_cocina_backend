import { jsPDF } from 'jspdf';
import { bellotaBoldBase64 } from './bellotaFontBase64';

export function registerBellotaFont(doc: jsPDF): boolean {
  try {
    // Check if font file already in VFS
    // @ts-ignore
    if (!doc.existsFileInVFS?.('Bellota-Bold.ttf')) {
      doc.addFileToVFS('Bellota-Bold.ttf', bellotaBoldBase64);
    }
    const fontList = doc.getFontList();
    if (!fontList['Bellota']) {
      doc.addFont('Bellota-Bold.ttf', 'Bellota', 'bold');
      doc.addFont('Bellota-Bold.ttf', 'Bellota', 'normal');
    }
    return true;
  } catch (e) {
    console.warn('Error registering Bellota font in jsPDF:', e);
    return false;
  }
}

export function renderArquifyPdfLogo(
  doc: jsPDF,
  x: number,
  y: number,
  fontSize = 22,
  options?: { color?: [number, number, number] }
) {
  const registered = registerBellotaFont(doc);
  const color = options?.color || [249, 115, 22]; // Orange-500
  doc.setTextColor(color[0], color[1], color[2]);
  
  if (registered) {
    try {
      doc.setFont('Bellota', 'bold');
    } catch {
      doc.setFont('helvetica', 'bold');
    }
  } else {
    doc.setFont('helvetica', 'bold');
  }

  doc.setFontSize(fontSize);
  doc.text('arquify', x, y);
}
