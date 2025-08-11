import { Request } from 'express';

export interface User {
  id: number;
  username: string;
  name: string;
  role: 'admin' | 'user';
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export interface Project {
  id: number;
  client_name: string;
  project_name: string;
  work_type: string;
  location: string;
}

export interface UserProject {
  id: number;
  user_id: number;
  project_id: number;
  status: 'active' | 'completed' | 'removed';
}

export interface Timesheet {
  id: number;
  user_id: number;
  project_id: number;
  week_start: string;
  sunday: number;
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  total_hours: number;
  status: 'active' | 'completed';
  submitted_at: string;
}

export interface TimesheetHours {
  sunday?: number;
  monday?: number;
  tuesday?: number;
  wednesday?: number;
  thursday?: number;
  friday?: number;
  saturday?: number;
}

export interface ProjectCompletion {
  id: number;
  user_id: number;
  project_id: number;
  completion_date: string;
  total_hours_worked: number;
}