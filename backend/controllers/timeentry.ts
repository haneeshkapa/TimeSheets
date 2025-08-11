import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { TimeEntryModel } from '../models/TimeEntry';
import { logger } from '../config';
import { validate } from '../utils/validation';

export const clockIn = async (req: AuthenticatedRequest, res: Response) => {
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
    
    // Check if user already has an active entry for this project
    const activeEntries = await TimeEntryModel.getActiveEntries(req.user!.id);
    const existingEntry = activeEntries.find(entry => entry.project_id === projectId);
    
    if (existingEntry) {
      return res.status(400).json({ error: 'Already clocked in to this project' });
    }
    
    const entryId = await TimeEntryModel.clockIn(req.user!.id, projectId);
    const entry = await TimeEntryModel.getEntryById(entryId);
    
    logger.info(`User ${req.user!.username} clocked in to project ${project_id}`);
    res.json({ message: 'Clocked in successfully', entry });
  } catch (error) {
    logger.error('Clock in error:', error);
    res.status(500).json({ error: 'Failed to clock in' });
  }
};

export const clockOut = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { entry_id } = req.body;
    
    // Validate input
    const validation = validate([
      { field: 'entry_id', value: entry_id, rules: ['required', 'integer'] }
    ]);
    
    if (!validation.isValid()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.getErrors() 
      });
    }
    
    const entryId = parseInt(entry_id);
    if (entryId <= 0) {
      return res.status(400).json({ error: 'Entry ID must be a positive integer' });
    }
    
    // Verify the entry belongs to the user
    const entry = await TimeEntryModel.getEntryById(entryId);
    if (!entry) {
      return res.status(404).json({ error: 'Time entry not found' });
    }
    
    if (entry.user_id !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized access to time entry' });
    }
    
    if (entry.status !== 'active') {
      return res.status(400).json({ error: 'Time entry is not active' });
    }
    
    const completedEntry = await TimeEntryModel.clockOut(entryId);
    
    logger.info(`User ${req.user!.username} clocked out from entry ${entry_id}`);
    res.json({ message: 'Clocked out successfully', entry: completedEntry });
  } catch (error) {
    logger.error('Clock out error:', error);
    res.status(500).json({ error: 'Failed to clock out' });
  }
};

export const getActiveEntries = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const activeEntries = await TimeEntryModel.getActiveEntries(req.user!.id);
    res.json(activeEntries);
  } catch (error) {
    logger.error('Get active entries error:', error);
    res.status(500).json({ error: 'Failed to fetch active entries' });
  }
};

export const getTimeEntries = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { date } = req.query;
    const timeEntries = await TimeEntryModel.getUserTimeEntries(req.user!.id, date as string);
    res.json(timeEntries);
  } catch (error) {
    logger.error('Get time entries error:', error);
    res.status(500).json({ error: 'Failed to fetch time entries' });
  }
};