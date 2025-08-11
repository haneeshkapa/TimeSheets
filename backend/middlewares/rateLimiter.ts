import { Request, Response, NextFunction } from 'express';
import { logger } from '../config';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

class RateLimiter {
  private store: RateLimitStore = {};
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    
    // Clean up expired entries every minute
    setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime <= now) {
        delete this.store[key];
      }
    });
  }

  private getKey(req: Request): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(req);
    }
    return req.ip || req.connection.remoteAddress || 'unknown';
  }

  middleware = (req: Request, res: Response, next: NextFunction): void => {
    const key = this.getKey(req);
    const now = Date.now();
    
    if (!this.store[key] || this.store[key].resetTime <= now) {
      // Reset the counter
      this.store[key] = {
        count: 0,
        resetTime: now + this.config.windowMs
      };
    }

    this.store[key].count++;

    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': this.config.maxRequests.toString(),
      'X-RateLimit-Remaining': Math.max(0, this.config.maxRequests - this.store[key].count).toString(),
      'X-RateLimit-Reset': new Date(this.store[key].resetTime).toISOString()
    });

    if (this.store[key].count > this.config.maxRequests) {
      logger.warn(`Rate limit exceeded for ${key}`, {
        ip: key,
        requests: this.store[key].count,
        limit: this.config.maxRequests,
        resetTime: this.store[key].resetTime
      });

      res.status(429).json({
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        details: {
          limit: this.config.maxRequests,
          windowMs: this.config.windowMs,
          retryAfter: Math.ceil((this.store[key].resetTime - now) / 1000)
        }
      });
      return;
    }

    next();
  };
}

// Predefined rate limiters
export const authLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 50 // 50 login attempts per 15 minutes
});

export const apiLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100 // 100 requests per 15 minutes
});

export const strictApiLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20 // 20 requests per minute
});

export const createRateLimiter = (config: RateLimitConfig) => new RateLimiter(config);