export interface BomPart {
  name: string;
  moduleId: string;
  qty: number;
  width: number;
  length: number;
  thickness: number;
  material: string;
  materialCategory?: string;
}

export interface NestingPart {
  id: string;
  width: number;
  length: number;
  qty: number;
  color: string;
  allowRotation: boolean;
}

export interface NestingGroup {
  material: string;
  thickness: number;
  parts: NestingPart[];
  sources: Record<string, {
    moduleId: string;
    name: string;
    materialCategory?: string;
  }>;
}

function positiveFinite(value: unknown): value is number {
  return typeof value === 'number' &&
    Number.isFinite(value) &&
    value > 0;
}

export function groupBomParts(
  parts: BomPart[],
  allowRotation = false
): NestingGroup[] {
  if (!Array.isArray(parts) || parts.length === 0) {
    throw new Error('BOM debe contener piezas');
  }

  const groups = new Map<string, NestingGroup>();

  for (const [index, part] of parts.entries()) {
    if (
      !part ||
      !positiveFinite(part.width) ||
      !positiveFinite(part.length) ||
      !positiveFinite(part.thickness) ||
      !Number.isSafeInteger(part.qty) ||
      part.qty <= 0 ||
      typeof part.material !== 'string' ||
      !part.material.trim() ||
      typeof part.moduleId !== 'string' ||
      !part.moduleId.trim() ||
      typeof part.name !== 'string' ||
      !part.name.trim()
    ) {
      throw new Error(`Pieza BOM inválida en posición ${index}`);
    }

    const material = part.material.trim();
    const key = JSON.stringify([
      material,
      part.thickness
    ]);

    if (!groups.has(key)) {
      groups.set(key, {
        material,
        thickness: part.thickness,
        parts: [],
        sources: {}
      });
    }

    const group = groups.get(key)!;
    const id = `BOM-${index + 1}`;

    group.parts.push({
      id,
      width: part.width,
      length: part.length,
      qty: part.qty,
      color: material,
      allowRotation
    });

    group.sources[id] = {
      moduleId: part.moduleId,
      name: part.name,
      materialCategory: part.materialCategory
    };
  }

  return [...groups.values()];
}
