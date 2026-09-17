import express from 'express';
import { body, validationResult } from 'express-validator';
import * as userController from '../controllers/userController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { getCurrentUser } from '../controllers/authController.js';

const router = express.Router();

// POST /api/users/register - Registrar nuevo usuario
router.post(
  '/register',
  [
    body('firstName').notEmpty().withMessage('El nombre es requerido'),
    body('lastName').notEmpty().withMessage('El apellido es requerido'),
    body('email').isEmail().withMessage('Email inválido'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('La contraseña debe tener al menos 6 caracteres'),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  userController.registerUser
);

// POST /api/users/verify - Verificar cuenta
router.post('/verify', userController.verifyAccount);

// GET /api/users - Obtener todos los usuarios (Admin) - Protected
import { admin } from '../middlewares/authMiddleware.js';
router.get('/', protect, admin, userController.getAllUsers);

// POST /api/users/login - Iniciar sesión
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('La contraseña es requerida'),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  userController.loginUser
);

// POST /api/users/wishlist - Toggle wishlist item
router.post('/wishlist', protect, userController.toggleWishlist);

// GET /api/users/wishlist - Get wishlist
router.get('/wishlist', protect, userController.getWishlist);

// GET /api/users/profile - Get current user profile
router.get('/profile', protect, userController.getProfile);
router.put('/profile', protect, userController.updateProfile);

export default router;

