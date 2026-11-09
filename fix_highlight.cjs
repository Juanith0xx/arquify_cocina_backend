const fs = require('fs');
let content = fs.readFileSync('src/components/Closet.tsx', 'utf8');

// The active module highlight is currently using `height * 5` for Y position (which was probably * 10 / 2)
// but the other things are in cm. Let's fix the highlight box scaling and position.

// original args: [mod.width * 10 + 2, height * 10 + 4, depth * 10 + 4] -> using * 10 meaning it's in mm?
// Wait, the closet is modeled in cm. (width=60, height=200, depth=60)
// If args are [600, 2000, 600] that is massive! That's why it looks like a giant wall/box.

content = content.replace(
  `        {state.activeModuleId === mod.id && (
          <mesh position={[modCenterX, height * 5 + baseOffset, 0]}>
            <boxGeometry args={[mod.width * 10 + 2, height * 10 + 4, depth * 10 + 4]} />
            <Edges scale={1.01} threshold={15} color="#f97316" />
          </mesh>
        )}`,
  `        {state.activeModuleId === mod.id && (
          <mesh position={[modCenterX, height / 2 + baseOffset, 0]}>
            <boxGeometry args={[mod.width + 1, height + 1, depth + 1]} />
            <Edges scale={1.0} threshold={15} color="#f97316" />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        )}`
);

fs.writeFileSync('src/components/Closet.tsx', content);
