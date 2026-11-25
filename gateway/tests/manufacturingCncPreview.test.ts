import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';

import {
  createServer,
  type Server,
  type IncomingMessage,
  type ServerResponse
} from 'node:http';

import {
  createManufacturingRouter
} from '../src/routes/manufacturing.js';

async function start(server: Server): Promise<string> {
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);
      resolve();
    });
  });

  const address = server.address();
  assert.ok(address && typeof address !== 'string');

  return `http://127.0.0.1:${address.port}`;
}

async function readBody(req: IncomingMessage) {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function send(
  res: ServerResponse,
  status: number,
  body: unknown
) {
  res.writeHead(status, {
    'Content-Type': 'application/json'
  });

  res.end(JSON.stringify(body));
}

const cabinet = {
  id: 'mueble-1',
  type: 'base',
  variant: '1_door',
  hasDoors: true,
  width: 60,
  height: 90,
  depth: 58
};

const parts = [
  {
    name: 'Lateral',
    moduleId: 'mueble-1',
    moduleIndex: 0,
    qty: 2,
    length: 800,
    width: 562,
    thickness: 18,
    material: '#FFFFFF',
    physicalUnits: [
      { unit: 1, role: 'STRUCTURAL_SIDE', side: 'left' },
      { unit: 2, role: 'STRUCTURAL_SIDE', side: 'right' }
    ]
  },
  {
    name: 'Puerta',
    moduleId: 'mueble-1',
    moduleIndex: 0,
    qty: 1,
    length: 794,
    width: 594,
    thickness: 18,
    material: '#FFFFFF'
  }
];

function input(hingeSide: 'left' | 'right' = 'left') {
  return {
    cabinets: [structuredClone(cabinet)],
    config: {},
    includeHardware: true,
    settings: {
      hardwareBrand: 'Provelcar',
      assemblyType: 'spax',
      golaSystem: 'none'
    },
    orientations: [{
      cabinetId: 'mueble-1',
      doorLeaves: 1,
      sides: [
        {
          role: 'STRUCTURAL_SIDE',
          sourceBomIndex: 0,
          physicalUnit: 1,
          side: 'left',
          innerFace: 'face_A'
        },
        {
          role: 'STRUCTURAL_SIDE',
          sourceBomIndex: 0,
          physicalUnit: 2,
          side: 'right',
          innerFace: 'face_A'
        }
      ],
      doors: [{
        role: 'DOOR_LEAF',
        sourceBomIndex: 1,
        physicalUnit: 1,
        hingeSide,
        innerFace: 'face_A'
      }]
    }]
  };
}

test('Gateway: contrato BOM -> CNC preview', async t => {
  const bomCalls: any[] = [];
  const cncCalls: any[] = [];

  let bomFails = false;
  let cncRejects = false;
  let cncInvalid = false;

  const bomServer = createServer(async (req, res) => {
    const body = await readBody(req);
    bomCalls.push(body);

    if (bomFails) {
      return send(res, 500, {
        success: false,
        error: 'Error simulado BOM'
      });
    }

    send(res, 200, {
      success: true,
      parts
    });
  });

  const cncServer = createServer(async (req, res) => {
    const body = await readBody(req);
    cncCalls.push(body);

    if (cncRejects) {
      return send(res, 422, {
        success: false,
        error: 'Orientación CNC inválida'
      });
    }

    const pieces = ['left', 'right', 'door'].map(side => ({
      physicalIdentity:
        side === 'door'
          ? null
          : { role: 'STRUCTURAL_SIDE', side },
      manifest: {
        readiness: 'NOT_MACHINE_READY'
      }
    }));

    send(res, 200, {
      success: true,
      readiness: cncInvalid
        ? 'MACHINE_READY'
        : 'NOT_MACHINE_READY',
      physicalPieceCount: pieces.length,
      pieces
    });
  });

  const bomUrl = await start(bomServer);
  const cncUrl = await start(cncServer);

  const app = express();
  app.use(express.json());

  app.use(
    '/api/v1/manufacturing',
    createManufacturingRouter({
      bomUrl,
      cncUrl,
      nestingUrl: 'http://127.0.0.1:9'
    })
  );

  const gatewayServer = createServer(app);
  const gatewayUrl = await start(gatewayServer);

  t.after(async () => {
    await Promise.all(
      [gatewayServer, cncServer, bomServer].map(
        server => new Promise<void>((resolve, reject) => {
          server.close(error =>
            error ? reject(error) : resolve()
          );
        })
      )
    );
  });

  async function post(body: unknown) {
    const response = await fetch(
      `${gatewayUrl}/api/v1/manufacturing/cnc-preview`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    );

    return {
      status: response.status,
      body: await response.json()
    };
  }

  for (const side of ['left', 'right'] as const) {
    await t.test(`transmite orientación ${side}`, async () => {
      const request = input(side);
      const result = await post(request);

      assert.equal(result.status, 200);
      assert.equal(result.body.success, true);
      assert.equal(result.body.readiness, 'NOT_MACHINE_READY');
      assert.equal(result.body.summary.physicalPieceCount, 3);

      assert.deepEqual(
        cncCalls.at(-1).parts,
        parts
      );

      assert.deepEqual(
        cncCalls.at(-1).orientations,
        request.orientations
      );

      assert.deepEqual(
        cncCalls.at(-1).cabinets,
        request.cabinets
      );

      assert.equal(bomCalls.at(-1).includeHardware, true);
    });
  }

  await t.test('rechaza falta de orientación antes de BOM', async () => {
    const request = input();
    request.orientations = [];

    const before = bomCalls.length;
    const result = await post(request);

    assert.equal(result.status, 422);
    assert.equal(bomCalls.length, before);
  });

  await t.test('rechaza hasDoors ausente', async () => {
    const request = input();
    const before = bomCalls.length;

    delete (request.cabinets[0] as {
      hasDoors?: boolean
    }).hasDoors;

    const result = await post(request);

    assert.equal(result.status, 422);
    assert.equal(bomCalls.length, before);
  });

  await t.test('propaga rechazo CNC con etapa identificada', async () => {
    cncRejects = true;

    try {
      const result = await post(input());

      assert.equal(result.status, 422);
      assert.equal(result.body.stage, 'CNC');
      assert.equal(result.body.success, false);
    } finally {
      cncRejects = false;
    }
  });

  await t.test('rechaza respuestas CNC no verificadas', async () => {
    cncInvalid = true;

    try {
      const result = await post(input());

      assert.equal(result.status, 502);
      assert.equal(result.body.stage, 'CNC');
    } finally {
      cncInvalid = false;
    }
  });

  await t.test('identifica fallos BOM', async () => {
    bomFails = true;

    try {
      const before = cncCalls.length;
      const result = await post(input());

      assert.equal(result.status, 502);
      assert.equal(result.body.stage, 'BOM');
      assert.equal(cncCalls.length, before);
    } finally {
      bomFails = false;
    }
  });
});
