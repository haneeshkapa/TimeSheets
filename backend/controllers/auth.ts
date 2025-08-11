import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';
import { logger } from '../config';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const user = await UserModel.findByUsername(username);
    if (!user || !bcrypt.compareSync(password, (user as any).password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    logger.info(`User ${username} logged in successfully`);
    res.json({ 
      token, 
      user: { id: user.id, username: user.username, role: user.role, name: user.name } 
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Database error' });
  }
};