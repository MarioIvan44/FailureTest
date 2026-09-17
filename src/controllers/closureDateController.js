import ClosureDate from '../models/ClosureDate.js';

// Get all closure dates
export const getClosureDates = async (req, res) => {
    try {
        const closureDates = await ClosureDate.find().sort({ date: 1 });
        res.json(closureDates);
    } catch (error) {
        console.error('Error fetching closure dates:', error);
        res.status(500).json({ error: 'Failed to fetch closure dates' });
    }
};

// Add a new closure date
export const addClosureDate = async (req, res) => {
    try {
        const { date, reason, hasSpecialHours, specialHours } = req.body;

        if (!date) {
            return res.status(400).json({ error: 'Date is required' });
        }

        // Check if date already exists
        const existing = await ClosureDate.findOne({ date: new Date(date) });
        if (existing) {
            return res.status(400).json({ error: 'This date is already marked as closed' });
        }

        const closureDate = new ClosureDate({
            date: new Date(date),
            reason: reason || '',
            hasSpecialHours: hasSpecialHours || false,
            specialHours: (hasSpecialHours && specialHours) ? {
                openTime: specialHours.openTime,
                closeTime: specialHours.closeTime
            } : undefined
        });

        await closureDate.save();
        res.status(201).json(closureDate);
    } catch (error) {
        console.error('Error adding closure date:', error);
        res.status(500).json({ error: 'Failed to add closure date' });
    }
};

// Delete a closure date
export const deleteClosureDate = async (req, res) => {
    try {
        const { id } = req.params;

        const closureDate = await ClosureDate.findByIdAndDelete(id);
        if (!closureDate) {
            return res.status(404).json({ error: 'Closure date not found' });
        }

        res.json({ message: 'Closure date deleted successfully' });
    } catch (error) {
        console.error('Error deleting closure date:', error);
        res.status(500).json({ error: 'Failed to delete closure date' });
    }
};

// Update a closure date (for special hours)
export const updateClosureDate = async (req, res) => {
    try {
        const { id } = req.params;
        const { hasSpecialHours, specialHours } = req.body;

        const closureDate = await ClosureDate.findById(id);
        if (!closureDate) {
            return res.status(404).json({ error: 'Closure date not found' });
        }

        // Update special hours
        if (hasSpecialHours !== undefined) {
            closureDate.hasSpecialHours = hasSpecialHours;
        }

        if (hasSpecialHours && specialHours) {
            // Validate that both openTime and closeTime are provided
            if (!specialHours.openTime || !specialHours.closeTime) {
                return res.status(400).json({ error: 'Both openTime and closeTime are required for special hours' });
            }
            closureDate.specialHours = {
                openTime: specialHours.openTime,
                closeTime: specialHours.closeTime,
            };
        } else if (!hasSpecialHours) {
            // Clear special hours if not using them
            closureDate.specialHours = undefined;
        }

        await closureDate.save();
        res.json(closureDate);
    } catch (error) {
        console.error('Error updating closure date:', error);
        res.status(500).json({ error: 'Failed to update closure date' });
    }
};
