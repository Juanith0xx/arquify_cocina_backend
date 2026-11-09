const fs = require('fs');
let code = fs.readFileSync('src/components/Blueprint.tsx', 'utf8');

// 1. getColorName method
const getColorStr = `
  const getColorName = (colorVal: string) => {
    if (colorVal.startsWith('#')) return colorVal;
    const found = state.customTextures?.find((t: any) => t.url === colorVal);
    if (found) return found.name;
    if (colorVal.startsWith('data:')) return 'TEXTURA PERSONALIZADA';
    const parts = colorVal.split('/');
    return parts[parts.length - 1].replace('.jpg', '').replace('.png', '');
  };

  const partsByColor: Record<string, NestingPart[]> = {};`;

code = code.replace(
  /const partsByColor: Record<string, NestingPart\[\]> = \{\};/,
  getColorStr
);

// 2. Add edges to partsByColor push
const pushStr = `    partsByColor[color].push({
      id: "part-" + index,
      name: p.name,
      width: p.width,
      length: p.length,
      qty: p.qty,
      color: color,
      edgeL1: p.edgeL1,
      edgeL2: p.edgeL2,
      edgeW1: p.edgeW1,
      edgeW2: p.edgeW2
    });`;

code = code.replace(
  /partsByColor\[color\]\.push\(\{\n\s*id: "part-" \+ index,\n\s*name: p\.name,\n\s*width: p\.width,\n\s*length: p\.length,\n\s*qty: p\.qty,\n\s*color: color\n\s*\}\);/,
  pushStr
);

// 3. Update the COLOR header
code = code.replace(
  /<span>PLANCHA \{board\.id\} - COLOR: <span className="uppercase text-orange-600">\{board\.color\}<\/span><\/span>/,
  `<span>PLANCHA {board.id} - COLOR: <span className="uppercase text-orange-600">{getColorName(board.color)}</span></span>`
);

// 4. Update the placed part rendering
const renderStr = `                              <div className="bg-white/80 px-1 py-0.5 rounded text-[8px] font-bold leading-tight flex flex-col items-center z-10">
                                <div>{p.name.substring(0, 10)}</div>
                                <div>{p.w.toFixed(0)}x{p.h.toFixed(0)}</div>
                              </div>
                              {p.edgeTop && <div className="absolute top-0.5 left-0.5 right-0.5 border-t-[1.5px] border-red-500 border-dashed" />}
                              {p.edgeBottom && <div className="absolute bottom-0.5 left-0.5 right-0.5 border-b-[1.5px] border-red-500 border-dashed" />}
                              {p.edgeLeft && <div className="absolute left-0.5 top-0.5 bottom-0.5 border-l-[1.5px] border-red-500 border-dashed" />}
                              {p.edgeRight && <div className="absolute right-0.5 top-0.5 bottom-0.5 border-r-[1.5px] border-red-500 border-dashed" />}`;

code = code.replace(
  /<div className="bg-white\/80 px-1 py-0\.5 rounded text-\[8px\] font-bold leading-tight flex flex-col items-center">\n\s*<div>\{p\.name\.substring\(0, 10\)\}<\/div>\n\s*<div>\{p\.w\.toFixed\(0\)\}x\{p\.h\.toFixed\(0\)\}<\/div>\n\s*<\/div>/,
  renderStr
);

fs.writeFileSync('src/components/Blueprint.tsx', code);
