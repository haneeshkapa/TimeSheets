import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middlewares';
import {
  getUsers,
  createUser,
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  assignProject,
  getTimesheets,
  getProjectCompletions,
  exportCSV,
  syncTimeEntries
} from '../controllers/admin';

const router = Router();

router.use(authenticateToken, requireAdmin);

router.get('/users', getUsers);
router.post('/users', createUser);
router.get('/projects', getProjects);
router.post('/projects', createProject);
router.put('/projects/:id', updateProject);
router.delete('/projects/:id', deleteProject);
router.post('/assign-project', assignProject);
router.get('/timesheets', getTimesheets);
router.get('/project-completions', getProjectCompletions);
router.get('/export/csv', exportCSV);
router.post('/sync-time-entries', syncTimeEntries);

export default router;