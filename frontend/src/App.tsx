import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import TimesheetEntry from './components/TimesheetEntry';
import AdminDashboard from './components/AdminDashboard';
import UserManagement from './components/UserManagement';
import ProjectManagement from './components/ProjectManagement';
import Reports from './components/Reports';
import CompletedProjects from './components/CompletedProjects';
import { ROUTES } from './constants';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route path={ROUTES.LOGIN} element={<LoginPage />} />
            <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.LOGIN} replace />} />
            
            <Route
              path={ROUTES.DASHBOARD}
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path={ROUTES.TIMESHEET}
              element={
                <ProtectedRoute>
                  <TimesheetEntry />
                </ProtectedRoute>
              }
            />
            
            <Route
              path={ROUTES.ADMIN}
              element={
                <ProtectedRoute adminOnly>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            
            <Route
              path={ROUTES.ADMIN_USERS}
              element={
                <ProtectedRoute adminOnly>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            
            <Route
              path={ROUTES.ADMIN_PROJECTS}
              element={
                <ProtectedRoute adminOnly>
                  <ProjectManagement />
                </ProtectedRoute>
              }
            />
            
            <Route
              path={ROUTES.REPORTS}
              element={
                <ProtectedRoute adminOnly>
                  <Reports />
                </ProtectedRoute>
              }
            />
            
            <Route
              path={ROUTES.COMPLETED_PROJECTS}
              element={
                <ProtectedRoute adminOnly>
                  <CompletedProjects />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
