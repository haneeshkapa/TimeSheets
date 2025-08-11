import { Request, Response, NextFunction } from 'express';
import { handleError } from '../utils/errorHandler';

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  handleError(error, res, `${req.method} ${req.path}`);
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.status(404).json({
    error: 'Route not found',
    code: 'ROUTE_NOT_FOUND',
    path: req.path,
    method: req.method
  });
};