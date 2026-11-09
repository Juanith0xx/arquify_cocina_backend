const fs = require('fs');

let scene = fs.readFileSync('src/components/kitchen/KitchenScene.tsx', 'utf8');

// Replace the useFrame hook
const useFrameStart = `useFrame(() => {`;
const useFrameEnd = `useEffect(() => {`;

const newUseFrame = `useFrame(() => {
    if (toolMode === 'draw_wall' && drawingStart) {
      raycaster.setFromCamera(pointer, camera);
      const ground = scene.getObjectByName('groundPlane');
      if (ground) {
        const intersects = raycaster.intersectObject(ground);
        if (intersects.length > 0) {
          const x = Math.round(intersects[0].point.x / 10) * 10;
          const z = Math.round(intersects[0].point.z / 10) * 10;
          setCurrentMousePos([x, z]);
        }
      }
    } else if (toolMode.startsWith('place_') || toolMode === 'move_active') {
      raycaster.setFromCamera(pointer, camera);
      const ground = scene.getObjectByName('groundPlane');
      if (ground) {
        const intersects = raycaster.intersectObject(ground);
        if (intersects.length > 0) {
          let x = Math.round(intersects[0].point.x / 5) * 5;
          let z = Math.round(intersects[0].point.z / 5) * 5;
          
          let cabWidth = 60;
          let cabDepth = 60;
          
          if (toolMode === 'move_active') {
             const activeCab = cabinets.find(c => c.id === useKitchenStore.getState().activeCabinetId);
             if (activeCab) {
                cabWidth = activeCab.width;
                cabDepth = activeCab.depth;
             }
          } else {
             const isBase = toolMode.startsWith('place_base_');
             const cabVariant = isBase ? toolMode.replace('place_base_', '') : 'open';
             if (cabVariant === 'spice_rack') cabWidth = 15;
             if (cabVariant === '2_doors' || cabVariant === '2_pot_drawers') cabWidth = 80;
          }

          // Snapping Logic
          const snapThreshold = 30;
          const activeCabId = useKitchenStore.getState().activeCabinetId;
          
          for (const cab of cabinets) {
             if (toolMode === 'move_active' && cab.id === activeCabId) continue;
             
             const cabLeft = cab.position[0] - cab.width / 2;
             const cabRight = cab.position[0] + cab.width / 2;
             
             const targetRightX = cabRight + cabWidth / 2;
             const targetLeftX = cabLeft - cabWidth / 2;
             
             // Check if close to right edge
             if (Math.abs(x - targetRightX) < snapThreshold && Math.abs(z - cab.position[2]) < 60) {
                x = targetRightX;
                z = cab.position[2]; // Align Z (back wall)
                break;
             }
             // Check if close to left edge
             else if (Math.abs(x - targetLeftX) < snapThreshold && Math.abs(z - cab.position[2]) < 60) {
                x = targetLeftX;
                z = cab.position[2];
                break;
             }
          }
          
          setGhostCabinet({ pos: [x, 40, z], rot: 0 });
        }
      }
    }
  });

  const handlePointerDown = (e: any) => {
    if (toolMode === 'select') {
      setActiveCabinet(null);
      return;
    }
    e.stopPropagation();

    if (toolMode === 'draw_wall') {
      const pt = currentMousePos || [e.point.x, e.point.z];
      if (!drawingStart) {
        setDrawingStart(pt);
      } else {
        addWall({
          id: crypto.randomUUID(),
          start: drawingStart,
          end: pt,
          thickness: 15,
          height: 240
        });
        setDrawingStart(pt); 
      }
    } else if (toolMode === 'move_active' && ghostCabinet) {
        const activeCabId = useKitchenStore.getState().activeCabinetId;
        if (activeCabId) {
           useKitchenStore.getState().updateCabinet(activeCabId, { position: ghostCabinet.pos });
        }
        setToolMode('select');
    } else if (toolMode.startsWith('place_') && ghostCabinet) {
      const typeMap: any = {
         'place_base': 'base',
         'place_wall': 'wall',
         'place_tall': 'tall',
         'place_island': 'island'
      };
      
      const isBase = toolMode.startsWith('place_base_');
      const cabType = isBase ? 'base' : toolMode.replace('place_', '');
      const cabVariant = isBase ? toolMode.replace('place_base_', '') : 'open';
      
      let cabWidth = 60;
      if (cabVariant === 'spice_rack') cabWidth = 15;
      if (cabVariant === '2_doors' || cabVariant === '2_pot_drawers') cabWidth = 80;

      const newId = crypto.randomUUID();
      addCabinet({
         id: newId,
         type: cabType as any,
         variant: cabVariant,
         width: cabWidth,
         height: cabType === 'tall' ? 200 : (cabType === 'wall' ? 60 : 80),
         depth: 60,
         position: ghostCabinet.pos,
         rotation: ghostCabinet.rot,
         color: '#f8fafc'
      });
      setActiveCabinet(newId);
      setToolMode('select');
    }
  };

  useEffect(() => {`;

const startIdx = scene.indexOf(useFrameStart);
const endIdx = scene.indexOf(useFrameEnd);

if (startIdx !== -1 && endIdx !== -1) {
    scene = scene.substring(0, startIdx) + newUseFrame + scene.substring(endIdx + useFrameEnd.length);
    fs.writeFileSync('src/components/kitchen/KitchenScene.tsx', scene);
    console.log("Scene updated with snapping and moving.");
} else {
    console.log("Could not find boundaries.");
}
