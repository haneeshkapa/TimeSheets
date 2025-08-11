import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import { logger } from './logger';

const db = new sqlite3.Database('./timesheet.db');

export const connectDB = () => {
  db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT,
      name TEXT
    )`);

    // Projects table
    db.run(`CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_name TEXT,
      project_name TEXT,
      work_type TEXT,
      location TEXT
    )`);

    // User projects table
    db.run(`CREATE TABLE IF NOT EXISTS user_projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      project_id INTEGER,
      status TEXT DEFAULT 'active',
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (project_id) REFERENCES projects (id)
    )`);

    // Timesheets table
    db.run(`CREATE TABLE IF NOT EXISTS timesheets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      project_id INTEGER,
      week_start DATE,
      sunday DECIMAL(4,2) DEFAULT 0,
      monday DECIMAL(4,2) DEFAULT 0,
      tuesday DECIMAL(4,2) DEFAULT 0,
      wednesday DECIMAL(4,2) DEFAULT 0,
      thursday DECIMAL(4,2) DEFAULT 0,
      friday DECIMAL(4,2) DEFAULT 0,
      saturday DECIMAL(4,2) DEFAULT 0,
      total_hours DECIMAL(4,2),
      status TEXT DEFAULT 'active',
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (project_id) REFERENCES projects (id)
    )`);

    // Project completions table
    db.run(`CREATE TABLE IF NOT EXISTS project_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      project_id INTEGER,
      completion_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      total_hours_worked DECIMAL(4,2),
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (project_id) REFERENCES projects (id)
    )`);

    // Time entries table for clock-in/out functionality
    db.run(`CREATE TABLE IF NOT EXISTS time_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      project_id INTEGER,
      clock_in DATETIME NOT NULL,
      clock_out DATETIME,
      duration INTEGER, -- in minutes
      date DATE NOT NULL,
      status TEXT DEFAULT 'active', -- 'active', 'completed'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (project_id) REFERENCES projects (id)
    )`);

    // Seed initial data
    const adminPassword = bcrypt.hashSync('admin123', 10);
    const userPassword = bcrypt.hashSync('user123', 10);
    
    db.run(`INSERT OR IGNORE INTO users (username, password, role, name) VALUES (?, ?, ?, ?)`, 
      ['admin', adminPassword, 'admin', 'Administrator']);
    db.run(`INSERT OR IGNORE INTO users (username, password, role, name) VALUES (?, ?, ?, ?)`, 
      ['john', userPassword, 'user', 'John Doe']);
    db.run(`INSERT OR IGNORE INTO users (username, password, role, name) VALUES (?, ?, ?, ?)`, 
      ['jane', userPassword, 'user', 'Jane Smith']);

    db.run(`INSERT OR IGNORE INTO projects (client_name, project_name, work_type, location) VALUES (?, ?, ?, ?)`,
      ['ABC Corp', 'Website Redesign', 'Development', 'Remote']);
    db.run(`INSERT OR IGNORE INTO projects (client_name, project_name, work_type, location) VALUES (?, ?, ?, ?)`,
      ['XYZ Ltd', 'Mobile App', 'Development', 'Office']);
    db.run(`INSERT OR IGNORE INTO projects (client_name, project_name, work_type, location) VALUES (?, ?, ?, ?)`,
      ['TechStart', 'Database Migration', 'DevOps', 'Hybrid']);

    db.run(`INSERT OR IGNORE INTO user_projects (user_id, project_id) VALUES (2, 1)`);
    db.run(`INSERT OR IGNORE INTO user_projects (user_id, project_id) VALUES (2, 2)`);
    db.run(`INSERT OR IGNORE INTO user_projects (user_id, project_id) VALUES (3, 1)`);
    db.run(`INSERT OR IGNORE INTO user_projects (user_id, project_id) VALUES (3, 3)`);

    // Add sample timesheet data to demonstrate reports (only run once)
    db.get("SELECT COUNT(*) as count FROM timesheets", (err, row: any) => {
      if (!err && row.count === 0) {
        const currentDate = new Date();
        const currentWeekStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay());
        const weekStartStr = currentWeekStart.toISOString().split('T')[0];
        
        const lastWeekStart = new Date(currentWeekStart);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        const lastWeekStartStr = lastWeekStart.toISOString().split('T')[0];

        // John's timesheet data (user_id: 2)
        db.run(`INSERT INTO timesheets (user_id, project_id, week_start, monday, tuesday, wednesday, thursday, friday, total_hours) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [2, 1, weekStartStr, 8, 7.5, 8, 8, 6, 37.5]);
        db.run(`INSERT INTO timesheets (user_id, project_id, week_start, monday, tuesday, wednesday, thursday, friday, total_hours) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [2, 2, weekStartStr, 2, 0.5, 0, 0, 2, 4.5]);
        
        // Last week data for John
        db.run(`INSERT INTO timesheets (user_id, project_id, week_start, monday, tuesday, wednesday, thursday, friday, total_hours) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [2, 1, lastWeekStartStr, 8, 8, 8, 8, 8, 40]);

        // Jane's timesheet data (user_id: 3)
        db.run(`INSERT INTO timesheets (user_id, project_id, week_start, monday, tuesday, wednesday, thursday, friday, total_hours) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [3, 1, weekStartStr, 6, 8, 7, 8, 8, 37]);
        db.run(`INSERT INTO timesheets (user_id, project_id, week_start, monday, tuesday, wednesday, thursday, friday, total_hours) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [3, 3, weekStartStr, 2, 0, 1, 0, 0, 3]);

        // Add some completed projects
        db.run(`INSERT INTO project_completions (user_id, project_id, total_hours_worked) VALUES (?, ?, ?)`,
          [2, 1, 85.5]);
        db.run(`INSERT INTO project_completions (user_id, project_id, total_hours_worked) VALUES (?, ?, ?)`,
          [3, 3, 24.5]);
      }
    });
  });

  logger.info('Database connected and initialized');
};

export { db };