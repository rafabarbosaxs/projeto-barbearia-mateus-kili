import { Request, Response } from 'express';
import { listActiveServices } from './services.service';

export async function getServices(_req: Request, res: Response) {
  const services = await listActiveServices();
  res.json({ services });
}
