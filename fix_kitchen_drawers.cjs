const fs = require('fs');
let code = fs.readFileSync('src/components/kitchen/Cabinet.tsx', 'utf8');

// Add imports
if (!code.includes('useFrame')) {
  code = code.replace("import React from 'react';", "import React, { useState, useRef, useEffect } from 'react';\nimport * as THREE from 'three';\nimport { useFrame } from '@react-three/fiber';\nimport { useCursor } from '@react-three/drei';");
}

// Add AnimatedDrawer
if (!code.includes('function AnimatedDrawer')) {
  const animatedDrawer = `
function AnimatedDrawer({ children, openZOffset, forceOpen, onClickAction }: { children: React.ReactNode, openZOffset: number, forceOpen?: boolean, onClickAction?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  
  useCursor(hovered);

  useEffect(() => {
    if (forceOpen !== undefined) setIsOpen(forceOpen);
  }, [forceOpen]);
  
  useFrame((state, delta) => {
    if (groupRef.current) {
      const targetZ = isOpen ? openZOffset : 0;
      groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, delta * 4);
    }
  });

  return (
    <group 
      ref={groupRef}
      onClick={(e) => { 
        e.stopPropagation(); 
        setIsOpen(!isOpen); 
        if(onClickAction) onClickAction(); 
      }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
    >
      {children}
    </group>
  );
}
`;
  code = code.replace("export function Cabinet", animatedDrawer + "\nexport function Cabinet");
}

fs.writeFileSync('src/components/kitchen/Cabinet.tsx', code);
