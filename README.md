# Timesheet Logging Application

A comprehensive web-based timesheet logging application built with React, Node.js, Express, and SQLite. This application allows users to log their work hours against assigned projects and provides administrators with powerful management and reporting capabilities.

## 🚀 Live Demo

- **Frontend**: [https://time-sheets-indol.vercel.app](https://time-sheets-indol.vercel.app)
- **Backend API**: [https://timesheets-anay.onrender.com](https://timesheets-anay.onrender.com)

> **Note**: Backend may take 30-60 seconds to wake up on first request (free tier limitation)

## Features

### User Features
- **Timesheet Entry**: Users can log hours for their assigned projects across a weekly timesheet
- **Project View**: See only projects they are assigned to
- **Weekly Time Tracking**: Easy-to-use interface for entering hours for each day of the week
- **Auto-calculation**: Total hours are automatically calculated
- **Individual Project Submission**: Save timesheet entries for each project separately

### Admin Features
- **Dashboard Overview**: View all submitted timesheets with filtering capabilities
- **User Management**: Add new users and manage existing ones
- **Project Management**: Create and manage projects
- **Project Assignment**: Assign projects to specific users
- **Reporting**: Generate detailed reports by user or project
- **Data Export**: Export timesheet data as CSV or JSON files
- **Filtering**: Filter timesheets by user, project, or date range

### Authentication & Roles
- **Secure Login**: JWT-based authentication
- **Role-based Access**: Separate user and admin roles
- **Protected Routes**: Route protection based on authentication and authorization

## Tech Stack

- **Frontend**: React 19 + TypeScript + Tailwind CSS (Deployed on Vercel)
- **Backend**: Node.js + Express.js + TypeScript (Deployed on Render)
- **Database**: SQLite3
- **Authentication**: JWT + bcrypt
- **Data Export**: CSV Writer

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd TimeSheetApp
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   npm start
   ```
   The backend server will start on `http://localhost:5001`

3. **Frontend Setup (in a new terminal)**
   ```bash
   cd frontend
   npm install
   npm start
   ```
   The frontend application will start on `http://localhost:3000`

## Default Login Credentials

### Admin Account
- **Username**: admin
- **Password**: admin123
- **Access**: Full admin dashboard, user/project management, reporting

### User Accounts
- **Username**: john / **Password**: user123
- **Username**: jane / **Password**: user123
- **Access**: Personal timesheet entry only

## Usage Guide

### For Users

1. **Login** with your user credentials
2. **Timesheet Entry**: 
   - View your assigned projects
   - Enter hours for each day of the week (Sunday through Saturday)
   - Click "Save" for each project to submit your timesheet
   - Hours are automatically calculated for totals

### For Administrators

1. **Login** with admin credentials
2. **Dashboard**: View all submitted timesheets with filtering options
3. **User Management**: 
   - Add new users with username, password, name, and role
   - View all existing users
4. **Project Management**: 
   - Create new projects with client name, project name, work type, and location
   - View all existing projects
5. **Project Assignment**: 
   - Assign projects to users from the User Management page
6. **Reports**: 
   - Generate user-based reports showing total hours and project counts
   - Generate project-based reports showing total hours and team size
   - View performance metrics and percentages
7. **Export Data**: 
   - Export all timesheet data as CSV files
   - Export data as JSON for further processing

## Database Schema

The application uses SQLite with the following tables:

- **users**: User accounts with authentication details
- **projects**: Project information including client and work details
- **user_projects**: Many-to-many relationship between users and projects
- **timesheets**: Time entries with daily hour breakdowns

## API Endpoints

### Authentication
- `POST /api/login` - User login

### User Endpoints
- `GET /api/user/projects` - Get assigned projects
- `GET /api/user/timesheets` - Get user timesheets for a specific week
- `POST /api/user/timesheets` - Submit timesheet entry

### Admin Endpoints
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create new user
- `GET /api/admin/projects` - Get all projects
- `POST /api/admin/projects` - Create new project
- `POST /api/admin/assign-project` - Assign project to user
- `GET /api/admin/timesheets` - Get all timesheets with filtering
- `GET /api/admin/export/csv` - Export timesheets as CSV

## Sample Data

The application comes pre-loaded with:
- 1 Admin user and 2 regular users
- 3 sample projects across different clients
- Sample project assignments

## Development

### Backend Development
```bash
cd backend
npm run dev  # Starts the server with nodemon for development
```

### Frontend Development
```bash
cd frontend
npm start  # Starts the React development server
```

### Building for Production
```bash
cd frontend
npm run build  # Creates optimized production build
```

## Security Features

- Password hashing using bcrypt
- JWT token-based authentication
- Role-based route protection
- SQL injection prevention through parameterized queries
- Input validation and sanitization

## Troubleshooting

### Common Issues

1. **Port conflicts**: If ports 3000 or 5000 are in use, modify the PORT environment variable
2. **Database issues**: Delete `timesheet.db` file to reset the database with sample data
3. **CORS issues**: Ensure both frontend and backend are running on their respective ports

### Logs
- Backend logs are displayed in the terminal where you run `npm start`
- Frontend development logs appear in the browser console

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is provided as-is for educational and demonstration purposes.