import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

// Helper para obtener o crear carrito
const getOrCreateCart = async (userId, sessionId) => {
  let cart = await Cart.findOne(
    userId ? { user: userId } : { sessionId }
  ).populate('items.product');

  if (!cart) {
    cart = new Cart(userId ? { user: userId } : { sessionId });
    await cart.save();
  }

  return cart;
};

// GET /api/cart - Obtener carrito
export const getCart = async (req, res) => {
  try {
    const { userId, sessionId } = req.query;
    const cart = await getOrCreateCart(userId, sessionId);
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/cart/add - Agregar producto al carrito
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, size, color, userId, sessionId } =
      req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    let cart = await getOrCreateCart(userId, sessionId);

    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.product &&
        (item.product._id || item.product).toString() === productId &&
        item.size === size &&
        item.color === color
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({
        product: productId,
        quantity,
        size,
        color,
        price: product.price,
      });
    }

    cart.total = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    await cart.save();
    await cart.populate('items.product');

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/cart/update/:itemId - Actualizar cantidad de un item
export const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const { userId, sessionId } = req.query;

    const cart = await getOrCreateCart(userId, sessionId);
    const item = cart.items.id(req.params.itemId);

    if (!item) {
      return res.status(404).json({ message: 'Item no encontrado' });
    }

    item.quantity = quantity;
    cart.total = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    await cart.save();
    await cart.populate('items.product');

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/cart/remove/:itemId - Eliminar item del carrito
export const removeFromCart = async (req, res) => {
  try {
    const { userId, sessionId } = req.query;

    const cart = await getOrCreateCart(userId, sessionId);
    cart.items.pull(req.params.itemId);
    cart.total = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    await cart.save();
    await cart.populate('items.product');

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/cart/clear - Limpiar carrito
export const clearCart = async (req, res) => {
  try {
    const { userId, sessionId } = req.query;

    const cart = await getOrCreateCart(userId, sessionId);
    cart.items = [];
    cart.total = 0;

    await cart.save();
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

