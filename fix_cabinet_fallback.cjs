const fs = require('fs');
let code = fs.readFileSync('src/components/kitchen/Cabinet.tsx', 'utf8');

code = code.replace(
  `const cDrawers = drawerFrontColor || color || '#f8fafc';`,
  `const cDrawers = drawerFrontColor || doorColor || color || '#f8fafc';`
);

fs.writeFileSync('src/components/kitchen/Cabinet.tsx', code);
