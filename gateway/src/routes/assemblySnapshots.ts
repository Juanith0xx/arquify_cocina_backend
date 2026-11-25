import { Router } from 'express';
import { Pool } from 'pg';
import type { Request, Response } from 'express';

const SNAPSHOT_ID_REGEX = /^[a-z0-9]{6,32}$/;

let pool: Pool | null = null;
let tableReadyPromise: Promise<void> | null = null;

function getPool(): Pool | null {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) return null;

  if (!pool) {
    const isInternalRailway =
      databaseUrl.includes('.railway.internal') ||
      databaseUrl.includes('localhost') ||
      databaseUrl.includes('127.0.0.1');

    const sslDisabled = process.env.PGSSLMODE === 'disable';

    pool = new Pool({
      connectionString: databaseUrl,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 8000,
      ssl: sslDisabled || isInternalRailway ? false : { rejectUnauthorized: false },
    });
  }

  return pool;
}

async function ensureAssemblySnapshotsTable(db: Pool): Promise<void> {
  if (!tableReadyPromise) {
    tableReadyPromise = db
      .query(`
        CREATE TABLE IF NOT EXISTS assembly_snapshots (
          id TEXT PRIMARY KEY,
          project_name TEXT,
          snapshot_json JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_assembly_snapshots_created_at
          ON assembly_snapshots (created_at DESC);
      `)
      .then(() => undefined)
      .catch((err) => {
        tableReadyPromise = null;
        throw err;
      });
  }
  return tableReadyPromise;
}

export function createAssemblySnapshotsRouter(): Router {
  const router = Router();

  // Guardar snapshot inmutable de solo lectura para etiquetas QR de armado 3D
  router.post('/', async (req: Request, res: Response) => {
    const db = getPool();
    if (!db) {
      return res.status(503).json({
        success: false,
        error: 'DATABASE_URL no está configurada en el servidor',
      });
    }

    const body = req.body ?? {};
    const id = typeof body.id === 'string' ? body.id.trim().toLowerCase() : '';
    const projectName =
      typeof body.projectName === 'string' ? body.projectName.trim().slice(0, 160) : null;
    const snapshot = body.snapshot;

    if (!SNAPSHOT_ID_REGEX.test(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID de snapshot inválido',
      });
    }

    if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere un objeto snapshot válido',
      });
    }

    try {
      await ensureAssemblySnapshotsTable(db);
      await db.query(
        `
          INSERT INTO assembly_snapshots (id, project_name, snapshot_json)
          VALUES ($1, $2, $3::jsonb)
          ON CONFLICT (id) DO NOTHING
        `,
        [id, projectName, JSON.stringify(snapshot)]
      );

      return res.status(201).json({
        success: true,
        id,
      });
    } catch (error) {
      console.error('[AssemblySnapshots] Error guardando en PostgreSQL:', error);
      return res.status(500).json({
        success: false,
        error: 'No se pudo guardar el snapshot de armado en PostgreSQL',
      });
    }
  });

  // Lectura pública por ID (el maestro escanea el QR desde su celular sin login)
  router.get('/:id', async (req: Request, res: Response) => {
    const db = getPool();
    if (!db) {
      return res.status(503).json({
        success: false,
        error: 'DATABASE_URL no está configurada en el servidor',
      });
    }

    const rawId = typeof req.params.id === 'string' ? req.params.id.trim().toLowerCase() : '';
    if (!SNAPSHOT_ID_REGEX.test(rawId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de snapshot inválido',
      });
    }

    try {
      await ensureAssemblySnapshotsTable(db);
      const result = await db.query(
        `
          SELECT id, project_name, snapshot_json, created_at
          FROM assembly_snapshots
          WHERE id = $1
          LIMIT 1
        `,
        [rawId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Snapshot de armado no encontrado',
        });
      }

      const row = result.rows[0];
      res.setHeader('Cache-Control', 'public, max-age=300');
      return res.status(200).json({
        success: true,
        id: row.id,
        projectName: row.project_name,
        snapshot: row.snapshot_json,
        createdAt: row.created_at,
      });
    } catch (error) {
      console.error('[AssemblySnapshots] Error consultando PostgreSQL:', error);
      return res.status(500).json({
        success: false,
        error: 'No se pudo leer el snapshot de armado desde PostgreSQL',
      });
    }
  });

  return router;
}
