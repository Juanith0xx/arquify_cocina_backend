const fs = require('fs');
const file = 'src/components/kitchen/Cabinet.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
    'const { activeCabinetId, setActiveCabinet } = useKitchenStore();',
    'const { activeCabinetId, setActiveCabinet, showSocle } = useKitchenStore();'
);

fs.writeFileSync(file, code);
console.log("Cabinet fixed");
