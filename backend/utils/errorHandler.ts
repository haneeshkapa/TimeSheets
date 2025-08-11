import { Response } from 'express';
import { logger } from '../config';

export interface ApiError {
  message: string;
  statusCode: number;
  code?: string;
  details?: any;
}

export class AppError extends Error implements ApiError {
  statusCode: number;
  code?: string;
  details?: any;

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 403, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', details?: any) {
    super(message, 500, 'DATABASE_ERROR', details);
    this.name = 'DatabaseError';
  }
}

export function handleError(error: any, res: Response, context?: string): void {
  let statusCode = 500;
  let message = 'Internal server error';
  let code = 'INTERNAL_ERROR';
  let details;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code || 'APP_ERROR';
    details = error.details;
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = error.message;
    code = 'VALIDATION_ERROR';
    details = error.details;
  } else if (error.code === 'SQLITE_CONSTRAINT') {
    statusCode = 409;
    message = 'Data constraint violation';
    code = 'CONSTRAINT_ERROR';
  } else if (error.code === 'ENOENT') {
    statusCode = 404;
    message = 'Resource not found';
    code = 'FILE_NOT_FOUND';
  }

  // Log the error
  const logContext = context ? `[${context}] ` : '';
  logger.error(`${logContext}Error: ${message}`, {
    statusCode,
    code,
    details,
    stack: error.stack
  });

  // Send error response
  const response: any = {
    error: message,
    code
  };

  if (details) {
    response.details = details;
  }

  // Don't expose internal details in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    response.error = 'Internal server error';
    delete response.details;
  }

  res.status(statusCode).json(response);
}

export function asyncHandler(fn: Function) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}