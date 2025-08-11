import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'timesheet-backend' },
  transports: [
    new winston.transports.File({ filename: 'server.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});