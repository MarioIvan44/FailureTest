import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Crear archivo vacío con solo encabezados
const emptyData = [];

const worksheet = XLSX.utils.json_to_sheet(emptyData);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');

// Ajustar ancho de columnas
const columnWidths = [
  { wch: 30 }, // Nombre
  { wch: 12 }, // Cantidad
  { wch: 12 }, // Precio
  { wch: 20 }, // Ubicación
  { wch: 20 }, // Código de Barra
  { wch: 40 }, // Imágenes
  { wch: 50 }, // Descripción
];
worksheet['!cols'] = columnWidths;

// Guardar en la raíz del proyecto
const outputPath = path.join(__dirname, '../../../inventario.xlsm');
XLSX.writeFile(workbook, outputPath, { bookType: 'xlsm' });

console.log(`Archivo inventario.xlsm creado en: ${outputPath}`);

