import XLSX from "xlsx";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import { generateUniqueBarcode } from "../services/barcodeService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta del archivo Excel fijo en la raíz del proyecto
const EXCEL_FILE_PATH = path.join(__dirname, "../../../inventario.xlsx");

const normalizeImages = (images) => {
  if (!images) return [];
  if (typeof images === "string") {
    return images
      .split(",")
      .map((url) => url.trim())
      .filter(Boolean);
  }
  if (Array.isArray(images)) {
    return images.filter(Boolean).map((url) => url.trim());
  }
  return [];
};

const createExcelWorkbook = (data) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Productos");

  // Ajustar ancho de columnas
  // Ajustar ancho de columnas
  const columnWidths = [
    { wch: 30 }, // Nombre
    { wch: 15 }, // Categoría
    { wch: 15 }, // Subcategoría
    { wch: 12 }, // Cantidad
    { wch: 12 }, // Precio
    { wch: 12 }, // Precio Original
    { wch: 20 }, // Ubicación
    { wch: 20 }, // Código de Barra
    { wch: 15 }, // Marca
    { wch: 15 }, // Proveedor
    { wch: 15 }, // Tallas
    { wch: 15 }, // Colores
    { wch: 12 }, // Costo
    { wch: 12 }, // Importe
    { wch: 12 }, // Impuestos
    { wch: 12 }, // Imp. Importación
    { wch: 12 }, // Flete
    { wch: 12 }, // Para Tienda
    { wch: 40 }, // Imágenes
    { wch: 50 }, // Descripción
  ];
  worksheet["!cols"] = columnWidths;

  return workbook;
};

// Función helper para generar nombre de archivo con fecha y hora
const generateFileName = () => {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2); // Últimos 2 dígitos del año
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  // Formato de 12 horas con AM/PM
  let hours = now.getHours();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 se convierte en 12
  const hours12 = String(hours).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `inventario_${day}-${month}-${year}_${hours12}-${minutes}-${seconds}-${ampm}.xlsx`;
};

