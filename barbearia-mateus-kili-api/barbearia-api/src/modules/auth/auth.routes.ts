import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { loginSchema } from './auth.schema';
import { postLogin } from './auth.controller';

export const authRouter = Router();

// POST /api/auth/login
authRouter.post('/login', validate(loginSchema, 'body'), postLogin);
