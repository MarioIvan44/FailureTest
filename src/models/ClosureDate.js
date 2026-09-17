import mongoose from 'mongoose';

const closureDateSchema = new mongoose.Schema(
    {
        date: {
            type: Date,
            required: true,
            unique: true,
        },
        reason: {
            type: String,
            required: false,
            default: '',
        },
        hasSpecialHours: {
            type: Boolean,
            required: false,
            default: false,
        },
        specialHours: {
            openTime: {
                type: String,
                required: false,
            },
            closeTime: {
                type: String,
                required: false,
            },
        },
    },
    {
        timestamps: true,
    }
);

const ClosureDate = mongoose.model('ClosureDate', closureDateSchema);

export default ClosureDate;
