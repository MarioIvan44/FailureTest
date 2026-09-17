import express from 'express';
import { reverseGeocode } from '../controllers/geocodingController.js';

const router = express.Router();

// Public route - no authentication needed for geocoding
router.get('/nominatim', reverseGeocode);

export default router;
