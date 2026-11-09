import { Router } from 'express';
import { generateNestingLayout } from '../../src/utils/nesting.js';

export const nestingRouter = Router();

nestingRouter.post('/optimize', (req, res) => {
  try {
    const { parts, sheetWidth = 1830, sheetHeight = 2500, kerf = 4 } = req.body;
    if (!parts || !Array.isArray(parts)) {
      return res.status(400).json({ error: 'Lista de piezas requerida para optimizar el corte' });
    }

    const nestingResult = generateNestingLayout(parts, { sheetWidth, sheetHeight, kerf });
    res.json({
      success: true,
      result: nestingResult,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Error procesando optimización de corte', details: error.message });
  }
});
