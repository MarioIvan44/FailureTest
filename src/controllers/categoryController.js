import Category from '../models/Category.js';

export const createCategory = async (req, res, next) => {
  try {
    const { name, description, icon } = req.body;

    if (!name) {
      res.status(400);
      throw new Error('El nombre de la categoría es obligatorio');
    }

    // Generate slug to check existence case-insensitively
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const categoryExists = await Category.findOne({ slug });
    if (categoryExists) {
      res.status(400);
      throw new Error('La categoría ya existe (el nombre genera un slug duplicado)');
    }

    const category = await Category.create({
      name,
      slug,
      description,
      icon,
    });

    res.status(201).json(category);
  } catch (error) {
    // Handle duplicate key error specifically
    if (error.code === 11000) {
      res.status(400);
      const field = Object.keys(error.keyValue)[0];
      error.message = `El valor ingresado para ${field} ya existe`;
    }
    next(error);
  }
};

export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({}).sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      res.status(404);
      throw new Error('Categoría no encontrada');
    }

    await category.deleteOne();
    res.json({ message: 'Categoría eliminada' });
  } catch (error) {
    next(error);
  }
};

// GET /api/categories/slug/:slug - Obtener una categoría por slug
export const getCategoryBySlug = async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/categories/:id - Obtener una categoría por ID
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/categories/:id - Actualizar una categoría
export const updateCategory = async (req, res, next) => {
  try {
    const { name, description, featured, order, icon } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      res.status(404);
      throw new Error('Categoría no encontrada');
    }

    // Check if new name conflicts with existing category only if name changed
    if (name && name !== category.name) {
      // Generate slug for new name
      const slug = name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const slugExists = await Category.findOne({ slug });
      // Ensure we are not finding the current category itself (though slug should be unique)
      if (slugExists && slugExists._id.toString() !== req.params.id) {
        res.status(400);
        throw new Error('Ya existe una categoría con ese nombre');
      }
      category.name = name;
      category.slug = slug;
    }

    if (description !== undefined) category.description = description;
    if (featured !== undefined) category.featured = featured;
    if (order !== undefined) category.order = order;
    if (icon !== undefined) category.icon = icon;

    const updatedCategory = await category.save();
    res.json(updatedCategory);
  } catch (error) {
    next(error);
  }
};

// POST /api/categories/:id/subcategories - Agregar subcategoría
export const addSubcategory = async (req, res, next) => {
  try {
    const { name, items } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      res.status(404);
      throw new Error('Categoría no encontrada');
    }

    if (!name) {
      res.status(400);
      throw new Error('El nombre de la subcategoría es obligatorio');
    }

    // Check if subcategory already exists
    const subcategoryExists = category.subcategories.find(
      sub => sub.name.toLowerCase() === name.toLowerCase()
    );

    if (subcategoryExists) {
      res.status(400);
      throw new Error('La subcategoría ya existe en esta categoría');
    }

    // Generate slug for subcategory
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    category.subcategories.push({
      name,
      slug,
      items: items || []
    });

    const updatedCategory = await category.save();
    res.status(201).json(updatedCategory);
  } catch (error) {
    next(error);
  }
};

// PUT /api/categories/:id/subcategories/:subcategoryId - Actualizar subcategoría
export const updateSubcategory = async (req, res, next) => {
  try {
    const { name, items } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      res.status(404);
      throw new Error('Categoría no encontrada');
    }

    const subcategory = category.subcategories.id(req.params.subcategoryId);

    if (!subcategory) {
      res.status(404);
      throw new Error('Subcategoría no encontrada');
    }

    if (name) {
      // Check if new name conflicts with existing subcategory
      const nameExists = category.subcategories.find(
        sub => sub._id.toString() !== req.params.subcategoryId &&
          sub.name.toLowerCase() === name.toLowerCase()
      );

      if (nameExists) {
        res.status(400);
        throw new Error('Ya existe una subcategoría con ese nombre en esta categoría');
      }

      subcategory.name = name;
      // Update slug
      subcategory.slug = name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    if (items !== undefined) {
      subcategory.items = items;
    }

    const updatedCategory = await category.save();
    res.json(updatedCategory);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/categories/:id/subcategories/:subcategoryId - Eliminar subcategoría
export const deleteSubcategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      res.status(404);
      throw new Error('Categoría no encontrada');
    }

    const subcategory = category.subcategories.id(req.params.subcategoryId);

    if (!subcategory) {
      res.status(404);
      throw new Error('Subcategoría no encontrada');
    }

    subcategory.deleteOne();
    const updatedCategory = await category.save();

    res.json({ message: 'Subcategoría eliminada', category: updatedCategory });
  } catch (error) {
    next(error);
  }
};
