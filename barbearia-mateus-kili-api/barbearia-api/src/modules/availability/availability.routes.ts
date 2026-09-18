import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { availabilityQuerySchema } from './availability.schema';
import { getAvailability } from './availability.controller';

export const availabilityRouter = Router();

// GET /api/availability?date=YYYY-MM-DD&serviceId=XYZ
availabilityRouter.get('/', validate(availabilityQuerySchema, 'query'), getAvailability);
