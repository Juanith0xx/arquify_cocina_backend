import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useConcreteHouseStore } from '../../store/concreteHouseStore';
import { DimensionCota } from '../DimensionCota';

export function ConcreteDimensionAnnotations3D() {
  const { dimensions, showDimensions } = useConcreteHouseStore();
  const signXRef = useRef<1 | -1>(1);
  const signZRef = useRef<1 | -1>(1);
  const [signs, setSigns] = useState<{ signX: 1 | -1; signZ: 1 | -1 }>({ signX: 1, signZ: 1 });

  useFrame(({ camera }) => {
    // Detectar el cuadrante de la cámara con respecto al centro del modelo (0,0,0)
    const curX = signXRef.current;
    const curZ = signZRef.current;
    let newX = curX;
    let newZ = curZ;

    // Histéresis de 0.1m para evitar parpadeos al rotar cerca de los ejes
    if (curX === 1 && camera.position.x < -0.1) newX = -1;
    else if (curX === -1 && camera.position.x > 0.1) newX = 1;

    if (curZ === 1 && camera.position.z < -0.1) newZ = -1;
    else if (curZ === -1 && camera.position.z > 0.1) newZ = 1;

    if (newX !== curX || newZ !== curZ) {
      signXRef.current = newX;
      signZRef.current = newZ;
      setSigns({ signX: newX, signZ: newZ });
    }
  });

  if (!showDimensions) return null;

  const { width: w, length: l, wallHeight: h, levels } = dimensions;
  const totalH = h * levels + (levels === 2 ? 12 : 0);
  const offset = 45; // cm fuera de los muros

  const { signX, signZ } = signs;
  const cotaZ = signZ * (l / 2 + offset);
  const wallZ = signZ * (l / 2);
  const cotaX = signX * (w / 2 + offset);
  const wallX = signX * (w / 2);

  return (
    <group>
      {/* 1. Cota Ancho Frontal/Posterior (Eje X) - se proyecta en la cara visible hacia la cámara */}
      <DimensionCota
        start={[-w / 2, 0, cotaZ]}
        end={[w / 2, 0, cotaZ]}
        label={`ANCHO: ${(w / 100).toFixed(2)} m`}
        color="#f97316"
        fontSize={14}
        textOffset={[0, 10, 0]}
        tickSize={10}
        extensionStart={[-w / 2, 0, wallZ]}
        extensionEnd={[w / 2, 0, wallZ]}
      />

      {/* 2. Cota Largo Lateral (Eje Z) - se proyecta en el lateral visible hacia la cámara */}
      <DimensionCota
        start={[cotaX, 0, -l / 2]}
        end={[cotaX, 0, l / 2]}
        label={`LARGO: ${(l / 100).toFixed(2)} m`}
        color="#f97316"
        fontSize={14}
        textOffset={[0, 10, 0]}
        tickSize={10}
        extensionStart={[wallX, 0, -l / 2]}
        extensionEnd={[wallX, 0, l / 2]}
      />

      {/* 3. Cota Altura (Eje Y) - ubicada en la esquina frontal visible más cercana a la cámara */}
      <DimensionCota
        start={[cotaX, 0, cotaZ]}
        end={[cotaX, totalH, cotaZ]}
        label={`ALTURA: ${(totalH / 100).toFixed(2)} m (${levels} ${levels === 1 ? 'Piso' : 'Pisos'})`}
        color="#38bdf8"
        fontSize={14}
        textOffset={[0, 10, 0]}
        tickSize={10}
        extensionStart={[wallX, 0, wallZ]}
        extensionEnd={[wallX, totalH, wallZ]}
      />
    </group>
  );
}
