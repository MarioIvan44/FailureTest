import Product from '../models/Product.js';
import Settings from '../models/Settings.js';

export const cleanUpOutOfStockProducts = async () => {
    try {
        const setting = await Settings.findOne({ key: 'daysToKeepZeroStock' });
        if (!setting || !setting.value || isNaN(setting.value)) {
            return; // Not configured
        }

        const days = parseFloat(setting.value);
        if (days <= 0) return;

        // Calculate threshold date: NOW - days
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - days);

        const result = await Product.updateMany(
            {
                stock: 0,
                paraTienda: true,
                stockZeroAt: { $lte: thresholdDate }
            },
            {
                $set: { paraTienda: false, stockZeroAt: null }
            }
        );

        if (result.modifiedCount > 0) {
            console.log(`[Auto-Hide] Hidden ${result.modifiedCount} products out of stock for more than ${days} days.`);
        }
    } catch (error) {
        console.error('[Auto-Hide] Error running cleanup job:', error);
    }
};

export const startInventoryJobs = () => {
    // Run immediately on start
    cleanUpOutOfStockProducts();

    // Run every hour (3600000 ms)
    setInterval(cleanUpOutOfStockProducts, 3600000);
};
