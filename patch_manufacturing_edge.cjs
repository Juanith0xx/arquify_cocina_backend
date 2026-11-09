const fs = require('fs');
let code = fs.readFileSync('src/utils/manufacturing.ts', 'utf8');

code = code.replace(
  /if \(part\.material === 'Melamina Frente'\) \{/,
  `if (part.material === 'Melamina Frente' || part.material === 'Melamina Frente Cajón') {`
);

fs.writeFileSync('src/utils/manufacturing.ts', code);
