import Settings from '../models/Settings.js';

// Get a specific setting by key
export const getSetting = async (req, res) => {
    try {
        const { key } = req.params;
        const setting = await Settings.findOne({ key });

        if (!setting) {
            // Return default values for known keys if not found
            if (key === 'adminEmail') {
                return res.json({ key: 'adminEmail', value: 'noreply.exequiel.miranda@gmail.com' });
            }
            if (key === 'primaryColor') {
                return res.json({ key: 'primaryColor', value: '#d32f2f' });
            }
            if (key === 'buttonTextColor') {
                return res.json({ key: 'buttonTextColor', value: '#ffffff' });
            }
            if (key === 'brandName') {
                return res.json({ key: 'brandName', value: 'TOFF' });
            }
            if (key === 'brandLogoUrl') {
                return res.json({ key: 'brandLogoUrl', value: '' });
            }
            if (key === 'useBrandLogo') {
                return res.json({ key: 'useBrandLogo', value: 'false' });
            }
            if (key === 'socialLinks') {
                return res.json({
                    key: 'socialLinks',
                    value: [
                        { platform: 'facebook', url: '', enabled: false },
                        { platform: 'instagram', url: '', enabled: false },
                        { platform: 'twitter', url: '', enabled: false },
                        { platform: 'youtube', url: '', enabled: false },
                        { platform: 'tiktok', url: '', enabled: false },
                        { platform: 'whatsapp', url: '', enabled: false }
                    ]
                });
            }
            return res.status(404).json({ message: 'Setting not found' });
        }

        res.json(setting);
    } catch (error) {
        console.error('Error getting setting:', error);
        res.status(500).json({ message: 'Error getting setting' });
    }
};

// Update or create a setting
export const updateSetting = async (req, res) => {
    try {
        const { key } = req.params;
        const { value } = req.body;

        if (value === undefined) {
            return res.status(400).json({ message: 'Value is required' });
        }

        const setting = await Settings.findOneAndUpdate(
            { key },
            { value },
            { new: true, upsert: true }
        );

        res.json(setting);
    } catch (error) {
        console.error('Error updating setting:', error);
        res.status(500).json({ message: 'Error updating setting' });
    }
};
