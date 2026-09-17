import mongoose from 'mongoose';

const announcementBarSchema = new mongoose.Schema({
    text: {
        type: String,
        trim: true,
    },
    imageUrl: {
        type: String,
        trim: true,
    },
    imagePublicId: {
        type: String,
        trim: true,
    },
    active: {
        type: Boolean,
        default: true,
    },
    backgroundColor: {
        type: String,
        default: '#DC2626', // Red color by default
        trim: true,
    },
    textColor: {
        type: String,
        default: '#FFFFFF', // White text by default
        trim: true,
    },
    animation: {
        type: String,
        enum: ['none', 'marquee', 'pulse', 'fadeIn', 'slideFromTop', 'bounce', 'wobble', 'heartbeat', 'blink', 'shake', 'swing', 'rubberBand', 'flash', 'jello'],
        default: 'none'
    },
    decoration: {
        type: String,
        enum: ['none', 'christmas', 'halloween', 'valentines', 'mothers_day', 'fathers_day', 'black_week', 'easter', 'new_year', 'independence_sv', 'birthday', 'august_fest'],
        default: 'none'
    },
    height: {
        type: Number,
        default: 40, // Height in pixels
    },
    fontSize: {
        type: Number,
        default: 13, // Font size in pixels
    }
}, {
    timestamps: true
});

const AnnouncementBar = mongoose.model('AnnouncementBar', announcementBarSchema);
export default AnnouncementBar;
