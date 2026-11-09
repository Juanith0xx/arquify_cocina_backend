import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

export async function exportBlueprintDomToPdf(
  filename = 'planos_fabricacion_completos_A3.pdf',
  onProgress?: (current: number, total: number) => void
): Promise<string | null> {
  const pages = Array.from(document.querySelectorAll<HTMLElement>('.blueprint-page'));
  if (!pages.length) {
    console.error('No se encontraron páginas de planos (.blueprint-page)');
    return null;
  }

  // A3 Landscape: 420 x 297 mm
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a3',
    compress: true
  });

  const total = pages.length;

  // Create container for html2canvas rendering at exact A3 pixel dimensions (1587 x 1122 at 96dpi)
  // Positioned at (0, 0) with low z-index so coordinates match viewport exactly without flashing
  const wrapper = document.createElement('div');
  wrapper.style.position = 'fixed';
  wrapper.style.left = '0px';
  wrapper.style.top = '0px';
  wrapper.style.width = '1587px';
  wrapper.style.height = '1122px';
  wrapper.style.zIndex = '-9999';
  wrapper.style.background = '#ffffff';
  wrapper.style.overflow = 'hidden';
  wrapper.style.pointerEvents = 'none';
  document.body.appendChild(wrapper);

  try {
    let pagesAdded = 0;

    for (let i = 0; i < total; i++) {
      const pageEl = pages[i];
      if (onProgress) onProgress(i + 1, total);

      // Clear wrapper
      wrapper.innerHTML = '';
      const clone = pageEl.cloneNode(true) as HTMLElement;
      clone.style.width = '1587px';
      clone.style.height = '1122px';
      clone.style.minWidth = '1587px';
      clone.style.minHeight = '1122px';
      clone.style.maxWidth = '1587px';
      clone.style.maxHeight = '1122px';
      clone.style.position = 'relative';
      clone.style.transform = 'none';
      clone.style.boxShadow = 'none';
      clone.style.margin = '0';
      clone.style.boxSizing = 'border-box';
      wrapper.appendChild(clone);

      // Wait for all images in clone to load with safety timeout
      const images = Array.from(clone.querySelectorAll('img'));
      await Promise.all(
        images.map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise(resolve => {
            img.onload = resolve;
            img.onerror = resolve;
            setTimeout(resolve, 800);
          });
        })
      );

      // Short tick for layout and SVG rendering
      await new Promise(resolve => setTimeout(resolve, 100));

      try {
        const canvas = await html2canvas(clone, {
          scale: 1.5,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          x: 0,
          y: 0,
          width: 1587,
          height: 1122,
          windowWidth: 1587,
          windowHeight: 1122,
          onclone: (clonedDoc) => {
            try {
              // Sanitize any remaining oklch/oklab styles if needed
              const styleTags = Array.from(clonedDoc.querySelectorAll('style'));
              styleTags.forEach(styleTag => {
                if (styleTag.textContent && (styleTag.textContent.includes('oklch') || styleTag.textContent.includes('oklab'))) {
                  styleTag.textContent = styleTag.textContent
                    .replace(/oklch\([^)]+\)/gi, '#475569')
                    .replace(/oklab\([^)]+\)/gi, '#475569');
                }
              });

              // Inject sRGB color override style
              const overrideStyle = clonedDoc.createElement('style');
              overrideStyle.innerHTML = `
                :root {
                  --color-slate-50: #f8fafc;
                  --color-slate-100: #f1f5f9;
                  --color-slate-200: #e2e8f0;
                  --color-slate-300: #cbd5e1;
                  --color-slate-400: #94a3b8;
                  --color-slate-500: #64748b;
                  --color-slate-600: #475569;
                  --color-slate-700: #334155;
                  --color-slate-800: #1e293b;
                  --color-slate-900: #0f172a;
                  --color-orange-500: #f97316;
                  --color-orange-600: #ea580c;
                }
                .bg-white { background-color: #ffffff !important; }
                .bg-slate-50 { background-color: #f8fafc !important; }
                .bg-slate-100 { background-color: #f1f5f9 !important; }
                .bg-slate-200 { background-color: #e2e8f0 !important; }
                .bg-slate-900 { background-color: #0f172a !important; color: #ffffff !important; }
                .bg-orange-500 { background-color: #f97316 !important; color: #ffffff !important; }
                .text-orange-600 { color: #ea580c !important; }
                .text-orange-500 { color: #f97316 !important; }
                .text-slate-500 { color: #64748b !important; }
                .text-slate-600 { color: #475569 !important; }
                .text-slate-700 { color: #334155 !important; }
                .text-slate-800 { color: #1e293b !important; }
                .text-slate-900 { color: #0f172a !important; }
                .border-slate-200 { border-color: #e2e8f0 !important; }
                .border-slate-300 { border-color: #cbd5e1 !important; }
                .border-slate-400 { border-color: #94a3b8 !important; }
              `;
              clonedDoc.head.appendChild(overrideStyle);

              const allEls = clonedDoc.querySelectorAll('*');
              allEls.forEach((el) => {
                const htmlEl = el as HTMLElement;
                if (htmlEl && htmlEl.style) {
                  for (let s = 0; s < htmlEl.style.length; s++) {
                    const prop = htmlEl.style[s];
                    const val = htmlEl.style.getPropertyValue(prop);
                    if (val && (val.includes('oklab') || val.includes('oklch'))) {
                      htmlEl.style.setProperty(prop, '#333333');
                    }
                  }
                }
              });
            } catch (e) {
              console.warn('Error sanitizing colors in onclone:', e);
            }
          }
        });

        if (pagesAdded > 0) {
          doc.addPage('a3', 'l');
        }

        const imgData = canvas.toDataURL('image/jpeg', 0.92);
        doc.addImage(imgData, 'JPEG', 0, 0, 420, 297, undefined, 'FAST');
        pagesAdded++;
      } catch (pageErr) {
        console.error(`Error al renderizar lámina ${i + 1} para PDF:`, pageErr);
      }
    }

    if (pagesAdded === 0) {
      console.error('No se pudo renderizar ninguna lámina');
      return null;
    }

    // Direct save using jsPDF cross-browser file-saver
    let savedSuccessfully = false;
    try {
      doc.save(filename);
      savedSuccessfully = true;
    } catch (saveErr) {
      console.warn('doc.save failed, falling back to blob link:', saveErr);
    }

    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);

    // Fallback download link only if doc.save failed
    if (!savedSuccessfully) {
      try {
        const downloadLink = document.createElement('a');
        downloadLink.href = blobUrl;
        downloadLink.download = filename;
        downloadLink.style.display = 'none';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        setTimeout(() => {
          if (downloadLink.parentNode) {
            document.body.removeChild(downloadLink);
          }
        }, 500);
      } catch (e) {
        console.warn('Programmatic fallback download click failed:', e);
      }
    }

    return blobUrl;
  } catch (err) {
    console.error('Error al exportar planos a PDF', err);
    return null;
  } finally {
    if (wrapper.parentNode) {
      document.body.removeChild(wrapper);
    }
  }
}
