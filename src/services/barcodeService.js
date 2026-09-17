import Product from '../models/Product.js';
import { generateBarcode } from '../utils/barcode.js';

export const generateUniqueBarcode = async () => {
  let barcode;
  let exists = true;

  while (exists) {
    barcode = generateBarcode();
    exists = await Product.exists({ barcode });
  }

  return barcode;
};

