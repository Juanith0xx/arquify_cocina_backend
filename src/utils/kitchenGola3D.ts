import * as THREE from 'three';

/**
 * Geometría y formas 2D extruidas paramétricas oficiales para el Sistema de Perfiles Gola Provelcar:
 * - Provelcar x175: Tirador Gola Superior "Tipo J" (aloja pestaña superior bajo cubierta y curva cóncava ergonómica).
 * - Provelcar x176: Tirador Gola Intermedio "Tipo C / U" (para paso entre cajones superpuestos).
 */

const golaJGeomCache = new Map<number, THREE.BufferGeometry>();
const golaCGeomCache = new Map<number, THREE.BufferGeometry>();

/**
 * Sección transversal oficial del Perfil Gola Tipo J en disposición VERTICAL de instalación real (según foto oficial image_3a9acff1.png):
 * Plano 2D: X = profundidad hacia el interior del mueble (0.4 a 2.95 cm), Y = altura relativa al borde superior (0 a -5.20 cm).
 * - Columna vertical posterior de ~50 mm (apoyo en el fondo del destaje CNC).
 * - Nervaduras traseras de clipaje/anclaje hacia el interior del mueble.
 * - Ceja superior bajo cubierta.
 * - Curva cóncava ergonómica inferior hacia adelante.
 * - Pestaña horizontal inferior con labio de remate hacia abajo sobre el frente del mueble.
 */
export function createProvelcarX175Shape(): THREE.Shape {
  const shape = new THREE.Shape();

  // 1. Ceja superior bajo cubierta (apoyo en X=2.30 a 2.60 en Y=0)
  shape.moveTo(2.30, 0);
  shape.lineTo(2.60, 0);

  // 2. Cara posterior de la columna vertical (apoya contra el fondo del destaje)
  // Baja hasta la primera nervadura de clip
  shape.lineTo(2.60, -1.30);
  // Nervadura trasera superior
  shape.lineTo(2.95, -1.30);
  shape.lineTo(2.95, -1.55);
  shape.lineTo(2.60, -1.55);

  // Tramo vertical intermedio
  shape.lineTo(2.60, -3.20);
  // Nervadura trasera inferior
  shape.lineTo(2.95, -3.20);
  shape.lineTo(2.95, -3.45);
  shape.lineTo(2.60, -3.45);

  // Baja hasta el inicio de la curva inferior
  shape.lineTo(2.60, -4.30);

  // 3. Curva ergonómica inferior hacia adelante (seno cóncavo)
  shape.bezierCurveTo(
    2.60, -4.85,
    2.20, -5.00,
    1.60, -5.00
  );

  // Tramo horizontal inferior hacia la pestaña frontal
  shape.lineTo(0.55, -5.00);

  // 4. Labio/gancho frontal hacia abajo
  shape.lineTo(0.55, -5.20);
  shape.lineTo(0.40, -5.20);
  shape.lineTo(0.40, -4.85); // Espesor t=0.15cm hacia arriba

  // Cara superior del ala frontal horizontal
  shape.lineTo(1.60, -4.85);

  // Curva interior cóncava
  shape.bezierCurveTo(
    2.05, -4.85,
    2.45, -4.70,
    2.45, -4.30
  );

  // Cara frontal interior de la columna vertical (sube hasta Y=0)
  shape.lineTo(2.45, -0.15);
  shape.lineTo(2.30, -0.15);

  shape.closePath();
  return shape;
}

/**
 * Sección transversal oficial del Perfil Gola Tipo C / U Provelcar x176 (en cm):
 * Según ficha técnica oficial del proveedor (50 mm alto x 20 mm profundidad):
 * - Centrado en Y = 0 (alto de cuerpo en U: 5.0 cm, de Y = -2.50 a Y = +2.50 cm).
 * - Profundidad del canal en U: 2.0 cm (de X = 0 en el borde frontal del casco a X = 2.00 cm en el respaldo plano).
 * - Pestañas/labios exteriores superior (+Y) e inferior (-Y) que abrazan el destaje CNC del lateral.
 * - Nervaduras traseras centrales de fijación para clip/escuadra.
 */
