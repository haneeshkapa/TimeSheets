import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { ProjectModel } from '../models/Project';
import { TimesheetModel } from '../models/Timesheet';
import { logger } from '../config';
import { validate } from '../utils/validation';

export const getUserProjects = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const projects = await ProjectModel.getUserProjects(req.user!.id);
    res.json(projects);
  } catch (error) {
    logger.error('Error fetching user projects:', error);
    res.status(500).json({ error: 'Database error' });
  }
};

export const getUserTimesheets = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { week_start } = req.query;
    const timesheets = await TimesheetModel.getUserTimesheets(req.user!.id, week_start as string);
    res.json(timesheets);
  } catch (error) {
    logger.error('Error fetching user timesheets:', error);
    res.status(500).json({ error: 'Database error' });
  }
};

export const saveTimesheet = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { project_id, week_start, hours } = req.body;
    
    // Validate input
    const validation = validate([
      { field: 'project_id', value: project_id, rules: ['required', 'integer'] },
      { field: 'week_start', value: week_start, rules: ['required', 'string', 'date'] },
      { field: 'hours', value: hours, rules: ['required'] }
    ]);
    
    if (!validation.isValid()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.getErrors() 
      });
    }
    
    // Validate project_id is positive
    const projectId = parseInt(project_id);
    if (projectId <= 0) {
      return res.status(400).json({ error: 'Project ID must be a positive integer' });
    }
    
    // Validate hours object
    if (typeof hours !== 'object' || hours === null) {
      return res.status(400).json({ error: 'Hours must be an object' });
    }
    
    // Validate individual hour values
    const validDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    for (const day of validDays) {
      if (hours[day] !== undefined) {
        const hourValue = parseFloat(hours[day]);
        if (isNaN(hourValue) || hourValue < 0 || hourValue > 24) {
          return res.status(400).json({ error: `Invalid hours for ${day}: must be between 0 and 24` });
        }
      }
    }
    
    const timesheetId = await TimesheetModel.saveTimesheet(req.user!.id, projectId, week_start, hours);
    res.json({ message: 'Timesheet saved successfully', id: timesheetId });
  } catch (error) {
    logger.error('Error saving timesheet:', error);
    res.status(500).json({ error: 'Database error' });
  }
};

export const completeProject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { project_id } = req.body;
    
    // Validate input
    const validation = validate([
      { field: 'project_id', value: project_id, rules: ['required', 'integer'] }
    ]);
    
    if (!validation.isValid()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.getErrors() 
      });
    }
    
    const projectId = parseInt(project_id);
    if (projectId <= 0) {
      return res.status(400).json({ error: 'Project ID must be a positive integer' });
    }
    
    const totalHours = await TimesheetModel.completeProject(req.user!.id, projectId);
    res.json({ message: 'Project completed successfully', totalHours });
  } catch (error) {
    logger.error('Error completing project:', error);
    res.status(500).json({ error: 'Database error' });
  }
};

export const removeProject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const projectId = parseInt(req.params.projectId);
    await ProjectModel.removeFromUser(req.user!.id, projectId);
    res.json({ message: 'Project removed from timesheet' });
  } catch (error) {
    logger.error('Error removing project:', error);
    res.status(500).json({ error: 'Database error' });
  }
};