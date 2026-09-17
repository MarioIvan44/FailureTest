import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        slug: {
            type: String,
            lowercase: true,
            trim: true,
            unique: true,
        },
        description: {
            type: String,
            trim: true,
        },
        subcategories: [{
            name: {
                type: String,
                required: true,
            },
            slug: {
                type: String,
                required: true,
            },
            items: {
                type: [String],
                default: [],
            }
        }],
        featured: {
            type: Boolean,
            default: false,
        },
        order: {
            type: Number,
            default: 0,
        },
        icon: {
            type: String,
            trim: true,
        }
    },
    {
        timestamps: true,
    }
);

// Middleware has been removed to avoid 'next is not a function' error.
// Slug generation is now handled in the controller.
/*
categorySchema.pre('save', function (next) {
    if (this.isModified('name') || this.isNew) {
        this.slug = this.name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    next();
});
*/

const Category = mongoose.model('Category', categorySchema);

export default Category;
