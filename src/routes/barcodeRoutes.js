import { Router } from 'express';
import { createBarcode } from '../controllers/barcodeController.js';

const router = Router();

router.post('/', createBarcode);

export default router;

