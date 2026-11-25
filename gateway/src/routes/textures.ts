import { Router } from 'express';
import { Pool } from 'pg';
import type { Request, Response } from 'express';

const TEXTURE_ID_REGEX = /^[a-zA-Z0-9_-]{2,80}$/;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'image/gif',
]);

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

async function ensureCustomTexturesTable(db: Pool): Promise<void> {
  if (!tableReadyPromise) {
    tableReadyPromise = db
      .query(`
        CREATE TABLE IF NOT EXISTS custom_textures (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          code TEXT NOT NULL DEFAULT '',
          brand TEXT NOT NULL DEFAULT '',
          category TEXT NOT NULL DEFAULT 'maderas',
          finish TEXT NOT NULL DEFAULT '',
          sheet_format TEXT NOT NULL DEFAULT '1.83 x 2.50 m',
          price_m2_clp INTEGER NOT NULL DEFAULT 0,
          price_sheet_clp INTEGER NOT NULL DEFAULT 0,
          url TEXT NOT NULL DEFAULT '',
          preview_url TEXT NOT NULL DEFAULT '',
          active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at_label TEXT NOT NULL DEFAULT '',
          provider_id TEXT,
          provider_name TEXT,
          approval_status TEXT NOT NULL DEFAULT 'approved',
          commission_percentage DOUBLE PRECISION,
          provider_net_price_clp INTEGER,
          rejection_reason TEXT,
          thickness_mm DOUBLE PRECISION,
          sheet_width_m DOUBLE PRECISION,
          sheet_height_m DOUBLE PRECISION,
          stock INTEGER,
          is_offer_active BOOLEAN NOT NULL DEFAULT FALSE,
          offer_discount_percent DOUBLE PRECISION,
          offer_price_clp INTEGER,
          offer_stock_limit INTEGER,
          offer_expiration_date TEXT,
          image_data BYTEA,
          image_mime TEXT,
          has_image BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_custom_textures_created_at
          ON custom_textures (created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_custom_textures_category
          ON custom_textures (category);
      `)
      .then(() => undefined)
      .catch((err) => {
        tableReadyPromise = null;
        throw err;
      });
  }
  return tableReadyPromise;
}

interface ParsedImageData {
  buffer: Buffer;
  mime: string;
}

function parseImageDataUrl(raw: string): { ok: true; data: ParsedImageData } | { ok: false; error: string } {
  const match = raw.match(/^data:(image\/[a-zA-Z0-9.+-]+)(?:;charset=[^;,]+)?(;base64)?,(.*)$/s);
  if (!match) {
    return { ok: false, error: 'Formato de imagen Data URL inválido' };
  }

  let mime = match[1].toLowerCase();
  if (mime === 'image/jpg') mime = 'image/jpeg';

  if (!ALLOWED_IMAGE_MIMES.has(mime)) {
    return { ok: false, error: `Tipo de imagen no permitido: ${mime}` };
  }

  const isBase64 = Boolean(match[2]);
  const payload = match[3] || '';

  let buffer: Buffer;
  try {
    buffer = isBase64
      ? Buffer.from(payload, 'base64')
      : Buffer.from(decodeURIComponent(payload), 'utf8');
  } catch {
    return { ok: false, error: 'No se pudo decodificar la imagen enviada' };
  }

  if (buffer.length === 0) {
    return { ok: false, error: 'La imagen está vacía' };
  }

  if (buffer.length > MAX_IMAGE_BYTES) {
    return { ok: false, error: 'La imagen supera el límite máximo permitido de 5 MB' };
  }

  return { ok: true, data: { buffer, mime } };
}

function isManagedTextureImageUrl(url: string, id: string): boolean {
  if (!url) return false;
  const escapedId = encodeURIComponent(id);
  return (
    url.includes(`/api/v1/textures/${escapedId}/image`) ||
    url.includes(`/api/v1/textures/${id}/image`)
  );
}

