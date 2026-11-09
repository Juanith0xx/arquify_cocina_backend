import * as THREE from 'three';

let cachedOsbTexture: THREE.CanvasTexture | null = null;
let cachedOsbBumpMap: THREE.CanvasTexture | null = null;
let cachedOsbEdgeTexture: THREE.CanvasTexture | null = null;
let cachedEpsTexture: THREE.CanvasTexture | null = null;
let cachedTimberTexture: THREE.CanvasTexture | null = null;
let cachedTimberHorizontalTexture: THREE.CanvasTexture | null = null;
let cachedTimberBumpMap: THREE.CanvasTexture | null = null;
let cachedTimberEndGrainTexture: THREE.CanvasTexture | null = null;
let cachedArratiaTexture: THREE.CanvasTexture | null = null;
let cachedArratiaBumpMap: THREE.CanvasTexture | null = null;
let cachedTimberCladdingTexture: THREE.CanvasTexture | null = null;
let cachedTimberCladdingBumpMap: THREE.CanvasTexture | null = null;
let cachedFiberCementTexture: THREE.CanvasTexture | null = null;
let cachedFiberCementBumpMap: THREE.CanvasTexture | null = null;
let cachedTyvekTexture: THREE.CanvasTexture | null = null;
let cachedZincCa8Texture: THREE.CanvasTexture | null = null;
let cachedZincCa8BumpMap: THREE.CanvasTexture | null = null;
let cachedAsphaltShingleTexture: THREE.CanvasTexture | null = null;
let cachedAsphaltShingleBumpMap: THREE.CanvasTexture | null = null;

/**
 * Genera texturas procedurales hiperrealistas de OSB (Oriented Strand Board), EPS, Madera Estructural
 * y Revestimientos Exteriores (Arratia Microacanalado Fijación Oculta, Tinglado de Madera, Siding Fibrocemento, Membrana Tyvek)
 * con la estética idéntica a los paneles PROSIP / APA y EETT de envolvente térmica.
 */
