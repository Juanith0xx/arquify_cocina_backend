const fs = require('fs');
let code = fs.readFileSync('src/pages/KitchenConfigurator.tsx', 'utf8');

const searchStr = `<ToggleBtn active={globalState.isTransparent} onClick={globalState.toggleTransparent} label="Modo Transparente" />`;
const replaceStr = `<ToggleBtn active={globalState.isTransparent} onClick={globalState.toggleTransparent} label="Modo Transparente" />
            <ToggleBtn active={state.showSocle} onClick={() => state.setShowSocle(!state.showSocle)} label="Zócalo" />`;

if (code.includes(searchStr)) {
    code = code.replace(searchStr, replaceStr);
    fs.writeFileSync('src/pages/KitchenConfigurator.tsx', code);
    console.log("Socle toggle added");
} else {
    console.log("Could not find toggle place");
}
