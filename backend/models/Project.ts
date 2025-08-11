import { db } from '../config';
import { Project } from '../types';

export class ProjectModel {
  static getAll(): Promise<Project[]> {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM projects`, (err, rows) => {
        if (err) reject(err);
        else resolve(rows as Project[]);
      });
    });
  }

  static getUserProjects(userId: number): Promise<Project[]> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT DISTINCT p.*, up.user_id 
        FROM projects p 
        JOIN user_projects up ON p.id = up.project_id 
        WHERE up.user_id = ? AND up.status = 'active'
      `;
      
      db.all(query, [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows as Project[]);
      });
    });
  }

  static create(client_name: string, project_name: string, work_type: string, location: string): Promise<number> {
    return new Promise((resolve, reject) => {
      db.run(`INSERT INTO projects (client_name, project_name, work_type, location) VALUES (?, ?, ?, ?)`,
        [client_name, project_name, work_type, location], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  static assignToUser(userId: number, projectId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run(`INSERT OR IGNORE INTO user_projects (user_id, project_id) VALUES (?, ?)`,
        [userId, projectId], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  static removeFromUser(userId: number, projectId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run(`UPDATE user_projects SET status = 'removed' WHERE user_id = ? AND project_id = ?`,
        [userId, projectId], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  static update(id: number, client_name: string, project_name: string, work_type: string, location: string): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run(`UPDATE projects SET client_name = ?, project_name = ?, work_type = ?, location = ? WHERE id = ?`,
        [client_name, project_name, work_type, location, id], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  static delete(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      // Delete timesheets for this project first
      db.run(`DELETE FROM timesheets WHERE project_id = ?`, [id], (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Delete user_project assignments
        db.run(`DELETE FROM user_projects WHERE project_id = ?`, [id], (err) => {
          if (err) {
            reject(err);
            return;
          }
          
          // Finally delete the project
          db.run(`DELETE FROM projects WHERE id = ?`, [id], function(err) {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
      });
    });
  }

  static getById(id: number): Promise<Project | null> {
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM projects WHERE id = ?`, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row as Project || null);
      });
    });
  }
}