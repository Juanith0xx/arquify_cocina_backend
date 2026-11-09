import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import {
  useChairStore,
  CHAIR_LEGS_COLORS,
  ABET_LAMINATI_CATALOG,
} from '../../store/chairStore';
import { useAdminStore } from '../../store/adminStore';

// Helper to get material properties and texture
function useLaminateMaterial(laminateId: string) {
  const customTextures = useChairStore((state) => state.customTextures);
  const adminTextures = useAdminStore((state) => state.textures);

  return useMemo(() => {
    // 1. Check if it's a chairStore custom texture
    const custom = customTextures.find((t) => t.id === laminateId);
    if (custom) {
      const loader = new THREE.TextureLoader();
      const tex = loader.load(custom.dataUrl);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(1.2, 1.2);
      return {
        color: '#FFFFFF',
        map: tex,
        roughness: 0.35,
        metalness: 0.05,
      };
    }

    // 2. Check if it's an adminStore custom texture from Backoffice
    const adminTex = adminTextures.find((t) => t.id === laminateId);
    if (adminTex) {
      const loader = new THREE.TextureLoader();
      const url = adminTex.url || adminTex.previewUrl;
      const tex = loader.load(url);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(1.2, 1.2);
      return {
        color: '#FFFFFF',
        map: tex,
        roughness: 0.35,
        metalness: 0.05,
      };
    }

    // 3. Check ABET Laminati Catalog
    const item = ABET_LAMINATI_CATALOG.find((c) => c.id === laminateId) || ABET_LAMINATI_CATALOG[0];

    if (item.isTexture && item.textureUrl) {
      const loader = new THREE.TextureLoader();
      const tex = loader.load(item.textureUrl);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(1.5, 1.5);
      return {
        color: item.hex || '#FFFFFF',
        map: tex,
        roughness: 0.4,
        metalness: 0.05,
      };
    }

    return {
      color: item.hex,
      map: undefined,
      roughness: 0.35,
      metalness: 0.05,
    };
  }, [laminateId, customTextures, adminTextures]);
}

// Terciado Natural (Wood Grain Texture) for underside
function usePlywoodNaturalMaterial() {
  return useMemo(() => {
    const loader = new THREE.TextureLoader();
    const tex = loader.load('/textures/light-wood-grain.svg');
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1.5, 1.5);
    return {
      color: '#d6ba94',
      map: tex,
      roughness: 0.6,
      metalness: 0.02,
    };
  }, []);
}

// Plywood Edge Texture for cut edge
function usePlywoodEdgeMaterial() {
  return useMemo(() => {
    const loader = new THREE.TextureLoader();
    const tex = loader.load('/textures/plywood-edge.svg');
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4.0, 1.0);
    return {
      color: '#e2cca9',
      map: tex,
      roughness: 0.65,
      metalness: 0.02,
    };
  }, []);
}

/**
 * Generates an ergonomically double-curved 3D molded plywood seat geometry.
 * Exact specifications from Plano Proyecto Hormiga (Plano Asiento):
 * - Width: 446mm (X: -0.223 to 0.223), Depth: 431mm (Z: -0.2155 to 0.2155), Thickness: 12mm
 * - Contorno anatómico: R604 frontal, R126 esquinas frontales, R428 laterales, R148 esquinas traseras, R443 trasero.
 * - Batea transversal: Radio R2264 con flecha 10mm.
 * - Caída frontal waterfall con flecha 21mm.
 */
