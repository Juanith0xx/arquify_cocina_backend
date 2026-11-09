import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { bomRouter } from './services/bom/bomController.js';
import { nestingRouter } from './services/nesting/nestingController.js';
import { cncRouter } from './services/cnc/cncController.js';
import { aiRouter } from './services/ai/aiController.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health Check
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Arquify Cocina Microservices API Gateway',
    microservices: [
      { name: 'Motor de Despiece BOM', endpoint: '/api/v1/bom' },
      { name: 'Optimizador de Corte Nesting', endpoint: '/api/v1/nesting' },
      { name: 'Mecanizado CNC DXF', endpoint: '/api/v1/cnc' },
      { name: 'Generación IA Renders', endpoint: '/api/v1/ai' }
    ],
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Registrar Rutas de Microservicios
app.use('/api/v1/bom', bomRouter);
app.use('/api/v1/nesting', nestingRouter);
app.use('/api/v1/cnc', cncRouter);
app.use('/api/v1/ai', aiRouter);

app.listen(PORT, () => {
  console.log(`🚀 API Gateway & Microservicios en puerto ${PORT}`);
});
