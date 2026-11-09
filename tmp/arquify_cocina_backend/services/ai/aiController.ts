import { Router } from 'express';

export const aiRouter = Router();

aiRouter.post('/render', async (req, res) => {
  try {
    const { imageBase64, prompt } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Imagen base requerida para el render IA' });
    }

    res.json({
      success: true,
      message: 'Render procesado',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Error procesando render IA', details: error.message });
  }
});
