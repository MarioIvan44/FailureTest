import express from 'express';
import {
    createCategory,
    getCategories,
    deleteCategory,
    getCategoryById,
    getCategoryBySlug,
    updateCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory
} from '../controllers/categoryController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, createCategory)
    .get(getCategories);

router.route('/:id')
    .delete(protect, deleteCategory)
    .get(getCategoryById)
    .put(protect, updateCategory);

router.get('/slug/:slug', getCategoryBySlug);

// Subcategory routes
router.route('/:id/subcategories')
    .post(protect, addSubcategory);

router.route('/:id/subcategories/:subcategoryId')
    .put(protect, updateSubcategory)
    .delete(protect, deleteSubcategory);

export default router;
