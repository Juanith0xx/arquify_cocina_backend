const fs = require('fs');
let code = fs.readFileSync('src/components/kitchen/Cabinet.tsx', 'utf8');

const countertopRegex = /\{\(type === 'base' \|\| type === 'island'\) && \(\s*<mesh position=\{\[0, height\/2 \+ 1, 0\]\} castShadow>\s*<boxGeometry args=\{\[width \+ 2, 2, depth \+ 2\]\} \/>\s*<meshStandardMaterial color="#f8fafc" roughness=\{0\.2\} metalness=\{0\.1\} \/>\s*<\/mesh>\s*\)\}/;

if (countertopRegex.test(code)) {
    code = code.replace(countertopRegex, '{/* Cubierta removida a petición */}');
    fs.writeFileSync('src/components/kitchen/Cabinet.tsx', code);
    console.log("Countertop removed successfully.");
} else {
    console.log("Countertop block not found. Trying flexible matching...");
    // Fallback just in case spacing is different
    const fallbackRegex = /\{\(type === 'base' \|\| type === 'island'\) && \([\s\S]*?<\/mesh>\s*\)\}/;
    if (fallbackRegex.test(code)) {
        code = code.replace(fallbackRegex, '{/* Cubierta removida a petición */}');
        fs.writeFileSync('src/components/kitchen/Cabinet.tsx', code);
        console.log("Countertop removed using fallback regex.");
    } else {
        console.log("Still not found.");
    }
}
