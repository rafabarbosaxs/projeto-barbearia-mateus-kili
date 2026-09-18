import { Request, Response } from 'express';
import { computeAvailableSlots } from './availability.service';
import { AvailabilityQuery } from './availability.schema';

export async function getAvailability(req: Request, res: Response) {
  const { date, serviceId } = req.query as unknown as AvailabilityQuery;
  const slots = await computeAvailableSlots(date, serviceId);
  res.json({ date, serviceId, slots });
}
