import { Router } from 'express';
import {
  groupBomParts,
  type BomPart
} from '../services/bomToNesting.js';

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value);
}

class ServiceError extends Error {
  constructor(
    public readonly status: number,
    public readonly stage: string,
    message: string
  ) {
    super(message);
  }
}

async function postJson(
  url: URL,
  body: unknown,
  stage: string,
  token?: string
): Promise<JsonObject> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000)
  });

  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    throw new ServiceError(
      502, stage, 'Respuesta inesperada del microservicio'
    );
  }

  let result: unknown;

  try {
    result = await response.json();
  } catch {
    throw new ServiceError(
      502, stage, 'JSON inválido del microservicio'
    );
  }

  if (!isObject(result)) {
    throw new ServiceError(
      502, stage, 'Estructura de respuesta inválida'
    );
  }

  if (!response.ok) {
    throw new ServiceError(
      response.status >= 400 && response.status < 500
        ? response.status
        : 502,
      stage,
      typeof result.error === 'string'
        ? result.error
        : 'Error del microservicio'
    );
  }

  return result;
}

async function postPreviewJson(
  url: URL,
  body: unknown,
  stage: 'BOM' | 'CNC',
  token?: string
): Promise<JsonObject> {
  try {
    return await postJson(url, body, stage, token);
  } catch (error) {
    if (error instanceof ServiceError) {
      throw error;
    }

    const timeout =
      error instanceof Error &&
      ['TimeoutError', 'AbortError'].includes(error.name);

    throw new ServiceError(
      timeout ? 504 : 503,
      stage,
      timeout
        ? `Tiempo de espera agotado en ${stage}`
        : `No fue posible conectar con ${stage}`
    );
  }
}

