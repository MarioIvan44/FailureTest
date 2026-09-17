import mongoose from 'mongoose';
import Category from '../models/Category.js';
import dotenv from 'dotenv';

dotenv.config();

const categories = [
    { name: 'Vestidos', description: 'Vestidos de todo tipo', subcategories: ['Vestidos Casuales', 'Vestidos de Noche', 'Vestidos de Fiesta', 'Vestidos de Coctel'] },
    { name: 'Blusas', description: 'Blusas y camisas', subcategories: ['Blusas Casuales', 'Blusas Formales', 'Camisas', 'Tops'] },
    { name: 'Pantalones', description: 'Pantalones y jeans', subcategories: ['Jeans', 'Pantalones de Vestir', 'Pantalones Casuales', 'Leggings'] },
    { name: 'Faldas', description: 'Faldas de diferentes estilos', subcategories: ['Faldas Largas', 'Faldas Cortas', 'Faldas Midi', 'Faldas Plisadas'] },
    { name: 'Zapatos', description: 'Calzado en general', subcategories: ['Tacones', 'Zapatos Planos', 'Botas', 'Sandalias', 'Tenis'] },
    { name: 'Accesorios', description: 'Bolsos, carteras y accesorios', subcategories: ['Bolsos', 'Carteras', 'Cinturones', 'Joyería', 'Bufandas'] },
    { name: 'Ropa Interior', description: 'Ropa interior y lencería', subcategories: ['Sostenes', 'Panties', 'Lencería', 'Pijamas'] },
    { name: 'Deportiva', description: 'Ropa deportiva y casual', subcategories: ['Ropa de Gym', 'Ropa de Yoga', 'Ropa Casual', 'Sudaderas'] },
];

const seedCategories = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado a MongoDB');

        // Limpiar categorías existentes (opcional)
        // await Category.deleteMany({});
        // console.log('🗑️  Categorías anteriores eliminadas');

        // Verificar si ya existen categorías
        const existingCount = await Category.countDocuments();
        if (existingCount > 0) {
            console.log(`ℹ️  Ya existen ${existingCount} categorías en la base de datos`);
            console.log('⏭️  Saltando creación de categorías');
        } else {
            // Crear categorías
            const createdCategories = await Category.insertMany(categories);
            console.log(`✅ ${createdCategories.length} categorías creadas exitosamente`);
            createdCategories.forEach(cat => {
                console.log(`   - ${cat.name} (${cat.slug})`);
            });
        }

        await mongoose.connection.close();
        console.log('👋 Conexión cerrada');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

seedCategories();
