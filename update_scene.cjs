const fs = require('fs');
let content = fs.readFileSync('src/components/Scene.tsx', 'utf8');

// Remove room back wall
content = content.replace(
  `        {/* Room Back Wall */}
        <mesh position={[0, 400, -depth / 2]} receiveShadow>
          <planeGeometry args={[1000, 1000]} />
          <meshStandardMaterial color="#404040" roughness={0.9} />
        </mesh>`,
  ``
);

fs.writeFileSync('src/components/Scene.tsx', content);
