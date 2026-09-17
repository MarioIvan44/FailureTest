import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['low_stock', 'pickup_ready', 'payment_failed', 'info', 'system_alert'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    metadata: {
        type: Object, // Flexible field for orderId, productId, etc.
        default: {}
    },
    isRead: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Notification', notificationSchema);
