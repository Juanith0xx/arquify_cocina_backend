const fs = require('fs');
let content = fs.readFileSync('src/components/Scene.tsx', 'utf8');

content = content.replace(
  `<mesh position={[0, 400, -depth / 2]} receiveShadow>`,
  `<mesh position={[0, 400, -depth / 2 - 1]} receiveShadow>`
);

fs.writeFileSync('src/components/Scene.tsx', content);
