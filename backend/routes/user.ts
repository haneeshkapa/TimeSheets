import { Router } from 'express';
import { authenticateToken } from '../middlewares';
import {
  getUserProjects,
  getUserTimesheets,
  saveTimesheet,
  completeProject,
  removeProject
} from '../controllers/user';
import {
  clockIn,
  clockOut,
  getActiveEntries,
  getTimeEntries
} from '../controllers/timeentry';

const router = Router();

router.use(authenticateToken);

router.get('/projects', getUserProjects);
router.get('/timesheets', getUserTimesheets);
router.post('/timesheets', saveTimesheet);
router.post('/complete-project', completeProject);
router.delete('/remove-project/:projectId', removeProject);

// Time entries (clock-in/out)
router.post('/clock-in', clockIn);
router.post('/clock-out', clockOut);
router.get('/active-entries', getActiveEntries);
router.get('/time-entries', getTimeEntries);

export default router;