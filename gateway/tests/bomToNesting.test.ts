import test from 'node:test';
import assert from 'node:assert/strict';

import {
  groupBomParts,
  type BomPart
} from '../src/services/bomToNesting.js';

const sample: BomPart[] = [
  {
    name: 'Lateral',
    moduleId: 'MOD-001',
    qty: 2,
    width: 562,
    length: 800,
    thickness: 18,
    material: '#FFFFFF',
    materialCategory: 'structure'
  },
  {
    name: 'Puerta',
    moduleId: 'MOD-001',
    qty: 1,
    width: 594,
    length: 794,
    thickness: 18,
    material: '#FFFFFF',
    materialCategory: 'doors'
  },
  {
    name: 'Fondo',
    moduleId: 'MOD-001',
    qty: 1,
    width: 564,
    length: 782,
    thickness: 3,
    material: 'Durolac Blanco 3mm',
    materialCategory: 'backs'
  }
];

test('separa materiales y espesores', () => {
  const groups = groupBomParts(sample);

  assert.equal(groups.length, 2);
  assert.equal(groups[0].thickness, 18);
  assert.equal(groups[1].thickness, 3);

  assert.equal(
    groups.reduce(
      (total, group) =>
        total + group.parts.reduce(
          (sum, part) => sum + part.qty, 0
        ),
      0
    ),
    4
  );
});

test('conserva trazabilidad de las piezas', () => {
  const groups = groupBomParts(sample);

  assert.equal(
    groups[0].sources['BOM-1'].moduleId,
    'MOD-001'
  );

  assert.equal(
    groups[0].sources['BOM-2'].name,
    'Puerta'
  );
});

test('no permite rotación por defecto', () => {
  const groups = groupBomParts(sample);

  assert.ok(
    groups.every(group =>
      group.parts.every(part =>
        part.allowRotation === false
      )
    )
  );
});

test('rechaza dimensiones inválidas', () => {
  assert.throws(
    () => groupBomParts([
      { ...sample[0], width: -562 }
    ]),
    /Pieza BOM inválida/
  );
});
