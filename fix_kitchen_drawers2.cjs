const fs = require('fs');
let code = fs.readFileSync('src/components/kitchen/Cabinet.tsx', 'utf8');

const oldRenderFronts = /const renderFronts = \(\) => \{[\s\S]*?return null;\n      \};/;

const newRenderFronts = `const renderFronts = () => {
         if (!variant || variant === 'open') return null;
         
         const renderDrawer = (keyPrefix: string, yPos: number, drawerH: number, colorProps: any) => {
            const nominalLength = Math.floor((depth - 5) / 5) * 5;
            const drawerBoxLength = nominalLength;
            const boxOuterWidth = width - gap*2 - 2.6; // 1.3cm per slide
            const sideHeight = Math.max(10, drawerH - 5);
            const boxZCenter = depth/2 - drawerBoxLength/2 + thickness;
            
            return (
               <group key={keyPrefix}>
                  <AnimatedDrawer openZOffset={drawerBoxLength - 3}>
                     <Board position={[0, yPos, frontZ]} args={[width - gap*2, drawerH, thickness]} {...colorProps} />
                     
                     {/* Drawer Box */}
                     <Board position={[-boxOuterWidth/2 + thickness/2, yPos, boxZCenter]} args={[thickness, sideHeight, drawerBoxLength]} {...parseColor(cInner)} />
                     <Board position={[boxOuterWidth/2 - thickness/2, yPos, boxZCenter]} args={[thickness, sideHeight, drawerBoxLength]} {...parseColor(cInner)} />
                     <Board position={[0, yPos, boxZCenter - drawerBoxLength/2 + thickness/2]} args={[boxOuterWidth - thickness*2, sideHeight, thickness]} {...parseColor(cInner)} />
                     <Board position={[0, yPos - sideHeight/2 + 0.3, boxZCenter]} args={[boxOuterWidth - thickness*2, 0.3, drawerBoxLength - thickness*2]} color="#dddddd" />
                     
                     {/* Movable Slides */}
                     <mesh position={[-boxOuterWidth/2 - 0.6, yPos - sideHeight/2 + 1.5, boxZCenter]}>
                        <boxGeometry args={[0.6, 2.5, drawerBoxLength]} />
                        <meshStandardMaterial color="#cccccc" metalness={0.7} roughness={0.3} />
                     </mesh>
                     <mesh position={[boxOuterWidth/2 + 0.6, yPos - sideHeight/2 + 1.5, boxZCenter]}>
                        <boxGeometry args={[0.6, 2.5, drawerBoxLength]} />
                        <meshStandardMaterial color="#cccccc" metalness={0.7} roughness={0.3} />
                     </mesh>
                  </AnimatedDrawer>
                  
                  {/* Fixed Slides */}
                  <mesh position={[-boxOuterWidth/2 - 1.2, yPos - sideHeight/2 + 1.5, boxZCenter]}>
                     <boxGeometry args={[1, 3.5, nominalLength]} />
                     <meshStandardMaterial color="#999999" metalness={0.8} roughness={0.2} />
                  </mesh>
                  <mesh position={[boxOuterWidth/2 + 1.2, yPos - sideHeight/2 + 1.5, boxZCenter]}>
                     <boxGeometry args={[1, 3.5, nominalLength]} />
                     <meshStandardMaterial color="#999999" metalness={0.8} roughness={0.2} />
                  </mesh>
               </group>
            );
         };
         
         if (variant === '1_door' || variant === 'spice_rack') {
            return <Board position={[0, legsHeight + cabH/2, frontZ]} args={[width - gap*2, cabH - gap*2, thickness]} {...parseColor(cDoors)} />;
         }
         
         if (variant === '2_doors') {
            const doorW = (width - gap*3) / 2;
            return (
               <>
                  <Board position={[-width/2 + gap + doorW/2, legsHeight + cabH/2, frontZ]} args={[doorW, cabH - gap*2, thickness]} {...parseColor(cDoors)} />
                  <Board position={[width/2 - gap - doorW/2, legsHeight + cabH/2, frontZ]} args={[doorW, cabH - gap*2, thickness]} {...parseColor(cDoors)} />
               </>
            );
         }
         
         if (variant === '1_door_1_drawer') {
            const drawerH = 15;
            const doorH = cabH - drawerH - gap*3;
            return (
               <>
                  <Board position={[0, legsHeight + gap + doorH/2, frontZ]} args={[width - gap*2, doorH, thickness]} {...parseColor(cDoors)} />
                  {renderDrawer('d1', legsHeight + gap*2 + doorH + drawerH/2, drawerH, parseColor(cDrawers))}
               </>
            );
         }
         
         if (variant === '4_drawers') {
            const drawerH = (cabH - gap*5) / 4;
            return (
               <>
                  {[0,1,2,3].map(i => renderDrawer('d' + i, legsHeight + gap + drawerH/2 + i*(drawerH + gap), drawerH, parseColor(cDrawers)))}
               </>
            );
         }
         
         if (variant === '2_pot_drawers') {
            const drawerH = (cabH - gap*3) / 2;
            return (
               <>
                  {[0,1].map(i => renderDrawer('p' + i, legsHeight + gap + drawerH/2 + i*(drawerH + gap), drawerH, parseColor(cDrawers)))}
               </>
            );
         }
         return null;
      };`;

code = code.replace(oldRenderFronts, newRenderFronts);

fs.writeFileSync('src/components/kitchen/Cabinet.tsx', code);
