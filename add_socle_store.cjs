const fs = require('fs');
let code = fs.readFileSync('src/store/kitchenStore.ts', 'utf8');

if (!code.includes('showSocle: boolean;')) {
    code = code.replace(
        'activeCabinetId: string | null;',
        'activeCabinetId: string | null;\n  showSocle: boolean;'
    );
    code = code.replace(
        'setDrawingStart: (pos: [number, number] | null) => void;',
        'setDrawingStart: (pos: [number, number] | null) => void;\n  setShowSocle: (val: boolean) => void;'
    );
    code = code.replace(
        'activeCabinetId: null,',
        'activeCabinetId: null,\n  showSocle: false,'
    );
    code = code.replace(
        'setDrawingStart: (pos) => set({ drawingStart: pos }),',
        'setDrawingStart: (pos) => set({ drawingStart: pos }),\n  setShowSocle: (val) => set({ showSocle: val }),'
    );
    fs.writeFileSync('src/store/kitchenStore.ts', code);
    console.log("kitchenStore updated with socle");
} else {
    console.log("socle already exists in store");
}
