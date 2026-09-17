import { customAlphabet } from 'nanoid';

const DIGITS = '0123456789';
const BARCODE_LENGTH = 13;
const nanoid = customAlphabet(DIGITS, BARCODE_LENGTH);

export const generateBarcode = () => nanoid();

