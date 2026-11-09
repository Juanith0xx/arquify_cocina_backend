const fs = require('fs');
let code = fs.readFileSync('src/pages/KitchenConfigurator.tsx', 'utf8');

// 1. Add imports
code = code.replace(
    "import { TexturesSection } from '../components/TexturesSection';",
    "import { TexturesSection } from '../components/TexturesSection';\nimport { KitchenBlueprint } from '../components/KitchenBlueprint';\nimport { exportKitchenToExcel } from '../utils/kitchenExcelGenerator';\nimport { FileSpreadsheet, FileText } from 'lucide-react';"
);

// 2. Add KitchenBlueprint
code = code.replace(
    "<main className=\"flex-1 flex overflow-hidden relative print:hidden\">",
    "<KitchenBlueprint />\n   <main className=\"flex-1 flex overflow-hidden relative print:hidden\">"
);

// 3. Add export buttons
const sidebarEndString = `        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <ToggleBtn active={globalState.showDimensions} onClick={globalState.toggleDimensions} label="Mostrar Cotas" />
            {globalState.showDimensions && (
              <input 
                type="range" 
                min={1} 
                max={5} 
                step={1}
                value={globalState.dimensionLevel} 
                onChange={(e) => globalState.setDimensionLevel(Number(e.target.value))}
                className="w-full h-1.5 mt-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500 hover:accent-orange-400 transition-all"
                title="Nivel de Detalle de Cotas"
              />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <ToggleBtn active={globalState.showDecorations} onClick={globalState.toggleDecorations} label="Ropa y Deco" />
            <ToggleBtn active={globalState.isTransparent} onClick={globalState.toggleTransparent} label="Modo Transparente" />
          </div>
        </div>`;

const exportButtons = `
        <div className="flex flex-col gap-2 mt-8 pt-6 border-t border-white/10">
          <button 
            onClick={exportKitchenToExcel} 
            className="flex items-center justify-center gap-2 w-full p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors text-[11px] uppercase tracking-widest font-bold shadow-lg"
          >
            <FileSpreadsheet size={16} />
            Exportar Excel CAD/CAM
          </button>
          
          <button 
            onClick={() => globalState.setIsPrinting(true)} 
            className="flex items-center justify-center gap-2 w-full p-2.5 bg-rose-600/20 border border-rose-500/50 rounded-lg hover:bg-rose-600/40 transition-colors text-[10px] uppercase tracking-wide text-rose-400 font-bold"
          >
            <FileText size={14} />
            Planos de Fabricación (PDF)
          </button>
        </div>
`;

if (code.includes(sidebarEndString)) {
    code = code.replace(sidebarEndString, sidebarEndString + exportButtons);
} else {
    console.log("Could not find sidebar end for buttons.");
}

fs.writeFileSync('src/pages/KitchenConfigurator.tsx', code);
console.log("Export buttons and blueprint added.");
