const fs = require('fs');
let code = fs.readFileSync('src/components/Blueprint.tsx', 'utf8');

const oldNestingGrouping = `  const partsByColor: Record<string, NestingPart[]> = {};
  allParts.forEach((p, index) => {
    const color = mapPartToColor(p);
    if (!partsByColor[color]) partsByColor[color] = [];
    
    partsByColor[color].push({
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
    });
  });

  const allBoards: BoardResult[] = [];
  Object.keys(partsByColor).forEach(color => {
    const b = optimizeNesting(partsByColor[color], 2500, 1830, 3.2, 15);
    allBoards.push(...b);
  });`;

const newNestingGrouping = `  type BoardGroup = { parts: NestingPart[], w: number, h: number, label: string, colorCode: string };
  const partsByBoard: Record<string, BoardGroup> = {};

  const addPartToBoard = (boardKey: string, label: string, colorCode: string, bw: number, bh: number, part: NestingPart) => {
    if (!partsByBoard[boardKey]) {
      partsByBoard[boardKey] = { parts: [], w: bw, h: bh, label, colorCode };
    }
    partsByBoard[boardKey].parts.push(part);
  };

  const hplOversize = 20;

  allParts.forEach((p, index) => {
    const color = mapPartToColor(p);
    let materialType = state.structureMaterial;
    if (p.material === 'Melamina Frente') materialType = state.doorMaterial;
    else if (p.material === 'Melamina Frente Cajón') materialType = state.drawerFrontMaterial;
    else if (p.material === 'Melamina Zócalo') materialType = state.socleMaterial;
    else if (p.material === 'Melamina Fondo') materialType = 'melamina';

    if (materialType === 'hpl') {
      // 1. HPL Cara
      addPartToBoard(\`HPL_CARA_\${color}\`, \`PLANCHA HPL - COLOR: \${getColorName(color)}\`, color, 3050, 1300, {
        id: "part-hpl-cara-" + index,
        name: p.name + " (Cara)",
        width: p.width + hplOversize,
        length: p.length + hplOversize,
        qty: p.qty,
        color: color,
        edgeL1: p.edgeL1, edgeL2: p.edgeL2, edgeW1: p.edgeW1, edgeW2: p.edgeW2
      });

      // 2. MDF Sustrato
      addPartToBoard(\`MDF_SUSTRATO\`, \`PLANCHA MDF DESNUDO (SUSTRATO HPL)\`, "#e5e5e5", 2500, 1830, {
        id: "part-mdf-" + index,
        name: p.name + " (Sustrato)",
        width: p.width,
        length: p.length,
        qty: p.qty,
        color: "#e5e5e5",
        edgeL1: p.edgeL1, edgeL2: p.edgeL2, edgeW1: p.edgeW1, edgeW2: p.edgeW2
      });

      // 3. HPL Balanceador
      if (state.hplBalancer) {
        addPartToBoard(\`HPL_BALANCER\`, \`PLANCHA HPL BLANCO (TRASCARA BALANCEADOR)\`, "#ffffff", 3050, 1300, {
          id: "part-hpl-bal-" + index,
          name: p.name + " (Trascara)",
          width: p.width + hplOversize,
          length: p.length + hplOversize,
          qty: p.qty,
          color: "#ffffff",
          edgeL1: p.edgeL1, edgeL2: p.edgeL2, edgeW1: p.edgeW1, edgeW2: p.edgeW2
        });
      }

    } else {
      // Melamina Normal
      addPartToBoard(\`MELAMINA_\${color}\`, \`PLANCHA \${p.material === 'Melamina Fondo' ? 'MDF 3mm' : 'MELAMINA'} - COLOR: \${getColorName(color)}\`, color, 2500, 1830, {
        id: "part-" + index,
        name: p.name,
        width: p.width,
        length: p.length,
        qty: p.qty,
        color: color,
        edgeL1: p.edgeL1, edgeL2: p.edgeL2, edgeW1: p.edgeW1, edgeW2: p.edgeW2
      });
    }
  });

  const allBoards: (BoardResult & { label?: string })[] = [];
  Object.keys(partsByBoard).forEach(key => {
    const group = partsByBoard[key];
    const b = optimizeNesting(group.parts, group.w, group.h, 3.2, 15);
    b.forEach(board => {
      allBoards.push({ ...board, label: group.label });
    });
  });`;

code = code.replace(oldNestingGrouping, newNestingGrouping);

// Now patch the rendering of the board title to use the label instead of color!
const oldTitle = `<h2 className="text-xl font-bold mb-4 text-slate-800 border-b-2 border-black pb-2 flex-shrink-0">OPTIMIZACIÓN DE CORTE - PLANCHAS 2500 x 1830 mm</h2>
              <div className="flex flex-col gap-6 flex-1 items-center justify-center min-h-0 w-full">
                {boards.map((board, bIdx) => {
                  return (
                    <div key={"board-" + board.id} className="flex flex-col items-center w-full max-w-[900px]" style={{ flexShrink: 1, minHeight: 0 }}>
                      <div className="w-full flex justify-between text-[11px] font-bold mb-1">
                        <span className="uppercase">PLANCHA {bpIdx * 2 + bIdx + 1} - COLOR: {getColorName(board.color)}</span>`;

const newTitle = `<h2 className="text-xl font-bold mb-4 text-slate-800 border-b-2 border-black pb-2 flex-shrink-0">OPTIMIZACIÓN DE CORTE Y NESTING</h2>
              <div className="flex flex-col gap-6 flex-1 items-center justify-center min-h-0 w-full">
                {boards.map((board, bIdx) => {
                  // Type casting to access the label added earlier
                  const label = (board as any).label || \`PLANCHA - COLOR: \${getColorName(board.color)}\`;
                  
                  return (
                    <div key={"board-" + board.id} className="flex flex-col items-center w-full max-w-[900px]" style={{ flexShrink: 1, minHeight: 0 }}>
                      <div className="w-full flex justify-between text-[11px] font-bold mb-1">
                        <span className="uppercase">{label} ({board.w}x{board.h}mm) - #{bpIdx * 2 + bIdx + 1}</span>`;

code = code.replace(oldTitle, newTitle);

// Need to fix aspectRatio styling on board
const oldBoardStyle = `className="relative border-2 border-zinc-800 shadow-md bg-stone-100/50 w-full"
                        style={{ aspectRatio: "2500 / 1830", maxHeight: "40vh" }}`;

const newBoardStyle = `className="relative border-2 border-zinc-800 shadow-md bg-stone-100/50 w-full"
                        style={{ aspectRatio: \`\${board.w} / \${board.h}\`, maxHeight: "40vh" }}`;

code = code.replace(oldBoardStyle, newBoardStyle);


fs.writeFileSync('src/components/Blueprint.tsx', code);
