import mongoose from 'mongoose';

const storeHoursSchema = new mongoose.Schema(
    {
        day: {
            type: Number,
            required: true,
            min: 0,
            max: 6, // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
            unique: true,
        },
        openTime: {
            type: String, // Format: "HH:mm"
            required: false,
            default: "07:00",
        },
        closeTime: {
            type: String, // Format: "HH:mm"
            required: false,
            default: "19:00",
        },
        closed: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

const StoreHours = mongoose.model('StoreHours', storeHoursSchema);

export default StoreHours;
