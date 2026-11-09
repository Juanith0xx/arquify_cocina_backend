import React from 'react';
import { useSpecialFurnitureStore, SPECIAL_COLORS, ABET_TEXTURES } from '../../store/specialFurnitureStore';

export function SpecialBlueprint() {
  const state = useSpecialFurnitureStore();
  const { width, height, depth, thickness, legHeight, exteriorColor, backTexture } = state;

  const extColorConfig = SPECIAL_COLORS.find(c => c.id === exteriorColor) || SPECIAL_COLORS[0];
  const abetConfig = ABET_TEXTURES.find(t => t.id === backTexture) || ABET_TEXTURES[0];

  const bodyHeight = height - legHeight;
  const drawerH = 20;

  return (
    <div className="w-full h-full bg-[#0d1117] text-slate-200 p-6 overflow-y-auto font-mono flex flex-col gap-6">
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-bold text-orange-400 tracking-wider">PLANO TÉCNICO Y COTAS 2D</h2>
          <p className="text-xs text-slate-400">Aparador Vitrina de Autor | Proyección Ortogonal</p>
        </div>
        <div className="text-right text-xs text-slate-400">
          <div><span className="text-white font-bold">{width} x {height} x {depth} cm</span></div>
          <div>Cuerpo: {bodyHeight} cm | Patas: {legHeight} cm</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vista Frontal */}
        <div className="bg-black/50 border border-white/10 rounded-xl p-4 flex flex-col items-center">
          <span className="text-xs uppercase tracking-widest text-orange-400 font-bold mb-4">Elevación Frontal (Cotas en mm)</span>
          <svg viewBox="0 0 320 420" className="w-full max-w-[280px] h-auto stroke-orange-400 fill-none">
            {/* Outline Cuerpo */}
            <rect x="40" y="40" width="240" height="280" strokeWidth="2" stroke="#e2e8f0" fill="rgba(200,90,72,0.1)" />
            {/* Patas metálicas inferiores */}
            <line x1="40" y1="320" x2="40" y2="380" strokeWidth="3" stroke="#94a3b8" />
            <line x1="280" y1="320" x2="280" y2="380" strokeWidth="3" stroke="#94a3b8" />
            <line x1="40" y1="350" x2="280" y2="350" strokeWidth="2" stroke="#64748b" />
            {/* Regatones */}
            <circle cx="40" cy="385" r="4" fill="#cbd5e1" />
            <circle cx="280" cy="385" r="4" fill="#cbd5e1" />
            {/* Puertas División Central */}
            <line x1="160" y1="40" x2="160" y2="320" strokeWidth="1.5" stroke="#f97316" strokeDasharray="4 2" />
            {/* Marcos de madera delgados (35mm) */}
            <rect x="44" y="44" width="112" height="272" strokeWidth="1.5" stroke="#d6ba94" />
            <rect x="164" y="44" width="112" height="272" strokeWidth="1.5" stroke="#d6ba94" />
            <rect x="52" y="52" width="96" height="256" strokeWidth="0.8" stroke="#38bdf8" strokeDasharray="2 2" />
            <rect x="172" y="52" width="96" height="256" strokeWidth="0.8" stroke="#38bdf8" strokeDasharray="2 2" />
            {/* Tapa Superior de Repisa del Cajón */}
            <rect x="42" y="166" width="236" height="6" strokeWidth="1" stroke="#d6ba94" fill="#d6ba94" />
            <text x="160" y="162" textAnchor="middle" fill="#d6ba94" fontSize="8" stroke="none">Tapa Superior Repisa (Madera)</text>
            {/* Cajón intermedio */}
            <rect x="44" y="172" width="232" height="42" strokeWidth="1.5" stroke="#d6ba94" fill="rgba(214,186,148,0.25)" />
            <text x="160" y="196" textAnchor="middle" fill="#d6ba94" fontSize="10" stroke="none" fontWeight="bold">Cajón Melamina Madera</text>
            {/* Repisas de cristal */}
            <line x1="44" y1="105" x2="276" y2="105" strokeWidth="1.5" stroke="#38bdf8" strokeDasharray="3 2" />
            <line x1="44" y1="265" x2="276" y2="265" strokeWidth="1.5" stroke="#38bdf8" strokeDasharray="3 2" />
            <text x="160" y="101" textAnchor="middle" fill="#38bdf8" fontSize="8" stroke="none">Repisa Cristal 6mm</text>
            <text x="160" y="261" textAnchor="middle" fill="#38bdf8" fontSize="8" stroke="none">Repisa Cristal 6mm</text>
            {/* Cotas */}
            <text x="160" y="25" textAnchor="middle" fill="#f97316" fontSize="11" stroke="none">{width * 10} mm (Ancho)</text>
            <text x="295" y="180" textAnchor="start" fill="#f97316" fontSize="11" stroke="none">{height * 10} mm</text>
          </svg>
        </div>

        {/* Vista Lateral / Perfil y Especificaciones */}
        <div className="bg-black/50 border border-white/10 rounded-xl p-4 flex flex-col gap-4">
          <span className="text-xs uppercase tracking-widest text-orange-400 font-bold">Ficha de Ensambles & Materiales</span>
          
          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2 bg-white/5 rounded border border-white/5">
              <span className="text-slate-400">Color Exterior:</span>
              <span className="text-white font-bold">{extColorConfig.name} ({extColorConfig.hex})</span>
            </div>
            <div className="flex justify-between p-2 bg-white/5 rounded border border-white/5">
              <span className="text-slate-400">Fondo Decorativo:</span>
              <span className="text-orange-400 font-bold">{abetConfig.name} ({abetConfig.code})</span>
            </div>
            <div className="flex justify-between p-2 bg-white/5 rounded border border-white/5">
              <span className="text-slate-400">Puertas Frontales:</span>
              <span className="text-white">Marco Madera Clara + Vidrio Templado</span>
            </div>
            <div className="flex justify-between p-2 bg-white/5 rounded border border-white/5">
              <span className="text-slate-400">Cajón Central:</span>
              <span className="text-white">Melamina Madera Clara / Correderas Ocultas</span>
            </div>
            <div className="flex justify-between p-2 bg-white/5 rounded border border-white/5">
              <span className="text-slate-400">Base Estructural:</span>
              <span className="text-white">Acero Cuadrado Negro + Regatones M8</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
