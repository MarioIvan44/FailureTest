import AnnouncementBar from '../models/AnnouncementBar.js';

// Public endpoint - Get active announcement bar
export const getActiveAnnouncementBar = async (req, res) => {
    try {
        const announcement = await AnnouncementBar.findOne({ active: true })
            .sort({ createdAt: -1 });

        if (!announcement) {
            return res.json(null);
        }

        res.json(announcement);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Admin endpoint - Get all announcement bars
export const getAnnouncementBars = async (req, res) => {
    try {
        const announcements = await AnnouncementBar.find({}).sort({ createdAt: -1 });
        res.json(announcements);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Admin endpoint - Create announcement bar
export const createAnnouncementBar = async (req, res) => {
    const { text, active, backgroundColor, textColor, animation, decoration, height, fontSize, imageUrl, imagePublicId } = req.body;

    if (!text && !imageUrl) {
        return res.status(400).json({ message: 'El texto o una imagen son requeridos' });
    }

    try {
        // If creating an active announcement, deactivate all others
        if (active) {
            await AnnouncementBar.updateMany({}, { active: false });
        }

        const announcement = new AnnouncementBar({
            text,
            active,
            backgroundColor,
            textColor,
            animation,
            decoration,
            height,
            fontSize,
            imageUrl,
            imagePublicId
        });

        const createdAnnouncement = await announcement.save();
        res.status(201).json(createdAnnouncement);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Admin endpoint - Update announcement bar
export const updateAnnouncementBar = async (req, res) => {
    try {
        const announcement = await AnnouncementBar.findById(req.params.id);

        if (announcement) {
            // If activating this announcement, deactivate all others
            if (req.body.active && !announcement.active) {
                await AnnouncementBar.updateMany(
                    { _id: { $ne: req.params.id } },
                    { active: false }
                );
            }

            announcement.text = req.body.text !== undefined ? req.body.text : announcement.text;
            announcement.active = req.body.active !== undefined ? req.body.active : announcement.active;
            announcement.backgroundColor = req.body.backgroundColor !== undefined ? req.body.backgroundColor : announcement.backgroundColor;
            announcement.textColor = req.body.textColor !== undefined ? req.body.textColor : announcement.textColor;
            announcement.animation = req.body.animation !== undefined ? req.body.animation : announcement.animation;
            announcement.decoration = req.body.decoration !== undefined ? req.body.decoration : announcement.decoration;
            announcement.height = req.body.height !== undefined ? req.body.height : announcement.height;
            announcement.fontSize = req.body.fontSize !== undefined ? req.body.fontSize : announcement.fontSize;
            announcement.imageUrl = req.body.imageUrl !== undefined ? req.body.imageUrl : announcement.imageUrl;
            announcement.imagePublicId = req.body.imagePublicId !== undefined ? req.body.imagePublicId : announcement.imagePublicId;

            const updatedAnnouncement = await announcement.save();
            res.json(updatedAnnouncement);
        } else {
            res.status(404).json({ message: 'Anuncio no encontrado' });
        }
    } catch (error) {
        res.status(404).json({ message: 'Anuncio no encontrado' });
    }
};

// Admin endpoint - Delete announcement bar
export const deleteAnnouncementBar = async (req, res) => {
    try {
        const announcement = await AnnouncementBar.findById(req.params.id);

        if (announcement) {
            await announcement.deleteOne();
            res.json({ message: 'Anuncio eliminado' });
        } else {
            res.status(404).json({ message: 'Anuncio no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