export const exportProducts = async (req, res, next) => {
  try {
    const products = await Product.find().populate('category').sort("-updatedAt");

    const data = products.map((product) => ({
      Nombre: product.name,
      Categoría: product.category ? product.category.name : "",
      Subcategoría: product.subcategory || "",
      Cantidad: product.stock !== undefined ? product.stock : product.quantity, // product.quantity might be old field, using stock usually
      Precio: product.price,
      "Precio Original": product.originalPrice || 0,
      Ubicación: product.location || "",
      "Código de Barra": product.barcode,
      Marca: product.brand || "",
      Proveedor: product.proveedor || "",
      Tallas: Array.isArray(product.sizes) ? product.sizes.join(", ") : "",
      Colores: Array.isArray(product.colors) ? product.colors.join(", ") : "",
      Costo: product.costo || 0,
      Importe: product.importe || 0,
      Impuestos: product.taxes || 0,
      "Imp. Importación": product.impuestosImportacion || 0,
      Flete: product.flete || 0,
      "Para Tienda": product.paraTienda ? "Sí" : "No",
      Imágenes: product.images.join(", "),
      Descripción: product.description || "",
    }));

    const workbook = createExcelWorkbook(data);

    // Guardar el archivo en la raíz del proyecto
    XLSX.writeFile(workbook, EXCEL_FILE_PATH);

    // También enviar el archivo como respuesta para descarga
    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    const filename = generateFileName();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${filename}`
    );

    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

export const getExcelFile = async (req, res, next) => {
  try {
    const filename = generateFileName();

    // Si el archivo existe, enviarlo
    if (fs.existsSync(EXCEL_FILE_PATH)) {
      const fileBuffer = fs.readFileSync(EXCEL_FILE_PATH);
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${filename}`
      );
      res.send(fileBuffer);
    } else {
      // Si no existe, crear uno vacío con solo los encabezados
      const emptyData = [];
      const workbook = createExcelWorkbook(emptyData);
      XLSX.writeFile(workbook, EXCEL_FILE_PATH);

      const buffer = XLSX.write(workbook, {
        type: "buffer",
        bookType: "xlsx",
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${filename}`
      );
      res.send(buffer);
    }
  } catch (error) {
    next(error);
  }
};

export const importProducts = async (req, res, next) => {
  try {
    let workbook;
    let source = "uploaded";

    // Si se especifica usar el archivo fijo, leerlo desde el sistema de archivos
    if (req.query.useFixed === "true" || req.query.useFixed === "1") {
      if (!fs.existsSync(EXCEL_FILE_PATH)) {
        res.status(404);
        throw new Error(
          "El archivo inventario.xlsx no existe. Exporta los productos primero."
        );
      }

      const fileBuffer = fs.readFileSync(EXCEL_FILE_PATH);
      workbook = XLSX.read(fileBuffer, { type: "buffer" });
      source = "fixed";
    } else if (req.file) {
      // Usar el archivo subido
      workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      source = "uploaded";
    } else {
      res.status(400);
      throw new Error(
        "No se proporcionó ningún archivo. Selecciona un archivo o usa el archivo fijo (inventario.xlsx)"
      );
    }

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      res.status(400);
      throw new Error("El archivo Excel está vacío");
    }

    const results = {
      success: [],
      errors: [],
      duplicates: [],
      total: data.length,
      source,
    };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // +2 porque la fila 1 es el encabezado

      try {
        const name = row.Nombre || row.nombre || row["Nombre del Producto"];
        if (!name || !name.toString().trim()) {
          results.errors.push({
            row: rowNumber,
            error: "El nombre del producto es obligatorio",
            data: row,
          });
          continue;
          continue;
        }

        // --- Category Lookup Logic ---
        const categoryName = (row.Categoría || row.categoría || row.Category || row.category || row.Categoria || row["Nombre de Categoría"] || "").toString().trim();
        let categoryId;

        if (categoryName) {
          // Buscar categoría por nombre (case insensitive)
          const category = await Category.findOne({
            name: { $regex: new RegExp(`^${categoryName}$`, 'i') }
          });

          if (category) {
            categoryId = category._id;
          } else {
            results.errors.push({
              row: rowNumber,
              error: `La categoría "${categoryName}" no existe en el sistema. Debe crearla antes de importar.`,
              data: row,
            });
            continue;
          }
        } else {
          results.errors.push({
            row: rowNumber,
            error: "La categoría es obligatoria para importar productos.",
            data: row,
          });
          continue;
        }
        // -----------------------------

        // --- Mapping Extended Fields ---
        const subcategory = (row.Subcategoría || row.subcategoría || row.Subcategoria || "").toString().trim();
        const brand = (row.Marca || row.marca || row.Brand || "").toString().trim();
        const proveedor = (row.Proveedor || row.proveedor || row.Provider || "").toString().trim();

        const sizesRaw = (row.Tallas || row.tallas || row.Sizes || "").toString();
        const sizes = sizesRaw ? sizesRaw.split(",").map(s => s.trim()).filter(Boolean) : ["S", "M", "L", "XL"];

        const colorsRaw = (row.Colores || row.colores || row.Colors || "").toString();
        const colors = colorsRaw ? colorsRaw.split(",").map(c => c.trim()).filter(Boolean) : [];

        const originalPrice = parseFloat(row["Precio Original"] || row.originalPrice || 0);
        const costo = parseFloat(row.Costo || row.costo || 0);
        const importe = parseFloat(row.Importe || row.importe || 0);
        const taxes = parseFloat(row.Impuestos || row.taxes || 0);
        const impuestosImportacion = parseFloat(row["Imp. Importación"] || row.impuestosImportacion || 0);
        const flete = parseFloat(row.Flete || row.flete || 0);

        const paraTiendaVal = (row["Para Tienda"] || row.paraTienda || "Sí").toString().toLowerCase();
        const paraTienda = paraTiendaVal === "sí" || paraTiendaVal === "si" || paraTiendaVal === "true" || paraTiendaVal === "yes";
        // -----------------------------

        const stock = parseFloat(
          row.Stock || row.stock || row.Cantidad || row.cantidad || row["Cantidad Existente"] || 0
        );
        const price = parseFloat(
          row.Precio || row.precio || row["Precio Unitario"] || 0
        );
        const location = (
          row.Ubicación ||
          row.ubicación ||
          row["Ubicación en Almacén"] ||
          ""
        )
          .toString()
          .trim();
        let barcode = (
          row["Código de Barra"] ||
          row["Codigo de Barra"] ||
          row.barcode ||
          row["Código"] ||
          ""
        )
          .toString()
          .trim()
          .toUpperCase();

        const images =
          row.Imágenes ||
          row.imágenes ||
          row.Imagenes ||
          row["URLs de Imágenes"] ||
          "";
        const description = (
          row.Descripción ||
          row.descripción ||
          row.Descripcion ||
          row["Descripción del Producto"] ||
          ""
        )
          .toString()
          .trim();

        // Si no hay código de barra, generar uno
        if (!barcode) {
          barcode = await generateUniqueBarcode();
        }

        // Verificar si el código de barra ya existe
        const existingProduct = await Product.findOne({ barcode });
        if (existingProduct) {
          results.duplicates.push({
            row: rowNumber,
            error: `El código de barra ${barcode} ya está registrado`,
            data: row,
          });
          continue;
        }

        const product = await Product.create({
          name: name.toString().trim(),
          stock: isNaN(stock) ? 0 : stock,
          price: isNaN(price) ? 0 : price,
          originalPrice: isNaN(originalPrice) ? 0 : originalPrice,
          location,
          barcode,
          images: normalizeImages(images),
          description,
          category: categoryId,
          subcategory,
          brand,
          proveedor,
          sizes,
          colors,
          costo: isNaN(costo) ? 0 : costo,
          importe: isNaN(importe) ? 0 : importe,
          taxes: isNaN(taxes) ? 0 : taxes,
          impuestosImportacion: isNaN(impuestosImportacion) ? 0 : impuestosImportacion,
          flete: isNaN(flete) ? 0 : flete,
          paraTienda
        });

        results.success.push({
          row: rowNumber,
          product: {
            _id: product._id,
            name: product.name,
            barcode: product.barcode,
          },
        });
      } catch (error) {
        if (error.code === 11000) {
          results.duplicates.push({
            row: rowNumber,
            error: "El código de barra ya está registrado",
            data: row,
          });
        } else {
          results.errors.push({
            row: rowNumber,
            error: error.message || "Error al procesar el producto",
            data: row,
          });
        }
      }
    }

    res.json({
      message: `Importación completada: ${results.success.length} productos agregados, ${results.duplicates.length} duplicados`,
      results,
    });
  } catch (error) {
    next(error);
  }
};
