const fs = require('fs');
let code = fs.readFileSync('src/components/kitchen/Cabinet.tsx', 'utf8');

const oldRenderUndermount = `const renderUndermountDrawer = (keyPrefix: string, yPos: number, drawerH: number, colorProps: any) => {
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
         };`;

const newRenderUndermount = `const renderUndermountDrawer = (keyPrefix: string, yPos: number, drawerH: number, colorProps: any) => {
            const innerDepthMm = (depth - 1.5) * 10;
            const nominalLength = getNominalSlideLength(innerDepthMm) / 10; // cm
            const drawerBoxLength = nominalLength - 1.0; // SKL = NL - 10mm
            
            // EL ERROR ESTABA AQUÍ: El centro del cajón interior debe empezar exactamente detrás de la puerta.
            // La parte trasera de la puerta está en \`depth/2\`.
            const drawerBoxZCenter = depth/2 - drawerBoxLength/2;
            const slideZCenter = depth/2 - nominalLength/2;
            
            // SKW = LW - 49mm (PDF spec)
            const skw = innerW - 4.9; 
            const sideHeight = Math.max(10, drawerH - 3); // Leave some vertical clearance
            const yBoxCenter = yPos;
            const yBoxBottom = yBoxCenter - sideHeight/2;
            const yBottomPanel = yBoxBottom + 1.2; // 12mm raised from bottom edge
            
            return (
               <group key={keyPrefix}>
                  {/* Fixed Undermount Slides (Attached to Cabinet) */}
                  <mesh position={[-innerW/2 + 1.225, yBoxBottom + 0.6, slideZCenter]}>
                     <boxGeometry args={[2.45, 1.2, nominalLength]} />
                     <meshStandardMaterial color="#999999" metalness={0.8} roughness={0.2} />
                  </mesh>
                  <mesh position={[innerW/2 - 1.225, yBoxBottom + 0.6, slideZCenter]}>
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
         };`;

if(code.includes('drawerBoxZCenter = depth/2 - drawerBoxLength/2 + thickness;')) {
    code = code.replace(oldRenderUndermount, newRenderUndermount);
    fs.writeFileSync('src/components/kitchen/Cabinet.tsx', code);
    console.log("Fix applied");
} else {
    console.log("Could not find the target string.");
}
