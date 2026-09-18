import { Router } from 'express';
import { getServices } from './services.controller';

export const servicesRouter = Router();

// GET /api/services
servicesRouter.get('/', getServices);
