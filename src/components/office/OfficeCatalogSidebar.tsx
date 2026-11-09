import React, { useState } from 'react';
import {
  Briefcase,
  Users,
  Presentation,
  Archive,
  Layers,
  Coffee,
  Armchair,
  Plus,
  Palette,
  Settings2,
  Trash2,
  Copy,
  RotateCw,
  Sparkles,
  Lock,
  Unlock,
  Move,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  useOfficeStore,
  OFFICE_CATALOG,
  MELAMINE_FINISHES,
  METAL_FINISHES,
  SCREEN_FABRICS,
  HANDLE_MODELS,
} from '../../store/officeStore';
import { OfficeFurnitureCategory } from '../../types/office';

export function OfficeCatalogSidebar() {
  const [activeSidebarTab, setActiveSidebarTab] = useState<'catalog' | 'inspector' | 'finishes'>('catalog');
  const activeCategory = useOfficeStore((state) => state.activeCategory);
  const selectedItemId = useOfficeStore((state) => state.selectedItemId);
  const placedItems = useOfficeStore((state) => state.placedItems);
  const addItem = useOfficeStore((state) => state.addItem);
  const duplicateItem = useOfficeStore((state) => state.duplicateItem);
  const removeItem = useOfficeStore((state) => state.removeItem);
  const rotateItem = useOfficeStore((state) => state.rotateItem);
  const updateItemDimensions = useOfficeStore((state) => state.updateItemDimensions);
  const updateItemFinishes = useOfficeStore((state) => state.updateItemFinishes);
  const toggleItemReturnSide = useOfficeStore((state) => state.toggleItemReturnSide);
  const toggleItemLock = useOfficeStore((state) => state.toggleItemLock);
  const updateItemPosition = useOfficeStore((state) => state.updateItemPosition);
  const moveItemDelta = useOfficeStore((state) => state.moveItemDelta);

  const defaultMelamine = useOfficeStore((state) => state.defaultMelamine);
  const setDefaultMelamine = useOfficeStore((state) => state.setDefaultMelamine);
  const defaultMetal = useOfficeStore((state) => state.defaultMetal);
  const setDefaultMetal = useOfficeStore((state) => state.setDefaultMetal);
  const defaultScreenFabric = useOfficeStore((state) => state.defaultScreenFabric);
  const setDefaultScreenFabric = useOfficeStore((state) => state.setDefaultScreenFabric);
  const defaultHandle = useOfficeStore((state) => state.defaultHandle);
  const setDefaultHandle = useOfficeStore((state) => state.setDefaultHandle);
  const applyGlobalFinishesToAll = useOfficeStore((state) => state.applyGlobalFinishesToAll);

  const selectedItem = placedItems.find((i) => i.id === selectedItemId);

  const categories: { id: OfficeFurnitureCategory; label: string; icon: any }[] = [
    { id: 'open-plan', label: 'Open Space & Bench', icon: Users },
    { id: 'executive', label: 'Privadas & Gerencia', icon: Briefcase },
    { id: 'meeting', label: 'Salas de Reunión', icon: Presentation },
    { id: 'storage', label: 'Almacenaje & Lockers', icon: Archive },
    { id: 'screens', label: 'Paneles & Biombos', icon: Layers },
    { id: 'cafeteria', label: 'Cafetería & Lounge', icon: Coffee },
    { id: 'chairs', label: 'Sillería Ergonómica', icon: Armchair },
  ];

  const filteredCatalog = OFFICE_CATALOG.filter((item) => item.category === activeCategory);

  return (
    <aside className="w-80 md:w-96 bg-zinc-900 border-r border-zinc-800 flex flex-col h-full shrink-0 select-none">
      {/* Top Tabs */}
      <div className="p-3 bg-zinc-950 border-b border-zinc-800 grid grid-cols-3 gap-1">
        <button
          onClick={() => setActiveSidebarTab('catalog')}
          className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeSidebarTab === 'catalog'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'text-slate-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Plus size={14} /> Catálogo
        </button>

        <button
          onClick={() => setActiveSidebarTab('inspector')}
          className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeSidebarTab === 'inspector'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'text-slate-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Settings2 size={14} /> Parámetros
          {selectedItem && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
        </button>

        <button
          onClick={() => setActiveSidebarTab('finishes')}
          className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeSidebarTab === 'finishes'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'text-slate-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Palette size={14} /> Materiales
        </button>
      </div>

      {/* Contenido según Tab */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* --- TAB 1: CATÁLOGO DE MUEBLES --- */}
        {activeSidebarTab === 'catalog' && (
          <div className="space-y-4">
            {/* Selector de Categorías */}
            <div className="grid grid-cols-2 gap-1.5">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => useOfficeStore.setState({ activeCategory: cat.id })}
                    className={`p-2.5 rounded-xl text-left flex items-center gap-2 transition-all cursor-pointer border ${
                      isActive
                        ? 'bg-orange-500/10 border-orange-500/50 text-orange-300 shadow-sm'
                        : 'bg-zinc-950/60 border-zinc-800 text-slate-400 hover:text-slate-200 hover:border-zinc-700'
                    }`}
                  >
                    <Icon size={16} className={isActive ? 'text-orange-400' : 'text-slate-500'} />
                    <span className="text-[11px] font-bold truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Lista de productos de la categoría */}
            <div className="space-y-3 pt-2">
              {filteredCatalog.map((item) => (
                <div
                  key={item.type}
                  className="bg-zinc-950/80 border border-zinc-800 hover:border-orange-500/50 rounded-2xl p-3.5 space-y-2.5 transition-all group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors">
                        {item.name}
                      </h4>
                      <p className="text-[10px] font-mono text-slate-400">{item.code}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-orange-500/10 text-orange-300 text-[10px] font-bold rounded-md border border-orange-500/20">
                      ${item.defaultPriceClp.toLocaleString('es-CL')}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-zinc-800/80">
                    <span>
                      {item.dimensionsCm.width} x {item.dimensionsCm.depth} x {item.dimensionsCm.height} cm
                    </span>
                    {item.capacityPeople > 0 && (
                      <span className="text-sky-400 font-semibold">{item.capacityPeople} personas</span>
                    )}
                  </div>

                  <button
                    onClick={() => addItem(item.type)}
                    className="w-full py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/10 transition-all cursor-pointer"
                  >
                    <Plus size={14} /> Insertar en Plano
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- TAB 2: INSPECTOR DE MUEBLE SELECCIONADO --- */}
        {activeSidebarTab === 'inspector' && (
          <div className="space-y-4">
            {selectedItem ? (
              <div className="space-y-4">
                <div className="bg-zinc-950 p-4 rounded-2xl border border-orange-500/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-orange-500/20 text-orange-300 text-[10px] font-bold uppercase tracking-wider rounded">
                      Seleccionado
                    </span>
                    <span className="text-xs font-mono font-bold text-white">
                      ${selectedItem.priceClp.toLocaleString('es-CL')} CLP
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{selectedItem.name}</h3>
                </div>

                {/* Acciones Rápidas */}
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => toggleItemLock(selectedItem.id)}
                    className={`p-2.5 border rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      selectedItem.isLocked
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                        : 'bg-zinc-950 hover:bg-zinc-800 border-zinc-800 text-slate-200'
                    }`}
                    title={selectedItem.isLocked ? 'Desbloquear mueble' : 'Fijar posición en el plano'}
                  >
                    {selectedItem.isLocked ? <Lock size={14} className="text-amber-400" /> : <Unlock size={14} />}
                    <span>{selectedItem.isLocked ? 'Fijado' : 'Fijar'}</span>
                  </button>

                  <button
                    onClick={() => rotateItem(selectedItem.id, Math.PI / 4)}
                    disabled={selectedItem.isLocked}
                    className="p-2.5 bg-zinc-950 hover:bg-zinc-800 disabled:opacity-40 border border-zinc-800 rounded-xl text-xs font-bold text-slate-200 flex flex-col items-center gap-1 transition-all cursor-pointer"
                  >
                    <RotateCw size={14} className="text-orange-400" />
                    <span>Rotar 45°</span>
                  </button>

                  <button
                    onClick={() => duplicateItem(selectedItem.id)}
                    className="p-2.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-bold text-slate-200 flex flex-col items-center gap-1 transition-all cursor-pointer"
                  >
                    <Copy size={14} className="text-sky-400" />
                    <span>Duplicar</span>
                  </button>

                  <button
                    onClick={() => removeItem(selectedItem.id)}
                    className="p-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-xs font-bold text-red-300 flex flex-col items-center gap-1 transition-all cursor-pointer"
                  >
                    <Trash2 size={14} />
                    <span>Eliminar</span>
                  </button>
                </div>

                {/* Control de Posición Métrica (X / Z) y Micro-Ajuste */}
                <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                      <Move size={12} className="text-orange-400" /> Coordenadas Métricas
                    </span>
                    {selectedItem.isLocked && (
                      <span className="text-[9px] font-bold text-amber-400">Bloqueado</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                      <span className="text-[10px] text-slate-400 block font-mono">Eje X (Ancho)</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <input
                          type="number"
                          step="0.05"
                          disabled={selectedItem.isLocked}
                          value={selectedItem.position[0]}
                          onChange={(e) =>
                            updateItemPosition(selectedItem.id, [
                              parseFloat(e.target.value) || 0,
                              0,
                              selectedItem.position[2],
                            ])
                          }
                          className="w-full bg-zinc-950 text-white font-mono font-bold px-2 py-1 rounded border border-zinc-700 disabled:opacity-40"
                        />
                        <span className="text-slate-400 font-mono text-[11px]">m</span>
                      </div>
                    </div>

                    <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                      <span className="text-[10px] text-slate-400 block font-mono">Eje Z (Profundidad)</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <input
                          type="number"
                          step="0.05"
                          disabled={selectedItem.isLocked}
                          value={selectedItem.position[2]}
                          onChange={(e) =>
                            updateItemPosition(selectedItem.id, [
                              selectedItem.position[0],
                              0,
                              parseFloat(e.target.value) || 0,
                            ])
                          }
                          className="w-full bg-zinc-950 text-white font-mono font-bold px-2 py-1 rounded border border-zinc-700 disabled:opacity-40"
                        />
                        <span className="text-slate-400 font-mono text-[11px]">m</span>
                      </div>
                    </div>
                  </div>

                  {/* Micro-desplazamiento en cruz */}
                  <div className="flex items-center justify-between pt-1 border-t border-zinc-900">
                    <span className="text-[10px] text-slate-400">Micro-paso (5 cm):</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveItemDelta(selectedItem.id, -0.05, 0)}
                        disabled={selectedItem.isLocked}
                        className="p-1.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-slate-300 rounded border border-zinc-800 cursor-pointer"
                        title="Izquierda 5cm"
                      >
                        <ChevronLeft size={12} />
                      </button>
                      <button
                        onClick={() => moveItemDelta(selectedItem.id, 0, -0.05)}
                        disabled={selectedItem.isLocked}
                        className="p-1.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-slate-300 rounded border border-zinc-800 cursor-pointer"
                        title="Arriba 5cm"
                      >
                        <ChevronUp size={12} />
                      </button>
                      <button
                        onClick={() => moveItemDelta(selectedItem.id, 0, 0.05)}
                        disabled={selectedItem.isLocked}
                        className="p-1.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-slate-300 rounded border border-zinc-800 cursor-pointer"
                        title="Abajo 5cm"
                      >
                        <ChevronDown size={12} />
                      </button>
                      <button
                        onClick={() => moveItemDelta(selectedItem.id, 0.05, 0)}
                        disabled={selectedItem.isLocked}
                        className="p-1.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-slate-300 rounded border border-zinc-800 cursor-pointer"
                        title="Derecha 5cm"
                      >
                        <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Ajuste de Retorno en L */}
                {(selectedItem.type === 'desk-executive-l' || selectedItem.type === 'desk-open-l') && (
                  <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-2">
                    <label className="block text-[10px] font-bold uppercase text-slate-400">
                      Mano del Retorno Lateral
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => toggleItemReturnSide(selectedItem.id)}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                          selectedItem.returnSide !== 'left'
                            ? 'bg-orange-500 text-white'
                            : 'bg-zinc-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        Retorno Derecho
                      </button>
                      <button
                        onClick={() => toggleItemReturnSide(selectedItem.id)}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                          selectedItem.returnSide === 'left'
                            ? 'bg-orange-500 text-white'
                            : 'bg-zinc-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        Retorno Izquierdo
                      </button>
                    </div>
                  </div>
                )}

                {/* Ajuste de Largo si es reescalable */}
                <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Largo de Cubierta</span>
                    <span className="font-mono text-orange-400 font-bold">{selectedItem.dimensionsCm.width} cm</span>
                  </div>
                  <input
                    type="range"
                    min="120"
                    max="300"
                    step="10"
                    value={selectedItem.dimensionsCm.width}
                    onChange={(e) =>
                      updateItemDimensions(selectedItem.id, { width: parseInt(e.target.value) })
                    }
                    className="w-full accent-orange-500"
                  />
                </div>

                {/* Acabados específicos según categoría */}
                {selectedItem.category === 'chairs' || selectedItem.type.startsWith('chair-') ? (
                  <>
                    {/* Tapiz / Malla / Monocasco para Sillas */}
                    <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-2">
                      <label className="block text-[10px] font-bold uppercase text-slate-400">
                        Tapiz / Malla Ergonómica / Monocasco
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {SCREEN_FABRICS.map((scr) => {
                          const isSelected = selectedItem.screenFinish === scr.id || selectedItem.chairFabricColor === scr.hex;
                          return (
                            <button
                              key={scr.id}
                              onClick={() => updateItemFinishes(selectedItem.id, { screen: scr.id, chairFabricColor: scr.hex })}
                              className={`p-2 rounded-xl text-left flex items-center gap-2 border transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-orange-500 bg-orange-500/10 text-white shadow-sm'
                                  : 'border-zinc-800 bg-zinc-900 text-slate-400 hover:border-zinc-700'
                              }`}
                            >
                              <span
                                className="w-4 h-4 rounded-full border border-black/20 shrink-0"
                                style={{ backgroundColor: scr.hex }}
                              />
                              <span className="text-[10px] font-bold truncate">{scr.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Estructura / Base / Patas Metálicas */}
                    <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-2">
                      <label className="block text-[10px] font-bold uppercase text-slate-400">
                        Base / Patas / Estructura Metálica
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {METAL_FINISHES.map((met) => (
                          <button
                            key={met.id}
                            onClick={() => updateItemFinishes(selectedItem.id, { metal: met.id })}
                            className={`p-2 rounded-xl text-left flex items-center gap-2 border transition-all cursor-pointer ${
                              selectedItem.metalFinish === met.id
                                ? 'border-orange-500 bg-orange-500/10 text-white'
                                : 'border-zinc-800 bg-zinc-900 text-slate-400 hover:border-zinc-700'
                            }`}
                          >
                            <span
                              className="w-4 h-4 rounded-full border border-black/20 shrink-0"
                              style={{ backgroundColor: met.hex }}
                            />
                            <span className="text-[10px] font-bold truncate">{met.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Acabado Melamina Individual */}
                    {selectedItem.type !== 'shelving-metal' && (
                      <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-2">
                        <label className="block text-[10px] font-bold uppercase text-slate-400">
                          {selectedItem.category === 'storage' ? 'Cuerpo & Frentes (Melamina)' : 'Acabado de Cubierta (MDP 24mm)'}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {MELAMINE_FINISHES.map((mel) => (
                            <button
                              key={mel.id}
                              onClick={() => updateItemFinishes(selectedItem.id, { melamine: mel.id })}
                              className={`p-2 rounded-xl text-left flex items-center gap-2 border transition-all cursor-pointer ${
                                selectedItem.melamineFinish === mel.id
                                  ? 'border-orange-500 bg-orange-500/10 text-white'
                                  : 'border-zinc-800 bg-zinc-900 text-slate-400 hover:border-zinc-700'
                              }`}
                            >
                              <span
                                className="w-4 h-4 rounded-full border border-black/20 shrink-0"
                                style={{ backgroundColor: mel.hex }}
                              />
                              <span className="text-[10px] font-bold truncate">{mel.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Acabado Estructura Metálica Individual */}
                    <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-2">
                      <label className="block text-[10px] font-bold uppercase text-slate-400">
                        {selectedItem.category === 'storage' ? 'Estructura / Zócalo' : 'Estructura Metálica 50x50mm'}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {METAL_FINISHES.map((met) => (
                          <button
                            key={met.id}
                            onClick={() => updateItemFinishes(selectedItem.id, { metal: met.id })}
                            className={`p-2 rounded-xl text-left flex items-center gap-2 border transition-all cursor-pointer ${
                              selectedItem.metalFinish === met.id
                                ? 'border-orange-500 bg-orange-500/10 text-white'
                                : 'border-zinc-800 bg-zinc-900 text-slate-400 hover:border-zinc-700'
                            }`}
                          >
                            <span
                              className="w-4 h-4 rounded-full border border-black/20 shrink-0"
                              style={{ backgroundColor: met.hex }}
                            />
                            <span className="text-[10px] font-bold truncate">{met.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Pantallas Acústicas si el mueble posee separadores */}
                    {(selectedItem.screenFinish || selectedItem.type.startsWith('bench-') || selectedItem.type === 'panel-divider') && (
                      <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-2">
                        <label className="block text-[10px] font-bold uppercase text-slate-400">
                          Tela / Tapiz Biombo Acústico
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {SCREEN_FABRICS.map((scr) => (
                            <button
                              key={scr.id}
                              onClick={() => updateItemFinishes(selectedItem.id, { screen: scr.id })}
                              className={`p-2 rounded-xl text-left flex items-center gap-2 border transition-all cursor-pointer ${
                                selectedItem.screenFinish === scr.id
                                  ? 'border-orange-500 bg-orange-500/10 text-white'
                                  : 'border-zinc-800 bg-zinc-900 text-slate-400 hover:border-zinc-700'
                              }`}
                            >
                              <span
                                className="w-4 h-4 rounded-full border border-black/20 shrink-0"
                                style={{ backgroundColor: scr.hex }}
                              />
                              <span className="text-[10px] font-bold truncate">{scr.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="p-8 text-center bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
                <Settings2 size={24} className="mx-auto text-slate-600" />
                <p className="text-xs font-bold text-slate-300">Ningún mueble seleccionado</p>
                <p className="text-[11px] text-slate-500">
                  Haz clic en un escritorio o mueble en la vista 2D o 3D para editar sus medidas y acabados.
                </p>
              </div>
            )}
          </div>
        )}

        {/* --- TAB 3: ACABADOS Y MATERIALES GLOBALES --- */}
        {activeSidebarTab === 'finishes' && (
          <div className="space-y-4">
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-400" />
                Paleta Global del Proyecto
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Define los materiales por defecto para nuevos puestos o aplícalos a todo el mobiliario.
              </p>
            </div>

            {/* Melamina Global */}
            <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-2">
              <label className="block text-[10px] font-bold uppercase text-slate-400">
                Cubiertas MDP 24mm (Predeterminado)
              </label>
              <div className="space-y-1.5">
                {MELAMINE_FINISHES.map((mel) => (
                  <button
                    key={mel.id}
                    onClick={() => setDefaultMelamine(mel.id)}
                    className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between border transition-all cursor-pointer ${
                      defaultMelamine === mel.id
                        ? 'border-orange-500 bg-orange-500/10 text-white'
                        : 'border-zinc-800 bg-zinc-900 text-slate-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-5 h-5 rounded-full border border-black/20 shrink-0 shadow-sm"
                        style={{ backgroundColor: mel.hex }}
                      />
                      <span className="text-xs font-bold">{mel.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{mel.code}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Metal Global */}
            <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-2">
              <label className="block text-[10px] font-bold uppercase text-slate-400">
                Pintura Electrostática Perfiles (50x50mm)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {METAL_FINISHES.map((met) => (
                  <button
                    key={met.id}
                    onClick={() => setDefaultMetal(met.id)}
                    className={`p-2.5 rounded-xl text-left flex items-center gap-2 border transition-all cursor-pointer ${
                      defaultMetal === met.id
                        ? 'border-orange-500 bg-orange-500/10 text-white'
                        : 'border-zinc-800 bg-zinc-900 text-slate-400 hover:border-zinc-700'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-black/20 shrink-0"
                      style={{ backgroundColor: met.hex }}
                    />
                    <span className="text-[11px] font-bold truncate">{met.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Pantallas Acústicas y Sillería Global */}
            <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-2">
              <label className="block text-[10px] font-bold uppercase text-slate-400">
                Tela / Tapiz Biombos Acústicos & Sillería
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SCREEN_FABRICS.map((scr) => (
                  <button
                    key={scr.id}
                    onClick={() => setDefaultScreenFabric(scr.id)}
                    className={`p-2 rounded-xl text-left flex items-center gap-2 border transition-all cursor-pointer ${
                      defaultScreenFabric === scr.id
                        ? 'border-orange-500 bg-orange-500/10 text-white'
                        : 'border-zinc-800 bg-zinc-900 text-slate-400 hover:border-zinc-700'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-black/20 shrink-0"
                      style={{ backgroundColor: scr.hex }}
                    />
                    <span className="text-[10px] font-bold truncate">{scr.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Botón Aplicar a Todo */}
            <button
              onClick={applyGlobalFinishesToAll}
              className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-orange-500/50 text-orange-400 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles size={15} /> Aplicar Acabados a Todo el Proyecto
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
