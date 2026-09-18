import { Request, Response } from 'express';
import { login } from './auth.service';
import { LoginInput } from './auth.schema';

export async function postLogin(req: Request, res: Response) {
  const { token } = await login(req.body as LoginInput);
  res.json({ token });
}
