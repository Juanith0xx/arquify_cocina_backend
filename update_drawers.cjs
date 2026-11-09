const fs = require('fs');
let code = fs.readFileSync('src/components/kitchen/Cabinet.tsx', 'utf8');

const oldRenderFronts = /const renderFronts = \(\) => \{[\s\S]*?return null;\n      \};/;

const newRenderFronts = `const renderFronts = () => {
         if (!variant || variant === 'open') return null;
         
         const renderUndermountDrawer = (keyPrefix: string, yPos: number, drawerH: number, colorProps: any) => {
            const innerDepthMm = (depth - 1.5) * 10;
            const nominalLength = getNominalSlideLength(innerDepthMm) / 10; // cm
            const drawerBoxLength = nominalLength - 1.0; // SKL = NL - 10mm
            const drawerBoxZCenter = depth/2 - drawerBoxLength/2 + thickness;
            
            // SKW = LW - 49mm (PDF spec)
            const skw = innerW - 4.9; 
            const sideHeight = Math.max(10, drawerH - 3); // Leave some vertical clearance
            const yBoxCenter = yPos;
            const yBoxBottom = yBoxCenter - sideHeight/2;
            const yBottomPanel = yBoxBottom + 1.2; // 12mm raised from bottom edge
            
            return (
               <group key={keyPrefix}>
                  {/* Fixed Undermount Slides (Attached to Cabinet) */}
                  <mesh position={[-innerW/2 + 1.225, yBoxBottom + 0.6, drawerBoxZCenter]}>
                     <boxGeometry args={[2.45, 1.2, nominalLength]} />
                     <meshStandardMaterial color="#999999" metalness={0.8} roughness={0.2} />
                  </mesh>
                  <mesh position={[innerW/2 - 1.225, yBoxBottom + 0.6, drawerBoxZCenter]}>
                     <boxGeometry args={[2.45, 1.2, nominalLength]} />
                     <meshStandardMaterial color="#999999" metalness={0.8} roughness={0.2} />
                  </mesh>

                  <AnimatedDrawer openZOffset={drawerBoxLength - 3}>
                     {/* Drawer Front */}
                     <Board position={[0, yBoxCenter, frontZ]} args={[width - gap*2, drawerH, thickness]} {...colorProps} />
                     
                     {/* Drawer Box (Sides, Back) */}
                     {/* Left Side */}
                     <Board position={[-skw/2 + thickness/2, yBoxCenter, drawerBoxZCenter]} args={[thickness, sideHeight, drawerBoxLength]} {...parseColor(cInner)} />
                     {/* Right Side */}
                     <Board position={[skw/2 - thickness/2, yBoxCenter, drawerBoxZCenter]} args={[thickness, sideHeight, drawerBoxLength]} {...parseColor(cInner)} />
                     {/* Back Panel (sitting on top of bottom panel) */}
                     <Board position={[0, yBoxCenter + 0.6, drawerBoxZCenter - drawerBoxLength/2 + thickness/2]} args={[skw - thickness*2, sideHeight - 1.2, thickness]} {...parseColor(cInner)} />
                     {/* Bottom Panel (12mm raised from side bottom edges) */}
                     <Board position={[0, yBottomPanel + 0.15, drawerBoxZCenter]} args={[skw - thickness*2, 0.3, drawerBoxLength - thickness*2]} color="#dddddd" />
                     
                     {/* Movable Undermount Slides (Attached to Drawer inside the 12mm cavity) */}
                     <mesh position={[-skw/2 + thickness + 1.0, yBoxBottom + 0.6, drawerBoxZCenter]}>
                        <boxGeometry args={[2.0, 1.2, drawerBoxLength]} />
                        <meshStandardMaterial color="#cccccc" metalness={0.7} roughness={0.3} />
                     </mesh>
                     <mesh position={[skw/2 - thickness - 1.0, yBoxBottom + 0.6, drawerBoxZCenter]}>
                        <boxGeometry args={[2.0, 1.2, drawerBoxLength]} />
                        <meshStandardMaterial color="#cccccc" metalness={0.7} roughness={0.3} />
                     </mesh>
                  </AnimatedDrawer>
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
            const yBoxCenter = legsHeight + gap*2 + doorH + drawerH/2;
            return (
               <>
                  <Board position={[0, legsHeight + gap + doorH/2, frontZ]} args={[width - gap*2, doorH, thickness]} {...parseColor(cDoors)} />
                  {renderUndermountDrawer('d1', yBoxCenter, drawerH, parseColor(cDrawers))}
               </>
            );
         }
         
         if (variant === '4_drawers') {
            const drawerH = (cabH - gap*5) / 4;
            return (
               <>
                  {[0,1,2,3].map(i => {
                    const yBoxCenter = legsHeight + gap + drawerH/2 + i*(drawerH + gap);
                    return renderUndermountDrawer('d' + i, yBoxCenter, drawerH, parseColor(cDrawers));
                  })}
               </>
            );
         }
         
         if (variant === '2_pot_drawers') {
            const drawerH = (cabH - gap*3) / 2;
            return (
               <>
                  {[0,1].map(i => {
                    const yBoxCenter = legsHeight + gap + drawerH/2 + i*(drawerH + gap);
                    return renderUndermountDrawer('p' + i, yBoxCenter, drawerH, parseColor(cDrawers));
                  })}
               </>
            );
         }
         return null;
      };`;

code = code.replace(oldRenderFronts, newRenderFronts);

// We don't need the old variables before renderFronts that were only for the drawers
code = code.replace(`// Drawer computations
      const innerDepthMm = (depth - 1.5) * 10; // assuming backwall thickness
      const nominalLengthMm = getNominalSlideLength(innerDepthMm);
      const nominalLength = nominalLengthMm / 10; // cm
      const drawerBoxLength = nominalLength - 1; // NL - 10mm
      const drawerBoxZCenter = depth/2 - drawerBoxLength/2;
      const boxOuterWidth = innerW - 2.6; // 13mm per side for slides
      const sideHeight = 15;`, "");

fs.writeFileSync('src/components/kitchen/Cabinet.tsx', code);
