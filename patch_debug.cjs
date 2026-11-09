const fs = require('fs');
let content = fs.readFileSync('src/pages/KitchenConfigurator.tsx', 'utf8');
content = content.replace(
  `<KitchenScene />`,
  `<KitchenScene />\n            <div className="absolute top-4 right-4 bg-red-500 z-50 p-4 text-white">Debug: ID={activeCabinetId || 'null'}, Found={activeCabinet ? 'yes' : 'no'}, Cabinets={cabinets.length}</div>`
);
fs.writeFileSync('src/pages/KitchenConfigurator.tsx', content);
