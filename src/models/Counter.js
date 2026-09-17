import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    value: {
        type: Number,
        required: true,
        default: 0,
    },
});

// Static method to get next sequence value atomically
counterSchema.statics.getNextSequence = async function (sequenceName) {
    const counter = await this.findOneAndUpdate(
        { name: sequenceName },
        { $inc: { value: 1 } },
        { new: true, upsert: true }
    );
    return counter.value;
};

const Counter = mongoose.model('Counter', counterSchema);

export default Counter;
