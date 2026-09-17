import express from 'express';
import * as cartController from '../controllers/cartController.js';

const router = express.Router();

// GET /api/cart - Obtener carrito
router.get('/', cartController.getCart);

// POST /api/cart/add - Agregar producto al carrito
router.post('/add', cartController.addToCart);

// PUT /api/cart/update/:itemId - Actualizar cantidad de un item
router.put('/update/:itemId', cartController.updateCartItem);

// DELETE /api/cart/remove/:itemId - Eliminar item del carrito
router.delete('/remove/:itemId', cartController.removeFromCart);

// DELETE /api/cart/clear - Limpiar carrito
router.delete('/clear', cartController.clearCart);

export default router;

