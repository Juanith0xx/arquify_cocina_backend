import { useRef, useState, useEffect } from 'react';
import { useStore } from '../store';
import { useKitchenStore } from '../store/kitchenStore';
import { useAdminStore } from '../store/adminStore';
import { DoubleSide } from 'three';
import { Edges } from '@react-three/drei';
import * as THREE from 'three';
import { useStudioRender } from './common/StudioRenderContext';

interface BoardProps {
  textureUrl?: string;
  materialType?: 'melamina' | 'hpl';
  position: [number, number, number];
  args: [number, number, number];
  color?: string;
  transparent?: boolean;
  opacity?: number;
  isFrontPanel?: boolean; // NUEVO: Identificador de veta continua
  isShelf?: boolean; // Repisa: cara superior (+Y) siempre es la cara vista HPL
  grainDirection?: 'vertical' | 'horizontal';
  hplBalancerOverride?: boolean;
  globalPosition?: [number, number, number];
}

export function Board({ position, args, color, textureUrl, materialType, transparent, opacity, isFrontPanel, isShelf, grainDirection, hplBalancerOverride, globalPosition }: BoardProps) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  
  const { settings } = useStudioRender();
  const isStudioRendering = settings.isRenderingMode && settings.hideEdges;
  const closetModules = useStore(state => state.modules);
  const kitchenCabinets = useKitchenStore(state => state.cabinets);
  const totalWidth = closetModules.length > 0 
    ? closetModules.reduce((sum, m) => sum + m.width, 0)
    : kitchenCabinets.reduce((sum, m) => sum + m.width, 0);

  useEffect(() => {
    let currentTexture: THREE.Texture | null = null;
    let isActive = true;

    if (textureUrl) {
      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin("anonymous");
      loader.load(textureUrl, (tex) => {
        if (!isActive) {
          tex.dispose();
          return;
        }
        
        const clonedTex = tex.clone();
        // NUNCA usar MirroredRepeatWrapping: evita duplicación en espejo e inversión de cabeza
        clonedTex.wrapS = THREE.RepeatWrapping;
        clonedTex.wrapT = THREE.RepeatWrapping;
        
        const img = clonedTex.image;
        const imgAspect = img && img.width > 0 ? (img.height / img.width) : 1;
        
        // Consultar si es una textura personalizada o HPL de autor registrada en el Back Office
        const adminTextures = useAdminStore.getState().textures || [];
        const customItem = adminTextures.find(
          t => t.url === textureUrl || t.previewUrl === textureUrl
        ) as any;
        const isHpl = materialType === "hpl" || (customItem && (customItem.category === 'hpl_autor' || customItem.brand?.toLowerCase().includes('abet')));
        
        // Dimensiones estándar reales del tablero/plancha (cm):
        // HPL: estándar ~130 x 305 cm
        // Melamina: formato industrial comercial estándar de 183 x 250 cm
        const dim1 = customItem?.sheetWidthM ? customItem.sheetWidthM * 100 : (isHpl ? 130 : 183);
        const dim2 = customItem?.sheetHeightM ? customItem.sheetHeightM * 100 : (isHpl ? 305 : 250);
        const maxSheetDim = Math.max(dim1, dim2); // ej: 305 cm (HPL) o 250 cm (Melamina)
        const minSheetDim = Math.min(dim1, dim2); // ej: 130 cm (HPL) o 183 cm (Melamina)

        let realWidthCm = minSheetDim;
        let realHeightCm = maxSheetDim;

        if (img && img.width > 0 && img.height > 0) {
          if (img.width > img.height) {
            // Imagen horizontal / apaisada (ej: mural de autor 1600x689 o plancha acostada)
            realWidthCm = maxSheetDim;
            realHeightCm = Math.max(minSheetDim, maxSheetDim * imgAspect);
          } else {
            // Imagen vertical o cuadrada
            realHeightCm = maxSheetDim;
            realWidthCm = Math.max(minSheetDim, maxSheetDim / imgAspect);
          }
        }
        
        let mapWidth = args[0];
        let mapHeight = args[1];
        
        if (args[2] > args[1] && args[0] > args[1]) {
           mapWidth = args[0];
           mapHeight = args[2];
        }
        
        if (args[2] > args[0] && args[1] > args[0]) {
           mapWidth = args[2];
           mapHeight = args[1];
        }

        clonedTex.repeat.set(mapWidth / realWidthCm, mapHeight / realHeightCm);
        
        if (isFrontPanel) {
          // Anclaje de origen para proyección continua de tablero (Veta Corrida / Continuidad Frontal)
          let closetLeftX = -totalWidth / 2;
          if (kitchenCabinets.length > 0 && closetModules.length === 0) {
             const minX = Math.min(...kitchenCabinets.map(c => (c.position?.[0] ?? 0) - c.width/2));
             closetLeftX = isFinite(minX) ? minX : -totalWidth / 2;
          }

          const closetBottomY = 10;
          const actualX = globalPosition ? globalPosition[0] : position[0];
          const actualY = globalPosition ? globalPosition[1] : position[1];
          const boardLeftX = actualX - args[0] / 2;
          const boardBottomY = actualY - args[1] / 2;
          const offsetX = (boardLeftX - closetLeftX) / realWidthCm;
          const offsetY = (boardBottomY - closetBottomY) / realHeightCm;
          clonedTex.offset.set(offsetX, offsetY);
        } else if (isHpl && mapWidth > mapHeight && imgAspect >= 1) {
           clonedTex.rotation = Math.PI / 2;
        }

        if (grainDirection === "horizontal") {
           clonedTex.rotation = Math.PI / 2;
           clonedTex.center.set(0.5, 0.5);
           clonedTex.repeat.set(mapHeight / realWidthCm, mapWidth / realHeightCm);
        }

        clonedTex.needsUpdate = true;
        
        setTexture((prev) => {
          if (prev) prev.dispose();
          return clonedTex;
        });
        currentTexture = clonedTex;
      });
    } else {
      setTexture((prev) => {
        if (prev) prev.dispose();
        return null;
      });
    }

    return () => {
      isActive = false;
      if (currentTexture) currentTexture.dispose();
    };
  }, [textureUrl, materialType, args[0], args[1], args[2], position[0], position[1], position[2], totalWidth, isFrontPanel, grainDirection, globalPosition]);

  const storeColor = useStore((state) => state.structureColor);
  const isTransparentGlobal = useStore((state) => state.isTransparent);
  
  const finalColor = color || storeColor;
  const isTransp = transparent || isTransparentGlobal;
  const currentOpacity = isTransparentGlobal ? 0.3 : (opacity !== undefined ? opacity : 1);

  
  const storeHplBalancer = useStore((state) => state.hplBalancer);
  const hplBalancer = hplBalancerOverride !== undefined ? hplBalancerOverride : storeHplBalancer;
  
  const resolvedColor = !texture && (finalColor === '#ffffff' || finalColor === '#f8fafc') 
    ? '#edf2f7' 
    : (texture ? '#ffffff' : finalColor);

  // Consultar acabado (Extra Mate vs Extra Brillo) para adaptar roughness y metalness en 3D
  const adminTexturesList = useAdminStore.getState().textures || [];
  const matchedCustomTexture = adminTexturesList.find(
    t => (textureUrl && (t.url === textureUrl || t.previewUrl === textureUrl)) || 
         (finalColor && (t.url === finalColor || t.previewUrl === finalColor))
  );
  const finishStr = (matchedCustomTexture?.finish || '').toLowerCase();
  const isExtraMate = finishStr.includes('mate') || finishStr.includes('matt');
  const isExtraBrillo = finishStr.includes('brillo') || finishStr.includes('brilliant') || finishStr.includes('gloss');

  let activeRoughness = 0.85;
  let activeMetalness = 0.0;
  if (isExtraMate) {
    activeRoughness = 0.95; // Superficie polimérica mate sedosa
    activeMetalness = 0.0;
  } else if (isExtraBrillo) {
    activeRoughness = 0.05; // Espejo ultra brillante reflectivo
    activeMetalness = 0.12;
  }

  // Create array of 6 materials
  const baseMatProps = {
    color: resolvedColor,
    map: texture,
    side: DoubleSide,
    transparent: isTransp,
    opacity: currentOpacity,
    roughness: activeRoughness,
    metalness: activeMetalness,
    depthWrite: !isTransp,
  };

  const whiteMatProps = {
    color: '#edf2f7',
    map: null,
    side: DoubleSide,
    transparent: isTransp,
    opacity: currentOpacity,
    roughness: 0.85,
    metalness: 0.0,
    depthWrite: !isTransp,
  };

  let trascaraFace = -1;
  
  if (materialType === 'hpl' && hplBalancer) {
    // Heuristic to find the inner face
    if (args[0] < args[1] && args[0] < args[2]) {
      // Side wall (thickness along X)
      trascaraFace = position[0] < 0 ? 0 : 1; // Left side inner is +X (0), right side inner is -X (1)
    } else if (args[1] < args[0] && args[1] < args[2]) {
      // Horizontal panel / repisa (espesor en Y):
      // La cara superior (+Y, índice 2) es siempre la cara vista decorativa útil donde se apoyan objetos.
      // La trascara (papel balanceador 0.9mm) se ubica en la cara inferior (-Y, índice 3), nunca en la cara superior.
      trascaraFace = 3;
    } else if (args[2] < args[0] && args[2] < args[1]) {
      // Front/Back panel (thickness along Z)
      trascaraFace = position[2] > 0 ? 5 : 4; // Front door inner is -Z (5), back panel inner is +Z (4)
    }
    
    // Override for doors/fronts if they use isFrontPanel
    if (isFrontPanel) {
      trascaraFace = 5;
    }
    if (isShelf) {
      trascaraFace = 3;
    }
  }

  const faces = [0, 1, 2, 3, 4, 5];
  
  return (
    <mesh position={position} castShadow={!isTransp} receiveShadow={!isTransp}>
      <boxGeometry args={args} />
      {faces.map((idx) => {
        const props = idx === trascaraFace ? whiteMatProps : baseMatProps;
        return (
          <meshStandardMaterial 
            key={`${idx}-${texture ? texture.uuid : (props.color || 'solid')}-${idx === trascaraFace}-${props.roughness}`}
            attach={`material-${idx}`}
            color={props.color}
            map={props.map}
            side={props.side}
            transparent={props.transparent}
            opacity={props.opacity}
            roughness={props.roughness}
            metalness={props.metalness}
            depthWrite={props.depthWrite}
          />
        );
      })}
      {!isStudioRendering && (
        isTransparentGlobal ? (
          <Edges scale={1} threshold={15} color="#555555" />
        ) : (
          <Edges scale={1} threshold={15} color="#18181b" />
        )
      )}
    </mesh>
  );
}