function createCurvedSeatGeometries() {
  const width = 0.446;
  const depth = 0.431;
  const thickness = 0.012;
  const halfT = thickness / 2;

  const nx = 40;
  const nz = 40;

  const evaluateSeatPoint = (u: number, v: number) => {
    let rawX = (u - 0.5) * width;
    let rawZ = (v - 0.5) * depth;

    // Compound rounded contours based on CAD radii (Front R126, Rear R148)
    const isFront = rawZ > 0;
    const cornerR = isFront ? 0.065 : 0.075;
    const maxInnerX = width / 2 - cornerR;
    const maxInnerZ = depth / 2 - cornerR;
    const absX = Math.abs(rawX);
    const absZ = Math.abs(rawZ);

    if (absX > maxInnerX && absZ > maxInnerZ) {
      const dx = absX - maxInnerX;
      const dz = absZ - maxInnerZ;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > cornerR) {
        const factor = cornerR / dist;
        rawX = Math.sign(rawX) * (maxInnerX + dx * factor);
        rawZ = Math.sign(rawZ) * (maxInnerZ + dz * factor);
      }
    }

    const xNorm = rawX / (width / 2); // -1 to 1
    const zNorm = rawZ / (depth / 2); // -1 to 1 (rear to front)

    // Transverse concave dishing (R2264, flecha 10 mm)
    const dishY = -0.010 * (1 - Math.pow(xNorm, 2));

    // Longitudinal waterfall roll (front drop flecha 21 mm)
    let waterfallY = 0;
    if (rawZ > 0.02) {
      const wFrac = (rawZ - 0.02) / (depth / 2 - 0.02);
      waterfallY = -0.021 * Math.pow(wFrac, 2.0);
    }

    // Rear anatomical lift (flecha 6 mm)
    let rearLiftY = 0;
    if (rawZ < -0.05) {
      const rFrac = (-0.05 - rawZ) / (depth / 2 - 0.05);
      rearLiftY = 0.007 * Math.pow(rFrac, 2.0);
    }

    // Gentle seat comfort slope (-2.5°)
    const tiltY = -0.016 * rawZ;

    const y = dishY + waterfallY + rearLiftY + tiltY;
    return new THREE.Vector3(rawX, y, rawZ);
  };

  // 1. TOP FACE GEOMETRY (Abet Laminati - Caras hacia arriba +Y)
  const topPositions: number[] = [];
  const topUvs: number[] = [];
  const topIndices: number[] = [];

  for (let j = 0; j <= nz; j++) {
    const v = j / nz;
    for (let i = 0; i <= nx; i++) {
      const u = i / nx;
      const pt = evaluateSeatPoint(u, v);
      topPositions.push(pt.x, pt.y + halfT, pt.z);
      topUvs.push(u, 1 - v);
    }
  }

  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i;
      const b = j * (nx + 1) + (i + 1);
      const c = (j + 1) * (nx + 1) + i;
      const d = (j + 1) * (nx + 1) + (i + 1);
      topIndices.push(a, c, d);
      topIndices.push(a, d, b);
    }
  }

  const topGeo = new THREE.BufferGeometry();
  topGeo.setAttribute('position', new THREE.Float32BufferAttribute(topPositions, 3));
  topGeo.setAttribute('uv', new THREE.Float32BufferAttribute(topUvs, 2));
  topGeo.setIndex(topIndices);
  topGeo.computeVertexNormals();

  // 2. BOTTOM FACE GEOMETRY (Madera Terciada Natural - Caras hacia abajo -Y)
  const botPositions: number[] = [];
  const botUvs: number[] = [];
  const botIndices: number[] = [];

  for (let j = 0; j <= nz; j++) {
    const v = j / nz;
    for (let i = 0; i <= nx; i++) {
      const u = i / nx;
      const pt = evaluateSeatPoint(u, v);
      botPositions.push(pt.x, pt.y - halfT, pt.z);
      botUvs.push(u, v);
    }
  }

  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i;
      const b = j * (nx + 1) + (i + 1);
      const c = (j + 1) * (nx + 1) + i;
      const d = (j + 1) * (nx + 1) + (i + 1);
      botIndices.push(a, b, d);
      botIndices.push(a, d, c);
    }
  }

  const bottomGeo = new THREE.BufferGeometry();
  bottomGeo.setAttribute('position', new THREE.Float32BufferAttribute(botPositions, 3));
  bottomGeo.setAttribute('uv', new THREE.Float32BufferAttribute(botUvs, 2));
  bottomGeo.setIndex(botIndices);
  bottomGeo.computeVertexNormals();

  // 3. PERIMETER EDGE GEOMETRY (Canto Multilaminar 12mm)
  const edgePositions: number[] = [];
  const edgeUvs: number[] = [];
  const edgeIndices: number[] = [];

  const perimeterCoords: { u: number; v: number }[] = [];
  for (let i = 0; i <= nx; i++) perimeterCoords.push({ u: i / nx, v: 0 });
  for (let j = 1; j <= nz; j++) perimeterCoords.push({ u: 1, v: j / nz });
  for (let i = nx - 1; i >= 0; i--) perimeterCoords.push({ u: i / nx, v: 1 });
  for (let j = nz - 1; j >= 1; j--) perimeterCoords.push({ u: 0, v: j / nz });

  const numPerim = perimeterCoords.length;
  for (let k = 0; k < numPerim; k++) {
    const { u, v } = perimeterCoords[k];
    const pt = evaluateSeatPoint(u, v);
    const uCoord = (k / numPerim) * 4.0;

    edgePositions.push(pt.x, pt.y + halfT, pt.z);
    edgeUvs.push(uCoord, 1);

    edgePositions.push(pt.x, pt.y - halfT, pt.z);
    edgeUvs.push(uCoord, 0);
  }

  for (let k = 0; k < numPerim; k++) {
    const nextK = (k + 1) % numPerim;
    const topA = k * 2;
    const botA = k * 2 + 1;
    const topB = nextK * 2;
    const botB = nextK * 2 + 1;

    edgeIndices.push(topA, topB, botB);
    edgeIndices.push(topA, botB, botA);
  }

  const edgeGeo = new THREE.BufferGeometry();
  edgeGeo.setAttribute('position', new THREE.Float32BufferAttribute(edgePositions, 3));
  edgeGeo.setAttribute('uv', new THREE.Float32BufferAttribute(edgeUvs, 2));
  edgeGeo.setIndex(edgeIndices);
  edgeGeo.computeVertexNormals();

  return { topGeo, bottomGeo, edgeGeo };
}

/**
 * Generates exact 3D molded curved backrest based on Plano Respaldo:
 * - Width: 461mm (cuerda frontal 447mm), Height: 219mm, Thickness: 12mm
 * - Cylindrical Curve: R = 396mm (R396) with flecha of 69mm!
 * - Top Corners: R56, Bottom Corners: R111 (wide ergonomic curve).
 * - Upper top edge arch: R2315.
 * - 4 Inox rivets spaced 342mm horizontally, 34mm vertically.
 */
