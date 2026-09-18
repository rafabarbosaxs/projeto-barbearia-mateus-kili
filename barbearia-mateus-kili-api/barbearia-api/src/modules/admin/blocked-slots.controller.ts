import { Request, Response } from 'express';
import {
  createBlockedSlot,
  deleteBlockedSlot,
  listBlockedSlots,
} from './blocked-slots.service';
import { CreateBlockedSlotInput } from './blocked-slots.schema';

export async function postBlockedSlot(req: Request, res: Response) {
  const blockedSlot = await createBlockedSlot(req.body as CreateBlockedSlotInput);
  res.status(201).json({ blockedSlot });
}

export async function getBlockedSlots(_req: Request, res: Response) {
  const blockedSlots = await listBlockedSlots();
  res.json({ blockedSlots });
}

export async function removeBlockedSlot(req: Request, res: Response) {
  await deleteBlockedSlot(req.params.id);
  res.status(204).send();
}
