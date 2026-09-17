import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['image', 'video', 'collage'],
        default: 'image',
    },
    imageUrl: {
        type: String,
        required: function () {
            return this.type === 'image';
        },
    },
    images: {
        type: [String],
        required: function () {
            return this.type === 'collage';
        },
        validate: {
            validator: function (v) {
                if (this.type !== 'collage') return true;
                return v && v.length >= 2 && v.length <= 12;
            },
            message: 'Un collage debe tener entre 2 y 12 imágenes'
        }
    },
    videoUrl: {
        type: String,
        required: function () {
            return this.type === 'video';
        },
    },
    videoDuration: {
        type: Number, // Duration in seconds
        required: function () {
            return this.type === 'video';
        },
    },
    title: {
        type: String,
        trim: true,
    },
    subtitle: {
        type: String,
        trim: true,
    },
    link: {
        type: String,
        trim: true,
    },
    active: {
        type: Boolean,
        default: true,
    },
    order: {
        type: Number,
        default: 0,
    }
}, {
    timestamps: true
});

const Banner = mongoose.model('Banner', bannerSchema);
export default Banner;
