import { Request, Response, NextFunction } from 'express';
import { logger } from '../config';

interface CustomError extends Error {
  status?: number;
}

export const errorHandler = (err: CustomError, req: Request, res: Response, _next: NextFunction) => {
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};