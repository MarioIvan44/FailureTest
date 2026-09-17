import { Router } from 'express';
import {
  exportProducts,
  getExcelFile,
  importProducts,
} from '../controllers/excelController.js';
import { uploadExcel } from '../middlewares/uploadMiddleware.js';

const router = Router();

router.get('/export', exportProducts);
router.get('/file', getExcelFile);
router.post('/import', uploadExcel.single('file'), importProducts);

export default router;

