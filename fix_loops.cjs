const fs = require('fs');
let code = fs.readFileSync('src/components/Blueprint.tsx', 'utf8');

const regex = /const hplOversize = 20;[\s\S]*?const allBoards: \(BoardResult & \{ label\?: string \}\)\[\] = \[\];/m;

const correctCode = `const hplOversize = 20;

  allParts.forEach((p, index) => {
    const color = mapPartToColor(p);
    let materialType = state.structureMaterial;
    if (p.material === 'Melamina Frente') materialType = state.doorMaterial;
    else if (p.material === 'Melamina Frente Cajón') materialType = state.drawerFrontMaterial;
    else if (p.material === 'Melamina Zócalo') materialType = state.socleMaterial;
    else if (p.material === 'Melamina Fondo') materialType = 'melamina';

    if (materialType === 'hpl') {
      addPartToBoard(\`HPL_CARA_\${color}\`, \`PLANCHA HPL - COLOR: \${getColorName(color)}\`, color, 3050, 1300, {
        id: "part-hpl-cara-" + index, name: p.name + " (Cara)", width: p.width + hplOversize, length: p.length + hplOversize, qty: p.qty, color: color, edgeL1: p.edgeL1, edgeL2: p.edgeL2, edgeW1: p.edgeW1, edgeW2: p.edgeW2
      });
      addPartToBoard(\`MDF_SUSTRATO\`, \`PLANCHA MDF DESNUDO 15MM (SUSTRATO HPL)\`, "#e5e5e5", 2500, 1830, {
        id: "part-mdf-" + index, name: p.name + " (Sustrato)", width: p.width, length: p.length, qty: p.qty, color: "#e5e5e5", edgeL1: p.edgeL1, edgeL2: p.edgeL2, edgeW1: p.edgeW1, edgeW2: p.edgeW2
      });
      if (state.hplBalancer) {
        addPartToBoard(\`HPL_BALANCER\`, \`PLANCHA HPL BLANCO (TRASCARA BALANCEADOR)\`, "#ffffff", 3050, 1300, {
          id: "part-hpl-bal-" + index, name: p.name + " (Trascara)", width: p.width + hplOversize, length: p.length + hplOversize, qty: p.qty, color: "#ffffff", edgeL1: p.edgeL1, edgeL2: p.edgeL2, edgeW1: p.edgeW1, edgeW2: p.edgeW2
        });
      }
    } else {
      addPartToBoard(\`MEL_\${color}\`, \`PLANCHA \${p.material === 'Melamina Fondo' ? 'MDF 3mm' : 'MELAMINA'} - COLOR: \${getColorName(color)}\`, color, 2500, 1830, {
        id: "part-" + index, name: p.name, width: p.width, length: p.length, qty: p.qty, color: color, edgeL1: p.edgeL1, edgeL2: p.edgeL2, edgeW1: p.edgeW1, edgeW2: p.edgeW2
      });
    }
  });

  const allBoards: (BoardResult & { label?: string })[] = [];`;

code = code.replace(regex, correctCode);
fs.writeFileSync('src/components/Blueprint.tsx', code);
