import Banner from '../models/Banner.js';

export const getBanners = async (req, res) => {
    try {
        const banners = await Banner.find({}).sort({ order: 1, createdAt: -1 });
        res.json(banners);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createBanner = async (req, res) => {
    const { type, imageUrl, images, videoUrl, videoDuration, title, subtitle, link, active, order } = req.body;

    // Validate based on type
    const bannerType = type || 'image';

    if (bannerType === 'image' && !imageUrl) {
        return res.status(400).json({ message: 'La imagen es requerida para banners de tipo imagen' });
    }

    if (bannerType === 'video' && (!videoUrl || !videoDuration)) {
        return res.status(400).json({ message: 'El video y la duración son requeridos para banners de tipo video' });
    }

    if (bannerType === 'collage' && (!images || images.length < 2 || images.length > 12)) {
        return res.status(400).json({ message: 'Un collage debe tener entre 2 y 12 imágenes' });
    }

    try {
        const banner = new Banner({
            type: bannerType,
            imageUrl,
            images,
            videoUrl,
            videoDuration,
            title,
            subtitle,
            link,
            active,
            order
        });

        const createdBanner = await banner.save();
        res.status(201).json(createdBanner);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const updateBanner = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);

        if (banner) {
            banner.type = req.body.type !== undefined ? req.body.type : banner.type;
            banner.imageUrl = req.body.imageUrl !== undefined ? req.body.imageUrl : banner.imageUrl;
            banner.images = req.body.images !== undefined ? req.body.images : banner.images;
            banner.videoUrl = req.body.videoUrl !== undefined ? req.body.videoUrl : banner.videoUrl;
            banner.videoDuration = req.body.videoDuration !== undefined ? req.body.videoDuration : banner.videoDuration;
            banner.title = req.body.title !== undefined ? req.body.title : banner.title;
            banner.subtitle = req.body.subtitle !== undefined ? req.body.subtitle : banner.subtitle;
            banner.link = req.body.link !== undefined ? req.body.link : banner.link;
            banner.active = req.body.active !== undefined ? req.body.active : banner.active;
            banner.order = req.body.order !== undefined ? req.body.order : banner.order;

            const updatedBanner = await banner.save();
            res.json(updatedBanner);
        } else {
            res.status(404).json({ message: 'Banner no encontrado' });
        }
    } catch (error) {
        res.status(404).json({ message: 'Banner no encontrado' });
    }
};

export const deleteBanner = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);

        if (banner) {
            await banner.deleteOne();
            res.json({ message: 'Banner eliminado' });
        } else {
            res.status(404).json({ message: 'Banner no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const reorderBanners = async (req, res) => {
    try {
        const { items } = req.body;

        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ message: 'Se requiere un array de items' });
        }

        // Use Promise.all to update all banners in parallel could lead to race conditions if not careful or database limitations.
        // For simplicity and safety with small lists (banners usually < 20), sequential or Promise.all is fine.
        // Using bulkWrite is better for performance but individual updates are easier to verify here.

        // Let's use Promise.all with individual updates
        const updatePromises = items.map(async (item) => {
            if (item._id && typeof item.order === 'number') {
                return Banner.findByIdAndUpdate(item._id, { order: item.order });
            }
        });

        await Promise.all(updatePromises);

        res.json({ message: 'Orden actualizado correctamente' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
