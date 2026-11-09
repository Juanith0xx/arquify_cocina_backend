import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useSpecialFurnitureStore, SPECIAL_COLORS, ABET_TEXTURES } from '../../store/specialFurnitureStore';

export function SpecialFurniture3D() {
  const {
    width,
    height,
    depth,
    thickness,
    legHeight,
    exteriorColor,
    backTexture,
    customBackTextureUrl,
    doorOpen,
    drawerOpen,
    showDimensions,
    isTransparent
  } = useSpecialFurnitureStore();

  const extColorConfig = SPECIAL_COLORS.find(c => c.id === exteriorColor) || SPECIAL_COLORS[0];
  const abetConfig = ABET_TEXTURES.find(t => t.id === backTexture);
  const effectiveTextureUrl = customBackTextureUrl || abetConfig?.url || (backTexture.startsWith('data:') || backTexture.startsWith('http') || backTexture.startsWith('/') ? backTexture : '/textures/abet-broccato-2831.svg');

  // Textures
  const [backTex, setBackTex] = useState<THREE.Texture | null>(null);
  const [woodTex, setWoodTex] = useState<THREE.Texture | null>(null);

  const bodyH = height - legHeight;
  const innerW = width - 2 * thickness;
  const innerH = bodyH - 2 * thickness;
  const innerD = depth - thickness;

  // Criterio exacto del configurador de closets (Board.tsx)
  useEffect(() => {
    let isActive = true;
    let currentTexture: THREE.Texture | null = null;

    if (effectiveTextureUrl) {
      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin("anonymous");
      loader.load(effectiveTextureUrl, (tex) => {
        if (!isActive) {
          tex.dispose();
          return;
        }

        const clonedTex = tex.clone();
        clonedTex.wrapS = THREE.RepeatWrapping;
        clonedTex.wrapT = THREE.RepeatWrapping;

        const img = clonedTex.image;
        const imgAspect = img && img.width > 0 ? (img.height / img.width) : (130 / 305);

        // Formato HPL estándar Abet Laminati: 130 cm x 305 cm
        let realWidthCm = 130;
        let realHeightCm = 305;
        if (img && img.width > 0 && img.height > 0) {
          if (img.width > img.height) {
            realWidthCm = 305;
            realHeightCm = Math.max(130, 305 * imgAspect);
          } else {
            realHeightCm = 305;
            realWidthCm = Math.max(130, 305 / imgAspect);
          }
        }

        const mapWidth = innerW;
        const mapHeight = innerH;

        clonedTex.repeat.set(mapWidth / realWidthCm, mapHeight / realHeightCm);
        
        // Centrado horizontal simétrico del motivo
        const offsetX = (1 - (mapWidth / realWidthCm)) / 2;
        clonedTex.offset.set(offsetX, 0);

        clonedTex.needsUpdate = true;

        setBackTex((prev) => {
          if (prev) prev.dispose();
          return clonedTex;
        });
        currentTexture = clonedTex;
      });
    } else {
      setBackTex((prev) => {
        if (prev) prev.dispose();
        return null;
      });
    }

    return () => {
      isActive = false;
      if (currentTexture) currentTexture.dispose();
    };
  }, [effectiveTextureUrl, innerW, innerH]);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load('/textures/light-wood-grain.svg', (t) => {
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(2, 2);
      setWoodTex(t);
    });
  }, []);

  // Smooth Animations
  const leftDoorRef = useRef<THREE.Group>(null);
  const rightDoorRef = useRef<THREE.Group>(null);
  const drawerRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    const targetAngle = doorOpen ? Math.PI * 0.55 : 0;
    if (leftDoorRef.current) {
      leftDoorRef.current.rotation.y = THREE.MathUtils.lerp(leftDoorRef.current.rotation.y, -targetAngle, delta * 8);
    }
    if (rightDoorRef.current) {
      rightDoorRef.current.rotation.y = THREE.MathUtils.lerp(rightDoorRef.current.rotation.y, targetAngle, delta * 8);
    }

    const targetDrawerZ = drawerOpen ? depth * 0.65 : 0;
    if (drawerRef.current) {
      drawerRef.current.position.z = THREE.MathUtils.lerp(drawerRef.current.position.z, targetDrawerZ, delta * 8);
    }
  });

  const bodyCenterY = legHeight + bodyH / 2;
  const drawerH = 19; // Altura del cajón intermedio
  const drawerY = bodyCenterY - 6; // Posicionado en el tercio inferior-medio tal cual la referencia
  
  // Tapa superior de repisa del cajón
  const drawerShelfTopY = drawerY + drawerH / 2 + thickness / 2;
  
  // Repisas de vidrio (superior e inferior)
  const upperGlassShelfY = drawerShelfTopY + (legHeight + bodyH - drawerShelfTopY) / 2;
  const lowerGlassShelfY = legHeight + thickness + (drawerY - drawerH / 2 - (legHeight + thickness)) / 2;

  // Puertas con marco delgado
  const doorWidth = (width - 0.4) / 2;
  const doorHeight = bodyH - 0.4;
  const frameW = 3.5; // Marco esbelto de 3.5 cm
  const frameThick = 2.0;

  // Materials
  const shellMat = (
    <meshStandardMaterial
      color={extColorConfig.hex}
      roughness={0.4}
      metalness={0.05}
      transparent={isTransparent}
      opacity={isTransparent ? 0.35 : 1.0}
    />
  );

  const woodMat = (
    <meshStandardMaterial
      color="#d4be9b"
      map={woodTex || undefined}
      roughness={0.5}
      metalness={0.04}
      transparent={isTransparent}
      opacity={isTransparent ? 0.45 : 1.0}
    />
  );

  const glassMat = (
    <meshPhysicalMaterial
      color="#ffffff"
      transmission={0.92}
      opacity={0.35}
      transparent={true}
      roughness={0.05}
      ior={1.52}
      thickness={0.6}
      reflectivity={0.9}
    />
  );

  const metalLegMat = (
    <meshStandardMaterial color="#1a1a1a" roughness={0.35} metalness={0.8} />
  );

  const chromeMat = (
    <meshStandardMaterial color="#f1f5f9" roughness={0.12} metalness={0.95} />
  );

  return (
    <group position={[0, 0, 0]}>
      {/* 1. CUERPO EXTERIOR (LATERALES, TECHO, BASE) */}
      {/* Lateral Izquierdo */}
      <mesh position={[-width / 2 + thickness / 2, bodyCenterY, 0]} castShadow receiveShadow>
        <boxGeometry args={[thickness, bodyH, depth]} />
        {shellMat}
      </mesh>
      {/* Lateral Derecho */}
      <mesh position={[width / 2 - thickness / 2, bodyCenterY, 0]} castShadow receiveShadow>
        <boxGeometry args={[thickness, bodyH, depth]} />
        {shellMat}
      </mesh>
      {/* Techo Superior */}
      <mesh position={[0, legHeight + bodyH - thickness / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[innerW, thickness, depth]} />
        {shellMat}
      </mesh>
      {/* Base Inferior */}
      <mesh position={[0, legHeight + thickness / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[innerW, thickness, depth]} />
        {shellMat}
      </mesh>

      {/* 2. FONDO TRASERO ABET LAMINATI EN PROPORCIÓN 130x305 CM */}
      <mesh position={[0, bodyCenterY, -depth / 2 + 0.3]} receiveShadow>
        <boxGeometry args={[innerW, innerH, 0.6]} />
        <meshStandardMaterial
          map={backTex || undefined}
          color={backTex ? '#ffffff' : '#25606C'}
          roughness={0.75}
          metalness={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 3. TAPA SUPERIOR DE REPISA DEL CAJÓN (MADERA CLARA) */}
      <mesh position={[0, drawerShelfTopY, 0]} castShadow receiveShadow>
        <boxGeometry args={[innerW, thickness, innerD]} />
        {woodMat}
      </mesh>

      {/* 4. REPISAS INTERIORES DE CRISTAL TEMPLADO */}
      {/* Repisa Superior de Cristal */}
      <group position={[0, upperGlassShelfY, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[innerW - 0.4, 0.6, innerD - 2]} />
          {glassMat}
        </mesh>
        {/* Soportes metálicos niquelados */}
        <mesh position={[-innerW / 2 + 0.3, -0.4, 7]}><cylinderGeometry args={[0.3, 0.3, 0.6, 8]} />{chromeMat}</mesh>
        <mesh position={[-innerW / 2 + 0.3, -0.4, -7]}><cylinderGeometry args={[0.3, 0.3, 0.6, 8]} />{chromeMat}</mesh>
        <mesh position={[innerW / 2 - 0.3, -0.4, 7]}><cylinderGeometry args={[0.3, 0.3, 0.6, 8]} />{chromeMat}</mesh>
        <mesh position={[innerW / 2 - 0.3, -0.4, -7]}><cylinderGeometry args={[0.3, 0.3, 0.6, 8]} />{chromeMat}</mesh>

        {/* Accesorios / Copas y Botellas referenciales (Tal cual foto) */}
        <group position={[-innerW / 4, 0.3, 0]}>
          {/* Botella 1 */}
          <mesh position={[-4, 7, 0]} castShadow>
            <cylinderGeometry args={[1.5, 1.5, 14, 16]} />
            <meshStandardMaterial color="#1e3a29" roughness={0.1} />
          </mesh>
          <mesh position={[-4, 15, 0]}>
            <cylinderGeometry args={[0.6, 1.2, 4, 16]} />
            <meshStandardMaterial color="#1e3a29" roughness={0.1} />
          </mesh>
          {/* Copa 1 */}
          <mesh position={[6, 5, 0]}>
            <cylinderGeometry args={[2.0, 0.2, 8, 16]} />
            <meshPhysicalMaterial color="#ffffff" transmission={0.9} transparent opacity={0.4} roughness={0.1} />
          </mesh>
        </group>
      </group>

      {/* Repisa Inferior de Cristal */}
      <group position={[0, lowerGlassShelfY, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[innerW - 0.4, 0.6, innerD - 2]} />
          {glassMat}
        </mesh>
        <mesh position={[-innerW / 2 + 0.3, -0.4, 7]}><cylinderGeometry args={[0.3, 0.3, 0.6, 8]} />{chromeMat}</mesh>
        <mesh position={[-innerW / 2 + 0.3, -0.4, -7]}><cylinderGeometry args={[0.3, 0.3, 0.6, 8]} />{chromeMat}</mesh>
        <mesh position={[innerW / 2 - 0.3, -0.4, 7]}><cylinderGeometry args={[0.3, 0.3, 0.6, 8]} />{chromeMat}</mesh>
        <mesh position={[innerW / 2 - 0.3, -0.4, -7]}><cylinderGeometry args={[0.3, 0.3, 0.6, 8]} />{chromeMat}</mesh>

        {/* Libros referenciales en repisa inferior */}
        <group position={[-innerW / 3.5, 5, 0]}>
          <mesh position={[0, 0, 0]} rotation={[0, 0, 0.1]} castShadow>
            <boxGeometry args={[3, 10, 14]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
          <mesh position={[3.5, 0, 0]} castShadow>
            <boxGeometry args={[3.2, 9.5, 13.5]} />
            <meshStandardMaterial color="#c2410c" />
          </mesh>
          <mesh position={[7, 0, 0]} castShadow>
            <boxGeometry args={[2.8, 10.5, 14]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
        </group>
      </group>

      {/* 5. CAJÓN CENTRAL EN MELAMINA MADERA CLARA */}
      <group position={[0, drawerY, 0]} ref={drawerRef}>
        {/* Frente de cajón visible */}
        <mesh position={[0, 0, depth / 2 - 0.9]} castShadow receiveShadow>
          <boxGeometry args={[innerW - 0.4, drawerH - 0.4, 1.8]} />
          {woodMat}
        </mesh>
        {/* Caja interior del cajón */}
        <group position={[0, -1.5, -1]}>
          {/* Fondo cajón */}
          <mesh position={[0, -drawerH / 2 + 2, 0]}>
            <boxGeometry args={[innerW - 5, 0.6, innerD - 5]} />
            <meshStandardMaterial color="#f0ede6" />
          </mesh>
          {/* Laterales caja */}
          <mesh position={[-innerW / 2 + 2.8, 0, 0]}>
            <boxGeometry args={[1.5, drawerH - 4.5, innerD - 5]} />
            <meshStandardMaterial color="#d1cac0" />
          </mesh>
          <mesh position={[innerW / 2 - 2.8, 0, 0]}>
            <boxGeometry args={[1.5, drawerH - 4.5, innerD - 5]} />
            <meshStandardMaterial color="#d1cac0" />
          </mesh>
          {/* Trasera caja */}
          <mesh position={[0, 0, -innerD / 2 + 2.8]}>
            <boxGeometry args={[innerW - 8, drawerH - 4.5, 1.5]} />
            <meshStandardMaterial color="#d1cac0" />
          </mesh>
          {/* Frontal interior (Contrafrente) caja */}
          <mesh position={[0, 0, innerD / 2 - 2.8]}>
            <boxGeometry args={[innerW - 8, drawerH - 4.5, 1.5]} />
            <meshStandardMaterial color="#d1cac0" />
          </mesh>
        </group>
      </group>

      {/* 6. PUERTAS CON MARCO DELGADO DE MADERA (3.5 CM) Y VIDRIO */}
      {/* Puerta Izquierda */}
      <group position={[-width / 2 + 0.2, bodyCenterY, depth / 2]} ref={leftDoorRef}>
        <group position={[doorWidth / 2, 0, 0]}>
          {/* Marco Superior */}
          <mesh position={[0, doorHeight / 2 - frameW / 2, 0]} castShadow>
            <boxGeometry args={[doorWidth, frameW, frameThick]} />
            {woodMat}
          </mesh>
          {/* Marco Inferior */}
          <mesh position={[0, -doorHeight / 2 + frameW / 2, 0]} castShadow>
            <boxGeometry args={[doorWidth, frameW, frameThick]} />
            {woodMat}
          </mesh>
          {/* Marco Lateral Izquierdo */}
          <mesh position={[-doorWidth / 2 + frameW / 2, 0, 0]} castShadow>
            <boxGeometry args={[frameW, doorHeight - 2 * frameW, frameThick]} />
            {woodMat}
          </mesh>
          {/* Marco Lateral Derecho */}
          <mesh position={[doorWidth / 2 - frameW / 2, 0, 0]} castShadow>
            <boxGeometry args={[frameW, doorHeight - 2 * frameW, frameThick]} />
            {woodMat}
          </mesh>
          {/* Cristal Interior */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[doorWidth - 2 * frameW + 0.8, doorHeight - 2 * frameW + 0.8, 0.4]} />
            {glassMat}
          </mesh>
          {/* Tirador Vertical Negro Delgado (Ubicado según foto referencia) */}
          <mesh position={[doorWidth / 2 - frameW / 2, 4, frameThick / 2 + 0.8]} castShadow>
            <boxGeometry args={[0.8, 30, 0.8]} />
            {metalLegMat}
          </mesh>
        </group>
      </group>

      {/* Puerta Derecha */}
      <group position={[width / 2 - 0.2, bodyCenterY, depth / 2]} ref={rightDoorRef}>
        <group position={[-doorWidth / 2, 0, 0]}>
          {/* Marco Superior */}
          <mesh position={[0, doorHeight / 2 - frameW / 2, 0]} castShadow>
            <boxGeometry args={[doorWidth, frameW, frameThick]} />
            {woodMat}
          </mesh>
          {/* Marco Inferior */}
          <mesh position={[0, -doorHeight / 2 + frameW / 2, 0]} castShadow>
            <boxGeometry args={[doorWidth, frameW, frameThick]} />
            {woodMat}
          </mesh>
          {/* Marco Lateral Izquierdo */}
          <mesh position={[-doorWidth / 2 + frameW / 2, 0, 0]} castShadow>
            <boxGeometry args={[frameW, doorHeight - 2 * frameW, frameThick]} />
            {woodMat}
          </mesh>
          {/* Marco Lateral Derecho */}
          <mesh position={[doorWidth / 2 - frameW / 2, 0, 0]} castShadow>
            <boxGeometry args={[frameW, doorHeight - 2 * frameW, frameThick]} />
            {woodMat}
          </mesh>
          {/* Cristal Interior */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[doorWidth - 2 * frameW + 0.8, doorHeight - 2 * frameW + 0.8, 0.4]} />
            {glassMat}
          </mesh>
          {/* Tirador Vertical Negro Delgado */}
          <mesh position={[-doorWidth / 2 + frameW / 2, 4, frameThick / 2 + 0.8]} castShadow>
            <boxGeometry args={[0.8, 30, 0.8]} />
            {metalLegMat}
          </mesh>
        </group>
      </group>

      {/* 7. BASE METÁLICA CON PATAS DE ACERO NEGRO Y REGATONES CROMADOS (CON ALTO CONTRASTE) */}
      {/* El tubo vertical pasa completamente por el lado exterior de los paneles laterales del mueble */}
      <group position={[0, 0, 0]}>
        {/* Bastidor inferior horizontal que sostiene la base del mueble por debajo */}
        <mesh position={[0, legHeight - 1.25, -depth / 2 + 3.5]} castShadow>
          <boxGeometry args={[width, 2.5, 2.5]} />
          {metalLegMat}
        </mesh>
        <mesh position={[0, legHeight - 1.25, depth / 2 - 3.5]} castShadow>
          <boxGeometry args={[width, 2.5, 2.5]} />
          {metalLegMat}
        </mesh>
        {/* Travesaños laterales inferiores soldados entre las patas exteriores */}
        <mesh position={[-width / 2 - 1.25, legHeight - 1.25, 0]} castShadow>
          <boxGeometry args={[2.5, 2.5, depth - 7]} />
          {metalLegMat}
        </mesh>
        <mesh position={[width / 2 + 1.25, legHeight - 1.25, 0]} castShadow>
          <boxGeometry args={[2.5, 2.5, depth - 7]} />
          {metalLegMat}
        </mesh>

        {/* 4 Patas verticales de tubo de acero cuadrado negro situadas POR FUERA de las caras laterales del mueble */}
        {[
          { x: -width / 2 - 1.25, z: depth / 2 - 3.5 },
          { x: -width / 2 - 1.25, z: -depth / 2 + 3.5 },
          { x: width / 2 + 1.25, z: depth / 2 - 3.5 },
          { x: width / 2 + 1.25, z: -depth / 2 + 3.5 },
        ].map((leg, i) => (
          <group key={i} position={[leg.x, 0, leg.z]}>
            {/* Tubo cuadrado de acero negro que se eleva por fuera del panel lateral */}
            <mesh position={[0, (legHeight + 14) / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[2.5, legHeight + 14, 2.5]} />
              {metalLegMat}
            </mesh>
            {/* Regatón articulado regulable cromado en la base */}
            <mesh position={[0, 0.8, 0]} castShadow>
              <cylinderGeometry args={[1.8, 1.8, 0.6, 16]} />
              {chromeMat}
            </mesh>
            <mesh position={[0, 1.6, 0]}>
              <cylinderGeometry args={[0.5, 0.5, 1.0, 8]} />
              {chromeMat}
            </mesh>
          </group>
        ))}
      </group>

      {/* 8. COTAS DE DIMENSIÓN 3D */}
      {showDimensions && (
        <group>
          {/* Cota de Ancho Superior */}
          <group position={[0, height + 8, depth / 2]}>
            <mesh>
              <boxGeometry args={[width, 0.15, 0.15]} />
              <meshBasicMaterial color="#ea580c" />
            </mesh>
            <Text position={[0, 3.5, 0]} fontSize={4.2} color="#ea580c" anchorX="center" anchorY="bottom">
              {`${width} cm`}
            </Text>
          </group>
          {/* Cota de Alto Lateral */}
          <group position={[width / 2 + 8, height / 2, depth / 2]}>
            <mesh>
              <boxGeometry args={[0.15, height, 0.15]} />
              <meshBasicMaterial color="#ea580c" />
            </mesh>
            <Text position={[3.5, 0, 0]} fontSize={4.2} color="#ea580c" anchorX="left" anchorY="middle" rotation={[0, 0, -Math.PI / 2]}>
              {`${height} cm`}
            </Text>
          </group>
          {/* Cota de Fondo */}
          <group position={[-width / 2 - 8, bodyCenterY, 0]}>
            <mesh rotation={[0, 0, 0]}>
              <boxGeometry args={[0.15, 0.15, depth]} />
              <meshBasicMaterial color="#ea580c" />
            </mesh>
            <Text position={[-3, 0, 0]} fontSize={3.8} color="#ea580c" anchorX="right" anchorY="middle">
              {`${depth} cm`}
            </Text>
          </group>
        </group>
      )}
    </group>
  );
}
