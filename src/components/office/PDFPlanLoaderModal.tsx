import React, { useState, useRef } from 'react';
import { Upload, FileText, Image as ImageIcon, X, Check, Eye, AlertCircle, Sparkles } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { useOfficeStore } from '../../store/officeStore';

// Configuración de worker para PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface PDFPlanLoaderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PDFPlanLoaderModal({ isOpen, onClose }: PDFPlanLoaderModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(1);
  const [selectedPage, setSelectedPage] = useState<number>(1);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileDetails, setFileDetails] = useState<{ name: string; type: 'pdf' | 'image'; w: number; h: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const setFloorPlanFile = useOfficeStore((state) => state.setFloorPlanFile);
  const startCalibration = useOfficeStore((state) => state.startCalibration);

  if (!isOpen) return null;

  const renderPdfPage = async (doc: any, pageNumber: number) => {
    try {
      setIsLoading(true);
      const page = await doc.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 2.0 }); // Alta resolución

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      if (!ctx) throw new Error('No se pudo inicializar el contexto 2D');

      await page.render({
        canvasContext: ctx,
        viewport: viewport,
      }).promise;

      const dataUrl = canvas.toDataURL('image/png');
      setPreviewUrl(dataUrl);
      setFileDetails({
        name: fileDetails?.name || `Plano_Arquitectura_Pag_${pageNumber}.pdf`,
        type: 'pdf',
        w: canvas.width,
        h: canvas.height,
      });
      setIsLoading(false);
    } catch (err: any) {
      console.error('Error renderizando página PDF:', err);
      setErrorMessage('Error al procesar la página del PDF: ' + (err.message || ''));
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const doc = await loadingTask.promise;

        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setSelectedPage(1);
        setFileDetails({
          name: file.name,
          type: 'pdf',
          w: 2000,
          h: 1400,
        });

        await renderPdfPage(doc, 1);
      } else if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          const img = new Image();
          img.onload = () => {
            setPreviewUrl(result);
            setFileDetails({
              name: file.name,
              type: 'image',
              w: img.width,
              h: img.height,
            });
            setIsLoading(false);
          };
          img.src = result;
        };
        reader.readAsDataURL(file);
      } else {
        throw new Error('Formato de archivo no soportado. Sube un PDF o una imagen (PNG, JPG, SVG).');
      }
    } catch (err: any) {
      console.error('Error cargando archivo:', err);
      setErrorMessage(err.message || 'Error al procesar el archivo seleccionado.');
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!previewUrl || !fileDetails) return;
    setFloorPlanFile(previewUrl, fileDetails.name, fileDetails.type, fileDetails.w, fileDetails.h);
    onClose();
    // Iniciar automáticamente la calibración de escala para máxima precisión
    startCalibration();
  };

  // Cargar una planta demo técnica dibujada en SVG/Canvas
  const handleLoadDemoPlan = () => {
    setIsLoading(true);
    const canvas = document.createElement('canvas');
    canvas.width = 2400;
    canvas.height = 1400;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Fondo blanco técnico
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grilla de ejes estructurales
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 100) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 100) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Muros perimetrales (Líneas arquitectónicas)
      ctx.strokeStyle = '#64748B';
      ctx.lineWidth = 6;
      ctx.strokeRect(100, 100, canvas.width - 200, canvas.height - 200);

      // Divisiones interiores (Oficinas privadas, salas de reunión, baños)
      ctx.lineWidth = 4;
      // Privada Gerencia
      ctx.strokeRect(100, 100, 600, 450);
      // Sala Directorio
      ctx.strokeRect(canvas.width - 700, 100, 600, 600);
      // Sala Reunión Pequeña
      ctx.strokeRect(canvas.width - 700, 750, 600, 450);
      // Coffee Break
      ctx.strokeRect(100, canvas.height - 550, 500, 450);

      // Cotas y Textos técnicos
      ctx.fillStyle = '#94A3B8';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('PLANTA DE ARQUITECTURA - NIVEL 4 (AMUBLAMIENTO)', 140, 70);
      ctx.font = '18px sans-serif';
      ctx.fillText('OFICINA GERENCIA', 140, 150);
      ctx.fillText('SALA DE DIRECTORIO', canvas.width - 660, 150);
      ctx.fillText('OPEN SPACE - OPERACIONES', canvas.width / 2 - 130, 200);
      ctx.fillText('COFFEE BREAK', 140, canvas.height - 500);

      // Cotas de referencia
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(100, canvas.height - 60);
      ctx.lineTo(canvas.width - 100, canvas.height - 60);
      ctx.stroke();
      ctx.fillStyle = '#64748B';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('← 24.00 m →', canvas.width / 2 - 60, canvas.height - 40);

      const demoDataUrl = canvas.toDataURL('image/png');
      setPreviewUrl(demoDataUrl);
      setFileDetails({
        name: 'Planta_Corporativa_Demo_Nivel4.png',
        type: 'image',
        w: canvas.width,
        h: canvas.height,
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                Cargar Planta de Arquitectura (PDF / Imagen)
              </h2>
              <p className="text-xs text-slate-400">
                Sube el plano arquitectónico en PDF para calcarlo y ubicar el mobiliario sobre él en 2D y 3D.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Zona Drag & Drop */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileUpload(e.dataTransfer.files[0]);
              }
            }}
            className="border-2 border-dashed border-zinc-700 hover:border-orange-500/80 bg-zinc-950/60 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/png,image/jpeg,image/svg+xml"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />

            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-all">
              <Upload size={28} />
            </div>

            <div className="text-center">
              <p className="text-sm font-bold text-white">Haz clic o arrastra tu archivo PDF o Imagen aquí</p>
              <p className="text-xs text-slate-400 mt-1">Soporta planos en PDF vectoriales, PNG de alta resolución, JPG y SVG</p>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <span className="px-2.5 py-1 bg-zinc-800 rounded-md text-[10px] font-mono text-slate-300">.PDF</span>
              <span className="px-2.5 py-1 bg-zinc-800 rounded-md text-[10px] font-mono text-slate-300">.PNG</span>
              <span className="px-2.5 py-1 bg-zinc-800 rounded-md text-[10px] font-mono text-slate-300">.JPG</span>
            </div>
          </div>

          {/* O opción de cargar plano de ejemplo */}
          <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
            <div className="flex items-center gap-3">
              <Sparkles size={18} className="text-amber-400" />
              <div>
                <p className="text-xs font-bold text-white">¿No tienes un PDF a mano?</p>
                <p className="text-[11px] text-slate-400">Carga una planta arquitectónica corporativa de muestra preconfigurada.</p>
              </div>
            </div>
            <button
              onClick={handleLoadDemoPlan}
              className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-slate-200 border border-zinc-700 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            >
              Usar Planta Demo
            </button>
          </div>

          {/* Mensajes de error */}
          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Selector de páginas si es PDF multipágina */}
          {pdfDoc && numPages > 1 && (
            <div className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
              <span className="text-xs text-slate-300">Página del documento ({numPages} páginas encontradas):</span>
              <div className="flex items-center gap-2">
                {Array.from({ length: numPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedPage(i + 1);
                      renderPdfPage(pdfDoc, i + 1);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      selectedPage === i + 1
                        ? 'bg-orange-500 text-white'
                        : 'bg-zinc-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Pág {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Vista previa del plano procesado */}
          {previewUrl && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Eye size={14} className="text-orange-400" /> Vista Previa del Plano Rasterizado
                </span>
                <span className="font-mono text-[11px]">
                  {fileDetails?.w} x {fileDetails?.h} px
                </span>
              </div>
              <div className="w-full h-48 bg-black/40 border border-zinc-700 rounded-xl overflow-hidden flex items-center justify-center p-2">
                <img
                  src={previewUrl}
                  alt="Plano Preview"
                  className="max-w-full max-h-full object-contain rounded"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            Cancelar
          </button>

          <button
            onClick={handleApply}
            disabled={!previewUrl || isLoading}
            className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
          >
            <Check size={16} />
            <span>{isLoading ? 'Procesando...' : 'Insertar en Plano 2D/3D'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
