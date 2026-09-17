import { uploadImage, deleteImage, extractPublicId } from '../services/cloudinaryService.js';
import AnnouncementImage from '../models/AnnouncementImage.js';

export const uploadProductImage = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('No se proporcionó ningún archivo');
    }

    console.log('Subiendo imagen a Cloudinary...');
    const result = await uploadImage(req.file.buffer, 'inventory/products');
    console.log('Imagen subida exitosamente:', result.public_id);

    res.json({
      url: result.url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error('Error en uploadProductImage:', error);
    next(error);
  }
};

export const deleteProductImage = async (req, res, next) => {
  try {
    const { publicId } = req.params;

    if (!publicId) {
      res.status(400);
      throw new Error('No se proporcionó el ID de la imagen');
    }

    await deleteImage(publicId);

    res.json({ message: 'Imagen eliminada correctamente' });
  } catch (error) {
    next(error);
  }
};

export const deleteImageByUrl = async (req, res, next) => {
  try {
    const { url } = req.body;

    if (!url) {
      res.status(400);
      throw new Error('No se proporcionó la URL de la imagen');
    }

    const publicId = extractPublicId(url);

    if (!publicId) {
      res.status(400);
      throw new Error('URL de Cloudinary no válida');
    }

    await deleteImage(publicId);

    res.json({ message: 'Imagen eliminada correctamente' });
  } catch (error) {
    next(error);
  }
};


export const uploadAnnouncementImage = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('No se proporcionó ningún archivo');
    }

    console.log('Subiendo imagen de anuncio a Cloudinary...');
    const result = await uploadImage(req.file.buffer, 'announcements');
    console.log('Imagen subida exitosamente:', result.public_id);

    // Save to gallery
    const galleryImage = new AnnouncementImage({
      url: result.url,
      public_id: result.public_id,
      name: req.file.originalname
    });
    await galleryImage.save();

    res.json({
      url: result.url,
      public_id: result.public_id,
      _id: galleryImage._id
    });
  } catch (error) {
    console.error('Error en uploadAnnouncementImage:', error);
    next(error);
  }
};

export const getAnnouncementImages = async (req, res, next) => {
  try {
    const images = await AnnouncementImage.find({}).sort({ createdAt: -1 });
    res.json(images);
  } catch (error) {
    next(error);
  }
};

export const deleteAnnouncementImage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const image = await AnnouncementImage.findById(id);
    if (!image) {
      res.status(404);
      throw new Error('Imagen no encontrada');
    }

    // Delete from Cloudinary
    await deleteImage(image.public_id);

    // Delete from DB
    await AnnouncementImage.findByIdAndDelete(id);

    res.json({ message: 'Imagen eliminada de la galería' });
  } catch (error) {
    next(error);
  }
};

export const uploadBrandLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('No se proporcionó ningún archivo');
    }

    console.log('Subiendo logo de marca a Cloudinary...');
    const result = await uploadImage(req.file.buffer, 'brand');
    console.log('Logo subido exitosamente:', result.public_id);

    res.json({
      url: result.url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error('Error en uploadBrandLogo:', error);
    next(error);
  }
};
