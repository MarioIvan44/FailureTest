import express from 'express';
import { uploadProductImage, deleteProductImage, deleteImageByUrl, uploadAnnouncementImage, getAnnouncementImages, deleteAnnouncementImage, uploadBrandLogo } from '../controllers/imageController.js';
import { uploadImage } from '../middlewares/imageUploadMiddleware.js';

const router = express.Router();

router.post('/upload', uploadImage.single('image'), uploadProductImage);
router.delete('/:publicId', deleteProductImage);
router.post('/delete-by-url', deleteImageByUrl);
router.post('/upload-announcement', uploadImage.single('image'), uploadAnnouncementImage);
router.get('/announcement-gallery', getAnnouncementImages);
router.delete('/announcement/:id', deleteAnnouncementImage);
router.post('/upload-logo', uploadImage.single('image'), uploadBrandLogo);

export default router;

