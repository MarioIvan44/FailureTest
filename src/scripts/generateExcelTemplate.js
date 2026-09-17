import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templateData = [
  {
    Nombre: 'Ejemplo: Camiseta Básica',
    Cantidad: 50,
    Precio: 29.99,
    Ubicación: 'Estante A-1',
    'Código de Barra': '1234567890123',
    Imágenes: 'https://ejemplo.com/imagen1.jpg, https://ejemplo.com/imagen2.jpg',
    Descripción: 'Camiseta de algodón 100%, talla M',
  },
  {
    Nombre: 'Ejemplo: Pantalón Vaquero',
    Cantidad: 30,
    Precio: 79.99,
    Ubicación: 'Estante B-2',
    'Código de Barra': '',
    Imágenes: 'https://ejemplo.com/pantalon.jpg',
    Descripción: 'Pantalón vaquero clásico, talla 32',
  },
];

const worksheet = XLSX.utils.json_to_sheet(templateData);
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

// Crear directorio si no existe (en la raíz del proyecto)
const outputDir = path.join(__dirname, '../../../excel-templates');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Guardar archivo
const outputPath = path.join(outputDir, 'template_productos.xlsx');
XLSX.writeFile(workbook, outputPath);

console.log(`Template Excel generado en: ${outputPath}`);

