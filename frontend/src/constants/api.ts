const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  
  // User endpoints
  USER_PROJECTS: `${API_BASE_URL}/api/user/projects`,
  USER_TIMESHEETS: `${API_BASE_URL}/api/user/timesheets`,
  SAVE_TIMESHEET: `${API_BASE_URL}/api/user/timesheets`,
  COMPLETE_PROJECT: `${API_BASE_URL}/api/user/complete-project`,
  REMOVE_PROJECT: `${API_BASE_URL}/api/user/remove-project`,
  CLOCK_IN: `${API_BASE_URL}/api/user/clock-in`,
  CLOCK_OUT: `${API_BASE_URL}/api/user/clock-out`,
  ACTIVE_ENTRIES: `${API_BASE_URL}/api/user/active-entries`,
  TIME_ENTRIES: `${API_BASE_URL}/api/user/time-entries`,
  
  // Admin endpoints
  ADMIN_USERS: `${API_BASE_URL}/api/admin/users`,
  ADMIN_PROJECTS: `${API_BASE_URL}/api/admin/projects`,
  ADMIN_ASSIGN_PROJECT: `${API_BASE_URL}/api/admin/assign-project`,
  ADMIN_TIMESHEETS: `${API_BASE_URL}/api/admin/timesheets`,
  ADMIN_PROJECT_COMPLETIONS: `${API_BASE_URL}/api/admin/project-completions`,
  ADMIN_EXPORT_CSV: `${API_BASE_URL}/api/admin/export/csv`,
} as const;