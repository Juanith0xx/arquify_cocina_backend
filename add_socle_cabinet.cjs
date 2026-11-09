const fs = require('fs');
let code = fs.readFileSync('src/components/kitchen/Cabinet.tsx', 'utf8');

// 1. Destructure showSocle from useKitchenStore
code = code.replace(
    'const { activeCabinetId, updateCabinet } = useKitchenStore();',
    'const { activeCabinetId, updateCabinet, showSocle } = useKitchenStore();'
);

// 2. Add zócalo rendering
const socleRender = `
               {/* Zócalo */}
               {showSocle && (
                  <mesh position={[0, legsHeight/2, depth/2 - 2]} castShadow receiveShadow>
                     <boxGeometry args={[width, legsHeight, 1.5]} />
                     <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.2} />
                  </mesh>
               )}
`;

code = code.replace(
    '               {/* Patas */}',
    socleRender + '\n               {/* Patas */}'
);

fs.writeFileSync('src/components/kitchen/Cabinet.tsx', code);
console.log("Socle added to Cabinet.tsx");
