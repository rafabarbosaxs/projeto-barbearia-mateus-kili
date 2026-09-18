import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { createAppointmentSchema } from './appointments.schema';
import { postAppointment } from './appointments.controller';

export const appointmentsRouter = Router();

// POST /api/appointments
appointmentsRouter.post('/', validate(createAppointmentSchema, 'body'), postAppointment);
