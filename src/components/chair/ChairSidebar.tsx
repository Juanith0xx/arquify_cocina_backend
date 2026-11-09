import React, { useState, useRef } from 'react';
import {
  useChairStore,
  CHAIR_LEGS_COLORS,
  ABET_LAMINATI_CATALOG,
  ChairLegsColor,
  CHAIR_FIXED_DIMENSIONS,
} from '../../store/chairStore';
import { useAdminStore } from '../../store/adminStore';
import {
  Palette,
  Check,
  Upload,
  Layers,
  FileSpreadsheet,
  FileText,
  Lock,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { exportChairExcel } from '../../utils/chairExcelGenerator';
import { exportChairPDF } from '../../utils/chairPdfGenerator';

export function ChairSidebar() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'materials' | 'specs'>('materials');

  const frameStyle = useChairStore((state) => state.frameStyle || 'classic_4legs');
  const setFrameStyle = useChairStore((state) => state.setFrameStyle);

  const legsColor = useChairStore((state) => state.legsColor);
  const setLegsColor = useChairStore((state) => state.setLegsColor);

  const seatLaminateId = useChairStore((state) => state.seatLaminateId);
  const setSeatLaminateId = useChairStore((state) => state.setSeatLaminateId);

  const backrestSameBothSides = useChairStore((state) => state.backrestSameBothSides);
  const setBackrestSameBothSides = useChairStore((state) => state.setBackrestSameBothSides);
  const backrestFrontLaminateId = useChairStore((state) => state.backrestFrontLaminateId);
  const setBackrestFrontLaminateId = useChairStore((state) => state.setBackrestFrontLaminateId);
  const backrestRearLaminateId = useChairStore((state) => state.backrestRearLaminateId);
  const setBackrestRearLaminateId = useChairStore((state) => state.setBackrestRearLaminateId);

  const chairQuantity = useChairStore((state) => state.chairQuantity);
  const setChairQuantity = useChairStore((state) => state.setChairQuantity);

  const customTextures = useChairStore((state) => state.customTextures);
  const addCustomTexture = useChairStore((state) => state.addCustomTexture);
  const removeCustomTexture = useChairStore((state) => state.removeCustomTexture);

  const customObjName = useChairStore((state) => state.customObjName);
  const setCustomObjText = useChairStore((state) => state.setCustomObjText);
  const objInputRef = useRef<HTMLInputElement>(null);

  const adminTextures = useAdminStore((state) => state.textures || []);

  const fullState = useChairStore();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        const newTexture = {
          id: `custom_${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
          dataUrl,
          createdAt: Date.now(),
        };
        addCustomTexture(newTexture);
        setSeatLaminateId(newTexture.id);
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleObjUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setCustomObjText(text, file.name);
      }
    };
    reader.readAsText(file);
    if (objInputRef.current) objInputRef.current.value = '';
  };

  const legsColorList: ChairLegsColor[] = ['blanco', 'verde_manzana', 'terracota', 'azul_petroleo'];

  return (
    <aside className="w-full lg:w-96 bg-[#111318] border-t lg:border-t-0 lg:border-l border-zinc-800 flex flex-col flex-1 lg:flex-none min-h-0 h-auto lg:h-full text-slate-200 select-none shadow-2xl z-30">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-zinc-800/80 bg-[#161922] flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
            Configurador de Silla
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Abet Laminati (130 × 305 cm) & Fierro Esmaltado
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('materials')}
            className={`px-3 py-1 rounded-lg transition-all ${
              activeTab === 'materials'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Diseño
          </button>
          <button
            onClick={() => setActiveTab('specs')}
            className={`px-3 py-1 rounded-lg transition-all ${
              activeTab === 'specs'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Ficha
          </button>
        </div>
      </div>

      {/* Main Content Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar text-xs">
        {activeTab === 'materials' ? (
          <>
            {/* ========================================================= */}
            {/* 0. MODELO / ESTRUCTURA DE FIERRO                          */}
            {/* ========================================================= */}
            <section className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2.5">
                <span className="font-bold uppercase tracking-wider text-white flex items-center gap-2 text-xs">
                  <Layers size={14} className="text-orange-400" />
                  Estructura & Chasis Tubular
                </span>
                <span className="text-[10px] text-orange-400 font-mono">Ø 22.2 × 1.5 mm</span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {[
                  {
                    id: 'classic_4legs' as const,
                    name: 'Clásica 4 Patas Tubular Continua',
                    desc: 'Doble curvatura de respaldo en montantes y 4 patas abiertas con regatones',
                  },
                  {
                    id: 'stackable_contract' as const,
                    name: 'Contract Apilable Reforzada',
                    desc: 'Chasis para alta afluencia con puente bajo asiento y apilado rápido',
                  },
                  {
                    id: 'sled_cantilever' as const,
                    name: 'Trineo Cantilever Flotante',
                    desc: 'Tubo de acero continuo en S con suave amortiguación ergonómica',
                  },
                ].map((st) => {
                  const isSelected = frameStyle === st.id;
                  return (
                    <button
                      key={st.id}
                      onClick={() => setFrameStyle(st.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-orange-500/10 border-orange-500 ring-2 ring-orange-500/20'
                          : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-bold ${isSelected ? 'text-orange-400' : 'text-white'}`}>
                          {st.name}
                        </span>
                        {isSelected && <Check size={12} className="text-orange-400" />}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{st.desc}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* ========================================================= */}
            {/* 1. COLOR DE PATAS (FIERRO)                                */}
            {/* ========================================================= */}
            <section className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold uppercase tracking-wider text-white flex items-center gap-2 text-xs">
                  <Palette size={14} className="text-orange-400" />
                  1. Color Patas de Fierro
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Esmalte al Horno</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {legsColorList.map((key) => {
                  const item = CHAIR_LEGS_COLORS[key];
                  const isSelected = legsColor === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setLegsColor(key)}
                      className={`relative flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-left ${
                        isSelected
                          ? 'bg-zinc-800 border-orange-500 ring-2 ring-orange-500/30'
                          : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                      }`}
                    >
                      <span
                        className="w-6 h-6 rounded-full border border-white/20 shadow-inner flex-shrink-0 flex items-center justify-center"
                        style={{ backgroundColor: item.hex }}
                      >
                        {isSelected && (
                          <Check
                            size={12}
                            style={{ color: item.textColor }}
                            className="stroke-[3]"
                          />
                        )}
                      </span>
                      <div className="overflow-hidden">
                        <div className="text-[11px] font-bold text-white truncate leading-tight">
                          {item.name}
                        </div>
                        <div className="text-[9px] font-mono text-slate-400 mt-0.5">{item.ral}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* ========================================================= */}
            {/* 2. DECORATIVO ASIENTO (ABET LAMINATI)                      */}
            {/* ========================================================= */}
            <section className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold uppercase tracking-wider text-white flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                  2. Decorativo Asiento
                </span>
                <span className="text-[10px] text-sky-300 font-mono">Abet Laminati HPL</span>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                Selecciona el laminado superior. La cara inferior se fabrica{' '}
                <strong className="text-amber-300">siempre en madera terciada natural</strong> y el borde perimetral luce el{' '}
                <strong className="text-amber-300">canto de terciado visto</strong>.
              </p>

              {/* Grid of Abet Laminati Options */}
              <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                {/* Backoffice Uploaded Textures */}
                {adminTextures.map((adminTex) => {
                  const isSelected = seatLaminateId === adminTex.id;
                  const imgUrl = adminTex.url || adminTex.previewUrl;
                  return (
                    <button
                      key={`admin-${adminTex.id}`}
                      onClick={() => setSeatLaminateId(adminTex.id)}
                      className={`relative flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-zinc-800 border-sky-400 ring-2 ring-sky-400/30'
                          : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt={adminTex.name}
                        className="w-6 h-6 rounded object-cover border border-white/20"
                      />
                      <div className="truncate flex-1">
                        <div className="text-[10px] font-semibold text-white truncate">
                          {adminTex.name}
                        </div>
                        <div className="text-[8px] text-sky-400 font-mono">Backoffice</div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 size={12} className="text-sky-400 ml-auto flex-shrink-0" />
                      )}
                    </button>
                  );
                })}

                {/* Custom Uploaded Textures */}
                {customTextures.map((custom) => {
                  const isSelected = seatLaminateId === custom.id;
                  return (
                    <button
                      key={custom.id}
                      onClick={() => setSeatLaminateId(custom.id)}
                      className={`relative flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-zinc-800 border-sky-400 ring-2 ring-sky-400/30'
                          : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <img
                        src={custom.dataUrl}
                        alt={custom.name}
                        className="w-6 h-6 rounded object-cover border border-white/20"
                      />
                      <div className="truncate flex-1">
                        <div className="truncate text-[10px] font-semibold text-white">
                          {custom.name}
                        </div>
                        <div className="text-[8px] text-orange-400 font-mono">Subido</div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 size={12} className="text-sky-400 ml-auto flex-shrink-0" />
                      )}
                    </button>
                  );
                })}

                {/* Standard Catalog */}
                {ABET_LAMINATI_CATALOG.map((item) => {
                  const isSelected = seatLaminateId === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSeatLaminateId(item.id)}
                      className={`relative flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-zinc-800 border-sky-400 ring-2 ring-sky-400/30'
                          : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      {item.isTexture && item.textureUrl ? (
                        <img
                          src={item.textureUrl}
                          alt={item.name}
                          className="w-6 h-6 rounded object-cover border border-white/20"
                        />
                      ) : (
                        <span
                          className="w-6 h-6 rounded border border-white/20 shadow-inner flex-shrink-0"
                          style={{ backgroundColor: item.hex }}
                        />
                      )}
                      <div className="truncate">
                        <div className="text-[10px] font-bold text-white truncate leading-tight">
                          {item.name}
                        </div>
                        <div className="text-[9px] font-mono text-slate-400">{item.code}</div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 size={12} className="text-sky-400 ml-auto flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* ========================================================= */}
            {/* 3. DECORATIVO RESPALDO (FRENTE Y DORSO)                    */}
            {/* ========================================================= */}
            <section className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold uppercase tracking-wider text-white flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                  3. Decorativo Respaldo
                </span>
                <span className="text-[10px] text-orange-300 font-mono">Frente & Dorso</span>
              </div>

              {/* Toggle Same Colors */}
              <div className="flex items-center justify-between p-2.5 bg-black/40 rounded-xl border border-zinc-800 mb-3">
                <span className="text-[11px] text-slate-300 font-medium">
                  ¿Mismo tono en frente y dorso?
                </span>
                <button
                  onClick={() => setBackrestSameBothSides(!backrestSameBothSides)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    backrestSameBothSides ? 'bg-orange-500' : 'bg-zinc-700'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      backrestSameBothSides ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Frente Respaldo Selector */}
              <div className="mb-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-orange-400 mb-1.5">
                  Cara Frontal del Respaldo:
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                  {/* Backoffice Textures */}
                  {adminTextures.map((adminTex) => {
                    const isSelected = backrestFrontLaminateId === adminTex.id;
                    const imgUrl = adminTex.url || adminTex.previewUrl;
                    return (
                      <button
                        key={`front-admin-${adminTex.id}`}
                        onClick={() => setBackrestFrontLaminateId(adminTex.id)}
                        className={`flex items-center gap-2 p-1.5 rounded-lg border text-left transition-all ${
                          isSelected
                            ? 'bg-zinc-800 border-orange-400 ring-1 ring-orange-400/30'
                            : 'bg-zinc-950/50 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt={adminTex.name}
                          className="w-5 h-5 rounded object-cover border border-white/20"
                        />
                        <div className="truncate text-[9px] font-bold text-white">{adminTex.name}</div>
                      </button>
                    );
                  })}

                  {/* Custom Uploaded */}
                  {customTextures.map((custom) => {
                    const isSelected = backrestFrontLaminateId === custom.id;
                    return (
                      <button
                        key={`front-custom-${custom.id}`}
                        onClick={() => setBackrestFrontLaminateId(custom.id)}
                        className={`flex items-center gap-2 p-1.5 rounded-lg border text-left transition-all ${
                          isSelected
                            ? 'bg-zinc-800 border-orange-400 ring-1 ring-orange-400/30'
                            : 'bg-zinc-950/50 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <img
                          src={custom.dataUrl}
                          alt={custom.name}
                          className="w-5 h-5 rounded object-cover border border-white/20"
                        />
                        <div className="truncate text-[9px] font-bold text-white">{custom.name}</div>
                      </button>
                    );
                  })}

                  {/* Standard Catalog */}
                  {ABET_LAMINATI_CATALOG.map((item) => {
                    const isSelected = backrestFrontLaminateId === item.id;
                    return (
                      <button
                        key={`front-${item.id}`}
                        onClick={() => setBackrestFrontLaminateId(item.id)}
                        className={`flex items-center gap-2 p-1.5 rounded-lg border text-left transition-all ${
                          isSelected
                            ? 'bg-zinc-800 border-orange-400 ring-1 ring-orange-400/30'
                            : 'bg-zinc-950/50 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        {item.isTexture && item.textureUrl ? (
                          <img
                            src={item.textureUrl}
                            alt={item.name}
                            className="w-5 h-5 rounded object-cover border border-white/20"
                          />
                        ) : (
                          <span
                            className="w-5 h-5 rounded border border-white/20"
                            style={{ backgroundColor: item.hex }}
                          />
                        )}
                        <div className="truncate text-[9px] font-bold text-white">{item.name}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dorso Posterior Respaldo Selector (Si no son iguales) */}
              {!backrestSameBothSides && (
                <div className="pt-2 border-t border-zinc-800/80">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1.5 flex items-center justify-between">
                    <span>Cara Posterior (Dorso Trasero):</span>
                    <span className="text-[9px] text-slate-400 font-mono">Personalizado</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                    {/* Backoffice Textures */}
                    {adminTextures.map((adminTex) => {
                      const isSelected = backrestRearLaminateId === adminTex.id;
                      const imgUrl = adminTex.url || adminTex.previewUrl;
                      return (
                        <button
                          key={`rear-admin-${adminTex.id}`}
                          onClick={() => setBackrestRearLaminateId(adminTex.id)}
                          className={`flex items-center gap-2 p-1.5 rounded-lg border text-left transition-all ${
                            isSelected
                              ? 'bg-zinc-800 border-amber-400 ring-1 ring-amber-400/30'
                              : 'bg-zinc-950/50 border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          <img
                            src={imgUrl}
                            alt={adminTex.name}
                            className="w-5 h-5 rounded object-cover border border-white/20"
                          />
                          <div className="truncate text-[9px] font-bold text-white">{adminTex.name}</div>
                        </button>
                      );
                    })}

                    {/* Custom Uploaded */}
                    {customTextures.map((custom) => {
                      const isSelected = backrestRearLaminateId === custom.id;
                      return (
                        <button
                          key={`rear-custom-${custom.id}`}
                          onClick={() => setBackrestRearLaminateId(custom.id)}
                          className={`flex items-center gap-2 p-1.5 rounded-lg border text-left transition-all ${
                            isSelected
                              ? 'bg-zinc-800 border-amber-400 ring-1 ring-amber-400/30'
                              : 'bg-zinc-950/50 border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          <img
                            src={custom.dataUrl}
                            alt={custom.name}
                            className="w-5 h-5 rounded object-cover border border-white/20"
                          />
                          <div className="truncate text-[9px] font-bold text-white">{custom.name}</div>
                        </button>
                      );
                    })}

                    {/* Standard Catalog */}
                    {ABET_LAMINATI_CATALOG.map((item) => {
                      const isSelected = backrestRearLaminateId === item.id;
                      return (
                        <button
                          key={`rear-${item.id}`}
                          onClick={() => setBackrestRearLaminateId(item.id)}
                          className={`flex items-center gap-2 p-1.5 rounded-lg border text-left transition-all ${
                            isSelected
                              ? 'bg-zinc-800 border-amber-400 ring-1 ring-amber-400/30'
                              : 'bg-zinc-950/50 border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          {item.isTexture && item.textureUrl ? (
                            <img
                              src={item.textureUrl}
                              alt={item.name}
                              className="w-5 h-5 rounded object-cover border border-white/20"
                            />
                          ) : (
                            <span
                              className="w-5 h-5 rounded border border-white/20"
                              style={{ backgroundColor: item.hex }}
                            />
                          )}
                          <div className="truncate text-[9px] font-bold text-white">{item.name}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            {/* ========================================================= */}
            {/* 4. SUBIR PLANCHA ABET LAMINATI (130 x 305 cm)              */}
            {/* ========================================================= */}
            <section className="bg-zinc-900/50 border border-dashed border-zinc-700/80 rounded-2xl p-3.5 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold transition-all border border-zinc-700"
              >
                <Upload size={14} className="text-orange-400" />
                <span>Cargar Plancha Abet (130 × 305 cm)</span>
              </button>
              <p className="text-[10px] text-slate-400 mt-1.5">
                Soporta archivos JPG, PNG o SVG de diseño personalizado
              </p>
            </section>

            {/* ========================================================= */}
            {/* 5. SUBIR MODELO 3D PERSONALIZADO (.OBJ / .OBJ.TXT)         */}
            {/* ========================================================= */}
            <section className="bg-zinc-900/50 border border-dashed border-orange-500/50 rounded-2xl p-3.5 text-center">
              <input
                ref={objInputRef}
                type="file"
                accept=".obj,.txt"
                onChange={handleObjUpload}
                className="hidden"
              />
              <div className="font-bold text-white text-xs mb-1 flex items-center justify-center gap-1.5">
                <Sparkles size={14} className="text-orange-400" />
                <span>Modelo 3D Personalizado (.obj / .obj.txt)</span>
              </div>
              {customObjName ? (
                <div className="flex items-center justify-between bg-zinc-800 p-2 rounded-xl border border-zinc-700 mt-2">
                  <div className="truncate text-xs text-orange-300 font-mono">
                    {customObjName}
                  </div>
                  <button
                    onClick={() => setCustomObjText(null, null)}
                    className="p-1 text-red-400 hover:text-red-300 transition-colors"
                    title="Eliminar modelo personalizado y volver al diseño original"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => objInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-md mt-1"
                  >
                    <Upload size={14} />
                    <span>Subir archivo .obj.txt</span>
                  </button>
                  <p className="text-[10px] text-slate-400 mt-1.5">
                    Sube tu archivo Wavefront OBJ o .obj.txt para reemplazar la geometría de la silla
                  </p>
                </>
              )}
            </section>
          </>
        ) : (
          /* ========================================================= */
          /* FICHA TÉCNICA Y DIMENSIONES FIJAS (PLANO DE FABRICACIÓN)  */
          /* ========================================================= */
          <div className="space-y-4">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-400 mb-2">
                <Lock size={14} />
                <span>Dimensiones Fijas (Matricería)</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                Las medidas geométricas respetan estrictamente los planos técnicos de producción y no
                son editables para garantizar la ergonomía y curvatura de molde.
              </p>

              <div className="space-y-1.5 font-mono text-[11px] bg-black/40 p-3 rounded-xl border border-zinc-800/80">
                <div className="flex justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-slate-400">Altura Total:</span>
                  <span className="text-white font-bold">{CHAIR_FIXED_DIMENSIONS.totalHeight} mm</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-slate-400">Altura de Asiento:</span>
                  <span className="text-sky-400 font-bold">{CHAIR_FIXED_DIMENSIONS.seatHeight} mm</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-slate-400">Ancho de Asiento:</span>
                  <span className="text-emerald-400 font-bold">{CHAIR_FIXED_DIMENSIONS.seatWidth} mm</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-slate-400">Profundidad Asiento:</span>
                  <span className="text-purple-400 font-bold">{CHAIR_FIXED_DIMENSIONS.seatDepth} mm</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-slate-400">Ancho Respaldo:</span>
                  <span className="text-orange-400 font-bold">{CHAIR_FIXED_DIMENSIONS.backrestWidth} mm</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-slate-400">Altura Respaldo:</span>
                  <span className="text-white font-bold">{CHAIR_FIXED_DIMENSIONS.backrestHeight} mm</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-slate-400">Espesor Terciado Curvo:</span>
                  <span className="text-amber-400 font-bold">{CHAIR_FIXED_DIMENSIONS.plywoodThickness} mm</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Tubo Acero Estructura:</span>
                  <span className="text-white font-bold">Ø {CHAIR_FIXED_DIMENSIONS.tubeDiameter} × {CHAIR_FIXED_DIMENSIONS.tubeWallThickness} mm</span>
                </div>
              </div>
            </div>

            {/* Cantidad para Cubicación */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4">
              <span className="text-xs font-bold uppercase tracking-wider text-white mb-2 block">
                Cantidad a Fabricar / Cotizar:
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setChairQuantity(chairQuantity - 1)}
                  className="w-9 h-9 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-lg font-bold transition-all border border-zinc-700"
                >
                  -
                </button>
                <div className="flex-1 text-center font-mono font-bold text-lg text-orange-400 bg-black/40 py-1.5 rounded-xl border border-zinc-800">
                  {chairQuantity} {chairQuantity === 1 ? 'silla' : 'sillas'}
                </div>
                <button
                  onClick={() => setChairQuantity(chairQuantity + 1)}
                  className="w-9 h-9 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-lg font-bold transition-all border border-zinc-700"
                >
                  +
                </button>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-3 pt-2 border-t border-zinc-800">
                <span>Consumo Tubo Fierro:</span>
                <strong className="text-white">{(4.2 * chairQuantity).toFixed(1)} m</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Footer with Export Buttons */}
      <div className="p-4 border-t border-zinc-800 bg-[#161922] flex flex-col gap-2">
        <div className="flex gap-2">
          <button
            onClick={() => exportChairPDF(fullState)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-orange-500/20"
            title="Descargar Ficha Técnica en PDF"
          >
            <FileText size={15} />
            <span>Ficha PDF</span>
          </button>

          <button
            onClick={() => exportChairExcel(fullState)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-emerald-400 hover:text-emerald-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md"
            title="Descargar Planilla Excel con Cubicación y BOM"
          >
            <FileSpreadsheet size={15} />
            <span>Excel BOM</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
