const fs = require('fs');
let code = fs.readFileSync('src/components/kitchen/Cabinet.tsx', 'utf8');

// Update legs height
code = code.replace(
    `const legsHeight = isBaseOrTall ? 15 : 0;`,
    `const legsHeight = isBaseOrTall ? 10 : 0;` // 100mm = 10cm
);

// Update legs rendering block
const oldLegs = `{isBaseOrTall && (
               <>
                  <mesh position={[-width/2 + 3, legsHeight/2, depth/2 - 5]} castShadow>
                     <cylinderGeometry args={[1.5, 1.5, legsHeight]} />
                     <meshStandardMaterial color="#111" roughness={0.8} />
                  </mesh>
                  <mesh position={[width/2 - 3, legsHeight/2, depth/2 - 5]} castShadow>
                     <cylinderGeometry args={[1.5, 1.5, legsHeight]} />
                     <meshStandardMaterial color="#111" roughness={0.8} />
                  </mesh>
                  <mesh position={[-width/2 + 3, legsHeight/2, -depth/2 + 5]} castShadow>
                     <cylinderGeometry args={[1.5, 1.5, legsHeight]} />
                     <meshStandardMaterial color="#111" roughness={0.8} />
                  </mesh>
                  <mesh position={[width/2 - 3, legsHeight/2, -depth/2 + 5]} castShadow>
                     <cylinderGeometry args={[1.5, 1.5, legsHeight]} />
                     <meshStandardMaterial color="#111" roughness={0.8} />
                  </mesh>
               </>
            )}`;

const newLegs = `{isBaseOrTall && (
               <>
                  <mesh position={[-width/2 + 3, legsHeight/2, depth/2 - 5]} castShadow>
                     <cylinderGeometry args={[1.5, 1.5, legsHeight]} />
                     <meshStandardMaterial color="#111" roughness={0.8} />
                  </mesh>
                  <mesh position={[width/2 - 3, legsHeight/2, depth/2 - 5]} castShadow>
                     <cylinderGeometry args={[1.5, 1.5, legsHeight]} />
                     <meshStandardMaterial color="#111" roughness={0.8} />
                  </mesh>
                  <mesh position={[-width/2 + 3, legsHeight/2, -depth/2 + 5]} castShadow>
                     <cylinderGeometry args={[1.5, 1.5, legsHeight]} />
                     <meshStandardMaterial color="#111" roughness={0.8} />
                  </mesh>
                  <mesh position={[width/2 - 3, legsHeight/2, -depth/2 + 5]} castShadow>
                     <cylinderGeometry args={[1.5, 1.5, legsHeight]} />
                     <meshStandardMaterial color="#111" roughness={0.8} />
                  </mesh>
                  {/* Pata central si el ancho es mayor a 60cm */}
                  {width > 60 && (
                     <mesh position={[0, legsHeight/2, 0]} castShadow>
                        <cylinderGeometry args={[1.5, 1.5, legsHeight]} />
                        <meshStandardMaterial color="#111" roughness={0.8} />
                     </mesh>
                  )}
               </>
            )}`;

code = code.replace(oldLegs, newLegs);

fs.writeFileSync('src/components/kitchen/Cabinet.tsx', code);
