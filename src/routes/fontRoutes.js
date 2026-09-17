import express from 'express';
import { uploadFont, getFonts, deleteFont } from '../controllers/fontController.js';
import { uploadImage } from '../middlewares/imageUploadMiddleware.js';

const router = express.Router();

// Uses uploadImage middleware which we updated to allow fonts
router.post('/', uploadImage.single('font'), uploadFont);
router.get('/', getFonts);
router.delete('/:id', deleteFont);

export default router;
