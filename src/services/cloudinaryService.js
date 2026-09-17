import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Cargar variables de entorno si no están cargadas
dotenv.config({ quiet: true });

// Configurar Cloudinary
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

/**
 * Sube una imagen a Cloudinary
 * @param {Buffer} fileBuffer - Buffer del archivo
 * @param {string} folder - Carpeta donde guardar (opcional)
 * @returns {Promise<{url: string, public_id: string}>}
 */
export const uploadImage = async (fileBuffer, folder = 'inventory') => {
  // Asegurar que las variables de entorno estén cargadas
  dotenv.config({ quiet: true });

  // Verificar que las variables de entorno estén configuradas
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Configuración de Cloudinary incompleta. Verifica las variables de entorno CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET en tu archivo .env');
  }

  // Reconfigurar Cloudinary con los valores actuales (por si acaso)
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  return new Promise((resolve, reject) => {
    // Detect if it's a video or image based on file signature
    const isVideo = fileBuffer[0] === 0x00 && fileBuffer[1] === 0x00 || // MP4
      fileBuffer[0] === 0x1A && fileBuffer[1] === 0x45 || // WebM
      fileBuffer[0] === 0x52 && fileBuffer[1] === 0x49;   // AVI

    // Detect fonts
    const isFont =
      (fileBuffer[0] === 0x00 && fileBuffer[1] === 0x01 && fileBuffer[2] === 0x00 && fileBuffer[3] === 0x00) || // TTF
      (fileBuffer[0] === 0x4F && fileBuffer[1] === 0x54 && fileBuffer[2] === 0x54 && fileBuffer[3] === 0x4F) || // OTF
      (fileBuffer[0] === 0x77 && fileBuffer[1] === 0x4F && fileBuffer[2] === 0x46 && fileBuffer[3] === 0x46) || // WOFF
      (fileBuffer[0] === 0x77 && fileBuffer[1] === 0x4F && fileBuffer[2] === 0x46 && fileBuffer[3] === 0x32);   // WOFF2

    let resourceType = 'image';
    if (isVideo) resourceType = 'video';
    if (isFont) resourceType = 'raw';

    const uploadOptions = {
      folder,
      resource_type: resourceType,
    };

    // Only add transformations for images
    if (resourceType === 'image') {
      uploadOptions.transformation = [
        { width: 1200, height: 1200, crop: 'limit' },
        { quality: 'auto' },
      ];
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Error de Cloudinary:', error);
          reject(new Error(`Error al subir archivo a Cloudinary: ${error.message}`));
        } else {
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
          });
        }
      }
    );

    const readableStream = new Readable();
    readableStream.push(fileBuffer);
    readableStream.push(null);
    readableStream.pipe(uploadStream);
  });
};

/**
 * Elimina una imagen de Cloudinary
 * @param {string} publicId - ID público de la imagen en Cloudinary
 * @returns {Promise<void>}
 */
export const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error eliminando imagen de Cloudinary:', error);
    throw error;
  }
};

/**
 * Extrae el public_id de una URL de Cloudinary
 * @param {string} url - URL de Cloudinary
 * @returns {string|null}
 */
export const extractPublicId = (url) => {
  try {
    if (!url || !url.includes('cloudinary.com')) {
      return null;
    }

    // Extraer el public_id de la URL de Cloudinary
    // Formato: https://res.cloudinary.com/{cloud_name}/image/upload/{folder}/{public_id}.{ext}
    const urlMatch = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.(jpg|jpeg|png|gif|webp|svg)/i);
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1];
    }

    // Fallback: método anterior
    const urlParts = url.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    if (uploadIndex !== -1 && uploadIndex < urlParts.length - 1) {
      const pathAfterUpload = urlParts.slice(uploadIndex + 1);
      // Saltar la versión si existe (v1234567890)
      const startIndex = pathAfterUpload[0] && pathAfterUpload[0].startsWith('v') ? 1 : 0;
      const pathParts = pathAfterUpload.slice(startIndex);
      const filename = pathParts[pathParts.length - 1];
      const publicIdWithoutExt = filename.split('.')[0];
      const folder = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : '';
      return folder ? `${folder}/${publicIdWithoutExt}` : publicIdWithoutExt;
    }

    return null;
  } catch (error) {
    console.error('Error extrayendo public_id:', error);
    return null;
  }
};

