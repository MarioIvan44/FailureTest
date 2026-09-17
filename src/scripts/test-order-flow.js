import { randomUUID } from 'crypto';

const BASE_URL = 'http://localhost:5000/api';
const SESSION_ID = randomUUID();

async function run() {
    try {
        console.log('1. Fetching products...');
        const productsRes = await fetch(`${BASE_URL}/products`);
        if (!productsRes.ok) throw new Error(`Failed to fetch products: ${productsRes.statusText}`);
        const products = await productsRes.json();
        if (!products.products || !products.products.length) {
            // products endpoint might return { products: [], ... } or just [] depending on pagination.
            // Based on typical controller patterns often it's paginated.
            // Let's check if it's an array or object.
            if (Array.isArray(products) && products.length > 0) {
                // use products
            } else if (products.products && Array.isArray(products.products) && products.products.length > 0) {
                // use products.products
            } else {
                throw new Error('No products found to test with');
            }
        }

        const productList = Array.isArray(products) ? products : products.products;
        const productId = productList[0]._id;
        console.log(`   Found product: ${productId}`);

        console.log('2. Adding to cart...');
        const cartRes = await fetch(`${BASE_URL}/cart/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                productId,
                quantity: 2,
                sessionId: SESSION_ID
            })
        });
        const cart = await cartRes.json();
        const cartId = cart._id;
        console.log(`   Created cart: ${cartId}`);

        console.log('3. Creating order...');
        const customer = {
            fullName: 'John Doe',
            email: 'john@example.com',
            phone: '1234567890',
            address: '123 Main St',
            reference: 'Near the park',
            additionalInstructions: 'Leave at door'
        };

        const orderRes = await fetch(`${BASE_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                idCart: cartId,
                customer
            })
        });

        if (!orderRes.ok) {
            const err = await orderRes.text();
            throw new Error(`Failed to create order: ${err}`);
        }

        const order = await orderRes.json();
        console.log(`   Created order: ${order.orderNumber} (ID: ${order._id})`);
        console.log(`   Order total: ${order.total}`);

        console.log('4. Verifying order details...');
        const verifyRes = await fetch(`${BASE_URL}/orders/${order._id}`);
        const verifiedOrder = await verifyRes.json();
        // Check if idCart is populated or is just ID. Controller says populated.
        const linkedCartId = verifiedOrder.idCart._id || verifiedOrder.idCart;

        if (linkedCartId !== cartId) throw new Error(`Cart ID mismatch: expected ${cartId}, got ${linkedCartId}`);
        console.log('   Order details verified.');

        console.log('5. Updating order status...');
        const updateRes = await fetch(`${BASE_URL}/orders/${order._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'processing' })
        });
        const updatedOrder = await updateRes.json();
        if (updatedOrder.status !== 'processing') throw new Error('Status update failed');
        console.log('   Order status updated to processing.');

        console.log('SUCCESS: Order flow verified.');
    } catch (error) {
        console.error('FAILED:', error);
        process.exit(1);
    }
}

run();
