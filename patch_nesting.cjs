const fs = require('fs');
let code = fs.readFileSync('src/utils/nesting.ts', 'utf8');

code = code.replace(
  /color: string;\n\}/,
  `color: string;\n  edgeL1: boolean;\n  edgeL2: boolean;\n  edgeW1: boolean;\n  edgeW2: boolean;\n}`
);

code = code.replace(
  /rotated: boolean;\n\}/,
  `rotated: boolean;\n  edgeTop: boolean;\n  edgeBottom: boolean;\n  edgeLeft: boolean;\n  edgeRight: boolean;\n}`
);

code = code.replace(
  /let items: \{ id: string, name: string, w: number, h: number \}\[\] = \[\];/,
  `let items: { id: string, name: string, w: number, h: number, eL1: boolean, eL2: boolean, eW1: boolean, eW2: boolean }[] = [];`
);

code = code.replace(
  /items\.push\(\{ id: \`\$\{p\.id\}-\$\{i\}\`, name: p\.name, w: p\.length, h: p\.width \}\);/,
  `items.push({ id: \`\${p.id}-\${i}\`, name: p.name, w: p.length, h: p.width, eL1: p.edgeL1, eL2: p.edgeL2, eW1: p.edgeW1, eW2: p.edgeW2 });`
);

code = code.replace(
  /const tryPlaceItem = \(board: BoardResult, item: \{ id: string, name: string, w: number, h: number \}\): boolean => \{/,
  `const tryPlaceItem = (board: BoardResult, item: { id: string, name: string, w: number, h: number, eL1: boolean, eL2: boolean, eW1: boolean, eW2: boolean }): boolean => {`
);

const replacePart = `      let eT = false, eB = false, eL = false, eR = false;
      if (bestRotated) {
        eT = item.eW1; eB = item.eW2; eL = item.eL1; eR = item.eL2;
      } else {
        eT = item.eL1; eB = item.eL2; eL = item.eW1; eR = item.eW2;
      }

      board.placedParts.push({
        id: item.id,
        name: item.name,
        x: fr.x,
        y: fr.y,
        w: pw,
        h: ph,
        rotated: bestRotated,
        edgeTop: eT,
        edgeBottom: eB,
        edgeLeft: eL,
        edgeRight: eR
      });`;

code = code.replace(
  /board\.placedParts\.push\(\{\n\s*id: item\.id,\n\s*name: item\.name,\n\s*x: fr\.x,\n\s*y: fr\.y,\n\s*w: pw,\n\s*h: ph,\n\s*rotated: bestRotated\n\s*\}\);/,
  replacePart
);

fs.writeFileSync('src/utils/nesting.ts', code);
