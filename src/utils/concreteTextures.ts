import * as THREE from 'three';

let cachedWallTexture: THREE.CanvasTexture | null = null;
let cachedWallBumpMap: THREE.CanvasTexture | null = null;
let cachedWallRoughnessMap: THREE.CanvasTexture | null = null;

let cachedSlabTexture: THREE.CanvasTexture | null = null;
let cachedSlabBumpMap: THREE.CanvasTexture | null = null;
let cachedSlabRoughnessMap: THREE.CanvasTexture | null = null;

let cachedCeilingTexture: THREE.CanvasTexture | null = null;
let cachedLeanConcreteTexture: THREE.CanvasTexture | null = null;
let cachedBrickTexture: THREE.CanvasTexture | null = null;
let cachedBrickBumpMap: THREE.CanvasTexture | null = null;
let cachedTimberTexture: THREE.CanvasTexture | null = null;

/**
 * Genera texturas hiperrealistas de Hormigón Armado Visto (Béton Brut / Architectural Fair-Faced Concrete),
 * Albañilería de Ladrillo Cerámico y Viguería de Madera Estructural para Entrepisos y Techumbre.
 */
export function getConcreteTextures() {
  if (
    cachedWallTexture &&
    cachedWallBumpMap &&
    cachedWallRoughnessMap &&
    cachedSlabTexture &&
    cachedSlabBumpMap &&
    cachedSlabRoughnessMap &&
    cachedCeilingTexture &&
    cachedLeanConcreteTexture &&
    cachedBrickTexture &&
    cachedBrickBumpMap &&
    cachedTimberTexture
  ) {
    return {
      wallTexture: cachedWallTexture,
      wallBumpMap: cachedWallBumpMap,
      wallRoughnessMap: cachedWallRoughnessMap,
      slabTexture: cachedSlabTexture,
      slabBumpMap: cachedSlabBumpMap,
      slabRoughnessMap: cachedSlabRoughnessMap,
      ceilingTexture: cachedCeilingTexture,
      leanConcreteTexture: cachedLeanConcreteTexture,
      brickTexture: cachedBrickTexture,
      brickBumpMap: cachedBrickBumpMap,
      timberTexture: cachedTimberTexture,
    };
  }

  // Dimensiones de alta resolución para renderizado nítido
  const size = 2048;

  // -------------------------------------------------------------
  // 1. TEXTURA DE MUROS (HORMIGÓN VISTO ARQUITECTÓNICO / BÉTON BRUT)
  // Módulo de 240 cm x 240 cm (2 paneles de 120x240 cm)
  // -------------------------------------------------------------
  const wallCanvas = document.createElement('canvas');
  wallCanvas.width = size;
  wallCanvas.height = size;
  const wctx = wallCanvas.getContext('2d');

  const wallBumpCanvas = document.createElement('canvas');
  wallBumpCanvas.width = size;
  wallBumpCanvas.height = size;
  const wbctx = wallBumpCanvas.getContext('2d');

  const wallRoughCanvas = document.createElement('canvas');
  wallRoughCanvas.width = size;
  wallRoughCanvas.height = size;
  const wrctx = wallRoughCanvas.getContext('2d');

  if (wctx && wbctx && wrctx) {
    // 1.1 Base cromática de cemento Portland visto arquitectónico (gris neutro luminoso)
    wctx.fillStyle = '#adb3bb';
    wctx.fillRect(0, 0, size, size);

    wbctx.fillStyle = '#808080';
    wbctx.fillRect(0, 0, size, size);

    wrctx.fillStyle = '#b8b8b8'; // Acabado desmoldado fenólico mate satinado
    wrctx.fillRect(0, 0, size, size);

    // 1.2 Nubes suaves y continuas de hidratación de cemento (sin costuras / seamless)
    // Usamos variaciones sinusoidales suaves para garantizar continuidad perfecta
    const imgData = wctx.getImageData(0, 0, size, size);
    const bData = wbctx.getImageData(0, 0, size, size);
    const rData = wrctx.getImageData(0, 0, size, size);
    const pixels = imgData.data;
    const bPixels = bData.data;
    const rPixels = rData.data;

    for (let y = 0; y < size; y++) {
      const ny = (y / size) * Math.PI * 2;
      for (let x = 0; x < size; x++) {
        const nx = (x / size) * Math.PI * 2;
        const idx = (y * size + x) * 4;

        // Ondas armónicas toroidales periódicas
        const wave1 = Math.sin(nx * 2 + Math.cos(ny * 2)) * 6;
        const wave2 = Math.cos(nx * 3 - Math.sin(ny * 3)) * 5;
        const wave3 = Math.sin(nx * 5 + ny * 5) * 3;
        const totalWave = wave1 + wave2 + wave3;

        // Grano mineral microfino
        const fineNoise = (Math.random() - 0.5) * 8;

        const val = totalWave + fineNoise;
        pixels[idx] = Math.min(255, Math.max(0, pixels[idx] + val));
        pixels[idx + 1] = Math.min(255, Math.max(0, pixels[idx + 1] + val * 0.98));
        pixels[idx + 2] = Math.min(255, Math.max(0, pixels[idx + 2] + val * 0.96));

        // Bump suave para microtextura de poro de cemento
        const bumpVal = (Math.random() - 0.5) * 12 + totalWave * 0.5;
        bPixels[idx] = Math.min(255, Math.max(0, bPixels[idx] + bumpVal));
        bPixels[idx + 1] = bPixels[idx];
        bPixels[idx + 2] = bPixels[idx];

        // Roughness levemente variable
        rPixels[idx] = Math.min(255, Math.max(0, rPixels[idx] + (Math.random() - 0.5) * 6));
        rPixels[idx + 1] = rPixels[idx];
        rPixels[idx + 2] = rPixels[idx];
      }
    }
    wctx.putImageData(imgData, 0, 0);
    wbctx.putImageData(bData, 0, 0);
    wrctx.putImageData(rData, 0, 0);

    // 1.3 Micro-poros de desencofrado (pinholes de aire esparcidos con sutileza)
    for (let p = 0; p < 450; p++) {
      const px = Math.random() * size;
      const py = Math.random() * size;
      const pr = 0.8 + Math.random() * 1.8;

      wctx.fillStyle = 'rgba(75, 80, 88, 0.55)';
      wctx.beginPath();
      wctx.arc(px, py, pr, 0, Math.PI * 2);
      wctx.fill();

      // Sombra proyectada del micro-poro
      wctx.fillStyle = 'rgba(215, 222, 230, 0.35)';
      wctx.beginPath();
      wctx.arc(px + 0.6, py + 0.6, pr * 0.6, 0, Math.PI * 2);
      wctx.fill();

      // Bump del poro
      wbctx.fillStyle = 'rgba(20, 20, 20, 0.7)';
      wbctx.beginPath();
      wbctx.arc(px, py, pr, 0, Math.PI * 2);
      wbctx.fill();
    }

    // 1.4 Juntas de modulación de tableros de moldaje industrial (Formwork Joint Lines)
    // Módulo estándar: 2 tableros de 120 cm x 240 cm (líneas en x=0, x=1024, x=2048, y=0, y=2048)
    const vertJoints = [0, size / 2, size - 1];
    const horizJoints = [0, size - 1];

    // Juntas verticales entre tableros
    vertJoints.forEach((vx) => {
      // Sombra de cantería / rebaje de junta
      wctx.strokeStyle = 'rgba(55, 60, 68, 0.75)';
      wctx.lineWidth = 3;
      wctx.beginPath();
      wctx.moveTo(vx, 0);
      wctx.lineTo(vx, size);
      wctx.stroke();

      // Bisel de luz en el borde derecho de la junta
      wctx.strokeStyle = 'rgba(230, 236, 244, 0.45)';
      wctx.lineWidth = 1.5;
      wctx.beginPath();
      wctx.moveTo(vx + 2, 0);
      wctx.lineTo(vx + 2, size);
      wctx.stroke();

      // Bump de ranura profunda
      wbctx.strokeStyle = 'rgba(10, 10, 10, 0.95)';
      wbctx.lineWidth = 4;
      wbctx.beginPath();
      wbctx.moveTo(vx, 0);
      wbctx.lineTo(vx, size);
      wbctx.stroke();
    });

    // Juntas horizontales entre tableros
    horizJoints.forEach((hy) => {
      wctx.strokeStyle = 'rgba(55, 60, 68, 0.75)';
      wctx.lineWidth = 3;
      wctx.beginPath();
      wctx.moveTo(0, hy);
      wctx.lineTo(size, hy);
      wctx.stroke();

      // Bisel de luz superior
      wctx.strokeStyle = 'rgba(230, 236, 244, 0.45)';
      wctx.lineWidth = 1.5;
      wctx.beginPath();
      wctx.moveTo(0, hy + 2);
      wctx.lineTo(size, hy + 2);
      wctx.stroke();

      // Bump de ranura
      wbctx.strokeStyle = 'rgba(10, 10, 10, 0.95)';
      wbctx.lineWidth = 4;
      wbctx.beginPath();
      wbctx.moveTo(0, hy);
      wbctx.lineTo(size, hy);
      wbctx.stroke();
    });

    // 1.5 Perforaciones de Agujas de Moldaje / Conos Pasamuros (Tie-rod holes / Formwork Cones)
    // En cada tablero de 120x240cm: 2 columnas a 20cm de cada borde (20cm y 100cm)
    // y 3 filas en altura (35cm, 120cm y 205cm)
    const panelWidthPx = size / 2; // 1024 px = 120 cm
    const coneCols = [
      panelWidthPx * (20 / 120),       // 170.6 px (Tablero 1)
      panelWidthPx * (100 / 120),      // 853.3 px (Tablero 1)
      panelWidthPx + panelWidthPx * (20 / 120),  // 1194.6 px (Tablero 2)
      panelWidthPx + panelWidthPx * (100 / 120), // 1877.3 px (Tablero 2)
    ];
    const coneRows = [
      size * (35 / 240),  // 298.6 px
      size * (120 / 240), // 1024.0 px
      size * (205 / 240), // 1749.3 px
    ];

    coneCols.forEach((cx) => {
      coneRows.forEach((cy) => {
        const outerRadius = 18; // ~4.2 cm de diámetro exterior del cono biselado
        const innerRadius = 7.5; // ~1.8 cm de diámetro del pasador/tapón central

        // 1. Anillo biselado cónico exterior (depresión y sombreado periférico)
        const coneGrad = wctx.createRadialGradient(cx - 2, cy - 2, 2, cx, cy, outerRadius);
        coneGrad.addColorStop(0, '#585e68');
        coneGrad.addColorStop(0.5, '#7b828c');
        coneGrad.addColorStop(0.85, '#9fa5ae');
        coneGrad.addColorStop(1, 'rgba(173, 179, 187, 0)');

        wctx.fillStyle = coneGrad;
        wctx.beginPath();
        wctx.arc(cx, cy, outerRadius, 0, Math.PI * 2);
        wctx.fill();

        // 2. Reflejo de luz en el reborde inferior del cono (bisel iluminado)
        wctx.strokeStyle = 'rgba(235, 240, 248, 0.6)';
        wctx.lineWidth = 2.2;
        wctx.beginPath();
        wctx.arc(cx, cy, outerRadius - 1, 0.25 * Math.PI, 0.75 * Math.PI);
        wctx.stroke();

        // 3. Orificio pasamuro cilíndrico / Tapón negro plástico de desencofrado
        wctx.fillStyle = '#1c1f24';
        wctx.beginPath();
        wctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
        wctx.fill();

        // Sombra de profundidad interior del agujero
        const holeInnerGrad = wctx.createRadialGradient(cx - 1, cy - 1, 0.5, cx, cy, innerRadius);
        holeInnerGrad.addColorStop(0, '#101215');
        holeInnerGrad.addColorStop(1, '#2e333a');
        wctx.fillStyle = holeInnerGrad;
        wctx.beginPath();
        wctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
        wctx.fill();

        // 4. Bump Map: Depresión cónica profunda y pozo de aguja
        const bConeGrad = wbctx.createRadialGradient(cx, cy, 1, cx, cy, outerRadius);
        bConeGrad.addColorStop(0, '#000000');
        bConeGrad.addColorStop(0.45, '#202020');
        bConeGrad.addColorStop(0.85, '#656565');
        bConeGrad.addColorStop(1, '#808080');

        wbctx.fillStyle = bConeGrad;
        wbctx.beginPath();
        wbctx.arc(cx, cy, outerRadius, 0, Math.PI * 2);
        wbctx.fill();

        // Pozo central máximo hundimiento en bump
        wbctx.fillStyle = '#000000';
        wbctx.beginPath();
        wbctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
        wbctx.fill();
      });
    });
  }

  // -------------------------------------------------------------
  // 2. TEXTURA DE LOSAS & RADIER (HORMIGÓN ALISADO MECÁNICAMENTE)
  // -------------------------------------------------------------
  const slabCanvas = document.createElement('canvas');
  slabCanvas.width = size;
  slabCanvas.height = size;
  const sctx = slabCanvas.getContext('2d');

  const slabBumpCanvas = document.createElement('canvas');
  slabBumpCanvas.width = size;
  slabBumpCanvas.height = size;
  const sbctx = slabBumpCanvas.getContext('2d');

  if (sctx && sbctx) {
    // Tono más pétreo y pulido / helicóptero para pavimentos
    sctx.fillStyle = '#9aa1ab';
    sctx.fillRect(0, 0, size, size);

    sbctx.fillStyle = '#808080';
    sbctx.fillRect(0, 0, size, size);

    // Variaciones periódicas continuas de alisado mecánico (sin costuras)
    const simgData = sctx.getImageData(0, 0, size, size);
    const sbData = sbctx.getImageData(0, 0, size, size);
    const spix = simgData.data;
    const sbp = sbData.data;

    for (let y = 0; y < size; y++) {
      const ny = (y / size) * Math.PI * 2;
      for (let x = 0; x < size; x++) {
        const nx = (x / size) * Math.PI * 2;
        const idx = (y * size + x) * 4;

        const swirl = Math.sin(nx * 3 + Math.cos(ny * 3)) * 4 + Math.cos(nx * 2 - Math.sin(ny * 2)) * 4;
        const grain = (Math.random() - 0.5) * 10;
        const val = swirl + grain;

        spix[idx] = Math.min(255, Math.max(0, spix[idx] + val));
        spix[idx + 1] = Math.min(255, Math.max(0, spix[idx + 1] + val * 0.98));
        spix[idx + 2] = Math.min(255, Math.max(0, spix[idx + 2] + val * 0.96));

        const bval = (Math.random() - 0.5) * 14 + swirl * 0.4;
        sbp[idx] = Math.min(255, Math.max(0, sbp[idx] + bval));
        sbp[idx + 1] = sbp[idx];
        sbp[idx + 2] = sbp[idx];
      }
    }
    sctx.putImageData(simgData, 0, 0);
    sbctx.putImageData(sbData, 0, 0);

    // Juntas de dilatación / aserrado de control
    sctx.strokeStyle = 'rgba(50, 54, 60, 0.65)';
    sctx.lineWidth = 2.5;
    sctx.beginPath();
    sctx.moveTo(size / 2, 0);
    sctx.lineTo(size / 2, size);
    sctx.moveTo(0, size / 2);
    sctx.lineTo(size, size / 2);
    sctx.stroke();

    sbctx.strokeStyle = '#202020';
    sbctx.lineWidth = 3.5;
    sbctx.beginPath();
    sbctx.moveTo(size / 2, 0);
    sbctx.lineTo(size / 2, size);
    sbctx.moveTo(0, size / 2);
    sbctx.lineTo(size, size / 2);
    sbctx.stroke();
  }

  // -------------------------------------------------------------
  // 3. TEXTURA DE CIELO DE HORMIGÓN VISTO
  // -------------------------------------------------------------
  const ceilingCanvas = document.createElement('canvas');
  ceilingCanvas.width = size;
  ceilingCanvas.height = size;
  const cctx = ceilingCanvas.getContext('2d');
  if (cctx) {
    // Tono luminoso para cielos
    cctx.fillStyle = '#b0b7c0';
    cctx.fillRect(0, 0, size, size);

    const cimgData = cctx.getImageData(0, 0, size, size);
    const cpix = cimgData.data;
    for (let y = 0; y < size; y++) {
      const ny = (y / size) * Math.PI * 2;
      for (let x = 0; x < size; x++) {
        const nx = (x / size) * Math.PI * 2;
        const idx = (y * size + x) * 4;
        const wave = Math.sin(nx * 2 + ny * 2) * 4 + (Math.random() - 0.5) * 8;
        cpix[idx] = Math.min(255, Math.max(0, cpix[idx] + wave));
        cpix[idx + 1] = Math.min(255, Math.max(0, cpix[idx + 1] + wave * 0.98));
        cpix[idx + 2] = Math.min(255, Math.max(0, cpix[idx + 2] + wave * 0.96));
      }
    }
    cctx.putImageData(cimgData, 0, 0);

    // Juntas perimetrales de tablero fenólico de cielo
    cctx.strokeStyle = 'rgba(70, 75, 82, 0.45)';
    cctx.lineWidth = 2;
    cctx.strokeRect(0, 0, size, size);
    cctx.beginPath();
    cctx.moveTo(size / 2, 0);
    cctx.lineTo(size / 2, size);
    cctx.moveTo(0, size / 2);
    cctx.lineTo(size, size / 2);
    cctx.stroke();
  }

  // -------------------------------------------------------------
  // 4. TEXTURA DE EMPLANTILLADO / HORMIGÓN POBRE
  // -------------------------------------------------------------
  const leanCanvas = document.createElement('canvas');
  leanCanvas.width = 512;
  leanCanvas.height = 512;
  const lctx = leanCanvas.getContext('2d');
  if (lctx) {
    lctx.fillStyle = '#5a6068';
    lctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 800; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = 1.5 + Math.random() * 4;
      lctx.fillStyle = Math.random() > 0.5 ? 'rgba(40, 43, 48, 0.7)' : 'rgba(130, 137, 145, 0.7)';
      lctx.beginPath();
      lctx.arc(x, y, r, 0, Math.PI * 2);
      lctx.fill();
    }
  }

  // -------------------------------------------------------------
  // 5. TEXTURA DE ALBAÑILERÍA / LADRILLO CERÁMICO ESTRUCTURAL
  // -------------------------------------------------------------
  const brickCanvas = document.createElement('canvas');
  brickCanvas.width = size;
  brickCanvas.height = size;
  const brctx = brickCanvas.getContext('2d');

  const brickBumpCanvas = document.createElement('canvas');
  brickBumpCanvas.width = size;
  brickBumpCanvas.height = size;
  const brbctx = brickBumpCanvas.getContext('2d');

  if (brctx && brbctx) {
    // Fondo: Mortero de junta gris (juntas de 12-15mm)
    brctx.fillStyle = '#9ca3af';
    brctx.fillRect(0, 0, size, size);

    brbctx.fillStyle = '#404040'; // Juntas hundidas
    brbctx.fillRect(0, 0, size, size);

    const rows = 16;
    const rowH = size / rows;
    const brickW = size / 5;
    const mortarGap = 6;

    for (let r = 0; r < rows; r++) {
      const isOffset = r % 2 === 1;
      const startX = isOffset ? -brickW / 2 : 0;
      const y = r * rowH + mortarGap / 2;
      const h = rowH - mortarGap;

      for (let x = startX; x < size + brickW; x += brickW) {
        const bx = x + mortarGap / 2;
        const bw = brickW - mortarGap;

        // Variaciones tonales de arcilla cocida / ladrillo princesa
        const toneRand = Math.random();
        let brickColor = '#c2410c'; // Arcilla terracota base
        if (toneRand < 0.25) brickColor = '#9a3412';
        else if (toneRand < 0.5) brickColor = '#ea580c';
        else if (toneRand < 0.75) brickColor = '#b45309';

        brctx.fillStyle = brickColor;
        brctx.fillRect(bx, y, bw, h);

        // Textura porosa superficial de ladrillo cerámico
        for (let p = 0; p < 12; p++) {
          const px = bx + Math.random() * bw;
          const py = y + Math.random() * h;
          brctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.12)';
          brctx.fillRect(px, py, 3, 2);
        }

        // Bump elevado para los ladrillos
        brbctx.fillStyle = '#c0c0c0';
        brbctx.fillRect(bx, y, bw, h);
      }
    }
  }

  // -------------------------------------------------------------
  // 6. TEXTURA DE MADERA PINO ESTRUCTURAL / IPV
  // -------------------------------------------------------------
  const timberCanvas = document.createElement('canvas');
  timberCanvas.width = 512;
  timberCanvas.height = 512;
  const tctx = timberCanvas.getContext('2d');
  if (tctx) {
    // Color pino oregón / pino radiata impregnado
    tctx.fillStyle = '#b58b57';
    tctx.fillRect(0, 0, 512, 512);

    // Vetas longitudinales de madera
    for (let i = 0; i < 40; i++) {
      const y = Math.random() * 512;
      const h = 4 + Math.random() * 12;
      tctx.fillStyle = Math.random() > 0.5 ? 'rgba(139, 90, 43, 0.25)' : 'rgba(210, 166, 121, 0.3)';
      tctx.fillRect(0, y, 512, h);
    }
  }

  // Creación y configuración de THREE.CanvasTexture con wrapping
  cachedWallTexture = new THREE.CanvasTexture(wallCanvas);
  cachedWallTexture.wrapS = THREE.RepeatWrapping;
  cachedWallTexture.wrapT = THREE.RepeatWrapping;
  cachedWallTexture.repeat.set(1, 1);
  cachedWallTexture.colorSpace = THREE.SRGBColorSpace;

  cachedWallBumpMap = new THREE.CanvasTexture(wallBumpCanvas);
  cachedWallBumpMap.wrapS = THREE.RepeatWrapping;
  cachedWallBumpMap.wrapT = THREE.RepeatWrapping;
  cachedWallBumpMap.repeat.set(1, 1);

  cachedWallRoughnessMap = new THREE.CanvasTexture(wallRoughCanvas);
  cachedWallRoughnessMap.wrapS = THREE.RepeatWrapping;
  cachedWallRoughnessMap.wrapT = THREE.RepeatWrapping;
  cachedWallRoughnessMap.repeat.set(1, 1);

  cachedSlabTexture = new THREE.CanvasTexture(slabCanvas);
  cachedSlabTexture.wrapS = THREE.RepeatWrapping;
  cachedSlabTexture.wrapT = THREE.RepeatWrapping;
  cachedSlabTexture.repeat.set(1, 1);
  cachedSlabTexture.colorSpace = THREE.SRGBColorSpace;

  cachedSlabBumpMap = new THREE.CanvasTexture(slabBumpCanvas);
  cachedSlabBumpMap.wrapS = THREE.RepeatWrapping;
  cachedSlabBumpMap.wrapT = THREE.RepeatWrapping;
  cachedSlabBumpMap.repeat.set(1, 1);

  cachedSlabRoughnessMap = new THREE.CanvasTexture(slabCanvas);
  cachedSlabRoughnessMap.wrapS = THREE.RepeatWrapping;
  cachedSlabRoughnessMap.wrapT = THREE.RepeatWrapping;
  cachedSlabRoughnessMap.repeat.set(1, 1);

  cachedCeilingTexture = new THREE.CanvasTexture(ceilingCanvas);
  cachedCeilingTexture.wrapS = THREE.RepeatWrapping;
  cachedCeilingTexture.wrapT = THREE.RepeatWrapping;
  cachedCeilingTexture.repeat.set(1, 1);
  cachedCeilingTexture.colorSpace = THREE.SRGBColorSpace;

  cachedLeanConcreteTexture = new THREE.CanvasTexture(leanCanvas);
  cachedLeanConcreteTexture.wrapS = THREE.RepeatWrapping;
  cachedLeanConcreteTexture.wrapT = THREE.RepeatWrapping;
  cachedLeanConcreteTexture.repeat.set(3, 3);
  cachedLeanConcreteTexture.colorSpace = THREE.SRGBColorSpace;

  cachedBrickTexture = new THREE.CanvasTexture(brickCanvas);
  cachedBrickTexture.wrapS = THREE.RepeatWrapping;
  cachedBrickTexture.wrapT = THREE.RepeatWrapping;
  cachedBrickTexture.repeat.set(1, 1);
  cachedBrickTexture.colorSpace = THREE.SRGBColorSpace;

  cachedBrickBumpMap = new THREE.CanvasTexture(brickBumpCanvas);
  cachedBrickBumpMap.wrapS = THREE.RepeatWrapping;
  cachedBrickBumpMap.wrapT = THREE.RepeatWrapping;
  cachedBrickBumpMap.repeat.set(1, 1);

  cachedTimberTexture = new THREE.CanvasTexture(timberCanvas);
  cachedTimberTexture.wrapS = THREE.RepeatWrapping;
  cachedTimberTexture.wrapT = THREE.RepeatWrapping;
  cachedTimberTexture.repeat.set(2, 2);
  cachedTimberTexture.colorSpace = THREE.SRGBColorSpace;

  return {
    wallTexture: cachedWallTexture,
    wallBumpMap: cachedWallBumpMap,
    wallRoughnessMap: cachedWallRoughnessMap,
    slabTexture: cachedSlabTexture,
    slabBumpMap: cachedSlabBumpMap,
    slabRoughnessMap: cachedSlabRoughnessMap,
    ceilingTexture: cachedCeilingTexture,
    leanConcreteTexture: cachedLeanConcreteTexture,
    brickTexture: cachedBrickTexture,
    brickBumpMap: cachedBrickBumpMap,
    timberTexture: cachedTimberTexture,
  };
}
