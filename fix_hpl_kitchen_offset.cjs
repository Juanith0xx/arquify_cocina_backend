const fs = require('fs');
let code = fs.readFileSync('src/components/Board.tsx', 'utf8');

const oldClosetLeftX = `const closetLeftX = -totalWidth / 2;`;
const newClosetLeftX = `
          // For closet, it is -totalWidth / 2. For kitchen, maybe we can just use a fixed 0, 
          // or find the min X of all cabinets.
          let closetLeftX = -totalWidth / 2;
          if (kitchenCabinets.length > 0 && closetModules.length === 0) {
             const minX = Math.min(...kitchenCabinets.map(c => c.x - c.width/2));
             closetLeftX = minX;
          }
`;

if (code.includes(oldClosetLeftX)) {
    code = code.replace(oldClosetLeftX, newClosetLeftX);
    fs.writeFileSync('src/components/Board.tsx', code);
    console.log("closetLeftX updated");
} else {
    console.log("Could not find closetLeftX");
}