function createCurvedBackrestGeometries() {
  const width = 0.461;
  const height = 0.219;
  const thickness = 0.012;
  const halfT = thickness / 2;
  const radiusCyl = 0.396; // R396 from blueprint

  const nx = 40;
  const ny = 30;

  const evaluateBackPoint = (u: number, v: number) => {
    let rawX = (u - 0.5) * width;
    let rawY = (v - 0.5) * height;

    // Asymmetrical top (R56) and bottom (R111) corner rounding
    const isTop = rawY > 0;
    const cornerR = isTop ? 0.056 : 0.085;
    const maxInnerX = width / 2 - cornerR;
    const maxInnerY = height / 2 - cornerR;
    const absX = Math.abs(rawX);
    const absY = Math.abs(rawY);

    if (absX > maxInnerX && absY > maxInnerY) {
      const dx = absX - maxInnerX;
      const dy = absY - maxInnerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > cornerR) {
        const factor = cornerR / dist;
        rawX = Math.sign(rawX) * (maxInnerX + dx * factor);
        rawY = Math.sign(rawY) * (maxInnerY + dy * factor);
      }
    }

    // Exact cylindrical curvature R396 (flecha 69mm at sides, wrapping forward +Z)
    const clampedX = Math.min(Math.abs(rawX), radiusCyl * 0.98);
    const wrapZ = radiusCyl - Math.sqrt(radiusCyl * radiusCyl - clampedX * clampedX);

    // Subtle crown on top edge (R2315)
    const crownY = isTop ? 0.003 * Math.cos((rawX / (width / 2)) * Math.PI * 0.5) : 0;

    return new THREE.Vector3(rawX, rawY + crownY, wrapZ);
  };

  // 1. FRONT FACE GEOMETRY (Abet Laminati - Caras hacia el frente +Z)
  const frontPositions: number[] = [];
  const frontUvs: number[] = [];
  const frontIndices: number[] = [];

  for (let j = 0; j <= ny; j++) {
    const v = j / ny;
    for (let i = 0; i <= nx; i++) {
      const u = i / nx;
      const pt = evaluateBackPoint(u, v);
      frontPositions.push(pt.x, pt.y, pt.z + halfT);
      frontUvs.push(u, v);
    }
  }

  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i;
      const b = j * (nx + 1) + (i + 1);
      const c = (j + 1) * (nx + 1) + i;
      const d = (j + 1) * (nx + 1) + (i + 1);
      frontIndices.push(a, b, d);
      frontIndices.push(a, d, c);
    }
  }

  const frontGeo = new THREE.BufferGeometry();
  frontGeo.setAttribute('position', new THREE.Float32BufferAttribute(frontPositions, 3));
  frontGeo.setAttribute('uv', new THREE.Float32BufferAttribute(frontUvs, 2));
  frontGeo.setIndex(frontIndices);
  frontGeo.computeVertexNormals();

  // 2. REAR FACE GEOMETRY (Dorso - Caras hacia atrás -Z)
  const rearPositions: number[] = [];
  const rearUvs: number[] = [];
  const rearIndices: number[] = [];

  for (let j = 0; j <= ny; j++) {
    const v = j / ny;
    for (let i = 0; i <= nx; i++) {
      const u = i / nx;
      const pt = evaluateBackPoint(u, v);
      rearPositions.push(pt.x, pt.y, pt.z - halfT);
      rearUvs.push(1 - u, v);
    }
  }

  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i;
      const b = j * (nx + 1) + (i + 1);
      const c = (j + 1) * (nx + 1) + i;
      const d = (j + 1) * (nx + 1) + (i + 1);
      rearIndices.push(a, d, b);
      rearIndices.push(a, c, d);
    }
  }

  const rearGeo = new THREE.BufferGeometry();
  rearGeo.setAttribute('position', new THREE.Float32BufferAttribute(rearPositions, 3));
  rearGeo.setAttribute('uv', new THREE.Float32BufferAttribute(rearUvs, 2));
  rearGeo.setIndex(rearIndices);
  rearGeo.computeVertexNormals();

  // 3. PERIMETER EDGE GEOMETRY (Canto 12mm)
  const edgePositions: number[] = [];
  const edgeUvs: number[] = [];
  const edgeIndices: number[] = [];

  const perimeterCoords: { u: number; v: number }[] = [];
  for (let i = 0; i <= nx; i++) perimeterCoords.push({ u: i / nx, v: 0 });
  for (let j = 1; j <= ny; j++) perimeterCoords.push({ u: 1, v: j / ny });
  for (let i = nx - 1; i >= 0; i--) perimeterCoords.push({ u: i / nx, v: 1 });
  for (let j = ny - 1; j >= 1; j--) perimeterCoords.push({ u: 0, v: j / ny });

  const numPerim = perimeterCoords.length;
  for (let k = 0; k < numPerim; k++) {
    const { u, v } = perimeterCoords[k];
    const pt = evaluateBackPoint(u, v);
    const uCoord = (k / numPerim) * 4.0;

    edgePositions.push(pt.x, pt.y, pt.z + halfT);
    edgeUvs.push(uCoord, 1);

    edgePositions.push(pt.x, pt.y, pt.z - halfT);
    edgeUvs.push(uCoord, 0);
  }

  for (let k = 0; k < numPerim; k++) {
    const nextK = (k + 1) % numPerim;
    const topA = k * 2;
    const botA = k * 2 + 1;
    const topB = nextK * 2;
    const botB = nextK * 2 + 1;

    edgeIndices.push(topA, topB, botB);
    edgeIndices.push(topA, botB, botA);
  }

  const edgeGeo = new THREE.BufferGeometry();
  edgeGeo.setAttribute('position', new THREE.Float32BufferAttribute(edgePositions, 3));
  edgeGeo.setAttribute('uv', new THREE.Float32BufferAttribute(edgeUvs, 2));
  edgeGeo.setIndex(edgeIndices);
  edgeGeo.computeVertexNormals();

  return { frontGeo, rearGeo, edgeGeo };
}

