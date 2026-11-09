import { Router } from 'express';
import { generateKitchenCncDxf } from '../../src/utils/kitchenCncDxf.js';

export const cncRouter = Router();

/**
 * POST /api/v1/cnc/dxf
 * Genera el archivo vectorial DXF / código G para centros de mecanizado CNC de 3/5 ejes
 */
cncRouter.post('/dxf', (req, res) => {
  try {
    const { cabinets } = req.body;
    if (!cabinets || !Array.isArray(cabinets)) {
      return res.status(400).json({ error: 'Módulos requeridos para mecanizado CNC' });
    }

    const dxfContent = generateKitchenCncDxf(cabinets);
    res.setHeader('Content-Type', 'application/dxf');
    res.setHeader('Content-Disposition', 'attachment; filename="mecanizado_cocina.dxf"');
    res.send(dxfContent);
  } catch (error: any) {
    res.status(500).json({ error: 'Error procesando mecanizado CNC DXF', details: error.message });
  }
});
