import mongoose from 'mongoose';

const announcementImageSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true,
    },
    public_id: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        trim: true,
    }
}, {
    timestamps: true
});

const AnnouncementImage = mongoose.model('AnnouncementImage', announcementImageSchema);
export default AnnouncementImage;