export function ChairModel() {
  const frameStyle = useChairStore((state) => state.frameStyle || 'classic_4legs');
  const legsColorKey = useChairStore((state) => state.legsColor);
  const seatLaminateId = useChairStore((state) => state.seatLaminateId);
  const backrestFrontLaminateId = useChairStore((state) => state.backrestFrontLaminateId);
  const backrestRearLaminateId = useChairStore((state) => state.backrestRearLaminateId);
  const showDimensions3D = useChairStore((state) => state.showDimensions3D);
  const explodedView = useChairStore((state) => state.explodedView);
  const customObjText = useChairStore((state) => state.customObjText);
  const customObjName = useChairStore((state) => state.customObjName);

  const legsConfig = CHAIR_LEGS_COLORS[legsColorKey] || CHAIR_LEGS_COLORS.azul_petroleo;

  const seatTopMat = useLaminateMaterial(seatLaminateId);
  const seatBottomMat = usePlywoodNaturalMaterial();
  const plywoodEdgeMat = usePlywoodEdgeMaterial();
  const backFrontMat = useLaminateMaterial(backrestFrontLaminateId);
  const backRearMat = useLaminateMaterial(backrestRearLaminateId);

  // Parse custom OBJ if uploaded
  const parsedCustomObj = useMemo(() => {
    if (!customObjText) return null;
    try {
      const loader = new OBJLoader();
      const obj = loader.parse(customObjText);
      const box = new THREE.Box3().setFromObject(obj);
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      if (maxDim > 0) {
        const scaleFactor = 0.8 / maxDim;
        obj.scale.set(scaleFactor, scaleFactor, scaleFactor);
        obj.updateMatrixWorld(true);
        const newBox = new THREE.Box3().setFromObject(obj);
        const center = new THREE.Vector3();
        newBox.getCenter(center);
        obj.position.sub(center);
        obj.position.y += 0.45;
      }
      return obj;
    } catch (e) {
      console.error('Error parsing custom OBJ:', e);
      return null;
    }
  }, [customObjText]);

  React.useEffect(() => {
    if (!parsedCustomObj) return;

    const meshes: { mesh: THREE.Mesh; center: THREE.Vector3; name: string }[] = [];
    parsedCustomObj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const box = new THREE.Box3().setFromObject(mesh);
        const center = new THREE.Vector3();
        box.getCenter(center);
        meshes.push({ mesh, center, name: (mesh.name || '').toLowerCase() });
      }
    });

    if (meshes.length === 0) return;

    const minY = Math.min(...meshes.map(m => m.center.y));
    const maxY = Math.max(...meshes.map(m => m.center.y));
    const totalHeightSpan = maxY - minY || 1;

    meshes.forEach(({ mesh, center, name }) => {
      const isLegKeyword =
        name.includes('leg') ||
        name.includes('pata') ||
        name.includes('tubo') ||
        name.includes('metal') ||
        name.includes('frame') ||
        name.includes('base') ||
        name.includes('structure') ||
        name.includes('fierro') ||
        name.includes('steel') ||
        name.includes('patas');

      const isBackKeyword =
        name.includes('back') ||
        name.includes('respaldo') ||
        name.includes('backrest') ||
        name.includes('dorso') ||
        name.includes('rear');

      const isSeatKeyword =
        name.includes('seat') ||
        name.includes('asiento') ||
        name.includes('cushion') ||
        name.includes('top');

      let assignedPart: 'legs' | 'seat' | 'back' = 'seat';

      if (isLegKeyword) {
        assignedPart = 'legs';
      } else if (isBackKeyword) {
        assignedPart = 'back';
      } else if (isSeatKeyword) {
        assignedPart = 'seat';
      } else {
        const normalizedY = (center.y - minY) / totalHeightSpan;
        if (normalizedY < 0.35) {
          assignedPart = 'legs';
        } else if (normalizedY > 0.65) {
          assignedPart = 'back';
        } else {
          assignedPart = 'seat';
        }
      }

      if (assignedPart === 'legs') {
        mesh.material = new THREE.MeshStandardMaterial({
          color: legsConfig.hex,
          metalness: legsConfig.metalness,
          roughness: legsConfig.roughness,
        });
      } else if (assignedPart === 'back') {
        mesh.material = new THREE.MeshStandardMaterial({
          color: backFrontMat.color,
          map: backFrontMat.map,
          roughness: backFrontMat.roughness,
          metalness: backFrontMat.metalness,
        });
      } else {
        mesh.material = new THREE.MeshStandardMaterial({
          color: seatTopMat.color,
          map: seatTopMat.map,
          roughness: seatTopMat.roughness,
          metalness: seatTopMat.metalness,
        });
      }
    });
  }, [parsedCustomObj, seatTopMat, backFrontMat, backRearMat, legsConfig]);

  // Explosions offsets
  const seatOffsetY = explodedView ? 0.08 : 0;
  const backrestOffsetZ = explodedView ? -0.12 : 0;
  const backrestOffsetY = explodedView ? 0.07 : 0;

  // Tubing radius (Barra / Tubo macizo Ø 16 mm -> radio 0.008m = 8mm)
  const tubeR = 0.008;

  // Ergonomic Plywood Geometries
  const { topGeo: seatTopGeo, bottomGeo: seatBottomGeo, edgeGeo: seatEdgeGeo } = useMemo(
    () => createCurvedSeatGeometries(),
    []
  );

  const { frontGeo: backFrontGeo, rearGeo: backRearGeo, edgeGeo: backEdgeGeo } = useMemo(
    () => createCurvedBackrestGeometries(),
    []
  );

  // =========================================================================
  // TUBULAR FRAME CURVES (Continuous Mandrel-Bent Steel Tubes)
  // Cleanly positioned UNDER the seat, with uprights routed BEHIND the seat
  // Exact dimensions: Base floor width = 526mm (X: +/-0.263), Uprights: 342mm (X: +/-0.171)
  // =========================================================================
  const { leftLegGeo, rightLegGeo, leftUprightGeo, rightUprightGeo, crossTubesGeo } = useMemo(() => {
    if (frameStyle === 'sled_cantilever') {
      // Sled Cantilever Loop
      const leftSledCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.20, 0.008, 0.20),
        new THREE.Vector3(-0.20, 0.008, -0.23),
        new THREE.Vector3(-0.20, 0.03, -0.25),
        new THREE.Vector3(-0.18, 0.20, -0.17),
        new THREE.Vector3(-0.171, 0.42, 0.02),
        new THREE.Vector3(-0.171, 0.42, 0.14),
      ]);
      const rightSledCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.20, 0.008, 0.20),
        new THREE.Vector3(0.20, 0.008, -0.23),
        new THREE.Vector3(0.20, 0.03, -0.25),
        new THREE.Vector3(0.18, 0.20, -0.17),
        new THREE.Vector3(0.171, 0.42, 0.02),
        new THREE.Vector3(0.171, 0.42, 0.14),
      ]);
      return {
        leftLegGeo: new THREE.TubeGeometry(leftSledCurve, 64, tubeR, 16, false),
        rightLegGeo: new THREE.TubeGeometry(rightSledCurve, 64, tubeR, 16, false),
        leftUprightGeo: new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3([
            new THREE.Vector3(-0.171, 0.42, -0.15),
            new THREE.Vector3(-0.171, 0.42, -0.245),
            new THREE.Vector3(-0.171, 0.56, -0.26),
            new THREE.Vector3(-0.171, 0.72, -0.28),
          ]),
          32,
          tubeR,
          16,
          false
        ),
        rightUprightGeo: new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3([
            new THREE.Vector3(0.171, 0.42, -0.15),
            new THREE.Vector3(0.171, 0.42, -0.245),
            new THREE.Vector3(0.171, 0.56, -0.26),
            new THREE.Vector3(0.171, 0.72, -0.28),
          ]),
          32,
          tubeR,
          16,
          false
        ),
        crossTubesGeo: [
          new THREE.TubeGeometry(
            new THREE.LineCurve3(new THREE.Vector3(-0.19, 0.008, 0.20), new THREE.Vector3(0.19, 0.008, 0.20)),
            8,
            tubeR,
            16,
            false
          ),
          new THREE.TubeGeometry(
            new THREE.LineCurve3(new THREE.Vector3(-0.171, 0.418, 0.05), new THREE.Vector3(0.171, 0.418, 0.05)),
            8,
            tubeR,
            16,
            false
          ),
        ],
      };
    }

    // Default: 'classic_4legs' & 'stackable_contract' (Plano Hormiga EETT)
    // Under-seat rail: Y = 0.42 (Underneath the seat)
    // Base footprint on floor: Width = 526 mm (+/-0.263m)
    // Front leg: flares to floor [+/-0.255, 0.008, 0.19]
    // Rear leg: flares to floor [+/-0.263, 0.008, -0.25]
    const leftCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.255, 0.008, 0.19),   // Floor Front Left (Base abierta 526mm)
      new THREE.Vector3(-0.21, 0.20, 0.15),     // Front Leg slope
      new THREE.Vector3(-0.18, 0.42, 0.13),     // Front upper bend under seat
      new THREE.Vector3(-0.175, 0.425, -0.01),  // Under seat rail center
      new THREE.Vector3(-0.18, 0.42, -0.15),    // Rear upper bend under seat
      new THREE.Vector3(-0.22, 0.20, -0.20),    // Rear leg slope
      new THREE.Vector3(-0.263, 0.008, -0.25),  // Floor Rear Left (Base abierta 526mm)
    ]);

    const rightCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.255, 0.008, 0.19),    // Floor Front Right
      new THREE.Vector3(0.21, 0.20, 0.15),     // Front Leg slope
      new THREE.Vector3(0.18, 0.42, 0.13),     // Front upper bend under seat
      new THREE.Vector3(0.175, 0.425, -0.01),  // Under seat rail center
      new THREE.Vector3(0.18, 0.42, -0.15),    // Rear upper bend under seat
      new THREE.Vector3(0.22, 0.20, -0.20),    // Rear leg slope
      new THREE.Vector3(0.263, 0.008, -0.25),  // Floor Rear Right
    ]);

    // Backrest Uprights: Start under rear of seat (Z = -0.15),
    // extend BEHIND the seat (Z = -0.245), then rise behind the backrest at X = +/-0.171m (342mm spacing)
    const leftUpright = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.171, 0.42, -0.15),
      new THREE.Vector3(-0.171, 0.42, -0.245),
      new THREE.Vector3(-0.171, 0.55, -0.255),
      new THREE.Vector3(-0.171, 0.72, -0.282),
    ]);

    const rightUpright = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.171, 0.42, -0.15),
      new THREE.Vector3(0.171, 0.42, -0.245),
      new THREE.Vector3(0.171, 0.55, -0.255),
      new THREE.Vector3(0.171, 0.72, -0.282),
    ]);

    // Cross-stretcher reinforcement tubes (Under the seat)
    const frontCross = new THREE.TubeGeometry(
      new THREE.LineCurve3(new THREE.Vector3(-0.175, 0.42, 0.11), new THREE.Vector3(0.175, 0.42, 0.11)),
      8,
      tubeR,
      16,
      false
    );

    const rearCross = new THREE.TubeGeometry(
      new THREE.LineCurve3(new THREE.Vector3(-0.175, 0.42, -0.15), new THREE.Vector3(0.175, 0.42, -0.15)),
      8,
      tubeR,
      16,
      false
    );

    return {
      leftLegGeo: new THREE.TubeGeometry(leftCurve, 64, tubeR, 16, false),
      rightLegGeo: new THREE.TubeGeometry(rightCurve, 64, tubeR, 16, false),
      leftUprightGeo: new THREE.TubeGeometry(leftUpright, 32, tubeR, 16, false),
      rightUprightGeo: new THREE.TubeGeometry(rightUpright, 32, tubeR, 16, false),
      crossTubesGeo: [frontCross, rearCross],
    };
  }, [frameStyle, tubeR]);

  return (
    <group position={[0, 0, 0]}>
      {/* ========================================================================= */}
      {/* 1. STEEL LEGS & FRAME (Estructura de Barra Maciza/Tubo Ø 16mm Esmaltado)  */}
      {/* ========================================================================= */}
      {!parsedCustomObj && (
        <group name="chair-steel-frame">
          {/* Left continuous bent tube */}
          <mesh castShadow receiveShadow geometry={leftLegGeo}>
            <meshStandardMaterial
              color={legsConfig.hex}
              metalness={legsConfig.metalness}
              roughness={legsConfig.roughness}
            />
          </mesh>

          {/* Right continuous bent tube */}
          <mesh castShadow receiveShadow geometry={rightLegGeo}>
            <meshStandardMaterial
              color={legsConfig.hex}
              metalness={legsConfig.metalness}
              roughness={legsConfig.roughness}
            />
          </mesh>

          {/* Left backrest upright stem */}
          <mesh castShadow receiveShadow geometry={leftUprightGeo}>
            <meshStandardMaterial
              color={legsConfig.hex}
              metalness={legsConfig.metalness}
              roughness={legsConfig.roughness}
            />
          </mesh>

          {/* Right backrest upright stem */}
          <mesh castShadow receiveShadow geometry={rightUprightGeo}>
            <meshStandardMaterial
              color={legsConfig.hex}
              metalness={legsConfig.metalness}
              roughness={legsConfig.roughness}
            />
          </mesh>

          {/* Cross-stretcher reinforcement tubes */}
          {crossTubesGeo.map((geo, idx) => (
            <mesh key={`cross-tube-${idx}`} castShadow receiveShadow geometry={geo}>
              <meshStandardMaterial
                color={legsConfig.hex}
                metalness={legsConfig.metalness}
                roughness={legsConfig.roughness}
              />
            </mesh>
          ))}

          {/* Under-seat mounting tabs with black rubber shock absorbers (silentblocks) */}
          {[
            [-0.15, 0.428, 0.10],
            [0.15, 0.428, 0.10],
            [-0.15, 0.428, -0.12],
            [0.15, 0.428, -0.12],
          ].map(([px, py, pz], idx) => (
            <group key={`mount-tab-${idx}`} position={[px, py, pz]}>
              {/* Welded steel tab plate */}
              <mesh position={[0, -0.002, 0]}>
                <boxGeometry args={[0.028, 0.003, 0.028]} />
                <meshStandardMaterial
                  color={legsConfig.hex}
                  metalness={legsConfig.metalness}
                  roughness={legsConfig.roughness}
                />
              </mesh>
              {/* Rubber silentblock dampener */}
              <mesh position={[0, 0.005, 0]}>
                <cylinderGeometry args={[0.010, 0.010, 0.010, 16]} />
                <meshStandardMaterial color="#18181B" roughness={0.9} metalness={0.05} />
              </mesh>
            </group>
          ))}

          {/* Backrest mounting brackets (Welded to uprights BEHIND the backrest at 342mm spacing) */}
          {[-0.171, 0.171].map((bx, bIdx) => (
            <mesh
              key={`back-mount-${bIdx}`}
              position={[bx, 0.665, -0.272]}
              rotation={[-0.157, 0, 0]}
            >
              <boxGeometry args={[0.024, 0.055, 0.005]} />
              <meshStandardMaterial
                color={legsConfig.hex}
                metalness={legsConfig.metalness}
                roughness={legsConfig.roughness}
              />
            </mesh>
          ))}

          {/* Injection-Molded Terminal de Goma Inserto Negro (Plano Hormiga) */}
          {frameStyle !== 'sled_cantilever' && (
            <>
              {/* Front Left Glide */}
              <group position={[-0.255, 0.008, 0.19]} rotation={[0.08, 0, 0.06]}>
                <mesh castShadow>
                  <cylinderGeometry args={[tubeR * 1.3, tubeR * 1.05, 0.016, 16]} />
                  <meshStandardMaterial
                    color={legsConfig.hex}
                    metalness={legsConfig.metalness}
                    roughness={legsConfig.roughness}
                  />
                </mesh>
              </group>
              {/* Front Right Glide */}
              <group position={[0.255, 0.008, 0.19]} rotation={[0.08, 0, -0.06]}>
                <mesh castShadow>
                  <cylinderGeometry args={[tubeR * 1.3, tubeR * 1.05, 0.016, 16]} />
                  <meshStandardMaterial
                    color={legsConfig.hex}
                    metalness={legsConfig.metalness}
                    roughness={legsConfig.roughness}
                  />
                </mesh>
              </group>
              {/* Rear Left Glide */}
              <group position={[-0.263, 0.008, -0.25]} rotation={[-0.15, 0, 0.06]}>
                <mesh castShadow>
                  <cylinderGeometry args={[tubeR * 1.3, tubeR * 1.05, 0.016, 16]} />
                  <meshStandardMaterial
                    color={legsConfig.hex}
                    metalness={legsConfig.metalness}
                    roughness={legsConfig.roughness}
                  />
                </mesh>
              </group>
              {/* Rear Right Glide */}
              <group position={[0.263, 0.008, -0.25]} rotation={[-0.15, 0, -0.06]}>
                <mesh castShadow>
                  <cylinderGeometry args={[tubeR * 1.3, tubeR * 1.05, 0.016, 16]} />
                  <meshStandardMaterial
                    color={legsConfig.hex}
                    metalness={legsConfig.metalness}
                    roughness={legsConfig.roughness}
                  />
                </mesh>
              </group>
            </>
          )}
        </group>
      )}

      {parsedCustomObj ? (
        <group name="custom-uploaded-obj-model" position={[0, 0, 0]}>
          <primitive object={parsedCustomObj} />
        </group>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* 2. ERGONOMIC CURVED PLYWOOD SEAT (Terciado Curvo 12mm Prensado)           */}
          {/* Exact Hormiga Dimensions: Ancho 446mm, Profundidad 431mm, Altura 450mm     */}
          {/* ========================================================================= */}
          <group
            name="chair-seat"
            position={[0, 0.444 + seatOffsetY, 0]}
          >
            {/* Top Face: Abet Laminati HPL Layer */}
            <mesh
              castShadow
              receiveShadow
              geometry={seatTopGeo}
            >
              <meshStandardMaterial
                color={seatTopMat.color}
                map={seatTopMat.map}
                roughness={seatTopMat.roughness}
                metalness={seatTopMat.metalness}
              />
            </mesh>

            {/* Bottom Face: Natural Plywood Wood Grain (MADERA TERCIADA NATURAL) */}
            <mesh
              receiveShadow
              geometry={seatBottomGeo}
            >
              <meshStandardMaterial
                color={seatBottomMat.color}
                map={seatBottomMat.map}
                roughness={seatBottomMat.roughness}
                metalness={seatBottomMat.metalness}
              />
            </mesh>

            {/* Perimeter Edge: Multiplex Laminated Plywood Canto 12mm */}
            <mesh
              castShadow
              receiveShadow
              geometry={seatEdgeGeo}
            >
              <meshStandardMaterial
                color={plywoodEdgeMat.color}
                map={plywoodEdgeMat.map}
                roughness={plywoodEdgeMat.roughness}
                metalness={plywoodEdgeMat.metalness}
              />
            </mesh>
          </group>

          {/* ========================================================================= */}
          {/* 3. ERGONOMIC CURVED PLYWOOD BACKREST (Terciado Curvo 12mm Prensado)       */}
          {/* Exact Hormiga Dimensions: Ancho 461mm, Alto 219mm, R396, H Total 775mm    */}
          {/* ========================================================================= */}
          <group
            name="chair-backrest"
            position={[0, 0.665 + backrestOffsetY, -0.245 + backrestOffsetZ]}
            rotation={[-0.157, 0, 0]}
          >
            {/* Front Face: Abet Laminati Front Decorative */}
            <mesh
              castShadow
              receiveShadow
              geometry={backFrontGeo}
            >
              <meshStandardMaterial
                color={backFrontMat.color}
                map={backFrontMat.map}
                roughness={backFrontMat.roughness}
                metalness={backFrontMat.metalness}
              />
            </mesh>

            {/* Rear Face: Abet Laminati Rear Decorative */}
            <mesh
              castShadow
              receiveShadow
              geometry={backRearGeo}
            >
              <meshStandardMaterial
                color={backRearMat.color}
                map={backRearMat.map}
                roughness={backRearMat.roughness}
                metalness={backRearMat.metalness}
              />
            </mesh>

            {/* Perimeter Edge: Multiplex Laminated Plywood Canto 12mm */}
            <mesh
              castShadow
              receiveShadow
              geometry={backEdgeGeo}
            >
              <meshStandardMaterial
                color={plywoodEdgeMat.color}
                map={plywoodEdgeMat.map}
                roughness={plywoodEdgeMat.roughness}
                metalness={plywoodEdgeMat.metalness}
              />
            </mesh>

            {/* 4 Inox dome rivets on FRONT of backrest passing through (Exact spacing: 342mm horiz, 34mm vert) */}
            {[-0.171, 0.171].map((rx) =>
              [-0.017, 0.017].map((ry) => {
                const radiusCyl = 0.396;
                const clampedX = Math.min(Math.abs(rx), radiusCyl * 0.98);
                const wrapZ = radiusCyl - Math.sqrt(radiusCyl * radiusCyl - clampedX * clampedX);
                return (
                  <group key={`rivet-${rx}-${ry}`} position={[rx, ry, wrapZ + 0.0068]}>
                    {/* Front chrome dome button head */}
                    <mesh>
                      <sphereGeometry args={[0.005, 16, 16]} />
                      <meshStandardMaterial color="#F1F5F9" metalness={0.95} roughness={0.15} />
                    </mesh>
                    {/* Black rubber sealing washer ring */}
                    <mesh position={[0, 0, -0.001]}>
                      <cylinderGeometry args={[0.0065, 0.0065, 0.001, 16]} />
                      <meshStandardMaterial color="#1E293B" roughness={0.9} />
                    </mesh>
                  </group>
                );
              })
            )}
          </group>
        </>
      )}

      {/* ========================================================================= */}
      {/* 4. 3D TECHNICAL DIMENSION COTAS & LABELS (Plano Hormiga Especificaciones)  */}
      {/* ========================================================================= */}
      {showDimensions3D && (
        <group name="chair-3d-cotas">
          {/* Total Height: 775 mm */}
          <group position={[0.30, 0.3875, 0]}>
            <mesh>
              <cylinderGeometry args={[0.001, 0.001, 0.775, 8]} />
              <meshBasicMaterial color="#F97316" />
            </mesh>
            <Html position={[0.04, 0, 0]} center>
              <div className="bg-black/85 text-orange-400 border border-orange-500/50 px-2 py-0.5 rounded text-[10px] font-mono font-bold whitespace-nowrap shadow-lg select-none pointer-events-none">
                H: 775 mm (Total)
              </div>
            </Html>
          </group>

          {/* Seat Height: 450 mm */}
          <group position={[-0.30, 0.225, 0.15]}>
            <mesh>
              <cylinderGeometry args={[0.001, 0.001, 0.45, 8]} />
              <meshBasicMaterial color="#38BDF8" />
            </mesh>
            <Html position={[-0.04, 0, 0]} center>
              <div className="bg-black/85 text-sky-400 border border-sky-500/50 px-2 py-0.5 rounded text-[10px] font-mono font-bold whitespace-nowrap shadow-lg select-none pointer-events-none">
                H: 450 mm (Asiento)
              </div>
            </Html>
          </group>

          {/* Seat Width: 446 mm */}
          <group position={[0, 0.46, 0.24]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.001, 0.001, 0.446, 8]} />
              <meshBasicMaterial color="#10B981" />
            </mesh>
            <Html position={[0, 0.03, 0]} center>
              <div className="bg-black/85 text-emerald-400 border border-emerald-500/50 px-2 py-0.5 rounded text-[10px] font-mono font-bold whitespace-nowrap shadow-lg select-none pointer-events-none">
                Ancho Asiento: 446 mm
              </div>
            </Html>
          </group>

          {/* Seat Depth: 431 mm */}
          <group position={[0.26, 0.46, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.001, 0.001, 0.431, 8]} />
              <meshBasicMaterial color="#A855F7" />
            </mesh>
            <Html position={[0.04, 0, 0]} center>
              <div className="bg-black/85 text-purple-400 border border-purple-500/50 px-2 py-0.5 rounded text-[10px] font-mono font-bold whitespace-nowrap shadow-lg select-none pointer-events-none">
                Prof Asiento: 431 mm
              </div>
            </Html>
          </group>

          {/* Backrest Width: 461 mm */}
          <group position={[0, 0.785, -0.26]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.001, 0.001, 0.461, 8]} />
              <meshBasicMaterial color="#EAB308" />
            </mesh>
            <Html position={[0, 0.03, 0]} center>
              <div className="bg-black/85 text-amber-300 border border-amber-500/50 px-2 py-0.5 rounded text-[10px] font-mono font-bold whitespace-nowrap shadow-lg select-none pointer-events-none">
                Respaldo: 461 × 219 mm (R396)
              </div>
            </Html>
          </group>

          {/* Base Floor Width: 526 mm */}
          <group position={[0, 0.02, 0.20]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.001, 0.001, 0.526, 8]} />
              <meshBasicMaterial color="#06B6D4" />
            </mesh>
            <Html position={[0, 0.03, 0]} center>
              <div className="bg-black/85 text-cyan-400 border border-cyan-500/50 px-2 py-0.5 rounded text-[10px] font-mono font-bold whitespace-nowrap shadow-lg select-none pointer-events-none">
                Base Patas: 526 mm (Barra Ø16mm)
              </div>
            </Html>
          </group>
        </group>
      )}
    </group>
  );
}
