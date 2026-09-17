import StoreHours from '../models/StoreHours.js';

// Seed default hours for the week
const seedDefaultHours = async () => {
    const days = [0, 1, 2, 3, 4, 5, 6];
    const defaultHours = days.map(day => ({
        day,
        openTime: "07:00",
        closeTime: "19:00",
        closed: false
    }));

    await StoreHours.insertMany(defaultHours);
    return StoreHours.find().sort({ day: 1 });
};

export const getAllStoreHours = async (req, res) => {
    try {
        let hours = await StoreHours.find().sort({ day: 1 });

        // If no hours found, seed them
        if (hours.length === 0) {
            hours = await seedDefaultHours();
        }

        res.json(hours);
    } catch (error) {
        console.error('Error getting store hours:', error);
        res.status(500).json({ message: 'Error getting store hours' });
    }
};

export const updateStoreHours = async (req, res) => {
    try {
        const { day } = req.params;
        const { openTime, closeTime, closed } = req.body;

        const hours = await StoreHours.findOneAndUpdate(
            { day: parseInt(day) },
            { openTime, closeTime, closed },
            { new: true, upsert: true }
        );

        res.json(hours);
    } catch (error) {
        console.error('Error updating store hours:', error);
        res.status(500).json({ message: 'Error updating store hours' });
    }
};

export const bulkUpdateStoreHours = async (req, res) => {
    try {
        const { hours } = req.body; // Array of { day, openTime, closeTime, closed }

        if (!Array.isArray(hours)) {
            return res.status(400).json({ message: 'Expected an array of hours' });
        }

        const updatePromises = hours.map(h =>
            StoreHours.findOneAndUpdate(
                { day: h.day },
                { openTime: h.openTime, closeTime: h.closeTime, closed: h.closed },
                { new: true, upsert: true }
            )
        );

        await Promise.all(updatePromises);
        const updatedHours = await StoreHours.find().sort({ day: 1 });
        res.json(updatedHours);
    } catch (error) {
        console.error('Error bulk updating store hours:', error);
        res.status(500).json({ message: 'Error bulk updating store hours' });
    }
};
