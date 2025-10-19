import express from 'express';
import {
  getUserActivities,
  createActivity,
  updateActivity,
  deleteActivity
} from '../controllers/activityControllers.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, getUserActivities);
router.post('/', auth, createActivity);
router.put('/:id', auth, updateActivity);
router.delete('/:id', auth, deleteActivity);

export default router;