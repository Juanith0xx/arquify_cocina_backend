const fs = require('fs');
let code = fs.readFileSync('src/components/Blueprint.tsx', 'utf8');

const regexTitle = /<h2 className="text-xl font-bold mb-4 text-slate-800 border-b-2 border-black pb-2 flex-shrink-0">OPTIMIZACIÓN DE CORTE - PLANCHAS 2500 x 1830 mm<\/h2>\s*<div className="flex flex-col gap-6 flex-1 items-center justify-center min-h-0 w-full">\s*\{boards\.map\(\(board, bIdx\) => \{\s*return \(\s*<div key=\{"board-" \+ board\.id\} className="flex flex-col items-center w-full max-w-\[900px\]" style=\{\{ flexShrink: 1, minHeight: 0 \}\}>\s*<div className="w-full flex justify-between text-\[11px\] font-bold mb-1">\s*<span>PLANCHA \{board\.id\} - COLOR: <span className="uppercase text-orange-600">\{getColorName\(board\.color\)\}<\/span><\/span>/m;

const replacementTitle = `<h2 className="text-xl font-bold mb-4 text-slate-800 border-b-2 border-black pb-2 flex-shrink-0">OPTIMIZACIÓN DE CORTE Y NESTING</h2>
              <div className="flex flex-col gap-6 flex-1 items-center justify-center min-h-0 w-full">
                {boards.map((board, bIdx) => {
                  const label = (board as any).label || \`PLANCHA \${board.id} - COLOR: \${getColorName(board.color)}\`;
                  return (
                    <div key={"board-" + board.id} className="flex flex-col items-center w-full max-w-[900px]" style={{ flexShrink: 1, minHeight: 0 }}>
                      <div className="w-full flex justify-between text-[11px] font-bold mb-1">
                        <span className="uppercase text-orange-600">{label} ({board.w}x{board.h}mm)</span>`;

code = code.replace(regexTitle, replacementTitle);
fs.writeFileSync('src/components/Blueprint.tsx', code);
