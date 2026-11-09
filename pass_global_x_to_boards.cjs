const fs = require('fs');
let code = fs.readFileSync('src/components/kitchen/Cabinet.tsx', 'utf8');

// The cabinet position is available as the prop \`position\` (which is [x, y, z])
// In renderUndermountDrawer, add globalPosition={[position[0], yBoxCenter, frontZ]} to the Board for drawer front
code = code.replace(
    /<Board position=\{\[0, yBoxCenter, frontZ\]\} args=\{\[width - gap\*2, drawerH, thickness\]\} \{\.\.\.colorProps\} isFrontPanel=\{true\} \/>/g,
    '<Board position={[0, yBoxCenter, frontZ]} args={[width - gap*2, drawerH, thickness]} {...colorProps} isFrontPanel={true} globalPosition={[position[0] + 0, position[1] + yBoxCenter, position[2] + frontZ]} />'
);

// 2 doors
code = code.replace(
    /<Board position=\{\[-width\/2 \+ gap \+ doorW\/2, legsHeight \+ cabH\/2, frontZ\]\} args=\{\[doorW, cabH - gap\*2, thickness\]\} \{\.\.\.parseColor\(cDoors\)\} isFrontPanel=\{true\} \/>/g,
    '<Board position={[-width/2 + gap + doorW/2, legsHeight + cabH/2, frontZ]} args={[doorW, cabH - gap*2, thickness]} {...parseColor(cDoors)} isFrontPanel={true} globalPosition={[position[0] - width/2 + gap + doorW/2, position[1] + legsHeight + cabH/2, position[2] + frontZ]} />'
);
code = code.replace(
    /<Board position=\{\[width\/2 - gap - doorW\/2, legsHeight \+ cabH\/2, frontZ\]\} args=\{\[doorW, cabH - gap\*2, thickness\]\} \{\.\.\.parseColor\(cDoors\)\} isFrontPanel=\{true\} \/>/g,
    '<Board position={[width/2 - gap - doorW/2, legsHeight + cabH/2, frontZ]} args={[doorW, cabH - gap*2, thickness]} {...parseColor(cDoors)} isFrontPanel={true} globalPosition={[position[0] + width/2 - gap - doorW/2, position[1] + legsHeight + cabH/2, position[2] + frontZ]} />'
);

// 1 door or spice rack
code = code.replace(
    /if \(variant === '1_door' \|\| variant === 'spice_rack'\) \{\n            return <Board position=\{\[0, legsHeight \+ cabH\/2, frontZ\]\} args=\{\[width - gap\*2, cabH - gap\*2, thickness\]\} \{\.\.\.parseColor\(cDoors\)\} isFrontPanel=\{true\} \/>;\n         \}/g,
    `if (variant === '1_door' || variant === 'spice_rack') {
            return <Board position={[0, legsHeight + cabH/2, frontZ]} args={[width - gap*2, cabH - gap*2, thickness]} {...parseColor(cDoors)} isFrontPanel={true} globalPosition={[position[0] + 0, position[1] + legsHeight + cabH/2, position[2] + frontZ]} />;
         }`
);

// 1 door 1 drawer (door part)
code = code.replace(
    /<Board position=\{\[0, legsHeight \+ gap \+ doorH\/2, frontZ\]\} args=\{\[width - gap\*2, doorH, thickness\]\} \{\.\.\.parseColor\(cDoors\)\} isFrontPanel=\{true\} \/>/g,
    '<Board position={[0, legsHeight + gap + doorH/2, frontZ]} args={[width - gap*2, doorH, thickness]} {...parseColor(cDoors)} isFrontPanel={true} globalPosition={[position[0] + 0, position[1] + legsHeight + gap + doorH/2, position[2] + frontZ]} />'
);

fs.writeFileSync('src/components/kitchen/Cabinet.tsx', code);
console.log('Fixed cabinet boards with globalX');
