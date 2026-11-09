const fs = require('fs');
let code = fs.readFileSync('src/components/Board.tsx', 'utf8');

// 1. Add globalPosition to BoardProps
if (!code.includes('globalPosition?: [number, number, number];')) {
    code = code.replace(
        'hplBalancerOverride?: boolean;',
        'hplBalancerOverride?: boolean;\n  globalPosition?: [number, number, number];'
    );
    code = code.replace(
        'isFrontPanel, grainDirection, hplBalancerOverride',
        'isFrontPanel, grainDirection, hplBalancerOverride, globalPosition'
    );
}

// 2. Change how boardLeftX and boardBottomY are calculated
const oldOffsetLogic = `const boardLeftX = position[0] - args[0] / 2;
          const boardBottomY = position[1] - args[1] / 2;`;
const newOffsetLogic = `const actualX = globalPosition ? globalPosition[0] : position[0];
          const actualY = globalPosition ? globalPosition[1] : position[1];
          const boardLeftX = actualX - args[0] / 2;
          const boardBottomY = actualY - args[1] / 2;`;

if (code.includes(oldOffsetLogic)) {
    code = code.replace(oldOffsetLogic, newOffsetLogic);
}

// 3. For kitchen cabinets, totalWidth is calculated, but closetLeftX needs to be correct.
// Kitchen cabinets might start at x=0 (left) or x=-total/2.
// Let's use bounding box or just use a fixed left. 
// In Kitchen, first cabinet is at x = width/2, next is at x = width/2 + previousWidth... wait.
// Let's check KitchenScene.js how cabinets are placed.
fs.writeFileSync('src/components/Board.tsx', code);
console.log("Board offset logic updated");
