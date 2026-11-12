import express from 'express';
import type { Request, Response } from 'express';

const app = express();

const PORT = Number(process.env.PORT || 3004);

const BOM_ENGINE_URL =
  process.env.BOM_ENGINE_URL ||
  (process.env.NODE_ENV === 'production'
    ? ''
    : 'http://127.0.0.1:3002');

const BOM_SERVICE_TOKEN = process.env.BOM_SERVICE_TOKEN;

const CUT_OPTIMIZER_URL =
  process.env.CUT_OPTIMIZER_URL ||
  (process.env.NODE_ENV === 'production'
    ? ''
    : 'http://127.0.0.1:3001');

if (!CUT_OPTIMIZER_URL) {
  throw new Error('CUT_OPTIMIZER_URL es obligatorio en producción');
}


if (!BOM_ENGINE_URL) {
  throw new Error('BOM_ENGINE_URL es obligatorio en producción');
}

app.disable('x-powered-by');
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'arquify-api-gateway'
  });
});

app.post('/api/v1/bom/calculate', async (req, res) => {
  const {
    cabinets,
    config,
    includeHardware = true
  } = req.body ?? {};

  if (!Array.isArray(cabinets) || !config) {
    return res.status(400).json({
      success: false,
      error: 'Se requieren cabinets y config'
    });
  }

  try {
    const upstream = await fetch(
      new URL('/calculate', BOM_ENGINE_URL),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(BOM_SERVICE_TOKEN
            ? {
                Authorization: `Bearer ${BOM_SERVICE_TOKEN}`
              }
            : {})
        },
        body: JSON.stringify({
          cabinets,
          config,
          includeHardware
        }),
        signal: AbortSignal.timeout(10000)
      }
    );

    const contentType =
      upstream.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
      return res.status(502).json({
        success: false,
        error: 'BOM Engine devolvió una respuesta inesperada'
      });
    }

    const result = await upstream.json();

    return res.status(upstream.status).json(result);

  } catch (error) {
    const timeout =
      error instanceof Error &&
      (error.name === 'TimeoutError' ||
       error.name === 'AbortError');

    return res.status(timeout ? 504 : 503).json({
      success: false,
      error: timeout
        ? 'Tiempo de espera agotado en BOM Engine'
        : 'No fue posible conectar con BOM Engine'
    });
  }
});


app.post('/api/v1/nesting/optimize', async (req, res) => {
  const body = req.body;

  if (
    !body ||
    typeof body !== 'object' ||
    !Array.isArray(body.parts) ||
    body.parts.length === 0
  ) {
    return res.status(400).json({
      success: false,
      error: 'Se requiere una lista de piezas no vacía'
    });
  }

  try {
    const upstream = await fetch(
      new URL('/optimize', CUT_OPTIMIZER_URL),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000)
      }
    );

    const contentType = upstream.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
      return res.status(502).json({
        success: false,
        error: 'Cut Optimizer devolvió una respuesta inesperada'
      });
    }

    const result = await upstream.json();
    return res.status(upstream.status).json(result);

  } catch (error) {
    const timeout =
      error instanceof Error &&
      (error.name === 'TimeoutError' ||
       error.name === 'AbortError');

    return res.status(timeout ? 504 : 503).json({
      success: false,
      error: timeout
        ? 'Tiempo de espera agotado en Cut Optimizer'
        : 'No fue posible conectar con Cut Optimizer'
    });
  }
});


const CNC_EXPORTER_URL =
  process.env.CNC_EXPORTER_URL ||
  (process.env.NODE_ENV === 'production'
    ? ''
    : 'http://127.0.0.1:3003');

if (!CNC_EXPORTER_URL) {
  throw new Error('CNC_EXPORTER_URL es obligatorio en producción');
}

async function forwardCnc(
  req: Request,
  res: Response,
  zip: boolean
) {
  const body = req.body ?? {};

  if (zip) {
    if (
      !Array.isArray(body.parts) ||
      body.parts.length === 0 ||
      body.parts.length > 200
    ) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere entre 1 y 200 piezas'
      });
    }
  } else if (
    !body.part ||
    typeof body.part !== 'object' ||
    Array.isArray(body.part)
  ) {
    return res.status(400).json({
      success: false,
      error: 'Se requiere una pieza válida'
    });
  }

  const endpoint = zip
    ? '/api/cnc/export-dxf-zip'
    : '/api/cnc/export-dxf';

  try {
    const upstream = await fetch(
      new URL(endpoint, CNC_EXPORTER_URL),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000)
      }
    );

    const contentType =
      upstream.headers.get('content-type') || '';

    if (!upstream.ok) {
      if (contentType.includes('application/json')) {
        const errorBody = await upstream.json();
        return res.status(upstream.status).json(errorBody);
      }

      return res.status(502).json({
        success: false,
        error: 'CNC Exporter devolvió un error inesperado'
      });
    }

    const expectedType = zip
      ? 'application/zip'
      : 'application/dxf';

    if (!contentType.includes(expectedType)) {
      return res.status(502).json({
        success: false,
        error: 'CNC Exporter devolvió un formato inesperado'
      });
    }

    const buffer = Buffer.from(
      await upstream.arrayBuffer()
    );

    res.status(200);
    res.setHeader('Content-Type', expectedType);
    res.setHeader(
      'Content-Disposition',
      zip
        ? 'attachment; filename="arquify_cnc.zip"'
        : 'attachment; filename="arquify_cnc.dxf"'
    );
    res.setHeader('Cache-Control', 'no-store');

    return res.send(buffer);

  } catch (error) {
    const timeout =
      error instanceof Error &&
      (
        error.name === 'TimeoutError' ||
        error.name === 'AbortError'
      );

    return res.status(timeout ? 504 : 503).json({
      success: false,
      error: timeout
        ? 'Tiempo de espera agotado en CNC Exporter'
        : 'No fue posible conectar con CNC Exporter'
    });
  }
}

app.post('/api/v1/cnc/export-dxf', (req, res) =>
  forwardCnc(req, res, false)
);

app.post('/api/v1/cnc/export-dxf-zip', (req, res) =>
  forwardCnc(req, res, true)
);

app.listen(PORT, '0.0.0.0', () => {
  console.log(
    `API Gateway de Arquify escuchando en puerto ${PORT}`
  );
});
