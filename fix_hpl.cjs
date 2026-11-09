const fs = require('fs');
let code = fs.readFileSync('src/components/kitchen/Cabinet.tsx', 'utf8');

// 1. Añadir isFrontPanel={true} a los Board del cajón
code = code.replace(
    /<Board position=\{\[0, yBoxCenter, frontZ\]\} args=\{\[width - gap\*2, drawerH, thickness\]\} \{\.\.\.colorProps\} \/>/g,
    '<Board position={[0, yBoxCenter, frontZ]} args={[width - gap*2, drawerH, thickness]} {...colorProps} isFrontPanel={true} />'
);

// 2. Añadir isFrontPanel={true} a la puerta de 1_door y spice_rack
code = code.replace(
    /if \(variant === '1_door' \|\| variant === 'spice_rack'\) \{\n            return <Board position=\{\[0, legsHeight \+ cabH\/2, frontZ\]\} args=\{\[width - gap\*2, cabH - gap\*2, thickness\]\} \{\.\.\.parseColor\(cDoors\)\} \/>;\n         \}/g,
    `if (variant === '1_door' || variant === 'spice_rack') {
            return <Board position={[0, legsHeight + cabH/2, frontZ]} args={[width - gap*2, cabH - gap*2, thickness]} {...parseColor(cDoors)} isFrontPanel={true} />;
         }`
);

// 3. Añadir isFrontPanel={true} a las puertas de 2_doors
code = code.replace(
    /<Board position=\{\\[-width\/2 \+ gap \+ doorW\/2, legsHeight \+ cabH\/2, frontZ\\]\} args=\{\\[doorW, cabH - gap\*2, thickness\\]\} \{\.\.\.parseColor\\(cDoors\\)\} \/>\\n                  <Board position=\{\\[width\/2 - gap - doorW\/2, legsHeight \+ cabH\/2, frontZ\\]\} args=\{\\[doorW, cabH - gap\*2, thickness\\]\} \{\.\.\.parseColor\\(cDoors\\)\} \/>/g,
    `<Board position={[-width/2 + gap + doorW/2, legsHeight + cabH/2, frontZ]} args={[doorW, cabH - gap*2, thickness]} {...parseColor(cDoors)} isFrontPanel={true} />
                  <Board position={[width/2 - gap - doorW/2, legsHeight + cabH/2, frontZ]} args={[doorW, cabH - gap*2, thickness]} {...parseColor(cDoors)} isFrontPanel={true} />`
);
// let's do this one more robustly
code = code.replace(
    /<Board position=\{\[-width\/2 \+ gap \+ doorW\/2, legsHeight \+ cabH\/2, frontZ\]\} args=\{\[doorW, cabH - gap\*2, thickness\]\} \{\.\.\.parseColor\(cDoors\)\} \/>/g,
    '<Board position={[-width/2 + gap + doorW/2, legsHeight + cabH/2, frontZ]} args={[doorW, cabH - gap*2, thickness]} {...parseColor(cDoors)} isFrontPanel={true} />'
);
code = code.replace(
    /<Board position=\{\[width\/2 - gap - doorW\/2, legsHeight \+ cabH\/2, frontZ\]\} args=\{\[doorW, cabH - gap\*2, thickness\]\} \{\.\.\.parseColor\(cDoors\)\} \/>/g,
    '<Board position={[width/2 - gap - doorW/2, legsHeight + cabH/2, frontZ]} args={[doorW, cabH - gap*2, thickness]} {...parseColor(cDoors)} isFrontPanel={true} />'
);

// 4. Añadir isFrontPanel={true} a la puerta en 1_door_1_drawer
code = code.replace(
    /<Board position=\{\[0, legsHeight \+ gap \+ doorH\/2, frontZ\]\} args=\{\[width - gap\*2, doorH, thickness\]\} \{\.\.\.parseColor\(cDoors\)\} \/>/g,
    '<Board position={[0, legsHeight + gap + doorH/2, frontZ]} args={[width - gap*2, doorH, thickness]} {...parseColor(cDoors)} isFrontPanel={true} />'
);

// 5. Cambiar las barras estructurales de 'base'
const oldBaseStruct = `<Board position={[0, height - thickness/2, depth/2 - 5]} args={[innerW, thickness, 10]} {...parseColor(cStructure)} />
                  <Board position={[0, height - thickness/2, -depth/2 + thickness + 5]} args={[innerW, thickness, 10]} {...parseColor(cStructure)} />`;

const newBaseStruct = `{/* Barra superior delantera (horizontal, 10cm de ancho) */}
                  <Board position={[0, height - thickness/2, depth/2 - 5]} args={[innerW, thickness, 10]} {...parseColor(cStructure)} />
                  {/* Barra superior trasera (vertical, 10cm de alto) */}
                  <Board position={[0, height - 5, -depth/2 + thickness/2]} args={[innerW, 10, thickness]} {...parseColor(cStructure)} />`;

code = code.replace(oldBaseStruct, newBaseStruct);

fs.writeFileSync('src/components/kitchen/Cabinet.tsx', code);
console.log('Fixed');
