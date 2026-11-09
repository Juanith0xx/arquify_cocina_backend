const fs = require('fs');
let code = fs.readFileSync('src/components/kitchen/Cabinet.tsx', 'utf8');

const searchStr = `            {isBaseOrTall && (
               <>`;
               
const replaceStr = `            {isBaseOrTall && (
               <>
                  {showSocle && (
                     <mesh position={[0, legsHeight/2, depth/2 - 2]} castShadow receiveShadow>
                        <boxGeometry args={[width, legsHeight, 1.5]} />
                        <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.4} />
                     </mesh>
                  )}`;

if (code.includes(searchStr)) {
    code = code.replace(searchStr, replaceStr);
    fs.writeFileSync('src/components/kitchen/Cabinet.tsx', code);
    console.log("Socle mesh successfully added to Cabinet.tsx");
} else {
    console.log("Could not find search string");
}
