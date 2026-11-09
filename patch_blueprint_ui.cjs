const fs = require('fs');
let code = fs.readFileSync('src/components/Blueprint.tsx', 'utf8');

// 1. TitleBlock update
const titleBlockOld = `<div className="w-2/4 border-r border-black p-2 flex flex-col justify-center text-xs space-y-1">
        <div><span className="font-bold">Estructura:</span> {state.thickness}mm Laminado {state.structureColor}</div>
        <div><span className="font-bold">Trasera:</span> 3mm {state.backColor}</div>
        <div><span className="font-bold">Tapacantos:</span> PVC 2mm en frentes, 0.45mm resto.</div>
        <div><span className="font-bold">Herrajes:</span> {state.assemblyType === 'minifix' ? 'Minifix + Tarugo' : 'Soberbio / Spax'}, Bisagras Cierre Suave, Correderas {state.drawerHardware}.</div>
      </div>`;

const titleBlockNew = `<div className="w-2/4 border-r border-black p-2 flex flex-col justify-center text-[10px] space-y-0.5">
        <div><span className="font-bold">Estructura:</span> {state.thickness}mm Laminado {getColorName(state.structureColor)}</div>
        <div><span className="font-bold">Trasera:</span> 3mm {getColorName(state.backColor)}</div>
        <div><span className="font-bold">Tapacantos:</span> PVC 2mm en frentes, 0.45mm resto.</div>
        <div><span className="font-bold">Herrajes:</span> {state.assemblyType === 'minifix' ? 'Minifix + Tarugo' : 'Soberbio / Spax'}, Correderas {state.drawerHardware}.</div>
      </div>`;

code = code.replace(
  /<div className="w-2\/4 border-r border-black p-2 flex flex-col justify-center text-xs space-y-1">[\s\S]*?<\/div>\s*<div className="w-1\/4 p-2 flex flex-col items-end justify-between">/,
  titleBlockNew + '\n      <div className="w-1/4 p-2 flex flex-col items-end justify-between">'
);

// 2. mapPartToColor
const mapPartOld = `  const mapPartToColor = (part: Part) => {
    if (part.material === 'Melamina Frente') return state.doorColor;
    if (part.material === 'Melamina Zócalo') return state.socleColor;
    if (part.material === 'Melamina Fondo') return state.backColor;
    return state.structureColor; 
  };`;

const mapPartNew = `  const mapPartToColor = (part: Part) => {
    if (part.material === 'Melamina Frente') return state.doorColor;
    if (part.material === 'Melamina Frente Cajón') return state.drawerFrontColor;
    if (part.material === 'Melamina Zócalo') return state.socleColor;
    if (part.material === 'Melamina Fondo') return state.backColor;
    return state.structureColor; 
  };`;

code = code.replace(
  /const mapPartToColor = \(part: Part\) => \{[\s\S]*?\};/,
  mapPartNew
);


// 3. Board layout fix
const boardLayoutOld = `<div className="flex-1 p-8 pb-32">
              <h2 className="text-xl font-bold mb-6 text-slate-800 border-b-2 border-black pb-2">OPTIMIZACIÓN DE CORTE - PLANCHAS 2500 x 1830 mm</h2>
              <div className="flex flex-col gap-10">
                {boards.map((board, bIdx) => {
                  const displayWidth = 800;
                  const scale = displayWidth / board.w;
                  const displayHeight = board.h * scale;

                  return (
                    <div key={"board-" + board.id} className="flex flex-col items-center">
                      <div className="w-full flex justify-between text-sm font-bold mb-2">`;

const boardLayoutNew = `<div className="flex-1 p-8 pb-32 flex flex-col w-full h-full overflow-hidden">
              <h2 className="text-xl font-bold mb-4 text-slate-800 border-b-2 border-black pb-2 flex-shrink-0">OPTIMIZACIÓN DE CORTE - PLANCHAS 2500 x 1830 mm</h2>
              <div className="flex flex-col gap-6 flex-1 items-center justify-center min-h-0 w-full">
                {boards.map((board, bIdx) => {
                  return (
                    <div key={"board-" + board.id} className="flex flex-col items-center w-full max-w-[900px]" style={{ flexShrink: 1, minHeight: 0 }}>
                      <div className="w-full flex justify-between text-[11px] font-bold mb-1">`;

code = code.replace(
  /<div className="flex-1 p-8 pb-32">\s*<h2 className="text-xl font-bold mb-6 text-slate-800 border-b-2 border-black pb-2">OPTIMIZACIÓN DE CORTE - PLANCHAS 2500 x 1830 mm<\/h2>\s*<div className="flex flex-col gap-10">\s*\{boards\.map\(\(board, bIdx\) => \{\s*const displayWidth = 800;\s*const scale = displayWidth \/ board\.w;\s*const displayHeight = board\.h \* scale;\s*return \(\s*<div key=\{"board-" \+ board\.id\} className="flex flex-col items-center">\s*<div className="w-full flex justify-between text-sm font-bold mb-2">/,
  boardLayoutNew
);

// 4. Board dimensions using percentages
const boardRenderOld = `                      <div 
                        className="relative border-2 border-zinc-800 shadow-md bg-stone-100/50"
                        style={{ width: displayWidth, height: displayHeight }}
                      >
                        {board.placedParts.map((p, pIdx) => {
                          const px = p.x * scale;
                          const py = p.y * scale;
                          const pw = p.w * scale;
                          const ph = p.h * scale;
                          
                          return (
                            <div 
                              key={"placed-" + p.id + "-" + pIdx}
                              className="absolute border border-black flex flex-col items-center justify-center text-center overflow-hidden"
                              style={{
                                left: px,
                                top: py,
                                width: pw,
                                height: ph,`;

const boardRenderNew = `                      <div 
                        className="relative border-2 border-zinc-800 shadow-md bg-stone-100/50 w-full"
                        style={{ aspectRatio: "2500 / 1830", maxHeight: "40vh" }}
                      >
                        {board.placedParts.map((p, pIdx) => {
                          const px = (p.x / board.w) * 100 + "%";
                          const py = (p.y / board.h) * 100 + "%";
                          const pw = (p.w / board.w) * 100 + "%";
                          const ph = (p.h / board.h) * 100 + "%";
                          
                          return (
                            <div 
                              key={"placed-" + p.id + "-" + pIdx}
                              className="absolute border border-black flex flex-col items-center justify-center text-center overflow-hidden"
                              style={{
                                left: px,
                                top: py,
                                width: pw,
                                height: ph,`;

code = code.replace(
  /<div \s*className="relative border-2 border-zinc-800 shadow-md bg-stone-100\/50"\s*style=\{\{ width: displayWidth, height: displayHeight \}\}\s*>\s*\{board\.placedParts\.map\(\(p, pIdx\) => \{\s*const px = p\.x \* scale;\s*const py = p\.y \* scale;\s*const pw = p\.w \* scale;\s*const ph = p\.h \* scale;\s*return \(\s*<div \s*key=\{"placed-" \+ p\.id \+ "-" \+ pIdx\}\s*className="absolute border border-black flex flex-col items-center justify-center text-center overflow-hidden"\s*style=\{\{\s*left: px,\s*top: py,\s*width: pw,\s*height: ph,/m,
  boardRenderNew
);

fs.writeFileSync('src/components/Blueprint.tsx', code);
