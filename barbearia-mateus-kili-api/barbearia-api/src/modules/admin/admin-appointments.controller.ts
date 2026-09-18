import { Request, Response } from 'express';
import { listAppointmentsByDate, updateAppointmentStatus } from '../appointments/appointments.service';
import { UpdateStatusInput } from '../appointments/appointments.schema';

export async function getAdminAppointments(req: Request, res: Response) {
  const date = req.query.date as string;
  const appointments = await listAppointmentsByDate(date);
  res.json({ date, appointments });
}

export async function patchAppointmentStatus(req: Request, res: Response) {
  const { id } = req.params;
  const { status } = req.body as UpdateStatusInput;
  const appointment = await updateAppointmentStatus(id, status);
  res.json({ appointment });
}
