const fs = require('fs');
let code = fs.readFileSync('src/components/kitchen/Cabinet.tsx', 'utf8');

const renderFrontsOld = `      const renderFronts = () => {
         if (!variant || variant === 'open') return null;
         
         if (variant === '1_door' || variant === 'spice_rack') {
            return <Board position={[0, legsHeight + cabH/2, frontZ]} args={[width - gap*2, cabH - gap*2, thickness]} color={color} />;
         }
         
         if (variant === '2_doors') {
            const doorW = (width - gap*3) / 2;
            return (
               <>
                  <Board position={[-width/2 + gap + doorW/2, legsHeight + cabH/2, frontZ]} args={[doorW, cabH - gap*2, thickness]} color={color} />
                  <Board position={[width/2 - gap - doorW/2, legsHeight + cabH/2, frontZ]} args={[doorW, cabH - gap*2, thickness]} color={color} />
               </>
            );
         }
         
         if (variant === '1_door_1_drawer') {
            const drawerH = 15;
            const doorH = cabH - drawerH - gap*3;
            return (
               <>
                  <Board position={[0, legsHeight + gap + doorH/2, frontZ]} args={[width - gap*2, doorH, thickness]} color={color} />
                  <Board position={[0, legsHeight + gap*2 + doorH + drawerH/2, frontZ]} args={[width - gap*2, drawerH, thickness]} color={color} />
               </>
            );
         }
         
         if (variant === '4_drawers') {
            const drawerH = (cabH - gap*5) / 4;
            return (
               <>
                  {[0,1,2,3].map(i => (
                     <Board key={i} position={[0, legsHeight + gap + drawerH/2 + i*(drawerH + gap), frontZ]} args={[width - gap*2, drawerH, thickness]} color={color} />
                  ))}
               </>
            );
         }
         
         if (variant === '2_pot_drawers') {
            const drawerH = (cabH - gap*3) / 2;
            return (
               <>
                  {[0,1].map(i => (
                     <Board key={i} position={[0, legsHeight + gap + drawerH/2 + i*(drawerH + gap), frontZ]} args={[width - gap*2, drawerH, thickness]} color={color} />
                  ))}
               </>
            );
         }
         return null;
      };`;

const renderFrontsNew = `      const renderFronts = () => {
         if (!variant || variant === 'open') return null;
         
         if (variant === '1_door' || variant === 'spice_rack') {
            return <Board position={[0, legsHeight + cabH/2, frontZ]} args={[width - gap*2, cabH - gap*2, thickness]} color={cDoors} />;
         }
         
         if (variant === '2_doors') {
            const doorW = (width - gap*3) / 2;
            return (
               <>
                  <Board position={[-width/2 + gap + doorW/2, legsHeight + cabH/2, frontZ]} args={[doorW, cabH - gap*2, thickness]} color={cDoors} />
                  <Board position={[width/2 - gap - doorW/2, legsHeight + cabH/2, frontZ]} args={[doorW, cabH - gap*2, thickness]} color={cDoors} />
               </>
            );
         }
         
         if (variant === '1_door_1_drawer') {
            const drawerH = 15;
            const doorH = cabH - drawerH - gap*3;
            return (
               <>
                  <Board position={[0, legsHeight + gap + doorH/2, frontZ]} args={[width - gap*2, doorH, thickness]} color={cDoors} />
                  <Board position={[0, legsHeight + gap*2 + doorH + drawerH/2, frontZ]} args={[width - gap*2, drawerH, thickness]} color={cDrawers} />
               </>
            );
         }
         
         if (variant === '4_drawers') {
            const drawerH = (cabH - gap*5) / 4;
            return (
               <>
                  {[0,1,2,3].map(i => (
                     <Board key={i} position={[0, legsHeight + gap + drawerH/2 + i*(drawerH + gap), frontZ]} args={[width - gap*2, drawerH, thickness]} color={cDrawers} />
                  ))}
               </>
            );
         }
         
         if (variant === '2_pot_drawers') {
            const drawerH = (cabH - gap*3) / 2;
            return (
               <>
                  {[0,1].map(i => (
                     <Board key={i} position={[0, legsHeight + gap + drawerH/2 + i*(drawerH + gap), frontZ]} args={[width - gap*2, drawerH, thickness]} color={cDrawers} />
                  ))}
               </>
            );
         }
         return null;
      };`;

code = code.replace(renderFrontsOld, renderFrontsNew);

// Replace structure colors
const oldBody = `<Board position={[-width/2 + thickness/2, legsHeight + cabH/2, 0]} args={[thickness, cabH, depth]} color={color} />
            <Board position={[width/2 - thickness/2, legsHeight + cabH/2, 0]} args={[thickness, cabH, depth]} color={color} />
            <Board position={[0, legsHeight + thickness/2, 0]} args={[innerW, thickness, depth]} color={color} />
            <Board position={[0, legsHeight + cabH/2, -depth/2 + thickness/2]} args={[innerW, cabH - thickness*2, thickness]} color={color} />
            
            {type === 'base' || type === 'island' ? (
               <>
                  <Board position={[0, height - thickness/2, depth/2 - 5]} args={[innerW, thickness, 10]} color={color} />
                  <Board position={[0, height - thickness/2, -depth/2 + thickness + 5]} args={[innerW, thickness, 10]} color={color} />
               </>
            ) : (
               <Board position={[0, height - thickness/2, 0]} args={[innerW, thickness, depth]} color={color} />
            )}`;

const newBody = `<Board position={[-width/2 + thickness/2, legsHeight + cabH/2, 0]} args={[thickness, cabH, depth]} color={cStructure} />
            <Board position={[width/2 - thickness/2, legsHeight + cabH/2, 0]} args={[thickness, cabH, depth]} color={cStructure} />
            <Board position={[0, legsHeight + thickness/2, 0]} args={[innerW, thickness, depth]} color={cStructure} />
            <Board position={[0, legsHeight + cabH/2, -depth/2 + thickness/2]} args={[innerW, cabH - thickness*2, thickness]} color={cBack} />
            
            {type === 'base' || type === 'island' ? (
               <>
                  <Board position={[0, height - thickness/2, depth/2 - 5]} args={[innerW, thickness, 10]} color={cStructure} />
                  <Board position={[0, height - thickness/2, -depth/2 + thickness + 5]} args={[innerW, thickness, 10]} color={cStructure} />
               </>
            ) : (
               <Board position={[0, height - thickness/2, 0]} args={[innerW, thickness, depth]} color={cStructure} />
            )}`;

code = code.replace(oldBody, newBody);

fs.writeFileSync('src/components/kitchen/Cabinet.tsx', code);
