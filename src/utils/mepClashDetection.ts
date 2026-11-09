import { MepPoint, MepClash } from '../types/mep';
import { CabinetType } from '../store/kitchenStore';
import { CountertopConfig } from '../types/countertop';

/**
 * Motor paramétrico de detección de colisiones e interferencias MEP
 * Verifica reglas sanitarias, de gas, eléctricas y mecánicas respecto a los módulos de cocina.
 */
export function detectMepClashes(
  mepPoints: MepPoint[],
  cabinets: CabinetType[],
  countertopConfig?: CountertopConfig
): MepClash[] {
  const clashes: MepClash[] = [];
  const realCabinets = cabinets.filter(
    (c) => c.type !== 'decoration' && !c.variant?.startsWith('deco_')
  );

  // 1. REGLA DE SEGURIDAD SEC: Distancia mínima Gas vs Electricidad (50 cm)
  const gasPoints = mepPoints.filter((p) => p.type === 'gas');
  const electricPoints = mepPoints.filter(
    (p) => p.type === 'electric_socket' || p.type === 'electric_power'
  );

  for (const gp of gasPoints) {
    for (const ep of electricPoints) {
      const dx = gp.position[0] - ep.position[0];
      const dy = gp.position[1] - ep.position[1];
      const dz = gp.position[2] - ep.position[2];
      const distCm = Math.hypot(dx, dy, dz);

      if (distCm < 50) {
        clashes.push({
          id: `clash-sec-${gp.id}-${ep.id}`,
          mepPointId: gp.id,
          relatedMepPointId: ep.id,
          severity: 'critical',
          title: 'Infracción Normativa SEC: Gas y Electricidad',
          description: `Distancia entre llave de gas "${gp.name}" y enchufe "${ep.name}" es de ${Math.round(distCm)} cm. La normativa técnica exige mínimo 50 cm para evitar ignición por arco eléctrico.`,
          resolutionRecommendation: 'Separar el punto eléctrico o la llave de gas al menos 50 cm en horizontal o vertical.',
          autoFixAvailable: true,
          autoFixAction: 'shift_mep_clearance',
        });
      }
    }
  }

  // 2. INTERFERENCIAS MEP CON MÓDULOS (Cajones, Traseras, Sifones)
  for (const point of mepPoints) {
    const isPlumbing = point.type === 'drain' || point.type === 'water_cold' || point.type === 'water_hot';
    const isElectric = point.type === 'electric_socket' || point.type === 'electric_power';

    // Buscar qué mueble envuelve o se superpone con este punto MEP en planta (XZ) y altura (Y)
    for (const cab of realCabinets) {
      const cCos = Math.cos(cab.rotation || 0);
      const cSin = Math.sin(cab.rotation || 0);

      // Transformar coordenadas del punto MEP al sistema local del gabinete
      const relX = point.position[0] - cab.position[0];
      const relZ = point.position[2] - cab.position[2];
      const localX = relX * cCos + relZ * cSin;
      const localZ = -relX * cSin + relZ * cCos;

      const halfW = cab.width / 2;
      const halfD = cab.depth / 2;
      const cabBottom = cab.position[1] - cab.height / 2;
      const cabTop = cab.position[1] + cab.height / 2;

      // Comprobar si el punto MEP está dentro del ancho del mueble y cerca de su respaldo posterior
      const isInsideWidth = Math.abs(localX) <= halfW + 1; // 1cm de tolerancia
      const isInsideHeight = point.elevation >= cabBottom - 2 && point.elevation <= cabTop + 2;
      const isAtBackWall = localZ <= -halfD + 18 && localZ >= -halfD - 12; // En la zona de respaldo/muro

      if (isInsideWidth && isInsideHeight && isAtBackWall) {
        // Conflicto A: Desagüe o tubería sanitaria contra cajoneras macizas
        const hasSolidDrawers = 
          cab.variant === '4_drawers' || 
          cab.variant === '2_pot_drawers' || 
          cab.variant === '1_door_1_drawer';

        if (isPlumbing && hasSolidDrawers) {
          clashes.push({
            id: `clash-drawer-plumbing-${point.id}-${cab.id}`,
            mepPointId: point.id,
            cabinetId: cab.id,
            severity: 'critical',
            title: 'Colisión: Desagüe/Grifería contra Cajones',
            description: `El mueble "${cab.variant}" tiene cajones macizos de profundidad completa que chocarán mecánicamente con la descarga de desagüe o el sifón.`,
            resolutionRecommendation: 'Reemplazar por "Fregadero Cajón en U" (sink_u_drawer) con recorte paramétrico para sifón o reubicar el mueble.',
            autoFixAvailable: true,
            autoFixAction: 'convert_to_u_drawer',
          });
        }

        // Conflicto B: Falta de retiro o calado sanitario en mueble base convencional
        if (isPlumbing && (cab.type === 'base' || cab.type === 'island') && !hasSolidDrawers && !point.hasSanitaryVoidRecess) {
          if (cab.variant !== 'sink_u_drawer') {
            clashes.push({
              id: `clash-void-${point.id}-${cab.id}`,
              mepPointId: point.id,
              cabinetId: cab.id,
              severity: 'warning',
              title: 'Vacío Sanitario / Calado de Trasera Requerido',
              description: `La instalación sanitaria (${point.name}) interfiere con el fondo Durolac del mueble. Requiere calado o retiro sanitario de 60 mm para paso de llaves y tuberías.`,
              resolutionRecommendation: 'Aplicar calado sanitario a la trasera o retirar el fondo en el despiece CNC.',
              autoFixAvailable: true,
              autoFixAction: 'add_sanitary_void',
            });
          }
        }

        // Conflicto C: Enchufe atrapado detrás de un costado o división interna
        if (isElectric) {
          const isNearLeftFlank = Math.abs(localX - (-halfW)) < 4;
          const isNearRightFlank = Math.abs(localX - halfW) < 4;
          if (isNearLeftFlank || isNearRightFlank) {
            clashes.push({
              id: `clash-elec-flank-${point.id}-${cab.id}`,
              mepPointId: point.id,
              cabinetId: cab.id,
              severity: 'warning',
              title: 'Enchufe obstruido por lateral de mueble',
              description: `El enchufe "${point.name}" coincide con el lateral o costado del módulo (espesor 18 mm), impidiendo enchufar artefactos.`,
              resolutionRecommendation: 'Desplazar el enchufe al menos 5 cm hacia el interior del módulo o fuera del canto.',
              autoFixAvailable: false,
            });
          }
        }
      }
    }
  }

  // 3. REGLAS DE EQUIPAMIENTO INTEGRADO (Fregadero vs Desagüe)
  if (countertopConfig?.enabled && countertopConfig.sinkModel && countertopConfig.sinkModel !== 'none') {
    const drainPoints = mepPoints.filter((p) => p.type === 'drain');
    if (drainPoints.length === 0) {
      clashes.push({
        id: 'clash-sink-no-drain',
        mepPointId: 'sink-no-drain',
        severity: 'critical',
        title: 'Lavaplatos sin Punto de Desagüe en Proyecto',
        description: `Se ha configurado una cubierta con lavaplatos empotrado pero no existe ningún punto de descarga sanitaria (DES Ø50) en los muros.`,
        resolutionRecommendation: 'Agregar el preset "Zona Lavaplatos Completa" en el muro correspondiente.',
        autoFixAvailable: false,
      });
    }
  }

  return clashes;
}
