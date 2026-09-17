import { uploadImage, deleteImage } from '../services/cloudinaryService.js';
import CustomFont from '../models/CustomFont.js';
import path from 'path';

export const uploadFont = async (req, res, next) => {
    try {
        if (!req.file) {
            res.status(400);
            throw new Error('No se proporcionó ningún archivo');
        }

        const ext = path.extname(req.file.originalname).substring(1).toLowerCase(); // ttf, otf...
        const name = req.body.name || path.parse(req.file.originalname).name;

        console.log('Subiendo fuente a Cloudinary...');
        const result = await uploadImage(req.file.buffer, 'fonts');
        console.log('Fuente subida exitosamente:', result.public_id);

        const font = new CustomFont({
            name,
            url: result.url,
            public_id: result.public_id,
            format: ext,
            originalName: req.file.originalname
        });

        await font.save();

        res.json(font);
    } catch (error) {
        console.error('Error en uploadFont:', error);
        next(error);
    }
};

export const getFonts = async (req, res, next) => {
    try {
        const fonts = await CustomFont.find({}).sort({ createdAt: -1 });
        res.json(fonts);
    } catch (error) {
        next(error);
    }
};

export const deleteFont = async (req, res, next) => {
    try {
        const { id } = req.params;

        const font = await CustomFont.findById(id);
        if (!font) {
            res.status(404);
            throw new Error('Fuente no encontrada');
        }

        // Delete from Cloudinary
        await deleteImage(font.public_id);

        // Delete from DB
        await CustomFont.findByIdAndDelete(id);

        res.json({ message: 'Fuente eliminada correctamente' });
    } catch (error) {
        next(error);
    }
};