export function getSipTextures() {
  if (
    cachedOsbTexture &&
    cachedOsbBumpMap &&
    cachedOsbEdgeTexture &&
    cachedEpsTexture &&
    cachedTimberTexture &&
    cachedTimberHorizontalTexture &&
    cachedTimberBumpMap &&
    cachedTimberEndGrainTexture &&
    cachedArratiaTexture &&
    cachedArratiaBumpMap &&
    cachedTimberCladdingTexture &&
    cachedTimberCladdingBumpMap &&
    cachedFiberCementTexture &&
    cachedFiberCementBumpMap &&
    cachedTyvekTexture &&
    cachedZincCa8Texture &&
    cachedZincCa8BumpMap &&
    cachedAsphaltShingleTexture &&
    cachedAsphaltShingleBumpMap
  ) {
    return {
      osbTexture: cachedOsbTexture,
      osbBumpMap: cachedOsbBumpMap,
      osbEdgeTexture: cachedOsbEdgeTexture,
      epsTexture: cachedEpsTexture,
      timberTexture: cachedTimberTexture,
      timberHorizontalTexture: cachedTimberHorizontalTexture,
      timberBumpMap: cachedTimberBumpMap,
      timberEndGrainTexture: cachedTimberEndGrainTexture,
      arratiaTexture: cachedArratiaTexture,
      arratiaBumpMap: cachedArratiaBumpMap,
      timberCladdingTexture: cachedTimberCladdingTexture,
      timberCladdingBumpMap: cachedTimberCladdingBumpMap,
      fiberCementTexture: cachedFiberCementTexture,
      fiberCementBumpMap: cachedFiberCementBumpMap,
      tyvekTexture: cachedTyvekTexture,
      zincCa8Texture: cachedZincCa8Texture,
      zincCa8BumpMap: cachedZincCa8BumpMap,
      asphaltShingleTexture: cachedAsphaltShingleTexture,
      asphaltShingleBumpMap: cachedAsphaltShingleBumpMap,
    };
  }

  // 1. TEXTURA OSB PRINCIPAL (Caras de tableros de virutas orientadas)
  const osbCanvas = document.createElement('canvas');
  osbCanvas.width = 1024;
  osbCanvas.height = 1024;
  const ctx = osbCanvas.getContext('2d');

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = 1024;
  bumpCanvas.height = 1024;
  const bctx = bumpCanvas.getContext('2d');

  if (ctx && bctx) {
    // Fondo base de madera cálida dorada/ámbar
    ctx.fillStyle = '#c7975e';
    ctx.fillRect(0, 0, 1024, 1024);

    bctx.fillStyle = '#808080';
    bctx.fillRect(0, 0, 1024, 1024);

    // Paleta de colores de virutas de madera reales (OSB)
    const flakeColors = [
      '#dfab6c', '#eac183', '#b88147', '#97612c', '#f5d49e',
      '#cca068', '#ad763d', '#865121', '#d49e61', '#f0cca1',
      '#be894e', '#a36c34', '#e6be82', '#7a481c', '#cf9e65',
    ];

    const prng = (seed: number) => {
      let t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    let seed = 12345;
    // Dibujar ~2200 virutas alargadas superpuestas orientadas preferentemente en sentido vertical/horizontal
    for (let i = 0; i < 2400; i++) {
      const x = prng(seed++) * 1024;
      const y = prng(seed++) * 1024;
      // Largo y ancho de la viruta
      const length = 35 + prng(seed++) * 110;
      const width = 8 + prng(seed++) * 24;
      // Ángulo: 80% alineadas verticalmente con leve variación (±18 grados), 20% cruzadas
      const isCrossed = prng(seed++) < 0.2;
      const angle = isCrossed
        ? (Math.PI / 2) + (prng(seed++) - 0.5) * 0.4
        : (prng(seed++) - 0.5) * 0.35;

      const colorIdx = Math.floor(prng(seed++) * flakeColors.length);
      const alpha = 0.7 + prng(seed++) * 0.3;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = flakeColors[colorIdx];
      ctx.globalAlpha = alpha;

      // Dibujar viruta poligonal irregular con esquinas rotas
      ctx.beginPath();
      const p1x = -length / 2;
      const p1y = -width / 2 + (prng(seed++) - 0.5) * 4;
      const p2x = length / 2;
      const p2y = -width / 2 + (prng(seed++) - 0.5) * 4;
      const p3x = length / 2 + (prng(seed++) - 0.5) * 6;
      const p3y = width / 2 + (prng(seed++) - 0.5) * 4;
      const p4x = -length / 2 - (prng(seed++) - 0.5) * 6;
      const p4y = width / 2 + (prng(seed++) - 0.5) * 4;

      ctx.moveTo(p1x, p1y);
      ctx.lineTo(p2x, p2y);
      ctx.lineTo(p3x, p3y);
      ctx.lineTo(p4x, p4y);
      ctx.closePath();
      ctx.fill();

      // Líneas de veta interna en cada viruta
      ctx.strokeStyle = prng(seed++) > 0.5 ? 'rgba(80, 40, 10, 0.25)' : 'rgba(255, 230, 180, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-length / 3, 0);
      ctx.lineTo(length / 3, 0);
      ctx.stroke();

      ctx.restore();

      // Grabar en Bump Map
      bctx.save();
      bctx.translate(x, y);
      bctx.rotate(angle);
      const bumpGray = Math.floor(100 + prng(seed++) * 110);
      bctx.fillStyle = `rgb(${bumpGray}, ${bumpGray}, ${bumpGray})`;
      bctx.globalAlpha = 0.5;
      bctx.fillRect(-length / 2, -width / 2, length, width);
      bctx.restore();
    }

    // Tinte de resina fenólica / MDI translúcida
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = '#6b3600';
    ctx.fillRect(0, 0, 1024, 1024);

    // Timbre técnico PROSIP APA / NCh sutil
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = '#1e3a8a';
    for (let sy = 120; sy < 1000; sy += 320) {
      ctx.fillText('PROSIP APA RATED OSB/3 STRUCTURAL 11.1mm E1 NCh2165', 80, sy);
      ctx.fillText('▲ THIS SIDE UP - RESINA MDI CLASE 1 - CONTROL CALIDAD', 120, sy + 30);
    }
    ctx.restore();
  }

  // 2. TEXTURA EPS (Poliestireno expandido de alta densidad blanco perlado)
  const epsCanvas = document.createElement('canvas');
  epsCanvas.width = 512;
  epsCanvas.height = 512;
  const ectx = epsCanvas.getContext('2d');
  if (ectx) {
    ectx.fillStyle = '#f8fafc';
    ectx.fillRect(0, 0, 512, 512);

    // Perlas de poliestireno sutiles (micro-esferas EPS 15-20 kg/m3)
    let eseed = 54321;
    const eprng = () => {
      let t = eseed += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    for (let i = 0; i < 1800; i++) {
      const ex = eprng() * 512;
      const ey = eprng() * 512;
      const er = 2 + eprng() * 4.5;
      ectx.beginPath();
      ectx.arc(ex, ey, er, 0, Math.PI * 2);
      ectx.fillStyle = eprng() > 0.5 ? 'rgba(255, 255, 255, 0.8)' : 'rgba(226, 232, 240, 0.45)';
      ectx.fill();
      ectx.strokeStyle = 'rgba(203, 213, 225, 0.25)';
      ectx.lineWidth = 0.5;
      ectx.stroke();
    }
  }

  // 3. TEXTURA CANTO OSB CON SELLADOR ROJO / NARANJA DE FÁBRICA
  const edgeCanvas = document.createElement('canvas');
  edgeCanvas.width = 256;
  edgeCanvas.height = 256;
  const edctx = edgeCanvas.getContext('2d');
  if (edctx) {
    // Fondo de capas prensadas de madera
    edctx.fillStyle = '#b3783b';
    edctx.fillRect(0, 0, 256, 256);

    // Franja de sellador impermeable rojo/naranja en el borde exterior
    edctx.fillStyle = '#dc2626';
    edctx.fillRect(0, 0, 256, 32);
    edctx.fillStyle = '#ea580c';
    edctx.fillRect(0, 32, 256, 20);

    // Estratos de virutas cortadas
    for (let y = 52; y < 256; y += 8) {
      edctx.fillStyle = y % 16 === 0 ? '#925c27' : '#caa068';
      edctx.fillRect(0, y, 256, 7);
    }
  }

  // 4. TEXTURA MADERA ESTRUCTURAL REALISTA (Listón de Pino Radiata / Pino Estructural según imagen del usuario)
  // 4.1 Veta Longitudinal Vertical (para pies derechos, jambas, puntales)
  const timberCanvas = document.createElement('canvas');
  timberCanvas.width = 512;
  timberCanvas.height = 512;
  const tctx = timberCanvas.getContext('2d');

  // 4.2 Mapa de Relieve / Bump Map Longitudinal (para sensación física de ranuras y fibras aserradas)
  const timberBumpCanvas = document.createElement('canvas');
  timberBumpCanvas.width = 512;
  timberBumpCanvas.height = 512;
  const tbctx = timberBumpCanvas.getContext('2d');

  if (tctx && tbctx) {
    // Fondo base cálido ámbar/miel de pino natural calibrado (idéntico a la imagen)
    tctx.fillStyle = '#bfa06b';
    tctx.fillRect(0, 0, 512, 512);

    tbctx.fillStyle = '#808080';
    tbctx.fillRect(0, 0, 512, 512);

    // Vetas longitudinales pronunciadas continuas en el eje Y (longitudinal)
    for (let x = 0; x < 512; x += 3) {
      const wave = Math.sin(x * 0.05) * 4 + Math.sin(x * 0.13) * 2;
      const isAnnualRing = x % 20 < 3 || x % 37 < 2;
      const alpha = isAnnualRing ? 0.35 : 0.15;

      tctx.fillStyle = isAnnualRing ? `rgba(118, 77, 34, ${alpha})` : `rgba(156, 114, 62, ${alpha})`;
      tctx.fillRect(x + wave, 0, 2.5, 512);

      const bumpVal = isAnnualRing ? 40 : 110;
      tbctx.fillStyle = `rgb(${bumpVal}, ${bumpVal}, ${bumpVal})`;
      tbctx.fillRect(x + wave, 0, 2.5, 512);
    }

    // Micro-fibras longitudinales y estrías de cepillo
    for (let i = 0; i < 70; i++) {
      const lineX = (i * 13) % 512;
      const wave = Math.cos(i * 0.4) * 2;
      tctx.fillStyle = 'rgba(92, 56, 20, 0.22)';
      tctx.fillRect(lineX + wave, 0, 1.2, 512);

      tbctx.fillStyle = 'rgb(30, 30, 30)';
      tbctx.fillRect(lineX + wave, 0, 1.2, 512);
    }

    // Nudos y desviaciones de veta naturales
    const knots = [
      { x: 130, y: 150, rx: 16, ry: 26 },
      { x: 370, y: 340, rx: 18, ry: 30 },
    ];
    knots.forEach((k) => {
      const grad = tctx.createRadialGradient(k.x, k.y, 2, k.x, k.y, k.ry);
      grad.addColorStop(0, 'rgba(85, 48, 16, 0.7)');
      grad.addColorStop(0.5, 'rgba(130, 85, 38, 0.4)');
      grad.addColorStop(1, 'rgba(191, 160, 107, 0)');
      tctx.fillStyle = grad;
      tctx.beginPath();
      tctx.ellipse(k.x, k.y, k.rx, k.ry, 0, 0, Math.PI * 2);
      tctx.fill();
    });
  }

  // 4.3 Veta Longitudinal Horizontal (para soleras inferiores, superiores, dinteles y vigas)
  const timberHCanvas = document.createElement('canvas');
  timberHCanvas.width = 512;
  timberHCanvas.height = 512;
  const thctx = timberHCanvas.getContext('2d');
  if (thctx) {
    thctx.fillStyle = '#bfa06b';
    thctx.fillRect(0, 0, 512, 512);

    for (let y = 0; y < 512; y += 3) {
      const wave = Math.sin(y * 0.05) * 4 + Math.sin(y * 0.13) * 2;
      const isAnnualRing = y % 20 < 3 || y % 37 < 2;
      const alpha = isAnnualRing ? 0.35 : 0.15;

      thctx.fillStyle = isAnnualRing ? `rgba(118, 77, 34, ${alpha})` : `rgba(156, 114, 62, ${alpha})`;
      thctx.fillRect(0, y + wave, 512, 2.5);
    }

    for (let i = 0; i < 70; i++) {
      const lineY = (i * 13) % 512;
      const wave = Math.cos(i * 0.4) * 2;
      thctx.fillStyle = 'rgba(92, 56, 20, 0.22)';
      thctx.fillRect(0, lineY + wave, 512, 1.2);
    }
  }

  // 4.4 Testa / Corte Transversal con Anillos Concéntricos (como la cabeza del listón en la imagen 1)
  const timberEndCanvas = document.createElement('canvas');
  timberEndCanvas.width = 256;
  timberEndCanvas.height = 256;
  const tectx = timberEndCanvas.getContext('2d');
  if (tectx) {
    tectx.fillStyle = '#bfa06b';
    tectx.fillRect(0, 0, 256, 256);

    const centerX = 230;
    const centerY = 230;

    for (let r = 8; r < 320; r += 7) {
      const isDark = r % 14 === 0;
      tectx.strokeStyle = isDark ? 'rgba(105, 65, 25, 0.55)' : 'rgba(155, 110, 55, 0.3)';
      tectx.lineWidth = isDark ? 2.5 : 1.5;
      tectx.beginPath();
      tectx.arc(centerX, centerY, r, 0, Math.PI * 2);
      tectx.stroke();
    }
  }

  // 5. TEXTURA ARRATIA MICROACANALADA DE FIJACIÓN OCULTA (Acero al Manganeso MG Prepintado PVDF / Poliéster)
  // Ancho útil 27.5 cm (275 mm), ondas semicirculares continuas de 10 mm de altura, remates machihembrados
  const arratiaCanvas = document.createElement('canvas');
  arratiaCanvas.width = 1024;
  arratiaCanvas.height = 1024;
  const actx = arratiaCanvas.getContext('2d');

  const arratiaBumpCanvas = document.createElement('canvas');
  arratiaBumpCanvas.width = 1024;
  arratiaBumpCanvas.height = 1024;
  const abctx = arratiaBumpCanvas.getContext('2d');

  if (actx && abctx) {
    // Fondo antracita / grafito prepintado arquitectónico de alta tecnología
    actx.fillStyle = '#1e242b';
    actx.fillRect(0, 0, 1024, 1024);

    abctx.fillStyle = '#808080';
    abctx.fillRect(0, 0, 1024, 1024);

    // Micro-acanalado continuo (ondas semicirculares de 10 mm de altura y paso estrecho ~16 mm)
    // Con modulación de panel de 27.5 cm (cada ~275 píxeles hay una junta machihembrada con fijación oculta)
    const panelWidthPx = 256; // 4 planchas útiles por repetición de 1024px
    const wavePitchPx = 16; // 16 ondas por plancha de 27.5 cm

    for (let x = 0; x < 1024; x++) {
      const isSeam = x % panelWidthPx < 4;
      const wavePhase = (x % wavePitchPx) / wavePitchPx;
      const sinVal = Math.sin(wavePhase * Math.PI * 2); // -1 a 1

      // Color de pintura metálica con reflejo en cresta y sombra en valle
      let baseBright = 32 + Math.floor(sinVal * 12);
      if (isSeam) baseBright = Math.max(10, baseBright - 18); // Ranura machihembrada oscura

      actx.fillStyle = `rgb(${baseBright}, ${baseBright + 4}, ${baseBright + 8})`;
      actx.fillRect(x, 0, 1, 1024);

      // Micro-relieve Bump Map (Onda de 10mm)
      let bumpVal = Math.floor(128 + sinVal * 85);
      if (isSeam) bumpVal = 20; // Canal profundo para junta machihembrada oculta
      abctx.fillStyle = `rgb(${bumpVal}, ${bumpVal}, ${bumpVal})`;
      abctx.fillRect(x, 0, 1, 1024);
    }

    // Microtextura PVDF texturado antihuella / mate sutil
    for (let i = 0; i < 3000; i++) {
      const px = Math.random() * 1024;
      const py = Math.random() * 1024;
      const noise = (Math.random() - 0.5) * 8;
      actx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.04})`;
      actx.fillRect(px, py, 1.5, 1.5);
    }
  }

  // 6. TEXTURA MADERA TINGLADA / SIDING PINO TERMOTRATADO (Traslape horizontal 1x4" / 1x5")
  const woodCladCanvas = document.createElement('canvas');
  woodCladCanvas.width = 512;
  woodCladCanvas.height = 512;
  const wctx = woodCladCanvas.getContext('2d');

  const woodCladBumpCanvas = document.createElement('canvas');
  woodCladBumpCanvas.width = 512;
  woodCladBumpCanvas.height = 512;
  const wbctx = woodCladBumpCanvas.getContext('2d');

  if (wctx && wbctx) {
    wctx.fillStyle = '#85562c';
    wctx.fillRect(0, 0, 512, 512);

    wbctx.fillStyle = '#808080';
    wbctx.fillRect(0, 0, 512, 512);

    const boardHPx = 64; // 8 tablas de tinglado traslapadas
    for (let b = 0; b < 8; b++) {
      const y0 = b * boardHPx;
      // Gradiente de sombra del traslape
      for (let y = 0; y < boardHPx; y++) {
        const curY = y0 + y;
        const normY = y / boardHPx;
        const shade = 0.85 + normY * 0.25;
        wctx.fillStyle = `rgba(${Math.floor(133 * shade)}, ${Math.floor(86 * shade)}, ${Math.floor(44 * shade)}, 1)`;
        wctx.fillRect(0, curY, 512, 1);

        // Bump map con inclinación en cuña del tinglado
        const bVal = Math.floor(70 + normY * 110);
        wbctx.fillStyle = `rgb(${bVal}, ${bVal}, ${bVal})`;
        wbctx.fillRect(0, curY, 512, 1);
      }

      // Línea de sombra profunda en el solape inferior
      wctx.fillStyle = 'rgba(25, 15, 5, 0.7)';
      wctx.fillRect(0, y0, 512, 3);
      wbctx.fillStyle = 'rgb(15, 15, 15)';
      wbctx.fillRect(0, y0, 512, 3);

      // Veta de madera horizontal dentro de la tabla
      for (let vx = 0; vx < 512; vx += 4) {
        wctx.fillStyle = 'rgba(65, 38, 15, 0.15)';
        wctx.fillRect(vx, y0, 2, boardHPx);
      }
    }
  }

  // 7. TEXTURA FIBROCEMENTO SIDING CEDRO GRIS
  const fcCanvas = document.createElement('canvas');
  fcCanvas.width = 512;
  fcCanvas.height = 512;
  const fcctx = fcCanvas.getContext('2d');

  const fcBumpCanvas = document.createElement('canvas');
  fcBumpCanvas.width = 512;
  fcBumpCanvas.height = 512;
  const fcbctx = fcBumpCanvas.getContext('2d');

  if (fcctx && fcbctx) {
    fcctx.fillStyle = '#4b5563';
    fcctx.fillRect(0, 0, 512, 512);

    fcbctx.fillStyle = '#808080';
    fcbctx.fillRect(0, 0, 512, 512);

    const fcBoardHPx = 64;
    for (let b = 0; b < 8; b++) {
      const y0 = b * fcBoardHPx;
      for (let y = 0; y < fcBoardHPx; y++) {
        const curY = y0 + y;
        const normY = y / fcBoardHPx;
        const cVal = Math.floor(70 + normY * 15);
        fcctx.fillStyle = `rgb(${cVal}, ${cVal + 6}, ${cVal + 12})`;
        fcctx.fillRect(0, curY, 512, 1);

        const bVal = Math.floor(80 + normY * 95);
        fcbctx.fillStyle = `rgb(${bVal}, ${bVal}, ${bVal})`;
        fcbctx.fillRect(0, curY, 512, 1);
      }
      fcctx.fillStyle = 'rgba(15, 20, 25, 0.8)';
      fcctx.fillRect(0, y0, 512, 3);
      fcbctx.fillStyle = 'rgb(10, 10, 10)';
      fcbctx.fillRect(0, y0, 512, 3);
    }
  }

  // 8. TEXTURA MEMBRANA HIDRÓFUGA RESPIRABLE TYVEK DUPONT / WEATHER BARRIER
  const tyvekCanvas = document.createElement('canvas');
  tyvekCanvas.width = 512;
  tyvekCanvas.height = 512;
  const tyctx = tyvekCanvas.getContext('2d');
  if (tyctx) {
    tyctx.fillStyle = '#f8fafc';
    tyctx.fillRect(0, 0, 512, 512);

    // Cuadrícula sutil de replanteo
    tyctx.strokeStyle = 'rgba(203, 213, 225, 0.6)';
    tyctx.lineWidth = 1;
    for (let x = 0; x < 512; x += 32) {
      tyctx.beginPath();
      tyctx.moveTo(x, 0);
      tyctx.lineTo(x, 512);
      tyctx.stroke();
    }
    for (let y = 0; y < 512; y += 32) {
      tyctx.beginPath();
      tyctx.moveTo(0, y);
      tyctx.lineTo(512, y);
      tyctx.stroke();
    }

    // Logotipo técnico Tyvek / HouseWrap
    tyctx.fillStyle = '#dc2626';
    tyctx.font = 'bold 22px sans-serif';
    tyctx.fillText('DuPont™ Tyvek®', 40, 140);
    tyctx.fillText('DuPont™ Tyvek®', 280, 380);

    tyctx.fillStyle = '#1e3a8a';
    tyctx.font = 'bold 12px sans-serif';
    tyctx.fillText('HomeWrap® Weather Barrier - NCh 1079', 40, 165);
    tyctx.fillText('HomeWrap® Weather Barrier - NCh 1079', 280, 405);
  }

  // 9. TEXTURA ZINC CA-8 / TRAPEZOIDAL NEGRO
  const zincCanvas = document.createElement('canvas');
  zincCanvas.width = 512;
  zincCanvas.height = 512;
  const zctx = zincCanvas.getContext('2d');

  const zincBumpCanvas = document.createElement('canvas');
  zincBumpCanvas.width = 512;
  zincBumpCanvas.height = 512;
  const zbctx = zincBumpCanvas.getContext('2d');

  if (zctx && zbctx) {
    zctx.fillStyle = '#1a202c';
    zctx.fillRect(0, 0, 512, 512);

    zbctx.fillStyle = '#808080';
    zbctx.fillRect(0, 0, 512, 512);

    const ribPitch = 64;
    for (let x = 0; x < 512; x++) {
      const phase = (x % ribPitch) / ribPitch;
      const sinVal = Math.sin(phase * Math.PI * 2);
      const bright = Math.floor(25 + sinVal * 15);
      zctx.fillStyle = `rgb(${bright}, ${bright + 2}, ${bright + 4})`;
      zctx.fillRect(x, 0, 1, 512);

      const bVal = Math.floor(128 + sinVal * 90);
      zbctx.fillStyle = `rgb(${bVal}, ${bVal}, ${bVal})`;
      zbctx.fillRect(x, 0, 1, 512);
    }
  }

  // 10. TEXTURA TEJA ASFÁLTICA NEGRA (Architectural Shingles / Gravillada con lengüetas)
  const shingleCanvas = document.createElement('canvas');
  shingleCanvas.width = 512;
  shingleCanvas.height = 512;
  const sctx = shingleCanvas.getContext('2d');

  const shingleBumpCanvas = document.createElement('canvas');
  shingleBumpCanvas.width = 512;
  shingleBumpCanvas.height = 512;
  const sbctx = shingleBumpCanvas.getContext('2d');

  if (sctx && sbctx) {
    sctx.fillStyle = '#1e232a';
    sctx.fillRect(0, 0, 512, 512);

    sbctx.fillStyle = '#707070';
    sbctx.fillRect(0, 0, 512, 512);

    // Hiladas de tejas asfálticas de 64px de alto
    const courseH = 64;
    for (let y = 0; y < 512; y += courseH) {
      const isShifted = (y / courseH) % 2 === 1;
      const tabW = 128;
      const xOffset = isShifted ? tabW / 2 : 0;

      // Línea de sombra de traslape inferior
      sctx.fillStyle = '#0b0d11';
      sctx.fillRect(0, y + courseH - 5, 512, 5);

      sbctx.fillStyle = '#202020';
      sbctx.fillRect(0, y + courseH - 5, 512, 5);

      for (let x = -tabW; x < 512 + tabW; x += tabW) {
        const tx = x + xOffset;
        // Ranura vertical entre lengüetas
        sctx.fillStyle = '#0f1115';
        sctx.fillRect(tx - 2, y, 4, courseH);

        sbctx.fillStyle = '#303030';
        sbctx.fillRect(tx - 2, y, 4, courseH);
      }
    }

    // Granulado / Gravilla mineral mineralizada sobre la teja
    for (let g = 0; g < 15000; g++) {
      const gx = Math.random() * 512;
      const gy = Math.random() * 512;
      const gBri = Math.floor(18 + Math.random() * 32);
      sctx.fillStyle = `rgb(${gBri}, ${gBri + 2}, ${gBri + 4})`;
      sctx.fillRect(gx, gy, 1.5, 1.5);
    }
  }

  // Crear CanvasTextures de Three.js
  cachedOsbTexture = new THREE.CanvasTexture(osbCanvas);
  cachedOsbTexture.wrapS = THREE.RepeatWrapping;
  cachedOsbTexture.wrapT = THREE.RepeatWrapping;
  cachedOsbTexture.repeat.set(1.5, 2.5);

  cachedOsbBumpMap = new THREE.CanvasTexture(bumpCanvas);
  cachedOsbBumpMap.wrapS = THREE.RepeatWrapping;
  cachedOsbBumpMap.wrapT = THREE.RepeatWrapping;
  cachedOsbBumpMap.repeat.set(1.5, 2.5);

  cachedEpsTexture = new THREE.CanvasTexture(epsCanvas);
  cachedEpsTexture.wrapS = THREE.RepeatWrapping;
  cachedEpsTexture.wrapT = THREE.RepeatWrapping;
  cachedEpsTexture.repeat.set(3, 3);

  cachedOsbEdgeTexture = new THREE.CanvasTexture(edgeCanvas);
  cachedOsbEdgeTexture.wrapS = THREE.RepeatWrapping;
  cachedOsbEdgeTexture.wrapT = THREE.RepeatWrapping;

  cachedTimberTexture = new THREE.CanvasTexture(timberCanvas);
  cachedTimberTexture.wrapS = THREE.RepeatWrapping;
  cachedTimberTexture.wrapT = THREE.RepeatWrapping;
  cachedTimberTexture.repeat.set(1, 4);

  cachedTimberHorizontalTexture = new THREE.CanvasTexture(timberHCanvas);
  cachedTimberHorizontalTexture.wrapS = THREE.RepeatWrapping;
  cachedTimberHorizontalTexture.wrapT = THREE.RepeatWrapping;
  cachedTimberHorizontalTexture.repeat.set(4, 1);

  cachedTimberBumpMap = new THREE.CanvasTexture(timberBumpCanvas);
  cachedTimberBumpMap.wrapS = THREE.RepeatWrapping;
  cachedTimberBumpMap.wrapT = THREE.RepeatWrapping;
  cachedTimberBumpMap.repeat.set(1, 4);

  cachedTimberEndGrainTexture = new THREE.CanvasTexture(timberEndCanvas);

  cachedArratiaTexture = new THREE.CanvasTexture(arratiaCanvas);
  cachedArratiaTexture.wrapS = THREE.RepeatWrapping;
  cachedArratiaTexture.wrapT = THREE.RepeatWrapping;
  cachedArratiaTexture.repeat.set(4, 2);

  cachedArratiaBumpMap = new THREE.CanvasTexture(arratiaBumpCanvas);
  cachedArratiaBumpMap.wrapS = THREE.RepeatWrapping;
  cachedArratiaBumpMap.wrapT = THREE.RepeatWrapping;
  cachedArratiaBumpMap.repeat.set(4, 2);

  cachedTimberCladdingTexture = new THREE.CanvasTexture(woodCladCanvas);
  cachedTimberCladdingTexture.wrapS = THREE.RepeatWrapping;
  cachedTimberCladdingTexture.wrapT = THREE.RepeatWrapping;
  cachedTimberCladdingTexture.repeat.set(2, 4);

  cachedTimberCladdingBumpMap = new THREE.CanvasTexture(woodCladBumpCanvas);
  cachedTimberCladdingBumpMap.wrapS = THREE.RepeatWrapping;
  cachedTimberCladdingBumpMap.wrapT = THREE.RepeatWrapping;
  cachedTimberCladdingBumpMap.repeat.set(2, 4);

  cachedFiberCementTexture = new THREE.CanvasTexture(fcCanvas);
  cachedFiberCementTexture.wrapS = THREE.RepeatWrapping;
  cachedFiberCementTexture.wrapT = THREE.RepeatWrapping;
  cachedFiberCementTexture.repeat.set(2, 4);

  cachedFiberCementBumpMap = new THREE.CanvasTexture(fcBumpCanvas);
  cachedFiberCementBumpMap.wrapS = THREE.RepeatWrapping;
  cachedFiberCementBumpMap.wrapT = THREE.RepeatWrapping;
  cachedFiberCementBumpMap.repeat.set(2, 4);

  cachedTyvekTexture = new THREE.CanvasTexture(tyvekCanvas);
  cachedTyvekTexture.wrapS = THREE.RepeatWrapping;
  cachedTyvekTexture.wrapT = THREE.RepeatWrapping;
  cachedTyvekTexture.repeat.set(2, 2);

  cachedZincCa8Texture = new THREE.CanvasTexture(zincCanvas);
  cachedZincCa8Texture.wrapS = THREE.RepeatWrapping;
  cachedZincCa8Texture.wrapT = THREE.RepeatWrapping;
  cachedZincCa8Texture.repeat.set(3, 3);

  cachedZincCa8BumpMap = new THREE.CanvasTexture(zincBumpCanvas);
  cachedZincCa8BumpMap.wrapS = THREE.RepeatWrapping;
  cachedZincCa8BumpMap.wrapT = THREE.RepeatWrapping;
  cachedZincCa8BumpMap.repeat.set(3, 3);

  cachedAsphaltShingleTexture = new THREE.CanvasTexture(shingleCanvas);
  cachedAsphaltShingleTexture.wrapS = THREE.RepeatWrapping;
  cachedAsphaltShingleTexture.wrapT = THREE.RepeatWrapping;
  cachedAsphaltShingleTexture.repeat.set(4, 4);

  cachedAsphaltShingleBumpMap = new THREE.CanvasTexture(shingleBumpCanvas);
  cachedAsphaltShingleBumpMap.wrapS = THREE.RepeatWrapping;
  cachedAsphaltShingleBumpMap.wrapT = THREE.RepeatWrapping;
  cachedAsphaltShingleBumpMap.repeat.set(4, 4);

  return {
    osbTexture: cachedOsbTexture,
    osbBumpMap: cachedOsbBumpMap,
    osbEdgeTexture: cachedOsbEdgeTexture,
    epsTexture: cachedEpsTexture,
    timberTexture: cachedTimberTexture,
    timberHorizontalTexture: cachedTimberHorizontalTexture,
    timberBumpMap: cachedTimberBumpMap,
    timberEndGrainTexture: cachedTimberEndGrainTexture,
    arratiaTexture: cachedArratiaTexture,
    arratiaBumpMap: cachedArratiaBumpMap,
    timberCladdingTexture: cachedTimberCladdingTexture,
    timberCladdingBumpMap: cachedTimberCladdingBumpMap,
    fiberCementTexture: cachedFiberCementTexture,
    fiberCementBumpMap: cachedFiberCementBumpMap,
    tyvekTexture: cachedTyvekTexture,
    zincCa8Texture: cachedZincCa8Texture,
    zincCa8BumpMap: cachedZincCa8BumpMap,
    asphaltShingleTexture: cachedAsphaltShingleTexture,
    asphaltShingleBumpMap: cachedAsphaltShingleBumpMap,
  };
}
