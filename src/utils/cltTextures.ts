import * as THREE from 'three';

let cachedPineWoodTexture: THREE.CanvasTexture | null = null;
let cachedCltEdgeTexture: THREE.CanvasTexture | null = null;
let cachedGalvanizedSteelTexture: THREE.CanvasTexture | null = null;
let cachedConcreteFoundationTexture: THREE.CanvasTexture | null = null;
let cachedEifsStuccoTexture: THREE.CanvasTexture | null = null;

/**
 * Textura procedural de alta calidad de Pino Radiata Niuform / CMPC (Caras principales CLT y Vigas GLT)
 */
export function getPineWoodTexture(): THREE.CanvasTexture {
  if (cachedPineWoodTexture) return cachedPineWoodTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Fondo base tono madera pino radiata cálido
    ctx.fillStyle = '#E8C39E';
    ctx.fillRect(0, 0, 1024, 1024);

    // Gradiente sutil
    const grad = ctx.createLinearGradient(0, 0, 1024, 0);
    grad.addColorStop(0, '#E4BC95');
    grad.addColorStop(0.3, '#EED0B0');
    grad.addColorStop(0.7, '#DFB48B');
    grad.addColorStop(1, '#E6BE97');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);

    // Vetas longitudinales de Pino Radiata
    for (let i = 0; i < 200; i++) {
      const y = Math.random() * 1024;
      const h = Math.random() * 8 + 2;
      const alpha = Math.random() * 0.18 + 0.05;
      
      ctx.fillStyle = `rgba(180, 125, 75, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo(0, y);
      
      let curY = y;
      for (let x = 0; x <= 1024; x += 64) {
        curY = y + Math.sin((x / 1024) * Math.PI * 4 + i) * 6 + (Math.random() - 0.5) * 4;
        ctx.lineTo(x, curY);
      }
      ctx.lineTo(1024, curY + h);
      ctx.lineTo(0, y + h);
      ctx.closePath();
      ctx.fill();
    }

    // Nudos naturales de madera suave
    for (let k = 0; k < 5; k++) {
      const kx = Math.random() * 900 + 60;
      const ky = Math.random() * 900 + 60;
      const radX = Math.random() * 20 + 10;
      const radY = radX * 1.8;

      const knotGrad = ctx.createRadialGradient(kx, ky, 2, kx, ky, radY);
      knotGrad.addColorStop(0, 'rgba(120, 70, 30, 0.45)');
      knotGrad.addColorStop(0.6, 'rgba(160, 105, 55, 0.25)');
      knotGrad.addColorStop(1, 'rgba(230, 190, 150, 0)');
      
      ctx.fillStyle = knotGrad;
      ctx.beginPath();
      ctx.ellipse(kx, ky, radX, radY, Math.PI / 12, 0, Math.PI * 2);
      ctx.fill();
    }

    // Líneas finas de fibra
    ctx.strokeStyle = 'rgba(150, 95, 45, 0.12)';
    ctx.lineWidth = 1;
    for (let j = 0; j < 300; j++) {
      const yLine = Math.random() * 1024;
      ctx.beginPath();
      ctx.moveTo(0, yLine);
      ctx.lineTo(1024, yLine + (Math.random() - 0.5) * 12);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  cachedPineWoodTexture = texture;
  return texture;
}

/**
 * Textura de canto de panel CLT (Capas ortogonales visibles 3/5 capas)
 */
export function getCltEdgeTexture(): THREE.CanvasTexture {
  if (cachedCltEdgeTexture) return cachedCltEdgeTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#D6AA82';
    ctx.fillRect(0, 0, 512, 512);

    // Dibujar 5 franjas alternadas para representar las capas cruzadas del CLT
    const layerCount = 5;
    const layerHeight = 512 / layerCount;

    for (let l = 0; l < layerCount; l++) {
      const y = l * layerHeight;
      const isTransverse = l % 2 === 1;

      if (isTransverse) {
        // Capa transversal (canto con testa de madera más oscura)
        ctx.fillStyle = '#C4946B';
        ctx.fillRect(0, y, 512, layerHeight);

        // Líneas de testa verticales
        ctx.strokeStyle = 'rgba(130, 75, 30, 0.22)';
        ctx.lineWidth = 1.5;
        for (let x = 0; x < 512; x += 12) {
          ctx.beginPath();
          ctx.moveTo(x + (Math.random() - 0.5) * 3, y);
          ctx.lineTo(x + (Math.random() - 0.5) * 3, y + layerHeight);
          ctx.stroke();
        }
      } else {
        // Capa longitudinal
        ctx.fillStyle = '#DFB994';
        ctx.fillRect(0, y, 512, layerHeight);

        ctx.strokeStyle = 'rgba(160, 110, 60, 0.2)';
        ctx.lineWidth = 1;
        for (let ly = y; ly < y + layerHeight; ly += 6) {
          ctx.beginPath();
          ctx.moveTo(0, ly);
          ctx.lineTo(512, ly + (Math.random() - 0.5) * 4);
          ctx.stroke();
        }
      }

      // Línea de adhesivo PUR estructural entre capas (tipo EN301)
      ctx.strokeStyle = 'rgba(70, 45, 20, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  cachedCltEdgeTexture = texture;
  return texture;
}

/**
 * Textura de Acero Galvanizado para Conectores Simpson Strong-Tie y Rothoblaas
 */
export function getGalvanizedSteelTexture(): THREE.CanvasTexture {
  if (cachedGalvanizedSteelTexture) return cachedGalvanizedSteelTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#8B949E';
    ctx.fillRect(0, 0, 256, 256);

    // Efecto espangla / galvanizado
    for (let i = 0; i < 150; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const s = Math.random() * 12 + 4;
      const gray = Math.floor(Math.random() * 50 + 130);
      ctx.fillStyle = `rgba(${gray}, ${gray + 6}, ${gray + 12}, 0.35)`;
      ctx.fillRect(x, y, s, s);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  cachedGalvanizedSteelTexture = texture;
  return texture;
}

/**
 * Textura de Radier / Fundación Hormigón Armado
 */
export function getConcreteFoundationTexture(): THREE.CanvasTexture {
  if (cachedConcreteFoundationTexture) return cachedConcreteFoundationTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#94999E';
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 400; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = Math.random() * 3 + 1;
      const shade = Math.random() > 0.5 ? 170 : 80;
      ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, 0.2)`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  cachedConcreteFoundationTexture = texture;
  return texture;
}

/**
 * Textura para EIFS Weber / Estuco Térmico Exterior
 */
export function getEifsStuccoTexture(): THREE.CanvasTexture {
  if (cachedEifsStuccoTexture) return cachedEifsStuccoTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#E8E8E6';
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 800; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const s = Math.random() * 2 + 0.5;
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.05 + 0.01})`;
      ctx.fillRect(x, y, s, s);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  cachedEifsStuccoTexture = texture;
  return texture;
}
