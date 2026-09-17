import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    originalPrice: {
      type: Number,
      min: 0,
    },
    images: {
      type: [String],
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    categorySlug: {
      type: String,
      trim: true,
      lowercase: true,
    },
    subcategory: {
      type: String,
      trim: true,
    },
    sizes: {
      type: [String],
      default: [],
    },
    colors: {
      type: [String],
      default: [],
    },
    stock: {
      type: Number,
      required: false, // Made optional for variant-based products
      min: 0,
      default: 0,
    },
    hasVariants: {
      type: Boolean,
      default: false,
    },
    variants: [
      {
        size: {
          type: String,
          default: null, // null if product has no size variants
        },
        color: {
          type: String,
          default: null, // null if product has no color variants
        },
        stock: {
          type: Number,
          required: true,
          min: 0,
          default: 0,
        },
        images: {
          type: [String],
          default: [], // Images specific to this variant (e.g., red shirt images)
        },
        sku: {
          type: String,
          trim: true,
        },
        stockZeroAt: {
          type: Date,
          default: null,
        },
      },
    ],
    brand: {
      type: String,
      trim: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    proveedor: {
      type: String,
      trim: true,
    },
    importe: {
      type: Number,
      min: 0,
    },
    taxes: {
      type: Number,
      min: 0,
      default: 0,
    },
    impuestosImportacion: {
      type: Number,
      min: 0,
      default: 0,
    },
    flete: {
      type: Number,
      min: 0,
      default: 0,
    },
    costo: {
      type: Number,
      min: 0,
    },
    paraTienda: {
      type: Boolean,
      default: true,
    },
    location: {
      type: String,
      trim: true,
    },
    barcode: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
    },
    stockZeroAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual field for total stock across all variants
productSchema.virtual('totalStock').get(function () {
  if (this.variants && this.variants.length > 0) {
    return this.variants.reduce((sum, variant) => sum + (variant.stock || 0), 0);
  }
  return this.stock || 0;
});

// Ensure virtuals are included in JSON responses
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ categorySlug: 1 });
productSchema.index({ hasVariants: 1 });

const Product = mongoose.model('Product', productSchema);
export default Product;
