import { Router } from 'express';
import { generateKitchenPartsList } from '../../src/utils/kitchenManufacturing.js';

export const bomRouter = Router();

bomRouter.post('/calculate', (req, res) => {
  try {
    const { cabinets } = req.body;
    if (!cabinets || !Array.isArray(cabinets)) {
      return res.status(400).json({ error: 'Módulos requeridos para el despiece' });
    }

    const parts = generateKitchenPartsList(cabinets);
    res.json({
      success: true,
      totalParts: parts.length,
      parts,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Error procesando despiece BOM', details: error.message });
  }
});
