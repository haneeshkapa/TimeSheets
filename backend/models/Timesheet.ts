import { db } from '../config';
import { Timesheet, TimesheetHours, ProjectCompletion } from '../types';

export class TimesheetModel {
  static getUserTimesheets(userId: number, weekStart: string): Promise<Timesheet[]> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT t.*, p.client_name, p.project_name, p.work_type, p.location
        FROM timesheets t
        JOIN projects p ON t.project_id = p.id
        WHERE t.user_id = ? AND t.week_start = ?
      `;
      
      db.all(query, [userId, weekStart], (err, rows) => {
        if (err) reject(err);
        else resolve(rows as Timesheet[]);
      });
    });
  }

  static getAllTimesheets(filters: { user_id?: number; week_start?: string; project_id?: number; }): Promise<Timesheet[]> {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT t.*, u.name as user_name, p.client_name, p.project_name, p.work_type, p.location
        FROM timesheets t
        JOIN users u ON t.user_id = u.id
        JOIN projects p ON t.project_id = p.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (filters.user_id) {
        query += ` AND t.user_id = ?`;
        params.push(filters.user_id);
      }
      if (filters.week_start) {
        query += ` AND t.week_start = ?`;
        params.push(filters.week_start);
      }
      if (filters.project_id) {
        query += ` AND t.project_id = ?`;
        params.push(filters.project_id);
      }

      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows as Timesheet[]);
      });
    });
  }

  static saveTimesheet(userId: number, projectId: number, weekStart: string, hours: TimesheetHours): Promise<number> {
    return new Promise((resolve, reject) => {
      const total_hours = Object.values(hours).reduce((sum, val) => sum + (val || 0), 0);

      const query = `
        INSERT OR REPLACE INTO timesheets 
        (user_id, project_id, week_start, sunday, monday, tuesday, wednesday, thursday, friday, saturday, total_hours)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.run(query, [
        userId, projectId, weekStart,
        hours.sunday || 0, hours.monday || 0, hours.tuesday || 0, hours.wednesday || 0,
        hours.thursday || 0, hours.friday || 0, hours.saturday || 0, total_hours
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  static completeProject(userId: number, projectId: number): Promise<number> {
    return new Promise((resolve, reject) => {
      // Get total hours worked
      const totalHoursQuery = `
        SELECT SUM(total_hours) as total_worked 
        FROM timesheets 
        WHERE user_id = ? AND project_id = ? AND status = 'active'
      `;

      db.get(totalHoursQuery, [userId, projectId], (err, result: any) => {
        if (err) {
          reject(err);
          return;
        }

        const totalHours = result ? result.total_worked || 0 : 0;

        // Insert completion record
        const completionQuery = `
          INSERT INTO project_completions (user_id, project_id, total_hours_worked)
          VALUES (?, ?, ?)
        `;

        db.run(completionQuery, [userId, projectId, totalHours], function(err) {
          if (err) {
            reject(err);
            return;
          }

          // Update project status
          const updateProjectQuery = `
            UPDATE user_projects 
            SET status = 'completed' 
            WHERE user_id = ? AND project_id = ?
          `;

          db.run(updateProjectQuery, [userId, projectId], (err) => {
            if (err) {
              reject(err);
              return;
            }

            // Archive timesheets
            const archiveQuery = `
              UPDATE timesheets 
              SET status = 'completed' 
              WHERE user_id = ? AND project_id = ?
            `;

            db.run(archiveQuery, [userId, projectId], (err) => {
              if (err) reject(err);
              else resolve(totalHours);
            });
          });
        });
      });
    });
  }

  static getProjectCompletions(): Promise<ProjectCompletion[]> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT pc.*, u.name as user_name, p.client_name, p.project_name, p.work_type, p.location
        FROM project_completions pc
        JOIN users u ON pc.user_id = u.id
        JOIN projects p ON pc.project_id = p.id
        ORDER BY pc.completion_date DESC
      `;

      db.all(query, (err, rows) => {
        if (err) reject(err);
        else resolve(rows as ProjectCompletion[]);
      });
    });
  }
}