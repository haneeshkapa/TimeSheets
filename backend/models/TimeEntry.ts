import { db } from '../config';

export interface TimeEntry {
  id?: number;
  user_id: number;
  project_id: number;
  clock_in: string;
  clock_out?: string;
  duration?: number; // in minutes
  date: string;
  status: 'active' | 'completed';
  created_at?: string;
}

export class TimeEntryModel {
  static clockIn(userId: number, projectId: number): Promise<number> {
    return new Promise((resolve, reject) => {
      const now = new Date();
      const clockIn = now.toISOString();
      const date = now.toISOString().split('T')[0];
      
      const query = `
        INSERT INTO time_entries (user_id, project_id, clock_in, date, status)
        VALUES (?, ?, ?, ?, 'active')
      `;
      
      db.run(query, [userId, projectId, clockIn, date], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  static clockOut(entryId: number): Promise<TimeEntry> {
    return new Promise((resolve, reject) => {
      const now = new Date();
      const clockOut = now.toISOString();
      
      // First get the entry to calculate duration
      db.get(`SELECT * FROM time_entries WHERE id = ?`, [entryId], (err, row: any) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!row) {
          reject(new Error('Time entry not found'));
          return;
        }
        
        const clockInTime = new Date(row.clock_in);
        const clockOutTime = now;
        const duration = Math.floor((clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60));
        
        // Update the entry with clock out info
        const updateQuery = `
          UPDATE time_entries 
          SET clock_out = ?, duration = ?, status = 'completed'
          WHERE id = ?
        `;
        
        db.run(updateQuery, [clockOut, duration, entryId], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              ...row,
              clock_out: clockOut,
              duration,
              status: 'completed'
            });
          }
        });
      });
    });
  }

  static getActiveEntries(userId: number): Promise<TimeEntry[]> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT te.*, p.project_name, p.client_name
        FROM time_entries te
        JOIN projects p ON te.project_id = p.id
        WHERE te.user_id = ? AND te.status = 'active'
        ORDER BY te.created_at DESC
      `;
      
      db.all(query, [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows as TimeEntry[]);
      });
    });
  }

  static getUserTimeEntries(userId: number, date?: string): Promise<TimeEntry[]> {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT te.*, p.project_name, p.client_name
        FROM time_entries te
        JOIN projects p ON te.project_id = p.id
        WHERE te.user_id = ?
      `;
      const params: any[] = [userId];
      
      if (date) {
        query += ` AND te.date = ?`;
        params.push(date);
      }
      
      query += ` ORDER BY te.created_at DESC`;
      
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows as TimeEntry[]);
      });
    });
  }

  static getEntryById(id: number): Promise<TimeEntry | null> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT te.*, p.project_name, p.client_name
        FROM time_entries te
        JOIN projects p ON te.project_id = p.id
        WHERE te.id = ?
      `;
      
      db.get(query, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row as TimeEntry || null);
      });
    });
  }
}