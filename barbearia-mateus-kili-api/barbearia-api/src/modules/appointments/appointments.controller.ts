import { Request, Response } from 'express';
import { createAppointment } from './appointments.service';
import { CreateAppointmentInput } from './appointments.schema';

export async function postAppointment(req: Request, res: Response) {
  const input = req.body as CreateAppointmentInput;
  const { appointment, whatsappConfirmationUrl } = await createAppointment(input);

  res.status(201).json({
    appointment,
    whatsappConfirmationUrl,
  });
}
