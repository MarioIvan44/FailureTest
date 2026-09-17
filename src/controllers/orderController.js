import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Counter from '../models/Counter.js';
import { createNotification } from './notificationController.js';
import { sendCriticalStockAlert, sendOutOfStockAlert, sendOrderStatusUpdate } from '../services/emailService.js';
import Settings from '../models/Settings.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generateOrderNumber = async () => {
    const sequenceValue = await Counter.getNextSequence('orderNumber');
    // Format with 8 digits, zero-padded (e.g., 00000001, 00000002, etc.)
    return sequenceValue.toString().padStart(8, '0');
};

export const createOrder = async (req, res) => {
    try {
        const { customer, idCart, user, subtotal, shippingCost, total, deliveryMethod, pickupDetails } = req.body;

        if (!idCart && (!req.body.items || req.body.items.length === 0)) {
            return res.status(400).json({ message: 'Cart ID or Items are required' });
        }

        let cart = null;
        if (idCart) {
            cart = await Cart.findById(idCart);
            if (!cart) {
                return res.status(404).json({ message: 'Cart not found' });
            }
        }

        const orderNumber = await generateOrderNumber();

        // Snapshot items: prefer items from request (POS or direct), fallback to cart items
        let orderItems = [];
        if (req.body.items && Array.isArray(req.body.items) && req.body.items.length > 0) {
            orderItems = req.body.items;
        } else if (cart && cart.items) {
            // Fallback: map from cart items structure
            orderItems = cart.items.map(item => ({
                product: item.product,
                quantity: item.quantity,
                price: item.price,
                size: item.size,
                color: item.color
            }));
        }

        if (orderItems.length === 0) {
            return res.status(400).json({ message: 'Order must have items' });
        }

        // Check stock availability first
        for (const item of orderItems) {
            // item.product could be an ID string or an object with _id, handle both
            const productId = item.product._id || item.product;
            const product = await Product.findById(productId);

            if (!product) {
                return res.status(404).json({ message: `Product not found: ${productId}` });
            }

            // Check variant-specific stock if product has variants
            if (product.hasVariants && product.variants && product.variants.length > 0) {
                // Find the matching variant
                const variant = product.variants.find((v) => {
                    const sizeMatch = item.size ? v.size === item.size : v.size === null;
                    const colorMatch = item.color ? v.color === item.color : v.color === null;
                    return sizeMatch && colorMatch;
                });

                if (!variant) {
                    const variantDesc = [item.size, item.color].filter(Boolean).join(' - ');
                    return res.status(404).json({
                        message: `Variant not found for product: ${product.name}${variantDesc ? ` (${variantDesc})` : ''}`
                    });
                }

                if (variant.stock < item.quantity) {
                    const variantDesc = [item.size, item.color].filter(Boolean).join(' - ');
                    return res.status(400).json({
                        message: `Insufficient stock for ${product.name}${variantDesc ? ` (${variantDesc})` : ''}. Available: ${variant.stock}, Requested: ${item.quantity}`
                    });
                }
            } else {
                // Fallback to total stock for non-variant products
                if (product.stock < item.quantity) {
                    return res.status(400).json({
                        message: `Insufficient stock for product: ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`
                    });
                }
            }
        }

        // Process map screenshot if provided
        let processedCustomer = { ...customer };
        if (customer.location && customer.location.mapScreenshot) {
            try {
                // Create uploads directory if it doesn't exist
                const uploadsDir = path.join(__dirname, '../../uploads/map-screenshots');
                if (!fs.existsSync(uploadsDir)) {
                    fs.mkdirSync(uploadsDir, { recursive: true });
                }

                // Extract base64 data
                const base64Data = customer.location.mapScreenshot.replace(/^data:image\/\w+;base64,/, '');
                const buffer = Buffer.from(base64Data, 'base64');

                // Generate unique filename
                const filename = `map-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
                const filepath = path.join(uploadsDir, filename);

                // Save file
                fs.writeFileSync(filepath, buffer);

                // Update customer object with file path instead of base64
                processedCustomer = {
                    ...customer,
                    location: {
                        ...customer.location,
                        mapScreenshot: `/uploads/map-screenshots/${filename}`
                    }
                };

                console.log('📸 Map screenshot saved:', filename);
            } catch (error) {
                console.error('Error saving map screenshot:', error);
                // Continue without screenshot if there's an error
                processedCustomer = {
                    ...customer,
                    location: {
                        ...customer.location,
                        mapScreenshot: null
                    }
                };
            }
        }

        const order = new Order({
            orderNumber,
            customer: processedCustomer,
            idCart,
            items: orderItems, // Save the snapshot
            subtotal: subtotal || (cart ? cart.total : orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0)),
            shippingCost: shippingCost || 0,
            total: total || (cart ? cart.total : orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0)),
            user: user || null,
            status: deliveryMethod === 'pos' ? 'delivered' : 'pending',
            deliveryMethod: deliveryMethod || 'delivery',
            pickupDetails: pickupDetails || null,
        });

        const createdOrder = await order.save();

        // Deduct stock
        for (const item of orderItems) {
            const productId = item.product._id || item.product;

            const product = await Product.findById(productId);
            if (product) {
                // Handle variant-based stock deduction
                if (product.hasVariants && product.variants && product.variants.length > 0) {
                    // Find the matching variant
                    const variantIndex = product.variants.findIndex((v) => {
                        const sizeMatch = item.size ? v.size === item.size : v.size === null;
                        const colorMatch = item.color ? v.color === item.color : v.color === null;
                        return sizeMatch && colorMatch;
                    });

                    if (variantIndex !== -1) {
                        const newVariantStock = Math.max(0, product.variants[variantIndex].stock - item.quantity);
                        product.variants[variantIndex].stock = newVariantStock;

                        if (newVariantStock === 0 && !product.variants[variantIndex].stockZeroAt) {
                            product.variants[variantIndex].stockZeroAt = new Date();
                        } else if (newVariantStock > 0) {
                            product.variants[variantIndex].stockZeroAt = null;
                        }

                        await product.save();

                        // Check for low stock notification for this variant
                        if (newVariantStock <= 5 && newVariantStock > 0) {
                            const variantDesc = [item.size, item.color].filter(Boolean).join(' - ');
                            await createNotification({
                                type: 'low_stock',
                                message: `Stock bajo para ${product.name}${variantDesc ? ` (${variantDesc})` : ''}: ${newVariantStock} unidades`,
                                metadata: { productId: product._id, variantId: product.variants[variantIndex]._id }
                            });
                        }

                        // Send email alerts for critical stock
                        try {
                            const criticalStockSetting = await Settings.findOne({ key: 'fashion_inventory_critical_stock' });
                            const criticalStockLevel = criticalStockSetting?.value ? parseInt(criticalStockSetting.value) : 5;

                            if (newVariantStock === 0) {
                                await sendOutOfStockAlert(product);
                            } else if (newVariantStock > 0 && newVariantStock <= criticalStockLevel) {
                                await sendCriticalStockAlert(product, criticalStockLevel);
                            }
                        } catch (emailError) {
                            console.error('Error sending stock email:', emailError);
                        }
                    }
                } else {
                    // Fallback: deduct from total stock for non-variant products
                    const newStock = Math.max(0, product.stock - item.quantity);
                    product.stock = newStock;

                    if (newStock === 0 && !product.stockZeroAt) {
                        product.stockZeroAt = new Date();
                    } else if (newStock > 0) {
                        product.stockZeroAt = null;
                    }

                    await product.save();

                    if (product.stock <= 5) {
                        await createNotification({
                            type: 'low_stock',
                            message: `Stock bajo para producto: ${product.name} (${product.stock} unidades)`,
                            metadata: { productId: product._id }
                        });
                    }

                    // Check for critical stock and send email
                    try {
                        const criticalStockSetting = await Settings.findOne({ key: 'fashion_inventory_critical_stock' });
                        const criticalStockLevel = criticalStockSetting?.value ? parseInt(criticalStockSetting.value) : 5;

                        if (product.stock === 0) {
                            // Send out-of-stock alert
                            await sendOutOfStockAlert(product);
                        } else if (product.stock > 0 && product.stock <= criticalStockLevel) {
                            // Send critical stock alert
                            await sendCriticalStockAlert(product, criticalStockLevel);
                        }
                    } catch (emailError) {
                        console.error('Error sending stock email:', emailError);
                        // Don't fail the request if email fails
                    }
                }
            }
        }

        // Trigger Notification for Pickup
        if (deliveryMethod === 'pickup') {
            await createNotification({
                type: 'pickup_ready',
                message: `Nuevo pedido para retiro en tienda: ${orderNumber}`,
                metadata: { orderId: createdOrder._id }
            });
        }

        // Optionally clear the cart or mark it as converted? 
        // Plan said "The linked Cart document should not be modified or deleted". 
        // So distinct carts per session/order is implied.

        res.status(201).json(createdOrder);
    } catch (error) {
        console.error("Order creation error:", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation Error', error: error.message });
        }
        res.status(500).json({ message: 'Error creating order', error: error.message });
    }
};

export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('items.product')
            .populate({
                path: 'idCart',
                populate: {
                    path: 'items.product',
                    model: 'Product'
                }
            })
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching orders', error: error.message });
    }
};

export const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('items.product')
            .populate({
                path: 'idCart',
                populate: {
                    path: 'items.product',
                    model: 'Product'
                }
            });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching order', error: error.message });
    }
};

export const updateOrder = async (req, res) => {
    try {
        const { status, notifyCustomer } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        let statusChanged = false;
        if (status && order.status !== status) {
            order.status = status;
            statusChanged = true;
        }

        const updatedOrder = await order.save();
        res.json(updatedOrder);

        // Send email notification if status changed and notification is requested (default to true)
        const shouldNotify = notifyCustomer !== false;

        if (statusChanged && shouldNotify && updatedOrder.customer && updatedOrder.customer.email) {
            try {
                await sendOrderStatusUpdate(updatedOrder.customer.email, updatedOrder, status);
            } catch (emailError) {
                console.error("Error sending order status email:", emailError);
                // Don't fail the request since the update was successful
            }
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating order', error: error.message });
    }
};
