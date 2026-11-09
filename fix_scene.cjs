const fs = require('fs');

let scene = fs.readFileSync('src/components/kitchen/KitchenScene.tsx', 'utf8');

// Fix mapping and ghost cabinet display
scene = scene.replace(
  `{cabinets.map(cab => <Cabinet key={cab.id} {...cab} />)}`,
  `{cabinets.map(cab => {
          if (toolMode === 'move_active' && cab.id === useKitchenStore.getState().activeCabinetId) return null;
          return <Cabinet key={cab.id} {...cab} />;
        })}`
);

const oldGhost = `{/* Cabinet Preview */}
        {toolMode.startsWith('place_') && ghostCabinet && !is2D && (
           <mesh position={ghostCabinet.pos} rotation={[0, ghostCabinet.rot, 0]}>
              <boxGeometry args={[
                  toolMode === 'place_base_spice_rack' ? 15 : (toolMode.includes('2_doors') || toolMode.includes('pot_drawers') ? 80 : 60), 
                  toolMode === 'place_tall' ? 200 : (toolMode === 'place_wall' ? 60 : 80), 
                  60
              ]} />
              <meshStandardMaterial color="#3b82f6" transparent opacity={0.6} />
           </mesh>
        )}`;

const newGhost = `{/* Cabinet Preview */}
        {(toolMode.startsWith('place_') || toolMode === 'move_active') && ghostCabinet && !is2D && (
           <mesh position={ghostCabinet.pos} rotation={[0, ghostCabinet.rot, 0]}>
              <boxGeometry args={[
                  toolMode === 'place_base_spice_rack' ? 15 : (toolMode.includes('2_doors') || toolMode.includes('pot_drawers') ? 80 : (toolMode === 'move_active' ? (useKitchenStore.getState().cabinets.find(c => c.id === useKitchenStore.getState().activeCabinetId)?.width || 60) : 60)), 
                  toolMode === 'place_tall' ? 200 : (toolMode === 'place_wall' ? 60 : (toolMode === 'move_active' ? (useKitchenStore.getState().cabinets.find(c => c.id === useKitchenStore.getState().activeCabinetId)?.height || 80) : 80)), 
                  toolMode === 'move_active' ? (useKitchenStore.getState().cabinets.find(c => c.id === useKitchenStore.getState().activeCabinetId)?.depth || 60) : 60
              ]} />
              <meshStandardMaterial color="#f97316" transparent opacity={0.5} />
              <Edges scale={1.0} color="#f97316" />
           </mesh>
        )}`;

scene = scene.replace(oldGhost, newGhost);

// Add wall snapping logic
// Instead of complex rotations, if there's a wall near Z, we snap Z to it.
const oldUseFrame = `// Check if close to left edge
             else if (Math.abs(x - targetLeftX) < snapThreshold && Math.abs(z - cab.position[2]) < 60) {
                x = targetLeftX;
                z = cab.position[2];
                break;
             }
          }`;

const newUseFrame = `// Check if close to left edge
             else if (Math.abs(x - targetLeftX) < snapThreshold && Math.abs(z - cab.position[2]) < 60) {
                x = targetLeftX;
                z = cab.position[2];
                break;
             }
          }
          
          // Wall Snapping (Keep it straight, just snap Z if we are near a drawn wall)
          const storeWalls = useKitchenStore.getState().walls;
          if (storeWalls.length > 0) {
             let minWallDist = Infinity;
             let snapZ = z;
             for (const w of storeWalls) {
                // simple horizontal wall check (most common)
                if (Math.abs(w.start[1] - w.end[1]) < 20) { 
                   const wallZ = w.start[1];
                   if (Math.abs(z - wallZ) < 80) {
                      // offset by half depth and half wall thickness
                      snapZ = wallZ + (cabDepth / 2) + (w.thickness / 2);
                      minWallDist = Math.abs(z - wallZ);
                   }
                }
             }
             if (minWallDist !== Infinity) {
                z = snapZ;
             }
          }`;

scene = scene.replace(oldUseFrame, newUseFrame);

fs.writeFileSync('src/components/kitchen/KitchenScene.tsx', scene);
