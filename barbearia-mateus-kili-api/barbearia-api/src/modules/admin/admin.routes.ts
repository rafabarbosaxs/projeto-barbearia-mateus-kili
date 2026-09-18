import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { listAdminAppointmentsQuerySchema, updateStatusSchema } from '../appointments/appointments.schema';
import { createBlockedSlotSchema } from './blocked-slots.schema';
import { getAdminAppointments, patchAppointmentStatus } from './admin-appointments.controller';
import { getBlockedSlots, postBlockedSlot, removeBlockedSlot } from './blocked-slots.controller';

export const adminRouter = Router();

// Todas as rotas abaixo exigem JWT válido (ver POST /api/auth/login).
adminRouter.use(requireAuth);

// GET /api/admin/appointments?date=YYYY-MM-DD
adminRouter.get(
  '/appointments',
  validate(listAdminAppointmentsQuerySchema, 'query'),
  getAdminAppointments,
);

// PATCH /api/admin/appointments/:id/status
adminRouter.patch(
  '/appointments/:id/status',
  validate(updateStatusSchema, 'body'),
  patchAppointmentStatus,
);

// POST /api/admin/blocked-slots
adminRouter.post('/blocked-slots', validate(createBlockedSlotSchema, 'body'), postBlockedSlot);

// Bônus (não pedido explicitamente, mas necessário para o bloqueio ser
// utilizável de verdade num painel): listar e remover bloqueios.
// GET /api/admin/blocked-slots
adminRouter.get('/blocked-slots', getBlockedSlots);
// DELETE /api/admin/blocked-slots/:id
adminRouter.delete('/blocked-slots/:id', removeBlockedSlot);
