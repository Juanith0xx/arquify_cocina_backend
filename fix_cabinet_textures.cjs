const fs = require('fs');
let code = fs.readFileSync('src/components/kitchen/Cabinet.tsx', 'utf8');

// Insert the helper function inside the Cabinet component
const hookLine = `const isActive = activeCabinetId === id;`;
const helperFn = `const isActive = activeCabinetId === id;
   const parseColor = (val: string) => val.startsWith('#') ? { color: val } : { textureUrl: val, color: '#ffffff' };
`;

code = code.replace(hookLine, helperFn);

// Replace all color={cXXX} with {...parseColor(cXXX)}
code = code.replace(/color=\{cDoors\}/g, '{...parseColor(cDoors)}');
code = code.replace(/color=\{cDrawers\}/g, '{...parseColor(cDrawers)}');
code = code.replace(/color=\{cStructure\}/g, '{...parseColor(cStructure)}');
code = code.replace(/color=\{cBack\}/g, '{...parseColor(cBack)}');
code = code.replace(/color=\{cInner\}/g, '{...parseColor(cInner)}');

fs.writeFileSync('src/components/kitchen/Cabinet.tsx', code);
