import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Camera,
  Download,
  Lock,
  CreditCard,
  Users,
  Utensils,
  Sun,
  Home,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Maximize2,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import { useSupabaseAuthStore } from '../../store/supabaseAuthStore';
import { useKitchenStore } from '../../store/kitchenStore';
import { getFriendlyColorName } from '../../utils/colorNames';
import { FINISH_LABELS, HandleFinish } from '../../types/handle';

interface NanoBananaRenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLight?: boolean;
}

export function NanoBananaRenderModal({ isOpen, onClose, isLight = false }: NanoBananaRenderModalProps) {
  const { currentUser, getUserNanoBananaCredits, deductNanoBananaCredit } = useAdminStore();
  const supabaseUser = useSupabaseAuthStore((state) => state.user);

  const effectiveRole = currentUser?.role || supabaseUser?.role || 'designer';
  const isSuperAdmin = effectiveRole === 'superadmin' || currentUser?.email?.includes('marcelo@robfu');
  const isFreeUser = effectiveRole === 'free_user';
  
  const credits = getUserNanoBananaCredits(currentUser?.email || supabaseUser?.email, effectiveRole);

  // Opciones de Configuración del Render
  const [propertyType, setPropertyType] = useState<string>('Casa Residencial');
  const [environment, setEnvironment] = useState<string>('Interior (Muros Ciegos / Sin Ventanas)');
  const [lighting, setLighting] = useState<string>('Mañana Luminosa (Luz Natural Sol)');
  const [hasPeople, setHasPeople] = useState<boolean>(false);
  const [hasProps, setHasProps] = useState<boolean>(false);

  // Estados del Flujo de Generación
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const [showRechargeModal, setShowRechargeModal] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setErrorMessage(null);

    // 1. Verificación de Usuario Gratis
    if (isFreeUser) {
      setShowUpgradeModal(true);
      return;
    }

    // 2. Verificación de Créditos Agotados
    if (!isSuperAdmin && credits <= 0) {
      setShowRechargeModal(true);
      return;
    }

    // 3. Captura del Canvas 3D
    setIsGenerating(true);
    setProgressStatus('Capturando viewport 3D del proyecto...');

    let canvasDataUrl = '';
    try {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        canvasDataUrl = canvas.toDataURL('image/png');
      }
    } catch (err) {
      console.warn('Advertencia al capturar canvas 3D:', err);
    }

    if (!canvasDataUrl) {
      setIsGenerating(false);
      setErrorMessage('No se pudo capturar la vista 3D actual. Asegúrate de estar en Vista 3D.');
      return;
    }

    try {
      setProgressStatus('Analizando geometría y módulos 3D...');
      await new Promise((r) => setTimeout(r, 600));

      let bimManifest: any = null;
      try {
        const kitchenState = useKitchenStore.getState();
        if (kitchenState && kitchenState.cabinets && kitchenState.cabinets.length > 0) {
          const { cabinets, countertopConfig, qstoneCatalog, handleConfig, floorType, wallColor, showSocle, socleFinish, socleHeight } = kitchenState;
          
          const wallOrBaseCab = cabinets.find((c) => c.type !== 'island') || cabinets[0];
          const rawColor = wallOrBaseCab?.doorColor || wallOrBaseCab?.drawerFrontColor || wallOrBaseCab?.color || '';
          const colorName = getFriendlyColorName(rawColor);

          // Detección estricta de melamina y tono de madera
          const isLightWood = rawColor.includes('light-wood-grain') || 
                              rawColor.toLowerCase().includes('roble') || 
                              colorName.toLowerCase().includes('roble') || 
                              rawColor === '#D4A373' || 
                              rawColor === '#dfc7a5' || 
                              rawColor === '#d6ba94';

          const woodToneDetails = isLightWood
            ? 'Roble Nórdico Claro / Rubio Escandinavo (#dfc7a5 / #d6ba94). Tono arena cálido muy claro y luminoso, veta lineal sutil, CERO nudos negros, PROHIBIDO nogal oscuro o castaño rústico.'
            : `${colorName} (${rawColor})`;

          const islandCabinets = cabinets.filter((c) => c.type === 'island');
          const hasIsland = islandCabinets.length > 0;
          const islandCab = islandCabinets[0];
          const islandRawColor = islandCab?.drawerFrontColor || islandCab?.doorColor || islandCab?.color || rawColor;
          const islandColorName = getFriendlyColorName(islandRawColor);

          // Mapeo detallado por zonas (Aéreos, Bases, Torres, Isla, Decoración/Electrodomésticos)
          const wallCabinets = cabinets.filter((c) => c.type === 'wall');
          const baseCabinets = cabinets.filter((c) => c.type === 'base');
          const tallCabinets = cabinets.filter((c) => c.type === 'tall');
          const decoCabinets = cabinets.filter((c) => c.type === 'decoration');

          // Directiva dinámica para muebles aéreos superiores:
          const hasWallMicrowave = wallCabinets.some((c) => c.variant?.includes('micro'));
          const hasWallOpen = wallCabinets.some((c) => c.variant?.includes('open') || c.variant?.includes('shelves'));
          let wallNotes = '';
          if (wallCabinets.length > 0) {
            wallNotes = `MUEBLES AÉREOS SUPERIORES (${wallCabinets.length} módulos): Todos los módulos aéreos tienen puertas batientes o abatibles lisas de melamina con tiradores idénticos a la captura 3D.`;
            if (hasWallMicrowave) {
              wallNotes += ' Incluye un nicho abierto de microondas.';
            } else if (hasWallOpen) {
              wallNotes += ' Incluye repisas abiertas vistas según la captura 3D.';
            } else {
              wallNotes += ' TODAS las puertas son completamente opacas, lisas y cerradas. ESTRICTAMENTE PROHIBIDO inventar repisas abiertas, nichos de microondas, botelleros, cavas o puertas de vidrio en la corrida superior.';
            }
          }

          // Directiva dinámica para muebles bajos de mesón:
          const hasBaseWineRack = baseCabinets.some((c) => c.variant === 'base_wine_rack' || c.variant === 'wine_rack' || c.variant === 'spice_rack');
          const baseNotes = `MUEBLES BAJOS (${baseCabinets.length} módulos bajo mesón): Muebles base con puertas y cajoneras bajo la cubierta de mesón.${hasBaseWineRack ? ' El botellero angosto de vino está situado en la fila baja bajo la cubierta de piedra.' : ''} Mantener el número exacto de frentes y cajones horizontales vistos en el 3D.`;

          // Directiva para electrodomésticos independientes (ej. cocina de pie / refrigerador):
          const hasFreestandingStove = decoCabinets.some((c) => c.variant?.includes('stove') || c.variant?.includes('cocina'));
          const applianceNotes = hasFreestandingStove
            ? 'ELECTRODOMÉSTICO DE PIE: Cocina a gas independiente de 90cm en acero inoxidable con quemadores y perillas en la cubierta superior y puerta de horno de vidrio/inox, posicionada exactamente en su lugar entre los muebles base y la torre.'
            : '';

          // Directiva para torres altas:
          const hasOpenTower = tallCabinets.some((c) => c.variant === 'tall_terminal_shelves' || c.variant === 'tall_open');
          const hasBuiltInOven = tallCabinets.some((c) => c.variant?.includes('oven') || c.variant?.includes('micro'));
          const tallNotes = tallCabinets.length > 0
            ? `MUEBLES TORRE ALTOS (${tallCabinets.length} torre): Torre con hornos empotrados integrados (horno y microondas negros/inox), despensa alta con puertas${hasOpenTower ? ', y torre con repisas abiertas vistas SIN PUERTAS' : ''}.`
            : '';

          // Directiva estricta para la isla o ausencia total de isla:
          const islandNotes = hasIsland 
            ? `ISLA CENTRAL: Mueble isla rectangular con cajonera y puertas lisas al frente. Cubierta en voladizo simétrico limpio.${showSocle ? ' Lleva ZÓCALO CONTINUO CERRADO sellado al piso idéntico a los muebles de muro. TOTALMENTE PROHIBIDO poner patas negras visibles debajo del zócalo de la isla.' : ' Montada sobre patas individuales con luz al piso.'}`
            : 'PROHIBICIÓN ESTRICTA DE ISLA O PENÍNSULA: Este proyecto NO TIENE NINGUNA ISLA NI PENÍNSULA. El piso central y de primer plano es un espacio abierto 100% despejado. ESTRICTAMENTE PROHIBIDO DIBUJAR O AGREGAR CUALQUIER ISLA, PENÍNSULA O BARRA EN EL SUELO.';

          const moduleArchitecture = [
            wallNotes,
            baseNotes,
            applianceNotes,
            tallNotes,
            islandNotes
          ].filter(Boolean).join(' | ');

          // Cubierta
          const currentCountertopItem = qstoneCatalog?.find((item) => item.id === countertopConfig?.selectedProductId);
          const countertopDesc = currentCountertopItem
            ? `${currentCountertopItem.name} (${currentCountertopItem.finish}, tonalidad ${currentCountertopItem.colorHex})`
            : 'Piedra sintetizada Qstone gris azulado / piedra pulida';

          let floorDesc = 'Baldosas cerámicas blancas en cuadrícula cuadrada regular con fragüe gris';
          if (floorType && floorType.includes('parquet')) {
            floorDesc = 'Piso flotante / parquet de madera';
          } else if (floorType && floorType.includes('concreto')) {
            floorDesc = 'Piso de microcemento / concreto pulido';
          }

          const rawFinish = handleConfig?.finish as HandleFinish | undefined;
          const finishLabel = (rawFinish && FINISH_LABELS[rawFinish]) 
            ? FINISH_LABELS[rawFinish] 
            : (rawFinish === 'negro' || (rawFinish as any) === 'black' ? 'Negro Mate' : 'Negro Mate');
          
          const isGola = handleConfig?.model === 'none' || kitchenState.golaSystem !== 'none';
          const hardwareDesc = isGola
            ? 'Sistema Riel Gola integrado sin tiradores frontales'
            : `Tiradores tipo perfil/asa en acabado ${finishLabel} (color ${rawFinish === 'negro' || !rawFinish ? '#1c1917 negro mate puro' : finishLabel})`;

          const socleColorName = socleFinish === 'black' ? 'NEGRO MATE' : socleFinish === 'grey_satin' ? 'ALUMINIO GRIS SATINADO' : 'aluminio gris satinado';
          const socleDesc = showSocle
            ? `Zócalo inferior continuo y cerrado de ${socleHeight || 10} cm en acabado ${socleColorName}`
            : 'Sin zócalo cerrado: muebles montados sobre patas cilíndricas negras individuales con espacio de luz/aire libre al suelo';

          const socleDirective = showSocle
            ? `ZÓCALO CONTINUO CERRADO HERMÉTICO de ${socleHeight || 10} cm en acabado ${socleColorName} que sella completamente la base contra el suelo en todos los muebles inferiores.${hasIsland ? ' Aplica idéntico en los muebles de pared y en la isla.' : ''} ESTRICTAMENTE PROHIBIDO DIBUJAR PATAS NEGRAS, POSTES O SALIENTES METÁLICAS DEBAJO O POR FUERA DEL ZÓCALO. Toda la base es un zócalo sólido continuo sellado al piso.`
            : 'PATAS CILÍNDRICAS INDIVIDUALES NEGRAS con espacio abierto al suelo. NO colocar zócalo cerrado ni bajar paneles laterales al suelo.';

          bimManifest = {
            cabinetFronts: colorName,
            hasIsland,
            islandFronts: hasIsland ? islandColorName : null,
            woodToneDetails,
            moduleArchitecture,
            countertop: countertopDesc,
            flooring: floorDesc,
            wallFinish: `Pintura lisa mate color ${wallColor || '#f3f4f6'}`,
            hardware: hardwareDesc,
            socle: socleDesc,
            socleDirective,
          };
        }
      } catch (e) {
        console.warn('No se pudo extraer bimManifest de cocina:', e);
      }

      setProgressStatus('Aplicando motor de iluminación y materiales NanoBanana AI...');

      const response = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: canvasDataUrl,
          propertyType,
          environment,
          lighting,
          hasPeople,
          hasProps,
          bimManifest,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.imageUrl) {
        throw new Error(data.error || 'No se pudo generar la imagen fotográfica');
      }

      // Descontar crédito y registrar log
      deductNanoBananaCredit({
        userId: currentUser?.id || supabaseUser?.id,
        userEmail: currentUser?.email || supabaseUser?.email,
        userName: currentUser?.full_name || supabaseUser?.full_name,
        propertyType,
        environment,
        lighting,
        hasPeople,
        hasProps,
      });

      setResultImage(data.imageUrl);
    } catch (err: any) {
      console.error('Error al generar render con NanoBanana:', err);
      let rawMsg = String(err?.message || err || '');
      if (rawMsg.includes('429') || rawMsg.includes('Quota exceeded') || rawMsg.includes('RESOURCE_EXHAUSTED')) {
        rawMsg = 'Límite de cuota alcanzado (Error 429) para el modelo NanoBanana en la cuenta/API Key gratuita de Google GenAI. He desplegado el flujo de configuración de API Key de pago para que puedas seleccionar o activar un proyecto con facturación y continuar generando renders fotográficos.';
      } else if (rawMsg.startsWith('{')) {
        try {
          const parsed = JSON.parse(rawMsg);
          rawMsg = parsed.error?.message || parsed.error || rawMsg;
        } catch {
          // ignore
        }
      }
      setErrorMessage(rawMsg || 'Ocurrió un error al procesar el render fotográfico. Intenta nuevamente.');
    } finally {
      setIsGenerating(false);
      setProgressStatus('');
    }
  };

  const handleDownloadImage = () => {
    if (!resultImage) return;
    const a = document.createElement('a');
    a.href = resultImage;
    a.download = `render_nanobanana_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-4xl max-h-[92vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden transition-colors ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-zinc-900 border-white/10 text-white'
        }`}
      >
        {/* Header con Título y Estado de Créditos */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-black/40'}`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-orange-500 to-amber-500 text-white rounded-xl shadow-md shadow-orange-500/20">
              <Camera size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg tracking-tight">Render Fotográfico NanoBanana AI</h3>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  Fotorrealismo
                </span>
              </div>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Conserva la geometría y posición exacta de tus muebles ambientados con IA
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Badge de Créditos */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold ${
              isSuperAdmin
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : isFreeUser
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : credits > 0
                ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              <Zap size={14} className="fill-current" />
              <span>
                {isSuperAdmin
                  ? 'Créditos: Ilimitados (SuperAdmin)'
                  : isFreeUser
                  ? 'Plan Gratuito 🔒'
                  : `${credits} / 100 Créditos`}
              </span>
            </div>

            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isLight ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-white/10 text-slate-400'
              }`}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Si ya hay un resultado generado, mostrar el previsualizador */}
          {resultImage ? (
            <div className="space-y-4 animate-in zoom-in-95 duration-200">
              <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black group">
                <img src={resultImage} alt="Render Fotográfico NanoBanana" className="w-full h-auto max-h-[60vh] object-contain mx-auto" />
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    onClick={handleDownloadImage}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer"
                  >
                    <Download size={16} />
                    <span>Descargar Render HD</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border bg-orange-500/5 border-orange-500/20">
                <div className="flex items-center gap-2 text-xs font-semibold text-orange-400">
                  <CheckCircle2 size={16} />
                  <span>Render generado manteniendo intacta la cantidad y distribución de los muebles.</span>
                </div>
                <button
                  onClick={() => setResultImage(null)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800' : 'bg-white/10 hover:bg-white/20 border-white/10 text-white'
                  }`}
                >
                  Configurar Nuevo Render
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Columna Izquierda: Parámetros del Inmueble y Entorno */}
              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-orange-400 mb-2">
                    <Home size={14} />
                    <span>1. Tipo de Inmueble</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Casa Residencial', 'Departamento Urbano', 'Loft Moderno', 'Oficina / Comercial'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setPropertyType(type)}
                        className={`p-3 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                          propertyType === type
                            ? 'bg-orange-500/20 border-orange-500 text-orange-400 shadow-sm'
                            : isLight
                            ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                            : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-orange-400 mb-2">
                    <Sparkles size={14} />
                    <span>2. Vista Exterior (Ventanas / Entorno)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      'Interior (Muros Ciegos / Sin Ventanas)',
                      'Playa / Vista al Mar',
                      'Campo / Naturaleza Verde',
                      'Ciudad / Rascacielos',
                      'Jardín / Patio Residencial',
                      'Bosque / Montaña',
                    ].map((env) => (
                      <button
                        key={env}
                        onClick={() => setEnvironment(env)}
                        className={`p-3 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                          environment === env
                            ? 'bg-orange-500/20 border-orange-500 text-orange-400 shadow-sm'
                            : isLight
                            ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                            : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
                        }`}
                      >
                        {env}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Columna Derecha: Iluminación, Personas y Decoración de Vida */}
              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-orange-400 mb-2">
                    <Sun size={14} />
                    <span>3. Iluminación y Hora</span>
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      'Mañana Luminosa (Luz Natural Sol)',
                      'Atardecer Cálido (Golden Hour)',
                      'Iluminación de Estudio de Fotografía',
                      'Noche Cálida con Luces Led Ambientales',
                    ].map((light) => (
                      <button
                        key={light}
                        onClick={() => setLighting(light)}
                        className={`p-3 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                          lighting === light
                            ? 'bg-orange-500/20 border-orange-500 text-orange-400 shadow-sm'
                            : isLight
                            ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                            : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
                        }`}
                      >
                        {light}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-orange-400 mb-2">
                    <Users size={14} />
                    <span>4. Vida, Personas y Decoración (Staging)</span>
                  </label>

                  <div className="space-y-2">
                    <label
                      className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                        hasPeople
                          ? 'bg-orange-500/10 border-orange-500/40 text-orange-300'
                          : isLight
                          ? 'bg-slate-50 border-slate-200 text-slate-700'
                          : 'bg-white/5 border-white/10 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Users size={18} className="text-orange-400" />
                        <div>
                          <div className="text-xs font-bold">Personas Activas e Interacción Real</div>
                          <div className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            Personas cocinando, organizando prendas o habitando el espacio.
                          </div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={hasPeople}
                        onChange={(e) => setHasPeople(e.target.checked)}
                        className="w-4 h-4 accent-orange-500 cursor-pointer"
                      />
                    </label>

                    <label
                      className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                        hasProps
                          ? 'bg-orange-500/10 border-orange-500/40 text-orange-300'
                          : isLight
                          ? 'bg-slate-50 border-slate-200 text-slate-700'
                          : 'bg-white/5 border-white/10 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Utensils size={18} className="text-orange-400" />
                        <div>
                          <div className="text-xs font-bold">Utensilios, Electrodomésticos y Adornos</div>
                          <div className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            Ollas, jugueras, vajilla, plantas, ropa colgada y libros en cubiertas.
                          </div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={hasProps}
                        onChange={(e) => setHasProps(e.target.checked)}
                        className="w-4 h-4 accent-orange-500 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Banner Informativo sobre Protección Geométrica */}
          {!resultImage && (
            <div className={`p-4 rounded-xl border flex items-start gap-3 ${
              isLight ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}>
              <ShieldAlert size={18} className="shrink-0 mt-0.5 text-amber-500" />
              <div className="text-xs leading-relaxed">
                <span className="font-extrabold uppercase">Garantía Geométrica NanoBanana:</span>
                {' '}La inteligencia artificial mantendrá intacta la cantidad de muebles, módulos, aberturas y posiciones de la escena 3D. Únicamente aplicará texturas fotorrealistas, iluminación y ambientación.
              </div>
            </div>
          )}

          {/* Mensaje de Error */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-3 text-xs font-semibold">
              <AlertCircle size={18} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer con Botones de Acción */}
        {!resultImage && (
          <div className={`flex items-center justify-between px-6 py-4 border-t ${isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-black/40'}`}>
            <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {isFreeUser ? (
                <span className="text-amber-500 font-bold flex items-center gap-1">
                  <Lock size={12} /> Bloqueado para plan gratuito
                </span>
              ) : isSuperAdmin ? (
                <span>SuperAdmin: Renders ilimitados</span>
              ) : (
                <span>Consumo: 1 Crédito por render</span>
              )}
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg cursor-pointer ${
                isGenerating
                  ? 'bg-orange-500/50 text-black cursor-wait'
                  : isFreeUser
                  ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
                  : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black shadow-orange-500/20 active:scale-95'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{progressStatus || 'Generando Render AI...'}</span>
                </>
              ) : isFreeUser ? (
                <>
                  <Lock size={16} />
                  <span>Actualizar Plan para Desbloquear</span>
                </>
              ) : (
                <>
                  <Camera size={16} />
                  <span>Generar Render Fotográfico AI</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Modal de Upgrade para Usuarios Gratuitos */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-4 ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-zinc-900 border-white/10 text-white'
          }`}>
            <div className="flex items-center justify-between">
              <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl">
                <Lock size={24} />
              </div>
              <button onClick={() => setShowUpgradeModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div>
              <h4 className="font-extrabold text-lg">Módulo Exclusivo para Usuarios de Pago</h4>
              <p className={`text-xs mt-1 leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Los Renders Fotográficos NanoBanana AI están habilitados para clientes de pago con suscripción activa. Incluye 100 créditos para generar fotos de revista hiperrealistas.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs space-y-2">
              <div className="font-bold uppercase tracking-wider">Beneficios del Plan Pro / Empresa:</div>
              <ul className="list-disc list-inside space-y-1">
                <li>100 Renders Fotográficos con NanoBanana AI</li>
                <li>Ambientación en Casa, Departamento o Vista a la Playa</li>
                <li>Preservación exacta de muebles y medidas 3D</li>
                <li>Descarga de imágenes en alta definición HD</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-white/10 hover:bg-white/10"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  alert('Redirigiendo a pasarela de suscripción...');
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg cursor-pointer"
              >
                <CreditCard size={16} />
                <span>Suscribirse Ahora</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Recarga de Créditos cuando saldo es 0 */}
      {showRechargeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-4 ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-zinc-900 border-white/10 text-white'
          }`}>
            <div className="flex items-center justify-between">
              <div className="p-3 bg-red-500/20 text-red-400 rounded-xl">
                <AlertCircle size={24} />
              </div>
              <button onClick={() => setShowRechargeModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div>
              <h4 className="font-extrabold text-lg">Créditos Agotados (0 / 100)</h4>
              <p className={`text-xs mt-1 leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Has utilizado tus 100 créditos de renders fotográficos NanoBanana. Recarga un nuevo paquete de créditos para continuar generando renders ilimitados.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs">
              <span className="font-bold">Paquete de Recarga:</span> 100 Créditos Adicionales por $29.900 CLP.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRechargeModal(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-white/10 hover:bg-white/10"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  setShowRechargeModal(false);
                  alert('Redirigiendo a pasarela de pago para recarga de créditos...');
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg cursor-pointer"
              >
                <CreditCard size={16} />
                <span>Recargar Créditos</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
