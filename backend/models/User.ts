import { db } from '../config';
import { User } from '../types';

export class UserModel {
  static findByUsername(username: string): Promise<User | undefined> {
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, row) => {
        if (err) reject(err);
        else resolve(row as User);
      });
    });
  }

  static findById(id: number): Promise<User | undefined> {
    return new Promise((resolve, reject) => {
      db.get(`SELECT id, username, name, role FROM users WHERE id = ?`, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row as User);
      });
    });
  }

  static getAll(): Promise<User[]> {
    return new Promise((resolve, reject) => {
      db.all(`SELECT id, username, name, role FROM users`, (err, rows) => {
        if (err) reject(err);
        else resolve(rows as User[]);
      });
    });
  }

  static create(username: string, hashedPassword: string, name: string, role: 'admin' | 'user'): Promise<number> {
    return new Promise((resolve, reject) => {
      db.run(`INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)`,
        [username, hashedPassword, name, role], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }
}