const fs = require('fs');

// 1. Fix Board.tsx
let boardCode = fs.readFileSync('src/components/Board.tsx', 'utf8');
boardCode = boardCode.replace(
    'const minX = Math.min(...kitchenCabinets.map(c => c.x - c.width/2));',
    'const minX = Math.min(...kitchenCabinets.map(c => c.position[0] - c.width/2));'
);
fs.writeFileSync('src/components/Board.tsx', boardCode);

// 2. Fix KitchenBlueprint.tsx
let blueprintCode = fs.readFileSync('src/components/KitchenBlueprint.tsx', 'utf8');

// import hardware list
blueprintCode = blueprintCode.replace(
    'import { generateKitchenPartsList } from \'../utils/kitchenManufacturing\';',
    'import { generateKitchenPartsList, generateKitchenHardwareList } from \'../utils/kitchenManufacturing\';'
);

// fix NestingPart
blueprintCode = blueprintCode.replace(
    `const nestingParts: NestingPart[] = allParts.map(p => ({
    id: Math.random().toString(),
    width: p.width,
    length: p.length,
    material: p.material,
    name: p.name,
    qty: p.qty,
    rotated: false
  }));`,
    `const nestingParts: NestingPart[] = allParts.map(p => ({
    id: Math.random().toString(),
    width: p.width,
    length: p.length,
    color: p.material,
    name: p.name,
    qty: p.qty,
    edgeL1: !!p.edgeL1,
    edgeL2: !!p.edgeL2,
    edgeW1: !!p.edgeW1,
    edgeW2: !!p.edgeW2,
    allowRotation: true
  }));`
);

// fix board properties
blueprintCode = blueprintCode.replace(/board\.material/g, 'board.color');
blueprintCode = blueprintCode.replace(/board\.width/g, 'board.w');
blueprintCode = blueprintCode.replace(/board\.length/g, 'board.h');
blueprintCode = blueprintCode.replace(/\(board\.efficiency \* 100\)\.toFixed\(1\)/g, '(100 - board.wastePercentage).toFixed(1)');

// fix PlacedPart
blueprintCode = blueprintCode.replace(/bp\.part\.name/g, 'bp.name');

fs.writeFileSync('src/components/KitchenBlueprint.tsx', blueprintCode);
console.log("Fixes applied");
