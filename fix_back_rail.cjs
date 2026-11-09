const fs = require('fs');
let code = fs.readFileSync('src/components/kitchen/Cabinet.tsx', 'utf8');

const oldBackRail = `<Board position={[0, height - 5, -depth/2 + thickness/2]} args={[innerW, 10, thickness]} {...parseColor(cStructure)} />`;
const newBackRail = `<Board position={[0, height - 5, -depth/2 + thickness * 1.5]} args={[innerW, 10, thickness]} {...parseColor(cStructure)} />`;

if (code.includes(oldBackRail)) {
    code = code.replace(oldBackRail, newBackRail);
    fs.writeFileSync('src/components/kitchen/Cabinet.tsx', code);
    console.log("Back rail position fixed");
} else {
    console.log("Could not find back rail");
}