export function createManufacturingRouter(options: {
  bomUrl: string;
  nestingUrl: string;
  cncUrl: string;
  bomToken?: string;
}) {
  const router = Router();

  router.post('/plan', async (req, res) => {
    const {
      cabinets,
      config,
      includeHardware = true,
      nesting = {}
    } = req.body ?? {};

    if (
      !Array.isArray(cabinets) ||
      cabinets.length === 0 ||
      !isObject(config) ||
      typeof includeHardware !== 'boolean' ||
      !isObject(nesting)
    ) {
      return res.status(400).json({
        success: false,
        error: 'Solicitud de fabricación inválida'
      });
    }

    const sheetWidth = nesting.sheetWidth ?? 1830;
    const sheetHeight = nesting.sheetHeight ?? 2500;
    const kerf = nesting.kerf ?? 4;
    const margin = nesting.margin ?? 15;

    const validNumber = (value: unknown): value is number =>
      typeof value === 'number' && Number.isFinite(value);

    if (
      !validNumber(sheetWidth) ||
      !validNumber(sheetHeight) ||
      !validNumber(kerf) ||
      !validNumber(margin) ||
      sheetWidth <= 0 ||
      sheetHeight <= 0 ||
      kerf < 0 ||
      margin < 0 ||
      margin * 2 >= Math.min(sheetWidth, sheetHeight)
    ) {
      return res.status(400).json({
        success: false,
        error: 'Parámetros de corte inválidos'
      });
    }

    try {
      const bom = await postJson(
        new URL('/calculate', options.bomUrl),
        { cabinets, config, includeHardware },
        'BOM',
        options.bomToken
      );

      if (bom.success !== true || !Array.isArray(bom.parts)) {
        throw new ServiceError(
          502, 'BOM', 'BOM devolvió un despiece inválido'
        );
      }

      let groups;

      try {
        groups = groupBomParts(bom.parts as BomPart[]);
      } catch {
        throw new ServiceError(
          502, 'ADAPTER', 'El despiece no pudo transformarse'
        );
      }

      const plannedGroups = [];
      let totalSheets = 0;
      let totalPlaced = 0;

      for (const group of groups) {
        const nestingResult = await postJson(
          new URL('/optimize', options.nestingUrl),
          {
            parts: group.parts,
            sheetWidth,
            sheetHeight,
            kerf,
            margin
          },
          'NESTING'
        );

        if (
          nestingResult.success !== true ||
          !Array.isArray(nestingResult.result) ||
          !nestingResult.result.every(
            board =>
              isObject(board) &&
              Array.isArray(board.placedParts)
          )
        ) {
          throw new ServiceError(
            502, 'NESTING', 'Resultado de corte inválido'
          );
        }

        const boards = nestingResult.result as Array<{
          placedParts: unknown[];
        }>;

        const expected = group.parts.reduce(
          (sum, part) => sum + part.qty,
          0
        );

        const placed = boards.reduce(
          (sum, board) => sum + board.placedParts.length,
          0
        );

        if (expected !== placed) {
          throw new ServiceError(
            502, 'NESTING', 'Faltan piezas en el plan de corte'
          );
        }

        totalSheets += boards.length;
        totalPlaced += placed;

        plannedGroups.push({
          material: group.material,
          thickness: group.thickness,
          sources: group.sources,
          expectedParts: expected,
          placedParts: placed,
          boards
        });
      }

      return res.json({
        success: true,
        summary: {
          totalPartTypes: bom.parts.length,
          totalPhysicalParts: totalPlaced,
          totalSheets,
          materialGroups: plannedGroups.length
        },
        ...(includeHardware ? { hardware: bom.hardware ?? [] } : {}),
        groups: plannedGroups
      });

    } catch (error) {
      if (error instanceof ServiceError) {
        return res.status(error.status).json({
          success: false,
          stage: error.stage,
          error: error.message
        });
      }

      const timeout =
        error instanceof Error &&
        ['TimeoutError', 'AbortError'].includes(error.name);

      return res.status(timeout ? 504 : 503).json({
        success: false,
        error: timeout
          ? 'Tiempo de espera agotado'
          : 'No fue posible completar la planificación'
      });
    }
  });


  /**
   * BOM -> CNC Exporter.
   * Solo previsualización: NO genera instrucciones de maquinaria.
   */
  router.post('/cnc-preview', async (req, res) => {
    const {
      cabinets,
      config,
      includeHardware = true,
      settings,
      orientations
    } = req.body ?? {};

    if (
      !Array.isArray(cabinets) ||
      cabinets.length === 0 ||
      cabinets.length > 50 ||
      !isObject(config) ||
      !isObject(settings) ||
      !Array.isArray(orientations) ||
      typeof includeHardware !== 'boolean'
    ) {
      return res.status(400).json({
        success: false,
        error: 'Solicitud de previsualización CNC inválida'
      });
    }

    const cabinetMap = new Map<string, JsonObject>();

    for (const cabinet of cabinets) {
      if (
        !isObject(cabinet) ||
        typeof cabinet.id !== 'string' ||
        !cabinet.id.trim() ||
        typeof cabinet.hasDoors !== 'boolean' ||
        cabinetMap.has(cabinet.id)
      ) {
        return res.status(422).json({
          success: false,
          error: 'Identidad o configuración de gabinete inválida'
        });
      }

      cabinetMap.set(cabinet.id, cabinet);
    }

    const orientationCount = new Map<string, number>();

    for (const orientation of orientations) {
      if (
        !isObject(orientation) ||
        typeof orientation.cabinetId !== 'string' ||
        !cabinetMap.has(orientation.cabinetId)
      ) {
        return res.status(422).json({
          success: false,
          error: 'Orientación con gabinete desconocido'
        });
      }

      const id = orientation.cabinetId;

      orientationCount.set(
        id,
        (orientationCount.get(id) ?? 0) + 1
      );
    }

    for (const [cabinetId, cabinet] of cabinetMap) {
      const count = orientationCount.get(cabinetId) ?? 0;

      if (cabinet.hasDoors === true) {
        if (cabinet.variant !== '1_door') {
          return res.status(422).json({
            success: false,
            error: 'Previsualización CNC admite solo 1_door'
          });
        }

        if (count !== 1) {
          return res.status(422).json({
            success: false,
            error: 'Cada gabinete con puerta requiere una orientación única'
          });
        }
      } else if (count !== 0) {
        return res.status(422).json({
          success: false,
          error: 'Gabinete sin puertas no debe tener orientación'
        });
      }
    }

    try {
      const bom = await postPreviewJson(
        new URL('/calculate', options.bomUrl),
        { cabinets, config, includeHardware },
        'BOM',
        options.bomToken
      );

      if (
        bom.success !== true ||
        !Array.isArray(bom.parts) ||
        bom.parts.length === 0
      ) {
        throw new ServiceError(
          502,
          'BOM',
          'BOM Engine devolvió un despiece inválido'
        );
      }

      // Enviar el despiece original, incluyendo physicalUnits.
      const cnc = await postPreviewJson(
        new URL('/api/cnc/plan-preview', options.cncUrl),
        {
          parts: bom.parts,
          cabinets,
          settings,
          orientations
        },
        'CNC'
      );

      if (
        cnc.success !== true ||
        cnc.readiness !== 'NOT_MACHINE_READY' ||
        !Array.isArray(cnc.pieces) ||
        typeof cnc.physicalPieceCount !== 'number' ||
        cnc.physicalPieceCount !== cnc.pieces.length ||
        !cnc.pieces.every(
          piece =>
            isObject(piece) &&
            isObject(piece.manifest) &&
            piece.manifest.readiness === 'NOT_MACHINE_READY'
        )
      ) {
        throw new ServiceError(
          502,
          'CNC',
          'CNC Exporter devolvió una previsualización inválida'
        );
      }

      return res.status(200).json({
        success: true,
        readiness: 'NOT_MACHINE_READY',
        summary: {
          cabinetCount: cabinets.length,
          bomPartTypes: bom.parts.length,
          physicalPieceCount: cnc.physicalPieceCount
        },
        preview: cnc
      });

    } catch (error) {
      if (error instanceof ServiceError) {
        return res.status(error.status).json({
          success: false,
          stage: error.stage,
          error: error.message
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Error interno de previsualización CNC'
      });
    }
  });

  return router;
}
