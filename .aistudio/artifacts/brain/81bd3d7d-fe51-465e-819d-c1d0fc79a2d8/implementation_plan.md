# Plan de Implementación: Elevación Frontal Lado a Lado (Muro A e Isla)

## 1. Alcance Realizado
- **Archivo modificado**: Exclusivamente `/src/components/KitchenBlueprint.tsx` en el Cuadrante 2 (Lámina 1: Vistas Generales de Arquitectura).
- **Aislamiento por capas estricto**: No se tocaron tiendas Zustand (`kitchenStore`, `store`), ni modelos 3D, mallas R3F, motores de cubicación, presupuestos B2B ni nesting.

## 2. Modificaciones Técnicas Aplicadas
- **Disposición Lado a Lado**: Muro A a la izquierda e Isla Central a la derecha en un único SVG armónico.
- **Escala Unificada 1:1**: Calculada a partir de la suma de anchos reales (`wallLenMm + sepMm + islandTotalWidthMm`). Los muebles de base del muro y los módulos isla comparten idéntica altura visual en píxeles.
- **Alineación de Niveles**:
  - Línea de suelo `0.00 N.P.T.` continua y alineada.
  - Zócalos al mismo nivel.
  - Cubiertas de trabajo a nivel continuo `+0.90 N.P.T.` (resaltadas en rojo técnico).
- **Separación Técnica y Rotulación**: Línea discontinua vertical divisoria (`dasharray="4,3"`) con títulos normalizados `ELEVACIÓN MURO A` y `ELEVACIÓN ISLA`.
- **Acotación Completa**: Cotas parciales de ancho sobre cada módulo, cota total de muro, cota total de isla, cota de altura Muro A (2200 mm) y cota de altura Isla (900 mm).

## 3. Verificación
- `compile_applet`: Build succeeded.
- `lint_applet` (`tsc --noEmit`): 0 errores.
