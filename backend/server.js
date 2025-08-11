const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = 'your_jwt_secret_key';

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./timesheet.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT,
    name TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_name TEXT,
    project_name TEXT,
    work_type TEXT,
    location TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS user_projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    project_id INTEGER,
    status TEXT DEFAULT 'active',
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (project_id) REFERENCES projects (id)
  )`);

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

  db.run(`CREATE TABLE IF NOT EXISTS project_completions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    project_id INTEGER,
    completion_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_hours_worked DECIMAL(4,2),
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (project_id) REFERENCES projects (id)
  )`);

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
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, username: user.username, role: user.role, name: user.name } });
  });
});

app.get('/api/user/projects', authenticateToken, (req, res) => {
  const query = `
    SELECT DISTINCT p.*, up.user_id 
    FROM projects p 
    JOIN user_projects up ON p.id = up.project_id 
    WHERE up.user_id = ? AND up.status = 'active'
  `;
  
  db.all(query, [req.user.id], (err, projects) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(projects);
  });
});

app.get('/api/user/timesheets', authenticateToken, (req, res) => {
  const { week_start } = req.query;
  
  const query = `
    SELECT t.*, p.client_name, p.project_name, p.work_type, p.location
    FROM timesheets t
    JOIN projects p ON t.project_id = p.id
    WHERE t.user_id = ? AND t.week_start = ?
  `;
  
  db.all(query, [req.user.id, week_start], (err, timesheets) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(timesheets);
  });
});

app.post('/api/user/timesheets', authenticateToken, (req, res) => {
  const { project_id, week_start, hours } = req.body;
  const total_hours = Object.values(hours).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);

  const query = `
    INSERT OR REPLACE INTO timesheets 
    (user_id, project_id, week_start, sunday, monday, tuesday, wednesday, thursday, friday, saturday, total_hours)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [
    req.user.id, project_id, week_start,
    hours.sunday || 0, hours.monday || 0, hours.tuesday || 0, hours.wednesday || 0,
    hours.thursday || 0, hours.friday || 0, hours.saturday || 0, total_hours
  ], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'Timesheet saved successfully', id: this.lastID });
  });
});

app.post('/api/user/complete-project', authenticateToken, (req, res) => {
  const { project_id, week_start } = req.body;

  // First, get total hours worked on this project
  const totalHoursQuery = `
    SELECT SUM(total_hours) as total_worked 
    FROM timesheets 
    WHERE user_id = ? AND project_id = ? AND status = 'active'
  `;

  db.get(totalHoursQuery, [req.user.id, project_id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    const totalHours = result ? result.total_worked || 0 : 0;

    // Insert into project_completions
    const completionQuery = `
      INSERT INTO project_completions (user_id, project_id, total_hours_worked)
      VALUES (?, ?, ?)
    `;

    db.run(completionQuery, [req.user.id, project_id, totalHours], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Update user_projects status
      const updateProjectQuery = `
        UPDATE user_projects 
        SET status = 'completed' 
        WHERE user_id = ? AND project_id = ?
      `;

      db.run(updateProjectQuery, [req.user.id, project_id], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        // Archive timesheets
        const archiveTimesheetsQuery = `
          UPDATE timesheets 
          SET status = 'completed' 
          WHERE user_id = ? AND project_id = ?
        `;

        db.run(archiveTimesheetsQuery, [req.user.id, project_id], function(err) {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          res.json({ message: 'Project completed successfully', totalHours });
        });
      });
    });
  });
});

app.delete('/api/user/remove-project/:projectId', authenticateToken, (req, res) => {
  const projectId = req.params.projectId;

  // Update user_projects status to removed
  const query = `
    UPDATE user_projects 
    SET status = 'removed' 
    WHERE user_id = ? AND project_id = ?
  `;

  db.run(query, [req.user.id, projectId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ message: 'Project removed from timesheet' });
  });
});

app.get('/api/admin/users', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  db.all(`SELECT id, username, name, role FROM users`, (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(users);
  });
});

app.post('/api/admin/users', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { username, password, name, role } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run(`INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)`,
    [username, hashedPassword, name, role], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'User created successfully', id: this.lastID });
  });
});

app.get('/api/admin/projects', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  db.all(`SELECT * FROM projects`, (err, projects) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(projects);
  });
});

app.post('/api/admin/projects', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { client_name, project_name, work_type, location } = req.body;

  db.run(`INSERT INTO projects (client_name, project_name, work_type, location) VALUES (?, ?, ?, ?)`,
    [client_name, project_name, work_type, location], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'Project created successfully', id: this.lastID });
  });
});

app.post('/api/admin/assign-project', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { user_id, project_id } = req.body;

  db.run(`INSERT OR IGNORE INTO user_projects (user_id, project_id) VALUES (?, ?)`,
    [user_id, project_id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'Project assigned successfully' });
  });
});

app.get('/api/admin/timesheets', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { user_id, week_start, project_id } = req.query;
  let query = `
    SELECT t.*, u.name as user_name, p.client_name, p.project_name, p.work_type, p.location
    FROM timesheets t
    JOIN users u ON t.user_id = u.id
    JOIN projects p ON t.project_id = p.id
    WHERE 1=1
  `;
  const params = [];

  if (user_id) {
    query += ` AND t.user_id = ?`;
    params.push(user_id);
  }
  if (week_start) {
    query += ` AND t.week_start = ?`;
    params.push(week_start);
  }
  if (project_id) {
    query += ` AND t.project_id = ?`;
    params.push(project_id);
  }

  db.all(query, params, (err, timesheets) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(timesheets);
  });
});

app.get('/api/admin/project-completions', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const query = `
    SELECT pc.*, u.name as user_name, p.client_name, p.project_name, p.work_type, p.location
    FROM project_completions pc
    JOIN users u ON pc.user_id = u.id
    JOIN projects p ON pc.project_id = p.id
    ORDER BY pc.completion_date DESC
  `;

  db.all(query, (err, completions) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(completions);
  });
});

app.get('/api/admin/export/csv', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const query = `
    SELECT t.*, u.name as user_name, p.client_name, p.project_name, p.work_type, p.location
    FROM timesheets t
    JOIN users u ON t.user_id = u.id
    JOIN projects p ON t.project_id = p.id
  `;

  db.all(query, (err, timesheets) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    const csvWriter = createCsvWriter({
      path: './timesheets_export.csv',
      header: [
        { id: 'user_name', title: 'User' },
        { id: 'client_name', title: 'Client' },
        { id: 'project_name', title: 'Project' },
        { id: 'work_type', title: 'Work Type' },
        { id: 'location', title: 'Location' },
        { id: 'week_start', title: 'Week Start' },
        { id: 'sunday', title: 'Sunday' },
        { id: 'monday', title: 'Monday' },
        { id: 'tuesday', title: 'Tuesday' },
        { id: 'wednesday', title: 'Wednesday' },
        { id: 'thursday', title: 'Thursday' },
        { id: 'friday', title: 'Friday' },
        { id: 'saturday', title: 'Saturday' },
        { id: 'total_hours', title: 'Total Hours' }
      ]
    });

    csvWriter.writeRecords(timesheets).then(() => {
      res.download('./timesheets_export.csv');
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});