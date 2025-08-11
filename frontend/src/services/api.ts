import { API_ENDPOINTS } from '../constants';
import { User, Project, Timesheet, TimesheetHours, ProjectCompletion } from '../types';

class ApiService {
  private getAuthToken(): string | null {
    return localStorage.getItem('token');
  }

  private async makeRequest<T>(url: string, options?: RequestInit): Promise<T> {
    const token = this.getAuthToken();
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options?.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Auth methods
  async login(username: string, password: string): Promise<{ token: string; user: User }> {
    return this.makeRequest(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  // User methods
  async getUserProjects(): Promise<Project[]> {
    return this.makeRequest(API_ENDPOINTS.USER_PROJECTS);
  }

  async getUserTimesheets(weekStart: string): Promise<Timesheet[]> {
    return this.makeRequest(`${API_ENDPOINTS.USER_TIMESHEETS}?week_start=${weekStart}`);
  }

  async saveTimesheet(projectId: number, weekStart: string, hours: TimesheetHours): Promise<{ message: string; id: number }> {
    return this.makeRequest(API_ENDPOINTS.SAVE_TIMESHEET, {
      method: 'POST',
      body: JSON.stringify({
        project_id: projectId,
        week_start: weekStart,
        hours,
      }),
    });
  }

  async completeProject(projectId: number): Promise<{ message: string; totalHours: number }> {
    return this.makeRequest(API_ENDPOINTS.COMPLETE_PROJECT, {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId }),
    });
  }

  async removeProject(projectId: number): Promise<{ message: string }> {
    return this.makeRequest(`${API_ENDPOINTS.REMOVE_PROJECT}/${projectId}`, {
      method: 'DELETE',
    });
  }

  // Time entry methods
  async clockIn(projectId: number): Promise<{ message: string; entry: any }> {
    return this.makeRequest(API_ENDPOINTS.CLOCK_IN, {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId }),
    });
  }

  async clockOut(entryId: number): Promise<{ message: string; entry: any }> {
    return this.makeRequest(API_ENDPOINTS.CLOCK_OUT, {
      method: 'POST',
      body: JSON.stringify({ entry_id: entryId }),
    });
  }

  async getActiveEntries(): Promise<any[]> {
    return this.makeRequest(API_ENDPOINTS.ACTIVE_ENTRIES);
  }

  async getTimeEntries(date?: string): Promise<any[]> {
    const url = date ? `${API_ENDPOINTS.TIME_ENTRIES}?date=${date}` : API_ENDPOINTS.TIME_ENTRIES;
    return this.makeRequest(url);
  }

  // Admin methods
  async getUsers(): Promise<User[]> {
    return this.makeRequest(API_ENDPOINTS.ADMIN_USERS);
  }

  async createUser(userData: { username: string; password: string; name: string; role: string }): Promise<{ message: string; id: number }> {
    return this.makeRequest(API_ENDPOINTS.ADMIN_USERS, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getProjects(): Promise<Project[]> {
    return this.makeRequest(API_ENDPOINTS.ADMIN_PROJECTS);
  }

  async createProject(projectData: { client_name: string; project_name: string; work_type: string; location: string }): Promise<{ message: string; id: number }> {
    return this.makeRequest(API_ENDPOINTS.ADMIN_PROJECTS, {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  async updateProject(projectId: number, projectData: { client_name: string; project_name: string; work_type: string; location: string }): Promise<{ message: string }> {
    return this.makeRequest(`${API_ENDPOINTS.ADMIN_PROJECTS}/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    });
  }

  async deleteProject(projectId: number): Promise<{ message: string }> {
    return this.makeRequest(`${API_ENDPOINTS.ADMIN_PROJECTS}/${projectId}`, {
      method: 'DELETE',
    });
  }

  async assignProject(userId: number, projectId: number): Promise<{ message: string }> {
    return this.makeRequest(API_ENDPOINTS.ADMIN_ASSIGN_PROJECT, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, project_id: projectId }),
    });
  }

  async getAdminTimesheets(filters?: { user_id?: number; week_start?: string; project_id?: number }): Promise<Timesheet[]> {
    const params = new URLSearchParams();
    if (filters?.user_id) params.append('user_id', filters.user_id.toString());
    if (filters?.week_start) params.append('week_start', filters.week_start);
    if (filters?.project_id) params.append('project_id', filters.project_id.toString());
    
    const queryString = params.toString();
    const url = queryString ? `${API_ENDPOINTS.ADMIN_TIMESHEETS}?${queryString}` : API_ENDPOINTS.ADMIN_TIMESHEETS;
    
    return this.makeRequest(url);
  }

  async getProjectCompletions(): Promise<ProjectCompletion[]> {
    return this.makeRequest(API_ENDPOINTS.ADMIN_PROJECT_COMPLETIONS);
  }

  async exportCSV(): Promise<void> {
    const token = this.getAuthToken();
    const response = await fetch(API_ENDPOINTS.ADMIN_EXPORT_CSV, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'timesheets_export.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } else {
      throw new Error('Export failed');
    }
  }
}

export const apiService = new ApiService();