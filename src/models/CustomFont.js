import mongoose from 'mongoose';

const customFontSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    url: {
        type: String,
        required: true,
    },
    public_id: {
        type: String,
        required: true,
    },
    format: {
        type: String,
        enum: ['ttf', 'otf', 'woff', 'woff2'],
        required: true
    },
    originalName: {
        type: String,
        required: true
    }
}, {
    timestamps: true,
});

const CustomFont = mongoose.model('CustomFont', customFontSchema);

export default CustomFont;
