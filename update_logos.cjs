const fs = require('fs');

function replaceLogoHome() {
    let code = fs.readFileSync('src/pages/Home.tsx', 'utf8');
    const oldLogo = `<div className="w-8 h-8 bg-orange-500 rounded-sm rotate-45 flex items-center justify-center">\n            <div className="w-4 h-4 border-2 border-black rotate-[-45deg]"></div>\n          </div>`;
    const newLogo = `<img src="/logo.png" alt="Robfu Logo" className="h-10 w-auto object-contain" />`;
    code = code.replace(oldLogo, newLogo);
    
    // Also change MuebleStudio to Robfu? User said "cambiar el icono naranjo del logo por este logo". Let's just change the icon.
    fs.writeFileSync('src/pages/Home.tsx', code);
}

function replaceLogoCloset() {
    let code = fs.readFileSync('src/pages/ClosetConfigurator.tsx', 'utf8');
    const oldLogo = `<div className="w-8 h-8 bg-orange-500 rounded-sm rotate-45 flex items-center justify-center">\n            <div className="w-4 h-4 border-2 border-black rotate-[-45deg]"></div>\n          </div>`;
    const newLogo = `<img src="/logo.png" alt="Robfu Logo" className="h-8 w-auto object-contain" />`;
    code = code.replace(oldLogo, newLogo);
    fs.writeFileSync('src/pages/ClosetConfigurator.tsx', code);
}

function replaceLogoKitchen() {
    let code = fs.readFileSync('src/pages/KitchenConfigurator.tsx', 'utf8');
    const oldTitle = `<span className="text-xl font-bold tracking-tighter uppercase">Planificador<span className="text-orange-500">Cocinas</span></span>`;
    const newLogoAndTitle = `<img src="/logo.png" alt="Robfu Logo" className="h-8 w-auto object-contain" /><span className="text-xl font-bold tracking-tighter uppercase">Planificador<span className="text-orange-500">Cocinas</span></span>`;
    code = code.replace(oldTitle, newLogoAndTitle);
    fs.writeFileSync('src/pages/KitchenConfigurator.tsx', code);
}

replaceLogoHome();
replaceLogoCloset();
replaceLogoKitchen();
