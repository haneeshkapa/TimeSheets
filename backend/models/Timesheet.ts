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
      // First, check if an entry already exists
      const checkQuery = `
        SELECT id, sunday, monday, tuesday, wednesday, thursday, friday, saturday, total_hours
        FROM timesheets 
        WHERE user_id = ? AND project_id = ? AND week_start = ?
      `;

      db.get(checkQuery, [userId, projectId, weekStart], (err, existingRow: any) => {
        if (err) {
          reject(err);
          return;
        }

        if (existingRow) {
          // Update existing record by adding hours
          const newSunday = (existingRow.sunday || 0) + (hours.sunday || 0);
          const newMonday = (existingRow.monday || 0) + (hours.monday || 0);
          const newTuesday = (existingRow.tuesday || 0) + (hours.tuesday || 0);
          const newWednesday = (existingRow.wednesday || 0) + (hours.wednesday || 0);
          const newThursday = (existingRow.thursday || 0) + (hours.thursday || 0);
          const newFriday = (existingRow.friday || 0) + (hours.friday || 0);
          const newSaturday = (existingRow.saturday || 0) + (hours.saturday || 0);
          const newTotalHours = newSunday + newMonday + newTuesday + newWednesday + newThursday + newFriday + newSaturday;

          const updateQuery = `
            UPDATE timesheets 
            SET sunday = ?, monday = ?, tuesday = ?, wednesday = ?, thursday = ?, friday = ?, saturday = ?, total_hours = ?
            WHERE id = ?
          `;

          db.run(updateQuery, [
            newSunday, newMonday, newTuesday, newWednesday, newThursday, newFriday, newSaturday, newTotalHours, existingRow.id
          ], function(err) {
            if (err) reject(err);
            else resolve(existingRow.id);
          });
        } else {
          // Insert new record
          const total_hours = Object.values(hours).reduce((sum, val) => sum + (val || 0), 0);

          const insertQuery = `
            INSERT INTO timesheets 
            (user_id, project_id, week_start, sunday, monday, tuesday, wednesday, thursday, friday, saturday, total_hours)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          db.run(insertQuery, [
            userId, projectId, weekStart,
            hours.sunday || 0, hours.monday || 0, hours.tuesday || 0, hours.wednesday || 0,
            hours.thursday || 0, hours.friday || 0, hours.saturday || 0, total_hours
          ], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          });
        }
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

  static syncTimeEntriesToTimesheets(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Get all completed time entries and aggregate them by user, project, and week
      const query = `
        SELECT 
          te.user_id,
          te.project_id,
          date(te.date, 'weekday 0', '-6 days') as week_start,
          CASE strftime('%w', te.date)
            WHEN '0' THEN SUM(te.duration) / 60.0
            ELSE 0
          END as sunday,
          CASE strftime('%w', te.date)
            WHEN '1' THEN SUM(te.duration) / 60.0
            ELSE 0
          END as monday,
          CASE strftime('%w', te.date)
            WHEN '2' THEN SUM(te.duration) / 60.0
            ELSE 0
          END as tuesday,
          CASE strftime('%w', te.date)
            WHEN '3' THEN SUM(te.duration) / 60.0
            ELSE 0
          END as wednesday,
          CASE strftime('%w', te.date)
            WHEN '4' THEN SUM(te.duration) / 60.0
            ELSE 0
          END as thursday,
          CASE strftime('%w', te.date)
            WHEN '5' THEN SUM(te.duration) / 60.0
            ELSE 0
          END as friday,
          CASE strftime('%w', te.date)
            WHEN '6' THEN SUM(te.duration) / 60.0
            ELSE 0
          END as saturday
        FROM time_entries te
        WHERE te.status = 'completed' AND te.duration IS NOT NULL
        GROUP BY te.user_id, te.project_id, date(te.date, 'weekday 0', '-6 days'), strftime('%w', te.date)
      `;

      db.all(query, async (err, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }

        try {
          // Group by user_id, project_id, week_start and aggregate
          const aggregated = new Map();
          
          rows.forEach(row => {
            const key = `${row.user_id}-${row.project_id}-${row.week_start}`;
            if (!aggregated.has(key)) {
              aggregated.set(key, {
                user_id: row.user_id,
                project_id: row.project_id,
                week_start: row.week_start,
                sunday: 0,
                monday: 0,
                tuesday: 0,
                wednesday: 0,
                thursday: 0,
                friday: 0,
                saturday: 0
              });
            }
            
            const entry = aggregated.get(key);
            entry.sunday += row.sunday || 0;
            entry.monday += row.monday || 0;
            entry.tuesday += row.tuesday || 0;
            entry.wednesday += row.wednesday || 0;
            entry.thursday += row.thursday || 0;
            entry.friday += row.friday || 0;
            entry.saturday += row.saturday || 0;
          });

          // Save each aggregated entry
          for (const entry of aggregated.values()) {
            const hours = {
              sunday: entry.sunday,
              monday: entry.monday,
              tuesday: entry.tuesday,
              wednesday: entry.wednesday,
              thursday: entry.thursday,
              friday: entry.friday,
              saturday: entry.saturday
            };
            
            await this.saveTimesheet(entry.user_id, entry.project_id, entry.week_start, hours);
          }

          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }
}