import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user || location.pathname === '/login') {
    return null;
  }

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold">Timesheet App</h1>
            </div>
            <div className="ml-10 flex items-baseline space-x-4">
              {user.role === 'admin' ? (
                <>
                  <Link
                    to="/admin"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      location.pathname === '/admin'
                        ? 'bg-blue-700 text-white'
                        : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/admin/users"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      location.pathname === '/admin/users'
                        ? 'bg-blue-700 text-white'
                        : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                    }`}
                  >
                    Users
                  </Link>
                  <Link
                    to="/admin/projects"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      location.pathname === '/admin/projects'
                        ? 'bg-blue-700 text-white'
                        : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                    }`}
                  >
                    Projects
                  </Link>
                  <Link
                    to="/reports"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      location.pathname === '/reports'
                        ? 'bg-blue-700 text-white'
                        : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                    }`}
                  >
                    Reports
                  </Link>
                  <Link
                    to="/completed-projects"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      location.pathname === '/completed-projects'
                        ? 'bg-blue-700 text-white'
                        : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                    }`}
                  >
                    Completed
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/dashboard"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      location.pathname === '/dashboard'
                        ? 'bg-blue-700 text-white'
                        : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/timesheet"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      location.pathname === '/timesheet'
                        ? 'bg-blue-700 text-white'
                        : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                    }`}
                  >
                    Time Clock
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center">
            <span className="mr-4">Welcome, {user.name}</span>
            <button
              onClick={logout}
              className="bg-blue-700 hover:bg-blue-800 px-3 py-2 rounded-md text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;