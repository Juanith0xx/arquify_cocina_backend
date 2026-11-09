const fs = require('fs');
let content = fs.readFileSync('src/components/kitchen/KitchenScene.tsx', 'utf8');
content = content.replace(
`      addCabinet({
         id: crypto.randomUUID(),`,
`      const newId = crypto.randomUUID();
      addCabinet({
         id: newId,`
);
content = content.replace(
`      setToolMode('select');`,
`      setActiveCabinet(newId);
      setToolMode('select');`
);
fs.writeFileSync('src/components/kitchen/KitchenScene.tsx', content);
