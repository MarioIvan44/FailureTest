import { generateUniqueBarcode } from '../services/barcodeService.js';

export const createBarcode = async (req, res, next) => {
  try {
    const barcode = await generateUniqueBarcode();
    res.status(201).json({ barcode });
  } catch (error) {
    next(error);
  }
};

