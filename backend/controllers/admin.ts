import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthenticatedRequest } from '../types';
import { UserModel } from '../models/User';
import { ProjectModel } from '../models/Project';
import { TimesheetModel } from '../models/Timesheet';
import { logger } from '../config';
import * as createCsvWriter from 'csv-writer';
import { validate, sanitizeString } from '../utils/validation';
import { handleError, NotFoundError, ValidationError, DatabaseError, asyncHandler } from '../utils/errorHandler';

export const getUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const users = await UserModel.getAll();
  res.json(users);
});

export const createUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { username, password, name, role } = req.body;
  
  // Validate input
  const validation = validate([
    { field: 'username', value: username, rules: ['required', 'string', 'min:3', 'max:50', 'alphanum'] },
    { field: 'password', value: password, rules: ['required', 'string', 'min:6', 'max:128'] },
    { field: 'name', value: name, rules: ['required', 'string', 'min:2', 'max:100', 'alpha'] },
    { field: 'role', value: role, rules: ['required', 'string'] }
  ]);
  
  if (!validation.isValid()) {
    throw new ValidationError('Invalid input data', validation.getErrors());
  }
  
  // Validate role is valid
  if (!['user', 'admin'].includes(role)) {
    throw new ValidationError('Role must be either "user" or "admin"');
  }
  
  // Sanitize inputs
  const sanitizedUsername = sanitizeString(username);
  const sanitizedName = sanitizeString(name);
  
  const hashedPassword = bcrypt.hashSync(password, 10);
  const userId = await UserModel.create(sanitizedUsername, hashedPassword, sanitizedName, role);
  res.json({ message: 'User created successfully', id: userId });
});

export const getProjects = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const projects = await ProjectModel.getAll();
    res.json(projects);
  } catch (error) {
    logger.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Database error' });
  }
};

export const createProject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { client_name, project_name, work_type, location } = req.body;
    
    // Validate input
    const validation = validate([
      { field: 'client_name', value: client_name, rules: ['required', 'string', 'min:2', 'max:100'] },
      { field: 'project_name', value: project_name, rules: ['required', 'string', 'min:2', 'max:100'] },
      { field: 'work_type', value: work_type, rules: ['required', 'string', 'min:2', 'max:50'] },
      { field: 'location', value: location, rules: ['required', 'string', 'min:2', 'max:100'] }
    ]);
    
    if (!validation.isValid()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.getErrors() 
      });
    }
    
    // Sanitize inputs
    const sanitizedClientName = sanitizeString(client_name);
    const sanitizedProjectName = sanitizeString(project_name);
    const sanitizedWorkType = sanitizeString(work_type);
    const sanitizedLocation = sanitizeString(location);
    
    const projectId = await ProjectModel.create(sanitizedClientName, sanitizedProjectName, sanitizedWorkType, sanitizedLocation);
    res.json({ message: 'Project created successfully', id: projectId });
  } catch (error) {
    logger.error('Error creating project:', error);
    res.status(500).json({ error: 'Database error' });
  }
};

export const updateProject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);
    const { client_name, project_name, work_type, location } = req.body;
    
    // Validate project ID
    if (isNaN(projectId) || projectId <= 0) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }
    
    // Validate input
    const validation = validate([
      { field: 'client_name', value: client_name, rules: ['required', 'string', 'min:2', 'max:100'] },
      { field: 'project_name', value: project_name, rules: ['required', 'string', 'min:2', 'max:100'] },
      { field: 'work_type', value: work_type, rules: ['required', 'string', 'min:2', 'max:50'] },
      { field: 'location', value: location, rules: ['required', 'string', 'min:2', 'max:100'] }
    ]);
    
    if (!validation.isValid()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.getErrors() 
      });
    }
    
    // Check if project exists
    const project = await ProjectModel.getById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Sanitize inputs
    const sanitizedClientName = sanitizeString(client_name);
    const sanitizedProjectName = sanitizeString(project_name);
    const sanitizedWorkType = sanitizeString(work_type);
    const sanitizedLocation = sanitizeString(location);
    
    await ProjectModel.update(projectId, sanitizedClientName, sanitizedProjectName, sanitizedWorkType, sanitizedLocation);
    res.json({ message: 'Project updated successfully' });
  } catch (error) {
    logger.error('Error updating project:', error);
    res.status(500).json({ error: 'Database error' });
  }
};

export const deleteProject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);
    
    // Check if project exists
    const project = await ProjectModel.getById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    await ProjectModel.delete(projectId);
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    logger.error('Error deleting project:', error);
    res.status(500).json({ error: 'Database error' });
  }
};

export const assignProject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user_id, project_id } = req.body;
    
    // Validate input
    const validation = validate([
      { field: 'user_id', value: user_id, rules: ['required', 'integer'] },
      { field: 'project_id', value: project_id, rules: ['required', 'integer'] }
    ]);
    
    if (!validation.isValid()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.getErrors() 
      });
    }
    
    // Validate that user_id and project_id are positive integers
    const userId = parseInt(user_id);
    const projectId = parseInt(project_id);
    
    if (userId <= 0 || projectId <= 0) {
      return res.status(400).json({ error: 'User ID and Project ID must be positive integers' });
    }
    
    await ProjectModel.assignToUser(userId, projectId);
    res.json({ message: 'Project assigned successfully' });
  } catch (error) {
    logger.error('Error assigning project:', error);
    res.status(500).json({ error: 'Database error' });
  }
};

export const getTimesheets = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user_id, week_start, project_id } = req.query;
    const filters = {
      user_id: user_id ? parseInt(user_id as string) : undefined,
      week_start: week_start as string,
      project_id: project_id ? parseInt(project_id as string) : undefined,
    };
    
    const timesheets = await TimesheetModel.getAllTimesheets(filters);
    res.json(timesheets);
  } catch (error) {
    logger.error('Error fetching timesheets:', error);
    res.status(500).json({ error: 'Database error' });
  }
};

export const getProjectCompletions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const completions = await TimesheetModel.getProjectCompletions();
    res.json(completions);
  } catch (error) {
    logger.error('Error fetching project completions:', error);
    res.status(500).json({ error: 'Database error' });
  }
};

export const exportCSV = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const timesheets = await TimesheetModel.getAllTimesheets({});
    
    // Create temporary file with unique name
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `timesheets_export_${timestamp}.csv`;
    const filePath = `./tmp/${filename}`;
    
    // Ensure tmp directory exists
    const fs = require('fs');
    const path = require('path');
    const tmpDir = path.dirname(filePath);
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    
    const csvWriter = createCsvWriter.createObjectCsvWriter({
      path: filePath,
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

    await csvWriter.writeRecords(timesheets);
    
    // Send file and schedule cleanup
    res.download(filePath, 'timesheets_export.csv', (err) => {
      // Clean up the temporary file after download
      setTimeout(() => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          logger.info(`Cleaned up temporary CSV file: ${filePath}`);
        }
      }, 5000); // 5 second delay to ensure download completes
    });
  } catch (error) {
    logger.error('Error exporting CSV:', error);
    res.status(500).json({ error: 'Export error' });
  }
};