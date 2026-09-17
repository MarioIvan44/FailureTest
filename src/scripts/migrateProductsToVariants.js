import mongoose from 'mongoose';
import Product from '../models/Product.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend root
dotenv.config({ path: path.join(__dirname, '../../src/.env') });

const migrateProductsToVariants = async () => {
    try {
        console.log('🚀 Starting product migration to variants system...');
        console.log(`📡 Connecting to MongoDB: ${process.env.MONGO_URI}`);

        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Find all products that don't have variants yet
        const productsToMigrate = await Product.find({
            $or: [
                { hasVariants: { $exists: false } },
                { hasVariants: false },
                { variants: { $exists: false } },
                { variants: { $size: 0 } }
            ]
        });

        console.log(`📦 Found ${productsToMigrate.length} products to migrate`);

        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        for (const product of productsToMigrate) {
            try {
                // Create a single default variant with the current stock
                const defaultVariant = {
                    size: null,
                    color: null,
                    stock: product.stock || 0,
                    sku: product.barcode || null,
                    stockZeroAt: product.stockZeroAt || null,
                };

                // Update the product
                product.hasVariants = false; // Mark as non-variant product (single default variant)
                product.variants = [defaultVariant];

                await product.save();
                successCount++;

                if (successCount % 10 === 0) {
                    console.log(`✓ Migrated ${successCount} products...`);
                }
            } catch (error) {
                errorCount++;
                errors.push({
                    productId: product._id,
                    productName: product.name,
                    error: error.message,
                });
                console.error(`❌ Error migrating product ${product.name}:`, error.message);
            }
        }

        console.log('\n📊 Migration Summary:');
        console.log(`✅ Successfully migrated: ${successCount} products`);
        console.log(`❌ Failed: ${errorCount} products`);

        if (errors.length > 0) {
            console.log('\n⚠️  Errors:');
            errors.forEach((err) => {
                console.log(`  - ${err.productName} (${err.productId}): ${err.error}`);
            });
        }

        console.log('\n✨ Migration complete!');
    } catch (error) {
        console.error('💥 Migration failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected from MongoDB');
        process.exit(0);
    }
};

// Run migration
migrateProductsToVariants();
