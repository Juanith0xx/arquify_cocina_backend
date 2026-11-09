import React, { useState, useEffect } from 'react';
import {
  Camera,
  X,
  Download,
  Sun,
  Moon,
  Sparkles,
  Flame,
  Flower2,
  Users,
  Layers,
  CheckCircle2,
  Sliders,
  Maximize2,
  Loader2,
  Monitor,
} from 'lucide-react';
import { useKitchenStore } from '../../store/kitchenStore';
import { useStore } from '../../store';
import { useStudioRender } from './StudioRenderContext';

interface StudioRenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLight?: boolean;
}

export function StudioRenderModal({ isOpen, onClose, isLight = false }: StudioRenderModalProps) {
  const { cabinets } = useKitchenStore();
  const { settings, updateSetting, triggerRenderCapture } = useStudioRender();

  // Sincronizar modo render en vivo mientras el modal esté abierto para previsualizar y preparar shaders
  useEffect(() => {
    if (isOpen) {
      updateSetting('isRenderingMode', true);
    } else {
      updateSetting('isRenderingMode', false);
    }
  }, [isOpen]);

  const handleModalClose = () => {
    updateSetting('isRenderingMode', false);
    onClose();
  };

  // Estados de Proceso de Renderizado
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderProgress, setRenderProgress] = useState<number>(0);
  const [renderedImageUrl, setRenderedImageUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const resolutionConfig = {
    fhd: { width: 1920, height: 1080, label: 'Full HD 1080p', desc: 'Ideal para compartir rápido y pantallas estándar' },
    '2k': { width: 2560, height: 1440, label: '2K Quad HD', desc: 'Excelente nitidez para presentaciones a clientes' },
    '4k': { width: 3840, height: 2160, label: '4K Ultra HD', desc: 'Máxima resolución para catálogos, banners e impresión' },
  };

  const handleCaptureStudioRender = async () => {
    setIsRendering(true);
    setRenderProgress(15);
    setRenderedImageUrl(null);

    try {
      setRenderProgress(30);
      // Asegurar que el modo render esté activo
      updateSetting('isRenderingMode', true);

      // Esperar sincronización de React y Three.js
      await new Promise((r) => setTimeout(r, 200));
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => requestAnimationFrame(r));

      setRenderProgress(60);

      // Invocar pipeline de renderizado Three.js en alta definición
      const rawCaptureUrl = await triggerRenderCapture();
      if (!rawCaptureUrl) {
        throw new Error('No se pudo capturar el frame de Three.js. Asegúrate de estar en Vista 3D.');
      }

      setRenderProgress(85);

      // Composición fotográfica en lienzo 2D a resolución 1:1
      const targetRes = resolutionConfig[settings.resolution];
      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = targetRes.width;
      offscreenCanvas.height = targetRes.height;
      const ctx = offscreenCanvas.getContext('2d');
      if (!ctx) throw new Error('No se pudo inicializar canvas 2D');

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = rawCaptureUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Dibujar captura directa 1:1 sin estiramiento
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetRes.width, targetRes.height);

      // Ficha técnica en esquina inferior
      ctx.fillStyle = '#f97316';
      ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
      ctx.fillText('ARQUIFY • 3D CAD/BIM STUDIO', 45, targetRes.height - 45);

      ctx.fillStyle = settings.lightingPreset === 'daylight' ? '#475569' : 'rgba(255, 255, 255, 0.7)';
      ctx.font = '14px monospace';
      ctx.fillText(
        `Resolución: ${targetRes.width}x${targetRes.height} | Preset: ${settings.lightingPreset.toUpperCase()} | Three.js PBR Engine`,
        45,
        targetRes.height - 24
      );

      setRenderProgress(98);
      await new Promise((r) => setTimeout(r, 100));

      const dataUrl = offscreenCanvas.toDataURL('image/png', 1.0);
      setRenderedImageUrl(dataUrl);
      setRenderProgress(100);
    } catch (err: any) {
      console.error('Error generando render Three.js:', err);
      alert(err?.message || 'Error al procesar el render fotográfico.');
    } finally {
      setIsRendering(false);
    }
  };

  const handleDownload = () => {
    if (!renderedImageUrl) return;
    const link = document.createElement('a');
    link.download = `render-estudio-arquify-${settings.resolution}-${Date.now()}.png`;
    link.href = renderedImageUrl;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-all ${
          isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-zinc-900 border-zinc-800 text-zinc-100'
        }`}
      >
        {/* Cabecera del Modal */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isLight ? 'border-slate-200 bg-slate-50' : 'border-zinc-800 bg-zinc-900/80'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400">
              <Camera size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold uppercase tracking-wider text-orange-500">
                  Render Estudio 3D (WebGL HD)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 uppercase">
                  100% Three.js • Sin IA
                </span>
              </div>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                Generador de renders nítidos fotorrealistas directo de tu GPU, con iluminación calibrada y ambientación.
              </p>
            </div>
          </div>
          <button
            onClick={handleModalClose}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isLight ? 'hover:bg-slate-200 border-slate-200 text-slate-500' : 'hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {renderedImageUrl ? (
            /* Vista Previa del Render Listo para Descargar */
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden border border-orange-500/30 bg-black aspect-video flex items-center justify-center group">
                <img
                  src={renderedImageUrl}
                  alt="Render Estudio 3D"
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-3 right-3 px-3 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/10 text-xs font-mono font-bold text-orange-400">
                  {resolutionConfig[settings.resolution].width} × {resolutionConfig[settings.resolution].height} px (PNG)
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => setRenderedImageUrl(null)}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300'
                  }`}
                >
                  Volver a Ajustes
                </button>

                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white text-xs font-extrabold uppercase tracking-wider shadow-lg shadow-orange-500/25 cursor-pointer"
                >
                  <Download size={16} />
                  <span>Descargar Render en Alta Definición</span>
                </button>
              </div>
            </div>
          ) : (
            /* Ajustes de Renderizado */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Columna Izquierda: Resolución e Iluminación */}
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-orange-500 block mb-2.5">
                    1. Resolución de Salida
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['fhd', '2k', '4k'] as const).map((key) => {
                      const item = resolutionConfig[key];
                      const active = settings.resolution === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => updateSetting('resolution', key)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            active
                              ? 'bg-orange-500/15 border-orange-500 text-orange-400 shadow-sm'
                              : isLight
                              ? 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                              : 'bg-zinc-800/50 border-zinc-700/60 hover:border-zinc-600 text-zinc-300'
                          }`}
                        >
                          <span className="text-xs font-black uppercase">{item.label}</span>
                          <span className="text-[10px] font-mono opacity-80 mt-1">
                            {item.width}x{item.height}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className={`text-[11px] mt-2 leading-relaxed ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                    {resolutionConfig[settings.resolution].desc}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-orange-500 block mb-2.5">
                    2. Ambiente de Iluminación
                  </label>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => updateSetting('lightingPreset', 'warm')}
                      className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                        settings.lightingPreset === 'warm'
                          ? 'bg-orange-500/15 border-orange-500 text-orange-400'
                          : isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-800/40 border-zinc-700/50 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Sun size={18} className="text-amber-500" />
                        <div>
                          <div className="text-xs font-bold">Luz Cálida de Estudio (3000K)</div>
                          <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                            Realza vetas de maderas y calidez en melaminas
                          </div>
                        </div>
                      </div>
                      {settings.lightingPreset === 'warm' && <CheckCircle2 size={16} className="text-orange-500" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => updateSetting('lightingPreset', 'daylight')}
                      className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                        settings.lightingPreset === 'daylight'
                          ? 'bg-orange-500/15 border-orange-500 text-orange-400'
                          : isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-800/40 border-zinc-700/50 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Sparkles size={18} className="text-cyan-400" />
                        <div>
                          <div className="text-xs font-bold">Luz Natural Día (5500K)</div>
                          <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                            Tonos neutros perfectos para cubiertas de cuarzo y blanco
                          </div>
                        </div>
                      </div>
                      {settings.lightingPreset === 'daylight' && <CheckCircle2 size={16} className="text-orange-500" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => updateSetting('lightingPreset', 'night_led')}
                      className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                        settings.lightingPreset === 'night_led'
                          ? 'bg-orange-500/15 border-orange-500 text-orange-400'
                          : isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-800/40 border-zinc-700/50 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Moon size={18} className="text-indigo-400" />
                        <div>
                          <div className="text-xs font-bold">Noche & Tiras LED de Acento</div>
                          <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                            Iluminación arquitectónica bajo muebles e isla
                          </div>
                        </div>
                      </div>
                      {settings.lightingPreset === 'night_led' && <CheckCircle2 size={16} className="text-orange-500" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Columna Derecha: Elementos Decorativos y Ambientación */}
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-orange-500 block mb-2.5">
                    3. Elementos Decorativos en la Escena
                  </label>
                  <div className="space-y-2.5">
                    <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                      settings.includePots
                        ? 'border-orange-500/40 bg-orange-500/10'
                        : isLight ? 'border-slate-200 bg-slate-50' : 'border-zinc-800 bg-zinc-800/40'
                    }`}>
                      <div className="flex items-center gap-3">
                        <Flame size={18} className="text-orange-400" />
                        <div>
                          <div className="text-xs font-bold">Ollas y Utensilios de Cocina</div>
                          <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                            Olla de acero inoxidable y sartén gourmet en encimera
                          </div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.includePots}
                        onChange={(e) => updateSetting('includePots', e.target.checked)}
                        className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
                      />
                    </label>

                    <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                      settings.includePlants
                        ? 'border-orange-500/40 bg-orange-500/10'
                        : isLight ? 'border-slate-200 bg-slate-50' : 'border-zinc-800 bg-zinc-800/40'
                    }`}>
                      <div className="flex items-center gap-3">
                        <Flower2 size={18} className="text-emerald-400" />
                        <div>
                          <div className="text-xs font-bold">Plantas de Interior / Botánica</div>
                          <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                            Macetas cerámicas y vegetación en repisas o mesones
                          </div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.includePlants}
                        onChange={(e) => updateSetting('includePlants', e.target.checked)}
                        className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
                      />
                    </label>

                    <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                      settings.includeHumanScale
                        ? 'border-orange-500/40 bg-orange-500/10'
                        : isLight ? 'border-slate-200 bg-slate-50' : 'border-zinc-800 bg-zinc-800/40'
                    }`}>
                      <div className="flex items-center gap-3">
                        <Users size={18} className="text-sky-400" />
                        <div>
                          <div className="text-xs font-bold">Escala Humana Arquitectónica</div>
                          <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                            Silueta a escala (1.72 m) para noción de proporción real
                          </div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.includeHumanScale}
                        onChange={(e) => updateSetting('includeHumanScale', e.target.checked)}
                        className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
                      />
                    </label>

                    <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                      settings.enableSoftShadows
                        ? 'border-orange-500/40 bg-orange-500/10'
                        : isLight ? 'border-slate-200 bg-slate-50' : 'border-zinc-800 bg-zinc-800/40'
                    }`}>
                      <div className="flex items-center gap-3">
                        <Sliders size={18} className="text-indigo-400" />
                        <div>
                          <div className="text-xs font-bold">Sombras Suaves PCSS</div>
                          <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                            Cálculo de oclusión y penumbra progresiva
                          </div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.enableSoftShadows}
                        onChange={(e) => updateSetting('enableSoftShadows', e.target.checked)}
                        className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                <div className={`p-4 rounded-xl border ${
                  isLight ? 'bg-orange-50/60 border-orange-200 text-orange-950' : 'bg-orange-950/20 border-orange-500/20 text-orange-200'
                }`}>
                  <div className="flex items-center gap-2 font-bold text-xs mb-1 text-orange-500">
                    <Sparkles size={14} />
                    <span>Ventajas de este Render Directo</span>
                  </div>
                  <ul className="text-[11px] space-y-1 list-disc list-inside opacity-90">
                    <li>Generación en 1 a 3 segundos directamente en tu equipo.</li>
                    <li>Sin límite de créditos ni coste de API.</li>
                    <li>Fidelidad exacta 1:1 a los materiales y medidas del proyecto.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Barra de Acciones Inferior */}
        {!renderedImageUrl && (
          <div className={`flex items-center justify-between px-6 py-4 border-t ${
            isLight ? 'border-slate-200 bg-slate-50' : 'border-zinc-800 bg-zinc-900/80'
          }`}>
            <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
              Módulos activos: <strong>{cabinets.length}</strong> • Ángulo de cámara actual
            </span>

            <button
              onClick={handleCaptureStudioRender}
              disabled={isRendering}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 via-amber-600 to-orange-500 hover:from-orange-400 hover:to-amber-500 text-white text-xs font-extrabold uppercase tracking-wider shadow-lg shadow-orange-500/25 disabled:opacity-50 cursor-pointer active:scale-95 transition-all"
            >
              {isRendering ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Procesando Render WebGL ({renderProgress}%)...</span>
                </>
              ) : (
                <>
                  <Camera size={16} />
                  <span>Generar Render Estudio ({settings.resolution.toUpperCase()})</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
