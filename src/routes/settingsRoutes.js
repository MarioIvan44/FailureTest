import express from 'express';
import { getSetting, updateSetting } from '../controllers/settingsController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All settings routes should be protected
router.route('/:key')
    .get( getSetting)
    .put( updateSetting);

export default router;
