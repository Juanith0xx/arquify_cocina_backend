import React, { useState, useMemo, useEffect } from 'react';
import { 
  Home, 
  Layers, 
  Sparkles, 
  Building, 
  Wrench, 
  PackageCheck, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Info, 
  Paintbrush, 
  Ruler, 
  DollarSign,
  Maximize2,
  ChevronDown
} from 'lucide-react';
import { useKitchenStore, FloorZoneDecoration, WallDecorationItem } from '../../store/kitchenStore';
import { useAdminStore, SupplyItem } from '../../store/adminStore';
import { calculatePolygonArea, getWallLabel } from '../../utils/roomGeometry';
import { WALL_COLOR_OPTIONS } from '../../utils/kitchenMaterials';

interface DecorationSectionProps {
  theme?: 'dark' | 'light';
}

export function DecorationSection({ theme = 'dark' }: DecorationSectionProps) {
  const isLight = theme === 'light';
  const [activeSubTab, setActiveSubTab] = useState<
    'pisos' | 'muros' | 'cortinas' | 'ventanas' | 'puertas' | 'focos' | 'rodones' | 'marqueteria'
  >('muros');

  const {
    roomConfig,
    walls,
    architecturalElements,
    spaceDecoration,
    setSpaceDecoration,
    setWallDecoration,
    setFloorZoneDecoration,
    addFloorZone,
    removeFloorZone,
    activeDecoWallId,
    setActiveDecoWallId,
    setIsWallDecoTabOpen,
  } = useKitchenStore();

  const { supplies } = useAdminStore();

  // Total floor area in m2
  const totalFloorM2 = useMemo(() => {
    if (roomConfig?.vertices && roomConfig.vertices.length >= 3) {
      const areaCm2 = calculatePolygonArea(roomConfig.vertices);
      return Math.round((areaCm2 / 10000) * 100) / 100;
    }
    return 15.0; // fallback 15 m2
  }, [roomConfig]);

  // Effective walls list
  const effectiveWalls = useMemo(() => {
    if (walls && walls.length > 0) return walls;
    if (roomConfig?.vertices && roomConfig.vertices.length >= 3) {
      return roomConfig.vertices.map((v, i, arr) => {
        const next = arr[(i + 1) % arr.length];
        const dx = next.x - v.x;
        const dy = next.y - v.y;
        const lengthCm = Math.hypot(dx, dy);
        return {
          id: `wall_v_${i}`,
          start: [v.x, v.y] as [number, number],
          end: [next.x, next.y] as [number, number],
          thickness: roomConfig.wallThickness || 20,
          height: roomConfig.wallHeight || 240,
        };
      });
    }
    return [];
  }, [walls, roomConfig]);

  // Perimeter in meters
  const totalPerimeterM = useMemo(() => {
    return effectiveWalls.reduce((sum, w) => {
      const dx = w.end[0] - w.start[0];
      const dy = w.end[1] - w.start[1];
      return sum + Math.hypot(dx, dy) / 100;
    }, 0);
  }, [effectiveWalls]);

  // Selected Wall ID for Wall subtab
  const [selectedWallId, setSelectedWallId] = useState<string>(
    effectiveWalls[0]?.id || 'wall_v_0'
  );
  const [isWallSupplyDropdownOpen, setIsWallSupplyDropdownOpen] = useState<boolean>(false);

  // Sincronizar estado del menú Muros con el visor 3D para proyectar las letras A, B, C...
  useEffect(() => {
    if (activeSubTab === 'muros') {
      setIsWallDecoTabOpen(true);
      if (selectedWallId) {
        setActiveDecoWallId(selectedWallId);
      }
    } else {
      setIsWallDecoTabOpen(false);
      setActiveDecoWallId(null);
    }
    return () => {
      setIsWallDecoTabOpen(false);
      setActiveDecoWallId(null);
    };
  }, [activeSubTab, selectedWallId, setIsWallDecoTabOpen, setActiveDecoWallId]);

  // Si el usuario hace clic directamente en un muro o viñeta 3D, reflejar la selección en la botonera
  useEffect(() => {
    if (activeDecoWallId && activeDecoWallId !== selectedWallId) {
      const match = effectiveWalls.find((w) => w.id === activeDecoWallId);
      if (match) {
        setSelectedWallId(match.id);
      } else {
        const idNum = activeDecoWallId.match(/\d+/);
        if (idNum) {
          const idx = parseInt(idNum[0], 10);
          if (effectiveWalls[idx]) {
            setSelectedWallId(effectiveWalls[idx].id);
          }
        }
      }
    }
  }, [activeDecoWallId, selectedWallId, effectiveWalls]);

  // Selected wall details
  const currentWall = effectiveWalls.find((w) => w.id === selectedWallId) || effectiveWalls[0];

  // Calculate gross and net m2 for a wall (subtracting doors/windows on that wall)
  const getWallAreaM2 = (wallId: string) => {
    const w = effectiveWalls.find((item) => item.id === wallId);
    if (!w) return 0;
    const dx = w.end[0] - w.start[0];
    const dy = w.end[1] - w.start[1];
    const lengthM = Math.hypot(dx, dy) / 100;
    const heightM = (w.height || 240) / 100;
    let grossArea = lengthM * heightM;

    // Openings on this wall
    const wallArchs = (architecturalElements || []).filter((el) => el.wallId === wallId);
    let openingsArea = 0;
    wallArchs.forEach((el) => {
      const openM2 = ((el.width || 80) / 100) * ((el.height || 200) / 100);
      openingsArea += openM2;
    });

    return Math.max(0, Math.round((grossArea - openingsArea) * 100) / 100);
  };

  // Filter supplies by category
  const getCategorySupplies = (cat: string) => {
    return (supplies || []).filter((s) => s.category === cat);
  };

  // Filter wall supplies strictly by finishType (pintura | papel_mural | revestimiento)
  const isSupplyMatchingWallFinishType = (
    s: SupplyItem,
    finishType: 'pintura' | 'papel_mural' | 'revestimiento'
  ): boolean => {
    if (s.category !== 'muros') return false;

    const unitFormat = (s.unitFormat || '').toLowerCase();
    const name = (s.name || '').toLowerCase();
    const code = (s.code || '').toLowerCase();
    const spec = (s.spec || '').toLowerCase();
    const notes = (s.notes || '').toLowerCase();
    const combined = `${name} ${code} ${spec} ${notes}`;

    if (finishType === 'pintura') {
      if (unitFormat === 'tinaja' || unitFormat === 'galon') return true;
      if (
        combined.includes('pintura') ||
        combined.includes('esmalte') ||
        combined.includes('latex') ||
        combined.includes('látex') ||
        combined.includes('oleo') ||
        combined.includes('óleo') ||
        combined.includes('barniz')
      ) {
        return !combined.includes('papel');
      }
      return false;
    }

    if (finishType === 'papel_mural') {
      if (unitFormat === 'rollo') return true;
      if (
        combined.includes('papel') ||
        combined.includes('mural') ||
        combined.includes('vinílico') ||
        combined.includes('vinilico')
      ) {
        return !combined.includes('pintura') && !combined.includes('esmalte');
      }
      return false;
    }

    if (finishType === 'revestimiento') {
      const isPintura =
        unitFormat === 'tinaja' ||
        unitFormat === 'galon' ||
        combined.includes('pintura') ||
        combined.includes('esmalte') ||
        combined.includes('látex');
      const isPapel =
        unitFormat === 'rollo' ||
        combined.includes('papel mural') ||
        combined.includes('mural');

      if (
        combined.includes('revestimiento') ||
        combined.includes('siding') ||
        combined.includes('wpc') ||
        combined.includes('liston') ||
        combined.includes('listón') ||
        combined.includes('palmeta') ||
        combined.includes('panel') ||
        combined.includes('azulejo') ||
        combined.includes('mosaico') ||
        combined.includes('terrazzo')
      ) {
        return true;
      }
      return !isPintura && !isPapel;
    }

    return true;
  };

  // Obtener color hex o imagen de previsualización para el insumo de muro/pintura
  const getSupplyColorHex = (s: SupplyItem): string => {
    if (s.imageUrl && (s.imageUrl.startsWith('#') || s.imageUrl.startsWith('rgb'))) {
      return s.imageUrl;
    }
    const nameLower = (s.name || '').toLowerCase();
    const specLower = (s.spec || '').toLowerCase();
    const codeLower = (s.code || '').toLowerCase();
    const combined = `${nameLower} ${specLower} ${codeLower}`;

    if (combined.includes('izmir') || combined.includes('purple') || combined.includes('púrpura') || combined.includes('purpura') || combined.includes('violeta')) return '#3E3150';
    if (combined.includes('blanco') || combined.includes('nieve') || combined.includes('hueso') || combined.includes('marfil')) return '#FFFFFF';
    if (combined.includes('negro') || combined.includes('antracita') || combined.includes('grafito')) return '#2D3748';
    if (combined.includes('gris') || combined.includes('cemento') || combined.includes('perla')) return '#CBD5E1';
    if (combined.includes('azul') || combined.includes('marino') || combined.includes('nordic')) return '#2B3A4A';
    if (combined.includes('verde') || combined.includes('oliva') || combined.includes('salvia') || combined.includes('botánico') || combined.includes('botanico')) return '#9CAF88';
    if (combined.includes('rojo') || combined.includes('terracota') || combined.includes('barro')) return '#C88D6F';
    if (combined.includes('lino') || combined.includes('arena') || combined.includes('beige')) return '#E7DEC8';

    const match = WALL_COLOR_OPTIONS.find((opt) => combined.includes(opt.name.toLowerCase().split(' ')[0]));
    if (match) return match.hex;

    return '#94A3B8';
  };

  const menuItems = [
    { id: 'pisos', label: '1. Pisos', icon: Home },
    { id: 'muros', label: '2. Muros', icon: Layers },
    { id: 'cortinas', label: '3. Cortinas', icon: Home },
    { id: 'ventanas', label: '4. Ventanas', icon: Building },
    { id: 'puertas', label: '5. Puertas', icon: Home },
    { id: 'focos', label: '6. Focos', icon: Sparkles },
    { id: 'rodones', label: '7. Rodones/Burletes', icon: Wrench },
    { id: 'marqueteria', label: '8. Marquetería', icon: PackageCheck },
  ] as const;

  return (
    <div className={`flex flex-col h-full text-xs transition-colors ${
      isLight ? 'bg-white text-slate-800' : 'bg-slate-900/90 text-slate-200'
    }`}>
      {/* Sub-tab Navigation Bar */}
      <div className={`grid grid-cols-4 sm:grid-cols-4 gap-1 p-2 border-b shrink-0 ${
        isLight ? 'border-slate-200 bg-slate-100' : 'border-white/10 bg-black/50'
      }`}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSubTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSubTab(item.id as any)}
              className={`flex flex-col items-center justify-center p-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                isActive
                  ? 'bg-orange-500 text-black shadow-sm'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon size={13} className="mb-0.5" />
              <span className="truncate w-full text-center">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">

        {/* 1. PISOS (CON ZONIFICACIÓN) */}
        {activeSubTab === 'pisos' && (
          <div className="space-y-4">
            <div className={`p-3 rounded-xl border ${
              isLight ? 'bg-orange-50 border-orange-200 text-slate-800' : 'bg-orange-500/10 border-orange-500/30 text-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold uppercase tracking-wider text-[11px] text-orange-500 flex items-center gap-1.5">
                  <Maximize2 size={14} /> Área Total de Piso Espacial
                </span>
                <span className="font-mono font-extrabold text-sm text-orange-400">{totalFloorM2} m²</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Puedes dividir el suelo en zonas (ej: Zona Cocina y Zona Comedor) para aplicar acabados diferentes por sector.
              </p>
            </div>

            {/* List of Floor Zones */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[11px] uppercase tracking-wider text-slate-400">
                  Zonas de Piso ({spaceDecoration.floorZones.length})
                </span>
                <button
                  onClick={() => addFloorZone()}
                  className="px-2 py-1 bg-orange-500 hover:bg-orange-600 text-black font-extrabold rounded-md flex items-center gap-1 text-[10px] cursor-pointer shadow-sm"
                >
                  <Plus size={12} /> Agregar Zona
                </button>
              </div>

              {spaceDecoration.floorZones.map((zone, idx) => {
                const zoneM2 = Math.round(((totalFloorM2 * zone.areaPercentage) / 100) * 100) / 100;
                const selectedSupply = supplies.find((s) => s.id === zone.supplyId);
                const coverage = selectedSupply?.coveragePerUnitM2 || zone.coveragePerUnitM2 || 1.44;
                const requiredUnits = selectedSupply ? Math.ceil(zoneM2 / coverage) : 0;
                const totalCost = selectedSupply ? requiredUnits * selectedSupply.priceClp : 0;

                return (
                  <div
                    key={zone.id}
                    className={`p-3 rounded-xl border space-y-2.5 transition-colors ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={zone.name}
                        onChange={(e) => setFloorZoneDecoration(zone.id, { name: e.target.value })}
                        className={`font-bold text-xs bg-transparent border-b outline-none px-1 py-0.5 flex-1 ${
                          isLight ? 'border-slate-300 text-slate-900' : 'border-white/20 text-orange-400'
                        }`}
                      />
                      {spaceDecoration.floorZones.length > 1 && (
                        <button
                          onClick={() => removeFloorZone(zone.id)}
                          className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                          title="Eliminar Zona"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <span className="text-slate-400 block mb-1">Porcentaje de Superficie</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="range"
                            min="10"
                            max="100"
                            step="5"
                            value={zone.areaPercentage}
                            onChange={(e) =>
                              setFloorZoneDecoration(zone.id, { areaPercentage: Number(e.target.value) })
                            }
                            className="flex-1 accent-orange-500"
                          />
                          <span className="font-mono font-bold text-orange-400 w-10 text-right">
                            {zone.areaPercentage}%
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block mb-1">Superficie Neta</span>
                        <span className="font-mono font-bold text-slate-200 text-xs">{zoneM2} m²</span>
                      </div>
                    </div>

                    {/* Selector de Insumo de Piso */}
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold block mb-1">Material / Piso Proveedor</label>
                      <select
                        value={zone.supplyId || ''}
                        onChange={(e) => {
                          const s = supplies.find((sup) => sup.id === e.target.value);
                          setFloorZoneDecoration(zone.id, {
                            supplyId: s?.id,
                            supplyName: s?.name,
                            priceClp: s?.priceClp,
                            unitFormat: s?.unitFormat || 'caja',
                            coveragePerUnitM2: s?.coveragePerUnitM2 || 1.44,
                          });
                        }}
                        className={`w-full p-2 rounded-lg text-xs font-semibold border outline-none ${
                          isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-white/10 text-slate-100'
                        }`}
                      >
                        <option value="">-- Seleccionar Piso --</option>
                        {getCategorySupplies('pisos').map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} - ${s.priceClp.toLocaleString('es-CL')}/{s.unitFormat || 'caja'} ({s.coveragePerUnitM2 || 1.44}m²)
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedSupply && (
                      <div className={`p-2 rounded-lg text-[10px] flex justify-between items-center ${
                        isLight ? 'bg-orange-100/70 text-slate-800' : 'bg-orange-500/20 text-orange-300'
                      }`}>
                        <div className="flex items-center gap-2">
                          {selectedSupply.imageUrl && (
                            selectedSupply.imageUrl.startsWith('#') ? (
                              <div
                                className="w-6 h-6 rounded-md shrink-0 border border-white/20"
                                style={{ backgroundColor: selectedSupply.imageUrl }}
                              />
                            ) : (
                              <img
                                src={selectedSupply.imageUrl}
                                alt={selectedSupply.name}
                                className="w-6 h-6 rounded-md object-cover shrink-0 border border-white/20"
                              />
                            )
                          )}
                          <div>
                            <span className="font-bold">{requiredUnits} {selectedSupply.unitFormat || 'cajas'}</span> ({coverage} m²/{selectedSupply.unitFormat || 'caja'})
                          </div>
                        </div>
                        <div className="font-mono font-extrabold text-xs">
                          ${totalCost.toLocaleString('es-CL')} CLP
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. MUROS (SELECCIÓN MURO POR MURO & FINISH TYPE) */}
        {activeSubTab === 'muros' && (
          <div className="space-y-4">
            {/* Selector de Muro Activo */}
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">
                Seleccionar Muro del Espacio ({effectiveWalls.length} Muros)
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                {effectiveWalls.map((w, index) => {
                  const isSelected = w.id === selectedWallId;
                  const wallM2 = getWallAreaM2(w.id);
                  const wallDeco = spaceDecoration.wallDecorations[w.id];

                  const wallLabel = getWallLabel(index);
                  return (
                    <button
                      key={w.id}
                      onClick={() => {
                        setSelectedWallId(w.id);
                        setActiveDecoWallId(w.id);
                      }}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-orange-500 text-black border-orange-400 font-black shadow-md'
                          : isLight
                          ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1.5 mb-0.5">
                        <span className="font-bold text-xs">Muro {index + 1}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-black ${
                          isSelected ? 'bg-black text-white' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                        }`}>
                          {wallLabel}
                        </span>
                      </div>
                      <span className="block text-[9px] opacity-80 font-mono">{wallM2} m²</span>
                      {wallDeco?.supplyId && (
                        <span className={`block text-[8px] uppercase tracking-tight font-bold truncate mt-0.5 ${
                          isSelected ? 'text-black/80 font-black' : 'text-emerald-400'
                        }`}>
                          ✓ Con Acabado
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Configuración del Muro Seleccionado */}
            {currentWall && (
              <div className={`p-3.5 rounded-2xl border space-y-3 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
              }`}>
                <div className="flex justify-between items-center pb-2 border-b border-white/10">
                  <div>
                    {(() => {
                      const curIdx = effectiveWalls.findIndex((w) => w.id === selectedWallId);
                      const curLabel = curIdx >= 0 ? getWallLabel(curIdx) : 'A';
                      return (
                        <h4 className="font-bold text-xs uppercase text-orange-400 flex items-center gap-1.5">
                          <span>Muro Seleccionado: Muro {curIdx >= 0 ? curIdx + 1 : 1}</span>
                          <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-black">
                            {curLabel}
                          </span>
                        </h4>
                      );
                    })()}
                    <span className="text-[10px] text-slate-400 font-mono">
                      Superficie Neta: {getWallAreaM2(selectedWallId)} m² (descontados vanos)
                    </span>
                  </div>
                  <Ruler size={16} className="text-orange-400" />
                </div>

                {/* Tipo de Acabado de Muro */}
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">
                    Tipo de Decoración de Muro
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'pintura', label: 'Pintura (Tinaja)' },
                      { id: 'papel_mural', label: 'Papel Mural (Rollo)' },
                      { id: 'revestimiento', label: 'Revestimiento' },
                    ].map((type) => {
                      const wallDeco = spaceDecoration.wallDecorations[selectedWallId];
                      const activeType = wallDeco?.finishType || 'pintura';
                      const isAct = activeType === type.id;

                      return (
                        <button
                          key={type.id}
                          onClick={() => {
                            const isSameType = activeType === type.id;
                            if (!isSameType) {
                              const currentSupply = supplies.find((s) => s.id === wallDeco?.supplyId);
                              const isMatching = currentSupply
                                ? isSupplyMatchingWallFinishType(currentSupply, type.id as any)
                                : false;

                              setWallDecoration(selectedWallId, {
                                ...wallDeco,
                                wallId: selectedWallId,
                                finishType: type.id as any,
                                ...(isMatching
                                  ? {}
                                  : {
                                      supplyId: undefined,
                                      supplyName: undefined,
                                      priceClp: undefined,
                                      unitFormat: undefined,
                                      coveragePerUnitM2: undefined,
                                      imageUrl: undefined,
                                    }),
                              });
                            }
                          }}
                          className={`p-2 rounded-lg border text-[10px] font-bold text-center cursor-pointer transition-all ${
                            isAct
                              ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                              : isLight
                              ? 'bg-white border-slate-300 text-slate-700'
                              : 'bg-black/30 border-white/10 text-slate-400'
                          }`}
                        >
                          {type.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selector de Insumo de Muro con Cuadraditos de Color al Inicio */}
                {(() => {
                  const wallDeco = spaceDecoration.wallDecorations[selectedWallId];
                  const activeType = wallDeco?.finishType || 'pintura';
                  const filteredWallSupplies = (supplies || []).filter((s) =>
                    isSupplyMatchingWallFinishType(s, activeType)
                  );
                  const selectedSupply = supplies.find((s) => s.id === wallDeco?.supplyId);

                  const placeholderLabel =
                    activeType === 'pintura'
                      ? '-- Seleccionar Pintura / Esmalte --'
                      : activeType === 'papel_mural'
                      ? '-- Seleccionar Papel Mural --'
                      : '-- Seleccionar Revestimiento --';

                  return (
                    <div className="relative">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] text-slate-400 font-bold block">
                          Insumo / Marca del Proveedor
                        </label>
                        <span className="text-[9px] font-mono text-orange-400 font-bold">
                          {filteredWallSupplies.length} disponible{filteredWallSupplies.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Botón Principal Desplegable */}
                      <button
                        type="button"
                        onClick={() => setIsWallSupplyDropdownOpen(!isWallSupplyDropdownOpen)}
                        className={`w-full p-2.5 rounded-xl text-xs font-semibold border flex items-center justify-between gap-2 transition-all cursor-pointer shadow-sm ${
                          isLight
                            ? 'bg-white border-slate-300 text-slate-900 hover:border-orange-500'
                            : 'bg-slate-800/90 border-white/15 text-slate-100 hover:border-orange-500/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {selectedSupply ? (
                            <>
                              {selectedSupply.imageUrl && !selectedSupply.imageUrl.startsWith('#') && !selectedSupply.imageUrl.startsWith('rgb') ? (
                                <img
                                  src={selectedSupply.imageUrl}
                                  alt={selectedSupply.name}
                                  className="w-4.5 h-4.5 rounded-md object-cover shrink-0 border border-black/30 shadow-sm"
                                />
                              ) : (
                                <span
                                  className="w-4.5 h-4.5 rounded-md shrink-0 border border-black/40 shadow-sm flex-none"
                                  style={{ backgroundColor: getSupplyColorHex(selectedSupply) }}
                                  title={`Color: ${getSupplyColorHex(selectedSupply)}`}
                                />
                              )}
                              <span className="truncate font-bold text-xs">{selectedSupply.name}</span>
                            </>
                          ) : (
                            <span className="text-slate-400 text-xs italic">{placeholderLabel}</span>
                          )}
                        </div>
                        <ChevronDown size={14} className={`shrink-0 transition-transform ${isWallSupplyDropdownOpen ? 'rotate-180 text-orange-400' : 'text-slate-400'}`} />
                      </button>

                      {/* Lista Desplegable flotante con Cuadraditos de Color al Inicio */}
                      {isWallSupplyDropdownOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsWallSupplyDropdownOpen(false)}
                          />
                          <div className={`absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border p-1.5 shadow-2xl max-h-60 overflow-y-auto custom-scrollbar space-y-1 ${
                            isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-orange-500/40 text-slate-100'
                          }`}>
                            <button
                              type="button"
                              onClick={() => {
                                const currentDeco = spaceDecoration.wallDecorations[selectedWallId] || { wallId: selectedWallId };
                                setWallDecoration(selectedWallId, {
                                  ...currentDeco,
                                  wallId: selectedWallId,
                                  finishType: activeType,
                                  supplyId: undefined,
                                  supplyName: undefined,
                                  priceClp: undefined,
                                  unitFormat: undefined,
                                  coveragePerUnitM2: undefined,
                                  imageUrl: undefined,
                                });
                                setIsWallSupplyDropdownOpen(false);
                              }}
                              className={`w-full text-left p-2 rounded-lg text-[11px] font-bold text-slate-400 hover:bg-slate-500/10 transition-colors cursor-pointer`}
                            >
                              {placeholderLabel}
                            </button>

                            {filteredWallSupplies.map((s) => {
                              const isSelected = spaceDecoration.wallDecorations[selectedWallId]?.supplyId === s.id;
                              const colorHex = getSupplyColorHex(s);
                              const hasImage = s.imageUrl && !s.imageUrl.startsWith('#') && !s.imageUrl.startsWith('rgb');

                              return (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => {
                                    const currentDeco = spaceDecoration.wallDecorations[selectedWallId] || { wallId: selectedWallId };
                                    setWallDecoration(selectedWallId, {
                                      ...currentDeco,
                                      wallId: selectedWallId,
                                      finishType: activeType,
                                      supplyId: s.id,
                                      supplyName: s.name,
                                      priceClp: s.priceClp,
                                      unitFormat: s.unitFormat || (activeType === 'pintura' ? 'galon' : activeType === 'papel_mural' ? 'rollo' : 'unidad'),
                                      coveragePerUnitM2: s.coveragePerUnitM2 || 10,
                                      imageUrl: s.imageUrl,
                                    });
                                    setIsWallSupplyDropdownOpen(false);
                                  }}
                                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-orange-500 text-black font-extrabold shadow-sm'
                                      : isLight
                                      ? 'hover:bg-slate-100 text-slate-800 font-semibold'
                                      : 'hover:bg-white/10 text-slate-200 font-semibold'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    {/* Cuadradito de color al principio del nombre */}
                                    {hasImage ? (
                                      <img
                                        src={s.imageUrl}
                                        alt={s.name}
                                        className="w-4.5 h-4.5 rounded-md object-cover shrink-0 border border-black/30 shadow-sm"
                                      />
                                    ) : (
                                      <span
                                        className="w-4.5 h-4.5 rounded-md shrink-0 border border-black/40 shadow-sm flex-none"
                                        style={{ backgroundColor: colorHex }}
                                        title={`Color: ${colorHex}`}
                                      />
                                    )}
                                    <span className="truncate font-bold">{s.name}</span>
                                  </div>
                                  <span className={`text-[10px] font-mono shrink-0 ml-2 ${isSelected ? 'text-black/80 font-black' : 'text-orange-400 font-extrabold'}`}>
                                    ${s.priceClp.toLocaleString('es-CL')}/{s.unitFormat || 'unid'}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}

                      {filteredWallSupplies.length === 0 && (
                        <p className="text-[10px] text-amber-500/90 italic mt-1.5 leading-tight">
                          No hay insumos de tipo {activeType === 'pintura' ? 'pintura' : activeType === 'papel_mural' ? 'papel mural' : 'revestimiento'} registrados en el catálogo de insumos.
                        </p>
                      )}
                    </div>
                  );
                })()}

                {/* Resumen del Muro Actual */}
                {(() => {
                  const deco = spaceDecoration.wallDecorations[selectedWallId];
                  const sup = supplies.find((s) => s.id === deco?.supplyId);
                  if (!sup) return null;

                  const wallM2 = getWallAreaM2(selectedWallId);
                  const coverage = sup.coveragePerUnitM2 || 10;
                  const reqQty = Math.ceil(wallM2 / coverage);
                  const totalWallPrice = reqQty * sup.priceClp;

                  return (
                    <div className={`p-2.5 rounded-xl border flex justify-between items-center text-xs ${
                      isLight ? 'bg-orange-100/70 border-orange-200 text-slate-900' : 'bg-orange-500/20 border-orange-500/40 text-orange-200'
                    }`}>
                      <div className="flex items-center gap-2.5">
                        {sup.imageUrl && (
                          sup.imageUrl.startsWith('#') ? (
                            <div
                              className="w-7 h-7 rounded-lg shrink-0 border border-white/20 shadow-sm"
                              style={{ backgroundColor: sup.imageUrl }}
                              title={`Color: ${sup.imageUrl}`}
                            />
                          ) : (
                            <img
                              src={sup.imageUrl}
                              alt={sup.name}
                              className="w-7 h-7 rounded-lg object-cover shrink-0 border border-white/20 shadow-sm"
                            />
                          )
                        )}
                        <div>
                          <span className="font-bold block">{sup.name}</span>
                          <span className="text-[10px] opacity-80">
                            Se necesitan {reqQty} {sup.unitFormat || 'unidades'} para {wallM2} m²
                          </span>
                        </div>
                      </div>
                      <div className="font-mono font-extrabold text-sm text-right shrink-0">
                        ${totalWallPrice.toLocaleString('es-CL')} CLP
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* 3. CORTINAS */}
        {activeSubTab === 'cortinas' && (
          <div className="space-y-3">
            <label className="text-[10px] text-slate-400 font-bold block">Insumo de Cortinas</label>
            <select
              value={spaceDecoration.cortinasSupplyId || ''}
              onChange={(e) => setSpaceDecoration({ cortinasSupplyId: e.target.value })}
              className={`w-full p-2.5 rounded-xl text-xs font-semibold border outline-none ${
                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-white/10 text-slate-100'
              }`}
            >
              <option value="">-- Seleccionar Cortina --</option>
              {getCategorySupplies('cortinas').map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} - ${s.priceClp.toLocaleString('es-CL')}/Unid.
                </option>
              ))}
            </select>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Cantidad de Ventanales / Cortinas</span>
              <input
                type="number"
                min="1"
                max="20"
                value={spaceDecoration.cortinasCount || 1}
                onChange={(e) => setSpaceDecoration({ cortinasCount: Math.max(1, Number(e.target.value)) })}
                className={`w-20 p-1.5 rounded-lg border text-center font-bold font-mono outline-none ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-white/20 text-orange-400'
                }`}
              />
            </div>
          </div>
        )}

        {/* 4. VENTANAS */}
        {activeSubTab === 'ventanas' && (
          <div className="space-y-3">
            <label className="text-[10px] text-slate-400 font-bold block">Modelo de Ventana / Termopanel</label>
            <select
              value={spaceDecoration.ventanasSupplyId || ''}
              onChange={(e) => setSpaceDecoration({ ventanasSupplyId: e.target.value })}
              className={`w-full p-2.5 rounded-xl text-xs font-semibold border outline-none ${
                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-white/10 text-slate-100'
              }`}
            >
              <option value="">-- Seleccionar Ventana --</option>
              {getCategorySupplies('ventanas').map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} - ${s.priceClp.toLocaleString('es-CL')}/Unid.
                </option>
              ))}
            </select>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Cantidad de Ventanas</span>
              <input
                type="number"
                min="1"
                max="20"
                value={spaceDecoration.ventanasCount || 1}
                onChange={(e) => setSpaceDecoration({ ventanasCount: Math.max(1, Number(e.target.value)) })}
                className={`w-20 p-1.5 rounded-lg border text-center font-bold font-mono outline-none ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-white/20 text-orange-400'
                }`}
              />
            </div>
          </div>
        )}

        {/* 5. PUERTAS */}
        {activeSubTab === 'puertas' && (
          <div className="space-y-3">
            <label className="text-[10px] text-slate-400 font-bold block">Modelo de Puerta Interior</label>
            <select
              value={spaceDecoration.puertasSupplyId || ''}
              onChange={(e) => setSpaceDecoration({ puertasSupplyId: e.target.value })}
              className={`w-full p-2.5 rounded-xl text-xs font-semibold border outline-none ${
                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-white/10 text-slate-100'
              }`}
            >
              <option value="">-- Seleccionar Puerta --</option>
              {getCategorySupplies('puertas').map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} - ${s.priceClp.toLocaleString('es-CL')}/Unid.
                </option>
              ))}
            </select>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Cantidad de Puertas</span>
              <input
                type="number"
                min="1"
                max="10"
                value={spaceDecoration.puertasCount || 1}
                onChange={(e) => setSpaceDecoration({ puertasCount: Math.max(1, Number(e.target.value)) })}
                className={`w-20 p-1.5 rounded-lg border text-center font-bold font-mono outline-none ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-white/20 text-orange-400'
                }`}
              />
            </div>
          </div>
        )}

        {/* 6. FOCOS */}
        {activeSubTab === 'focos' && (
          <div className="space-y-3">
            <label className="text-[10px] text-slate-400 font-bold block">Focos LED / Spots de Cielo</label>
            <select
              value={spaceDecoration.focosSupplyId || ''}
              onChange={(e) => setSpaceDecoration({ focosSupplyId: e.target.value })}
              className={`w-full p-2.5 rounded-xl text-xs font-semibold border outline-none ${
                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-white/10 text-slate-100'
              }`}
            >
              <option value="">-- Seleccionar Foco / Iluminación --</option>
              {getCategorySupplies('focos').map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} - ${s.priceClp.toLocaleString('es-CL')}
                </option>
              ))}
            </select>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Cantidad de Focos / Packs</span>
              <input
                type="number"
                min="1"
                max="50"
                value={spaceDecoration.focosCount || 4}
                onChange={(e) => setSpaceDecoration({ focosCount: Math.max(1, Number(e.target.value)) })}
                className={`w-20 p-1.5 rounded-lg border text-center font-bold font-mono outline-none ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-white/20 text-orange-400'
                }`}
              />
            </div>
          </div>
        )}

        {/* 7. RODONES O BURLETES */}
        {activeSubTab === 'rodones' && (
          <div className="space-y-3">
            <div className={`p-2.5 rounded-xl border flex justify-between items-center text-xs ${
              isLight ? 'bg-slate-100 border-slate-300' : 'bg-white/5 border-white/10'
            }`}>
              <span className="text-slate-400">Perímetro Total del Espacio</span>
              <span className="font-mono font-bold text-orange-400">{totalPerimeterM.toFixed(1)} Metros Lineales</span>
            </div>

            <label className="text-[10px] text-slate-400 font-bold block">Insumo de Rodón / Guardapolvo</label>
            <select
              value={spaceDecoration.rodonesSupplyId || ''}
              onChange={(e) => setSpaceDecoration({ rodonesSupplyId: e.target.value })}
              className={`w-full p-2.5 rounded-xl text-xs font-semibold border outline-none ${
                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-white/10 text-slate-100'
              }`}
            >
              <option value="">-- Seleccionar Rodón / Burlete --</option>
              {getCategorySupplies('rodones_burletes').map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} - ${s.priceClp.toLocaleString('es-CL')}/m
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 8. MARQUETERÍA DE MUROS Y CIELO */}
        {activeSubTab === 'marqueteria' && (
          <div className="space-y-3">
            <div className={`p-2.5 rounded-xl border flex justify-between items-center text-xs ${
              isLight ? 'bg-slate-100 border-slate-300' : 'bg-white/5 border-white/10'
            }`}>
              <span className="text-slate-400">Perímetro de Cielo</span>
              <span className="font-mono font-bold text-orange-400">{totalPerimeterM.toFixed(1)} Metros Lineales</span>
            </div>

            <label className="text-[10px] text-slate-400 font-bold block">Moldura / Cornisa de Cielo</label>
            <select
              value={spaceDecoration.marqueteriaSupplyId || ''}
              onChange={(e) => setSpaceDecoration({ marqueteriaSupplyId: e.target.value })}
              className={`w-full p-2.5 rounded-xl text-xs font-semibold border outline-none ${
                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-white/10 text-slate-100'
              }`}
            >
              <option value="">-- Seleccionar Moldura / Marquetería --</option>
              {getCategorySupplies('marqueteria').map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} - ${s.priceClp.toLocaleString('es-CL')}/m
                </option>
              ))}
            </select>
          </div>
        )}

      </div>
    </div>
  );
}
