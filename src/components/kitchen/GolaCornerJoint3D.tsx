import React, { useMemo } from 'react';
import * as THREE from 'three';

export interface GolaCornerJoint3DProps {
  position: [number, number, number];
  isRight?: boolean;
  color: string;
  metalness: number;
  roughness: number;
}

/**
 * Modelado 3D de alta fidelidad del Conector Esquinero Interior 90° para Perfil Gola L.
 * Reproduce fielmente la pieza oficial de fundición de aluminio (Provelcar x175 / Scilm / Volpato / Hafele)
 * documentada en image_717cce05.png:
 * - Seno cóncavo ergonómico interior continuo a 90° para paso suave de la mano.
 * - Ala 1 orientada hacia el riel frontal del mueble esquinero (-X en mano derecha, +X en mano izquierda).
 * - Ala 2 orientada hacia el riel frontal del mueble perpendicular (+Z hacia el frente, cero penetración al fondo).
 * - Lengüetas/aletas macho superior e inferior de acople con barrenos de fijación.
 * - Pestaña horizontal inferior con labio de remate y patines de apoyo a 90°.
 * - Acabado anodizado (aluminio natural satinado o negro mate).
 */
export function GolaCornerJoint3D({
  position,
  isRight = true,
  color,
  metalness,
  roughness,
}: GolaCornerJoint3DProps) {
  const dirX = isRight ? -1 : 1;
  const wingLen = 2.8; // 28 mm longitud del ala 1 hacia el riel del mueble esquinero
  const spineZ = -2.60; // Posición Z de la espina dorsal exterior del riel Gola L del esquinero
  const lipZ = -0.40; // Posición Z del labio frontal del riel Gola L del esquinero
  const wing2EndZ = 1.50; // Posición Z (+thickness) donde inicia el riel Gola L del mueble perpendicular
  const perpLipX = dirX * 2.20; // Posición X del labio frontal del riel Gola L del mueble perpendicular

  // 1. Pared vertical posterior en L con seno cóncavo interior continuo (extrusión vertical de 52 mm)
  const cornerGeom = useMemo(() => {
    // Tras geom.rotateX(Math.PI / 2): X_3d = x_shape, Y_3d = -z_extrude, Z_3d = +y_shape
    const shape = new THREE.Shape();
    const wallT = 0.50; // Espesor de pared vertical más nervio posterior
    const innerZ = spineZ + wallT; // -2.10
    const innerX = dirX * wallT; // -0.50 (right) o +0.50 (left)
    const curveR = 0.85;

    shape.moveTo(0, spineZ); // Esquina exterior posterior (0, -2.60)
    shape.lineTo(dirX * wingLen, spineZ); // Extremo Ala 1 espina
    shape.lineTo(dirX * wingLen, innerZ); // Cara interior Ala 1
    shape.lineTo(dirX * (wallT + curveR), innerZ);
    // Curva cóncava ergonómica interior a 90°
    shape.quadraticCurveTo(innerX, innerZ, innerX, innerZ + curveR);
    shape.lineTo(innerX, wing2EndZ); // Cara interior Ala 2 hacia el frente (+Z)
    shape.lineTo(0, wing2EndZ); // Extremo Ala 2 espina en Z = +1.50
    shape.closePath();

    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: 5.2, // 52 mm altura perfil Gola L (Y = 0 a -5.2)
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.03,
      bevelSegments: 2,
    });
    geom.rotateX(Math.PI / 2);
    geom.computeVertexNormals();
    return geom;
  }, [dirX, spineZ, wingLen, wing2EndZ]);

  // 2. Base / pestaña horizontal inferior continua a 90° (une los canales de 22 mm de ambos rieles)
  const bottomPlateGeom = useMemo(() => {
    const shape = new THREE.Shape();

    shape.moveTo(0, spineZ); // Vértice exterior (0, -2.60)
    shape.lineTo(dirX * wingLen, spineZ); // Ala 1 espina
    shape.lineTo(dirX * wingLen, lipZ); // Ala 1 labio frontal (Z = -0.40)
    shape.lineTo(dirX * 2.45, lipZ);
    // Encuentro curvo suave entre el labio frontal de Ala 1 (Z = -0.40) y el de Ala 2 (X = dirX * 2.20)
    shape.quadraticCurveTo(perpLipX, lipZ, perpLipX, lipZ + 0.25);
    shape.lineTo(perpLipX, wing2EndZ); // Ala 2 labio frontal hasta Z = +1.50
    shape.lineTo(0, wing2EndZ); // Ala 2 espina hasta Z = +1.50
    shape.closePath();

    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: 0.35, // Y = -4.85 a -5.20
      bevelEnabled: false,
    });
    geom.rotateX(Math.PI / 2);
    geom.computeVertexNormals();
    return geom;
  }, [dirX, spineZ, lipZ, wingLen, wing2EndZ, perpLipX]);

  // 3. Labio frontal ascendente continuo a 90° (une los labios frontales de ambos perfiles Gola L)
  const frontLipGeom = useMemo(() => {
    const shape = new THREE.Shape();
    const lipT = 0.25;
    const innerLipZ = lipZ - lipT; // -0.65
    const innerPerpLipX = dirX * (2.20 - lipT); // dirX * 1.95

    shape.moveTo(dirX * wingLen, lipZ);
    shape.lineTo(dirX * 2.45, lipZ);
    shape.quadraticCurveTo(perpLipX, lipZ, perpLipX, lipZ + 0.25);
    shape.lineTo(perpLipX, wing2EndZ);
    shape.lineTo(innerPerpLipX, wing2EndZ);
    shape.lineTo(innerPerpLipX, lipZ + 0.20);
    shape.quadraticCurveTo(innerPerpLipX, innerLipZ, dirX * 2.40, innerLipZ);
    shape.lineTo(dirX * wingLen, innerLipZ);
    shape.closePath();

    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: 0.85, // Desde Y = -4.35 hasta Y = -5.20
      bevelEnabled: false,
    });
    geom.rotateX(Math.PI / 2);
    geom.computeVertexNormals();
    return geom;
  }, [dirX, lipZ, wingLen, wing2EndZ, perpLipX]);

  return (
    <group position={position}>
      {/* Cuerpo vertical posterior esquinero en L fundido */}
      <mesh geometry={cornerGeom} castShadow receiveShadow>
        <meshStandardMaterial
          color={color}
          metalness={metalness}
          roughness={roughness}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Base horizontal inferior de unión a 90° */}
      <mesh position={[0, -4.85, 0]} geometry={bottomPlateGeom} castShadow receiveShadow>
        <meshStandardMaterial
          color={color}
          metalness={metalness}
          roughness={roughness}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Labio frontal ascendente continuo a 90° */}
      <mesh position={[0, -4.35, 0]} geometry={frontLipGeom} castShadow receiveShadow>
        <meshStandardMaterial
          color={color}
          metalness={metalness}
          roughness={roughness}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Aletas / lengüetas macho de inserción en Ala 1 (encastran en el riel del mueble esquinero) */}
      <group position={[dirX * wingLen, 0, spineZ + 0.25]}>
        {/* Lengüeta macho superior */}
        <mesh position={[dirX * 0.7, -0.9, 0]} castShadow>
          <boxGeometry args={[1.4, 0.75, 0.28]} />
          <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
        </mesh>
        {/* Barreno cilíndrico de fijación en lengüeta superior */}
        <mesh position={[dirX * 0.7, -0.9, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.32, 12]} />
          <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.3} />
        </mesh>

        {/* Lengüeta macho inferior */}
        <mesh position={[dirX * 0.7, -3.6, 0]} castShadow>
          <boxGeometry args={[1.4, 0.75, 0.28]} />
          <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
        </mesh>
        {/* Barreno cilíndrico en lengüeta inferior */}
        <mesh position={[dirX * 0.7, -3.6, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.32, 12]} />
          <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.3} />
        </mesh>
      </group>

      {/* Aletas / lengüetas macho de inserción en Ala 2 (encastran hacia +Z en el riel del mueble perpendicular) */}
      <group position={[dirX * 0.25, 0, wing2EndZ]}>
        {/* Lengüeta macho superior hacia +Z */}
        <mesh position={[0, -0.9, 0.7]} castShadow>
          <boxGeometry args={[0.28, 0.75, 1.4]} />
          <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
        </mesh>
        {/* Barreno cilíndrico de fijación */}
        <mesh position={[dirX * 0.15, -0.9, 0.7]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.16, 0.16, 0.32, 12]} />
          <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.3} />
        </mesh>

        {/* Lengüeta macho inferior hacia +Z */}
        <mesh position={[0, -3.6, 0.7]} castShadow>
          <boxGeometry args={[0.28, 0.75, 1.4]} />
          <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
        </mesh>
        {/* Barreno cilíndrico de fijación */}
        <mesh position={[dirX * 0.15, -3.6, 0.7]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.16, 0.16, 0.32, 12]} />
          <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.3} />
        </mesh>
      </group>

      {/* Patines de apoyo de remate inferior (matching Foto 4 Hafele/Provelcar) */}
      <mesh position={[dirX * (wingLen + 0.4), -5.1, spineZ + 0.35]} castShadow>
        <boxGeometry args={[0.8, 0.2, 0.5]} />
        <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
      </mesh>
      <mesh position={[dirX * 0.35, -5.1, wing2EndZ + 0.4]} castShadow>
        <boxGeometry args={[0.5, 0.2, 0.8]} />
        <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
      </mesh>
    </group>
  );
}