export function createProvelcarX176Shape(): THREE.Shape {
  const shape = new THREE.Shape();

  // 1. Labio / pestaña frontal superior (abraza el borde superior del destaje CNC en X=0)
  shape.moveTo(0.00, 2.36);
  shape.lineTo(0.00, 2.72);
  shape.lineTo(0.24, 2.72);
  shape.lineTo(0.24, 2.58);
  shape.lineTo(0.14, 2.58);
  shape.lineTo(0.14, 2.50);

  // 2. Ala horizontal superior exterior hacia el fondo del destaje
  shape.lineTo(1.65, 2.50);

  // Curva exterior superior hacia la espalda vertical plana
  shape.quadraticCurveTo(2.00, 2.50, 2.00, 2.15);

  // 3. Espalda vertical plana posterior con nervaduras centrales de anclaje
  shape.lineTo(2.00, 0.55);
  // Nervadura trasera superior (clip en L)
  shape.lineTo(2.26, 0.55);
  shape.lineTo(2.26, 0.25);
  shape.lineTo(2.16, 0.25);
  shape.lineTo(2.16, 0.42);
  shape.lineTo(2.00, 0.42);

  // Tramo central entre nervaduras
  shape.lineTo(2.00, -0.42);

  // Nervadura trasera inferior (clip en L simétrico)
  shape.lineTo(2.16, -0.42);
  shape.lineTo(2.16, -0.25);
  shape.lineTo(2.26, -0.25);
  shape.lineTo(2.26, -0.55);
  shape.lineTo(2.00, -0.55);

  // Continúa espalda vertical plana hasta la curva inferior
  shape.lineTo(2.00, -2.15);

  // Curva exterior inferior hacia el ala horizontal inferior
  shape.quadraticCurveTo(2.00, -2.50, 1.65, -2.50);

  // 4. Ala horizontal inferior exterior hacia el frente del casco
  shape.lineTo(0.14, -2.50);

  // 5. Labio / pestaña frontal inferior (abraza el borde inferior del destaje CNC en X=0)
  shape.lineTo(0.14, -2.58);
  shape.lineTo(0.24, -2.58);
  shape.lineTo(0.24, -2.72);
  shape.lineTo(0.00, -2.72);
  shape.lineTo(0.00, -2.36);

  // 6. Contorno interior del canal en U (espesor constante ~1.4mm)
  shape.lineTo(1.55, -2.36);
  shape.quadraticCurveTo(1.86, -2.36, 1.86, -2.05);
  shape.lineTo(1.86, 2.05);
  shape.quadraticCurveTo(1.86, 2.36, 1.55, 2.36);
  shape.lineTo(0.00, 2.36);

  shape.closePath();
  return shape;
}

/**
 * Obtiene o crea la geometría 3D extruida de Provelcar x175 para un ancho de tramo dado.
 */
export function getProvelcarX175Geometry(span: number): THREE.BufferGeometry {
  const key = Math.round(span * 10) / 10;
  let geom = golaJGeomCache.get(key);
  if (!geom) {
    const shape = createProvelcarX175Shape();
    geom = new THREE.ExtrudeGeometry(shape, {
      depth: span,
      bevelEnabled: false,
      steps: 1,
      curveSegments: 16
    });
    geom.computeVertexNormals();
    golaJGeomCache.set(key, geom);
  }
  return geom;
}

/**
 * Obtiene o crea la geometría 3D extruida de Provelcar x176 para un ancho de tramo dado.
 */
export function getProvelcarX176Geometry(span: number): THREE.BufferGeometry {
  const key = Math.round(span * 10) / 10;
  let geom = golaCGeomCache.get(key);
  if (!geom) {
    const shape = createProvelcarX176Shape();
    geom = new THREE.ExtrudeGeometry(shape, {
      depth: span,
      bevelEnabled: false,
      steps: 1,
      curveSegments: 16
    });
    geom.computeVertexNormals();
    golaCGeomCache.set(key, geom);
  }
  return geom;
}