function toFiniteNumberOrNull(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

function toIntOrNull(val: unknown): number | null {
  const n = toFiniteNumberOrNull(val);
  return n === null ? null : Math.round(n);
}

function toStringOrNull(val: unknown, maxLen = 500): string | null {
  if (typeof val !== 'string') return null;
  const trimmed = val.trim();
  return trimmed ? trimmed.slice(0, maxLen) : null;
}

interface TextureRow {
  id: string;
  name: string;
  code: string;
  brand: string;
  category: string;
  finish: string;
  sheet_format: string;
  price_m2_clp: number;
  price_sheet_clp: number;
  url: string;
  preview_url: string;
  active: boolean;
  created_at_label: string;
  provider_id: string | null;
  provider_name: string | null;
  approval_status: string;
  commission_percentage: number | null;
  provider_net_price_clp: number | null;
  rejection_reason: string | null;
  thickness_mm: number | null;
  sheet_width_m: number | null;
  sheet_height_m: number | null;
  stock: number | null;
  is_offer_active: boolean | null;
  offer_discount_percent: number | null;
  offer_price_clp: number | null;
  offer_stock_limit: number | null;
  offer_expiration_date: string | null;
  has_image: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

function rowToTextureItem(row: TextureRow) {
  const version = row.updated_at ? new Date(row.updated_at).getTime() : Date.now();
  const managedUrl = `/api/v1/textures/${encodeURIComponent(row.id)}/image?v=${version}`;
  const resolvedUrl = row.has_image ? managedUrl : row.url;
  const resolvedPreviewUrl = row.has_image ? managedUrl : (row.preview_url || row.url);

  const createdAtLabel =
    row.created_at_label ||
    (row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);

  return {
    id: row.id,
    name: row.name,
    code: row.code || '',
    brand: row.brand || '',
    category: row.category || 'maderas',
    finish: row.finish || '',
    sheetFormat: row.sheet_format || '1.83 x 2.50 m',
    priceM2Clp: Number(row.price_m2_clp) || 0,
    priceSheetClp: Number(row.price_sheet_clp) || 0,
    url: resolvedUrl,
    previewUrl: resolvedPreviewUrl,
    active: Boolean(row.active),
    createdAt: createdAtLabel,
    ...(row.provider_id ? { providerId: row.provider_id } : {}),
    ...(row.provider_name ? { providerName: row.provider_name } : {}),
    approvalStatus: row.approval_status || 'approved',
    ...(row.commission_percentage !== null && row.commission_percentage !== undefined
      ? { commissionPercentage: Number(row.commission_percentage) }
      : {}),
    ...(row.provider_net_price_clp !== null && row.provider_net_price_clp !== undefined
      ? { providerNetPriceClp: Number(row.provider_net_price_clp) }
      : {}),
    ...(row.rejection_reason ? { rejectionReason: row.rejection_reason } : {}),
    ...(row.thickness_mm !== null && row.thickness_mm !== undefined
      ? { thicknessMm: Number(row.thickness_mm) }
      : {}),
    ...(row.sheet_width_m !== null && row.sheet_width_m !== undefined
      ? { sheetWidthM: Number(row.sheet_width_m) }
      : {}),
    ...(row.sheet_height_m !== null && row.sheet_height_m !== undefined
      ? { sheetHeightM: Number(row.sheet_height_m) }
      : {}),
    ...(row.stock !== null && row.stock !== undefined ? { stock: Number(row.stock) } : {}),
    ...(row.is_offer_active ? { isOfferActive: Boolean(row.is_offer_active) } : {}),
    ...(row.offer_discount_percent !== null && row.offer_discount_percent !== undefined
      ? { offerDiscountPercent: Number(row.offer_discount_percent) }
      : {}),
    ...(row.offer_price_clp !== null && row.offer_price_clp !== undefined
      ? { offerPriceClp: Number(row.offer_price_clp) }
      : {}),
    ...(row.offer_stock_limit !== null && row.offer_stock_limit !== undefined
      ? { offerStockLimit: Number(row.offer_stock_limit) }
      : {}),
    ...(row.offer_expiration_date ? { offerExpirationDate: row.offer_expiration_date } : {}),
  };
}

const SELECT_METADATA_COLUMNS = `
  id, name, code, brand, category, finish, sheet_format,
  price_m2_clp, price_sheet_clp, url, preview_url, active,
  created_at_label, provider_id, provider_name, approval_status,
  commission_percentage, provider_net_price_clp, rejection_reason,
  thickness_mm, sheet_width_m, sheet_height_m, stock,
  is_offer_active, offer_discount_percent, offer_price_clp,
  offer_stock_limit, offer_expiration_date, has_image,
  created_at, updated_at
`;

export function createTexturesRouter(): Router {
  const router = Router();

  // CORS para permitir carga de texturas desde Three.js (crossOrigin="anonymous") y dev local
  router.use((_req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
  });

  router.options('*', (_req, res) => {
    res.sendStatus(204);
  });

  // Listar todas las texturas almacenadas en PostgreSQL (sin enviar binarios en el JSON)
  router.get('/', async (_req: Request, res: Response) => {
    const db = getPool();
    if (!db) {
      return res.status(503).json({
        success: false,
        error: 'DATABASE_URL no está configurada en el servidor',
      });
    }

    try {
      await ensureCustomTexturesTable(db);
      const result = await db.query<TextureRow>(`
        SELECT ${SELECT_METADATA_COLUMNS}
        FROM custom_textures
        ORDER BY created_at DESC
      `);

      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({
        success: true,
        textures: result.rows.map(rowToTextureItem),
      });
    } catch (error) {
      console.error('[Textures] Error listando texturas desde PostgreSQL:', error);
      return res.status(500).json({
        success: false,
        error: 'No se pudieron consultar las texturas desde PostgreSQL',
      });
    }
  });

  // Servir el archivo binario de la textura almacenada en PostgreSQL (para <img> y Three.js TextureLoader)
  router.get('/:id/image', async (req: Request, res: Response) => {
    const db = getPool();
    if (!db) {
      return res.status(503).json({
        success: false,
        error: 'DATABASE_URL no está configurada en el servidor',
      });
    }

    const rawId = typeof req.params.id === 'string' ? req.params.id.trim() : '';
    if (!TEXTURE_ID_REGEX.test(rawId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de textura inválido',
      });
    }

    try {
      await ensureCustomTexturesTable(db);
      const result = await db.query<{ image_data: Buffer | null; image_mime: string | null }>(
        `
          SELECT image_data, image_mime
          FROM custom_textures
          WHERE id = $1
          LIMIT 1
        `,
        [rawId]
      );

      if (result.rows.length === 0 || !result.rows[0].image_data) {
        return res.status(404).json({
          success: false,
          error: 'Imagen de textura no encontrada',
        });
      }

      const { image_data, image_mime } = result.rows[0];
      const mime = image_mime || 'image/jpeg';

      res.status(200);
      res.setHeader('Content-Type', mime);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      if (mime === 'image/svg+xml') {
        res.setHeader('Content-Security-Policy', 'sandbox');
      }

      return res.send(image_data);
    } catch (error) {
      console.error('[Textures] Error sirviendo imagen desde PostgreSQL:', error);
      return res.status(500).json({
        success: false,
        error: 'No se pudo obtener la imagen de textura desde PostgreSQL',
      });
    }
  });

  // Crear o actualizar (UPSERT) una textura en PostgreSQL
  const handleUpsert = async (req: Request, res: Response, isCreate: boolean) => {
    const db = getPool();
    if (!db) {
      return res.status(503).json({
        success: false,
        error: 'DATABASE_URL no está configurada en el servidor',
      });
    }

    const body = req.body ?? {};
    const paramId = typeof req.params.id === 'string' ? req.params.id.trim() : '';
    const bodyId = typeof body.id === 'string' ? body.id.trim() : '';
    const id = paramId || bodyId || `tex-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    if (!TEXTURE_ID_REGEX.test(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID de textura inválido',
      });
    }

    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 200) : '';
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'El nombre de la textura es obligatorio',
      });
    }

    const rawUrl = typeof body.url === 'string' ? body.url.trim() : '';
    const rawPreviewUrl = typeof body.previewUrl === 'string' ? body.previewUrl.trim() : '';
    const candidateImageDataUrl = rawUrl.startsWith('data:image/')
      ? rawUrl
      : rawPreviewUrl.startsWith('data:image/')
      ? rawPreviewUrl
      : '';

    let imageData: Buffer | null = null;
    let imageMime: string | null = null;
    let hasImage = false;
    let preserveExistingImage = false;
    let storedUrl = rawUrl;
    let storedPreviewUrl = rawPreviewUrl || rawUrl;

    if (candidateImageDataUrl) {
      const parsed = parseImageDataUrl(candidateImageDataUrl);
      if (!parsed.ok) {
        return res.status(400).json({
          success: false,
          error: parsed.error,
        });
      }
      imageData = parsed.data.buffer;
      imageMime = parsed.data.mime;
      hasImage = true;
      storedUrl = '';
      storedPreviewUrl = '';
    } else if (isManagedTextureImageUrl(rawUrl, id) || isManagedTextureImageUrl(rawPreviewUrl, id)) {
      // Edición de metadatos sin reemplazar la imagen ya almacenada en PostgreSQL
      preserveExistingImage = true;
      storedUrl = '';
      storedPreviewUrl = '';
    } else {
      // Color hexadecimal (#FFFFFF), ruta estática (/textures/...) o URL externa
      storedUrl = rawUrl.slice(0, 2000);
      storedPreviewUrl = (rawPreviewUrl || rawUrl).slice(0, 2000);
    }

    const validCategories = new Set(['maderas', 'solidos', 'hpl_autor', 'piedras_marmoles']);
    const category =
      typeof body.category === 'string' && validCategories.has(body.category)
        ? body.category
        : 'maderas';

    const validApproval = new Set(['pending', 'approved', 'rejected']);
    const approvalStatus =
      typeof body.approvalStatus === 'string' && validApproval.has(body.approvalStatus)
        ? body.approvalStatus
        : 'approved';

    const createdAtLabel =
      toStringOrNull(body.createdAt, 40) || new Date().toISOString().split('T')[0];

    try {
      await ensureCustomTexturesTable(db);
      const result = await db.query<TextureRow>(
        `
          INSERT INTO custom_textures (
            id, name, code, brand, category, finish, sheet_format,
            price_m2_clp, price_sheet_clp, url, preview_url, active,
            created_at_label, provider_id, provider_name, approval_status,
            commission_percentage, provider_net_price_clp, rejection_reason,
            thickness_mm, sheet_width_m, sheet_height_m, stock,
            is_offer_active, offer_discount_percent, offer_price_clp,
            offer_stock_limit, offer_expiration_date,
            image_data, image_mime, has_image
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            $8, $9, $10, $11, $12,
            $13, $14, $15, $16,
            $17, $18, $19,
            $20, $21, $22, $23,
            $24, $25, $26,
            $27, $28,
            $29, $30, $31
          )
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            code = EXCLUDED.code,
            brand = EXCLUDED.brand,
            category = EXCLUDED.category,
            finish = EXCLUDED.finish,
            sheet_format = EXCLUDED.sheet_format,
            price_m2_clp = EXCLUDED.price_m2_clp,
            price_sheet_clp = EXCLUDED.price_sheet_clp,
            url = CASE WHEN $32::boolean THEN custom_textures.url ELSE EXCLUDED.url END,
            preview_url = CASE WHEN $32::boolean THEN custom_textures.preview_url ELSE EXCLUDED.preview_url END,
            active = EXCLUDED.active,
            provider_id = EXCLUDED.provider_id,
            provider_name = EXCLUDED.provider_name,
            approval_status = EXCLUDED.approval_status,
            commission_percentage = EXCLUDED.commission_percentage,
            provider_net_price_clp = EXCLUDED.provider_net_price_clp,
            rejection_reason = EXCLUDED.rejection_reason,
            thickness_mm = EXCLUDED.thickness_mm,
            sheet_width_m = EXCLUDED.sheet_width_m,
            sheet_height_m = EXCLUDED.sheet_height_m,
            stock = EXCLUDED.stock,
            is_offer_active = EXCLUDED.is_offer_active,
            offer_discount_percent = EXCLUDED.offer_discount_percent,
            offer_price_clp = EXCLUDED.offer_price_clp,
            offer_stock_limit = EXCLUDED.offer_stock_limit,
            offer_expiration_date = EXCLUDED.offer_expiration_date,
            image_data = CASE WHEN $32::boolean THEN custom_textures.image_data ELSE EXCLUDED.image_data END,
            image_mime = CASE WHEN $32::boolean THEN custom_textures.image_mime ELSE EXCLUDED.image_mime END,
            has_image = CASE WHEN $32::boolean THEN custom_textures.has_image ELSE EXCLUDED.has_image END,
            updated_at = NOW()
          RETURNING ${SELECT_METADATA_COLUMNS}
        `,
        [
          id,
          name,
          toStringOrNull(body.code, 100) || '',
          toStringOrNull(body.brand, 160) || '',
          category,
          toStringOrNull(body.finish, 120) || '',
          toStringOrNull(body.sheetFormat, 80) || '1.83 x 2.50 m',
          toIntOrNull(body.priceM2Clp) ?? 0,
          toIntOrNull(body.priceSheetClp) ?? 0,
          storedUrl,
          storedPreviewUrl,
          body.active !== undefined ? Boolean(body.active) : true,
          createdAtLabel,
          toStringOrNull(body.providerId, 120),
          toStringOrNull(body.providerName, 160),
          approvalStatus,
          toFiniteNumberOrNull(body.commissionPercentage),
          toIntOrNull(body.providerNetPriceClp),
          toStringOrNull(body.rejectionReason, 500),
          toFiniteNumberOrNull(body.thicknessMm),
          toFiniteNumberOrNull(body.sheetWidthM),
          toFiniteNumberOrNull(body.sheetHeightM),
          toIntOrNull(body.stock),
          Boolean(body.isOfferActive),
          toFiniteNumberOrNull(body.offerDiscountPercent),
          toIntOrNull(body.offerPriceClp),
          toIntOrNull(body.offerStockLimit),
          toStringOrNull(body.offerExpirationDate, 40),
          imageData,
          imageMime,
          hasImage,
          preserveExistingImage,
        ]
      );

      return res.status(isCreate ? 201 : 200).json({
        success: true,
        texture: rowToTextureItem(result.rows[0]),
      });
    } catch (error) {
      console.error('[Textures] Error guardando textura en PostgreSQL:', error);
      return res.status(500).json({
        success: false,
        error: 'No se pudo guardar la textura en PostgreSQL',
      });
    }
  };

  router.post('/', (req, res) => handleUpsert(req, res, true));
  router.put('/:id', (req, res) => handleUpsert(req, res, false));

  // Eliminar textura desde PostgreSQL
  router.delete('/:id', async (req: Request, res: Response) => {
    const db = getPool();
    if (!db) {
      return res.status(503).json({
        success: false,
        error: 'DATABASE_URL no está configurada en el servidor',
      });
    }

    const rawId = typeof req.params.id === 'string' ? req.params.id.trim() : '';
    if (!TEXTURE_ID_REGEX.test(rawId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de textura inválido',
      });
    }

    try {
      await ensureCustomTexturesTable(db);
      await db.query('DELETE FROM custom_textures WHERE id = $1', [rawId]);
      return res.status(200).json({
        success: true,
        id: rawId,
      });
    } catch (error) {
      console.error('[Textures] Error eliminando textura en PostgreSQL:', error);
      return res.status(500).json({
        success: false,
        error: 'No se pudo eliminar la textura en PostgreSQL',
      });
    }
  });

  return router;
}
