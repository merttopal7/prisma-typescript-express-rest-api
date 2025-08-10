import { Response, NextFunction } from 'express';
import { verifyJwt } from '../services/jwt.service';

export const authenticate = (req: any, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ error: true, errorMessage: 'Not found token!' });

  const token = authHeader.split(' ')[1];
  const decoded = verifyJwt(token, process.env.JWT_SECRET_ACCESS!);

  if (!decoded) return res.status(401).json({ error: true, errorMessage: 'Invalid token!' });

  req.user = decoded;
  next();
};
