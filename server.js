import 'dotenv/config';
import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'store.json');
const PRODUCTS_DIR = path.join(__dirname, 'assets', 'products');

// Initialize Razorpay SDK instance using environment variables
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});

if (!fs.existsSync(PRODUCTS_DIR)) {
  fs.mkdirSync(PRODUCTS_DIR, { recursive: true });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

// Helper: load store data
function getStoreData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading store.json:', err);
    return { products: [] };
  }
}

// Helper: save store data
function saveStoreData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing store.json:', err);
    return false;
  }
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  let pathname = parsedUrl.pathname;

  // Set CORS headers for local development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // API Endpoints
  if (pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok', brand: 'MuddaCraft', supplier: 'A to Z Mudda House', timestamp: new Date() }));
  }

  if (pathname === '/api/store' && req.method === 'GET') {
    const data = getStoreData();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(data));
  }

  if (pathname === '/api/product' && req.method === 'GET') {
    const id = parsedUrl.searchParams.get('id');
    const store = getStoreData();
    const product = (store.products || []).find(p => p.id === id);
    if (product) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(product));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Product not found' }));
    }
  }

  // Upload image to assets/products
  if (pathname === '/api/admin/upload' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { filename, base64Data } = JSON.parse(body || '{}');
        if (!filename || !base64Data) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Filename and base64Data required' }));
        }

        // Clean filename and extract data
        const safeName = filename.toLowerCase().replace(/[^a-z0-9_.-]/g, '-');
        const uniqueName = `upload-${Date.now()}-${safeName}`;
        const targetPath = path.join(PRODUCTS_DIR, uniqueName);

        const dataBuffer = Buffer.from(base64Data.replace(/^data:image\/\w+;base64,/, ''), 'base64');
        fs.writeFileSync(targetPath, dataBuffer);

        const relativeUrl = `assets/products/${uniqueName}`;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, url: relativeUrl, filename: uniqueName }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Failed to process file upload' }));
      }
    });
    return;
  }

  // Add a new product
  if (pathname === '/api/admin/products' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const newProduct = JSON.parse(body || '{}');
        if (!newProduct.name || !newProduct.category) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Product name and category are required' }));
        }

        const store = getStoreData();
        const baseSlug = (newProduct.name || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const id = newProduct.id || `${baseSlug}-${Date.now().toString().slice(-4)}`;

        const productEntry = {
          id,
          name: newProduct.name,
          category: newProduct.category,
          filterCategory: newProduct.filterCategory || newProduct.category,
          price: newProduct.price !== undefined && newProduct.price !== null ? newProduct.price : null,
          priceDisplay: newProduct.price ? `₹${newProduct.price}` : 'Price on Request',
          priceConfirmed: !!newProduct.priceConfirmed,
          stock: newProduct.stock || 'available',
          availability: newProduct.availability || 'Subject to Supplier Confirmation',
          image: newProduct.image || 'assets/products/placeholder-cane.svg',
          images: newProduct.images || [newProduct.image || 'assets/products/placeholder-cane.svg'],
          supplier: newProduct.supplier || 'A to Z Mudda House, Muzaffarnagar, Uttar Pradesh',
          description: newProduct.description || 'Authentic traditional Indian craft.',
          specifications: newProduct.specifications || 'Specifications Coming Soon',
          featured: !!newProduct.featured,
          order: (store.products || []).length + 1
        };

        store.products.push(productEntry);
        saveStoreData(store);

        res.writeHead(201, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, product: productEntry }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Invalid product payload' }));
      }
    });
    return;
  }

  // Update existing product
  if (pathname === '/api/admin/products' && req.method === 'PUT') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const updated = JSON.parse(body || '{}');
        if (!updated.id) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Product ID required' }));
        }

        const store = getStoreData();
        const idx = store.products.findIndex(p => p.id === updated.id);
        if (idx === -1) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Product not found' }));
        }

        store.products[idx] = { ...store.products[idx], ...updated };
        // Recalculate priceDisplay
        if (store.products[idx].price) {
          store.products[idx].priceDisplay = `₹${store.products[idx].price}`;
          store.products[idx].priceConfirmed = true;
        } else {
          store.products[idx].priceDisplay = 'Price on Request';
          store.products[idx].priceConfirmed = false;
        }

        saveStoreData(store);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, product: store.products[idx] }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Invalid payload' }));
      }
    });
    return;
  }

  // Delete product
  if (pathname === '/api/admin/products' && req.method === 'DELETE') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { id } = JSON.parse(body || '{}');
        const store = getStoreData();
        store.products = (store.products || []).filter(p => p.id !== id);
        saveStoreData(store);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, id }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Failed to delete product' }));
      }
    });
    return;
  }

  // Reorder products
  if (pathname === '/api/admin/products/reorder' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { orderedIds } = JSON.parse(body || '{}');
        if (!Array.isArray(orderedIds)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'orderedIds array required' }));
        }

        const store = getStoreData();
        const productMap = new Map((store.products || []).map(p => [p.id, p]));
        const reordered = [];

        orderedIds.forEach((id, index) => {
          if (productMap.has(id)) {
            const p = productMap.get(id);
            p.order = index + 1;
            reordered.push(p);
            productMap.delete(id);
          }
        });

        // Append any remaining products
        productMap.forEach(p => reordered.push(p));
        store.products = reordered;
        saveStoreData(store);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, products: store.products }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Invalid reorder payload' }));
      }
    });
    return;
  }

  // Pincode calculation API
  if (pathname === '/api/pincode-check' && req.method === 'GET') {
    const pin = parsedUrl.searchParams.get('pincode') || '';
    if (!/^\d{6}$/.test(pin)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ valid: false, message: 'Please enter a valid 6-digit Indian PIN code' }));
    }

    const store = getStoreData();
    const prefix = pin.substring(0, 2);
    const isRemote = (store.shipping?.remotePrefixes || []).includes(prefix);
    
    let zone = 'North';
    let days = '3–5 business days';
    let shippingBase = store.shipping?.base || 250;
    
    if (['11', '12', '13', '20', '24', '25', '26', '27', '28'].includes(prefix)) {
      zone = 'Delhi NCR & Uttar Pradesh';
      days = '2–4 business days';
    } else if (['30', '31', '32', '33', '34', '14', '15', '16', '17', '18', '19'].includes(prefix)) {
      zone = 'North India (Punjab, Rajasthan, Haryana)';
      days = '4–5 business days';
    } else if (['36', '37', '38', '39', '40', '41', '42', '43', '44'].includes(prefix)) {
      zone = 'West India (Maharashtra & Gujarat)';
      days = '4–6 business days';
    } else if (['50', '51', '52', '53', '56', '57', '58', '59', '60', '61', '62', '63', '64'].includes(prefix)) {
      zone = 'South India (Karnataka, TN, Telangana, Kerala)';
      days = '5–7 business days';
    } else if (['70', '71', '72', '73', '74', '75', '76', '80', '81', '82', '83', '84', '85'].includes(prefix)) {
      zone = 'East & Central India (Bengal, Bihar, Odisha, MP)';
      days = '5–7 business days';
    } else if (isRemote || ['78', '79'].includes(prefix)) {
      zone = 'Northeast & Special Regions';
      days = '7–10 business days';
      shippingBase += (store.shipping?.remoteSurcharge || 200);
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      valid: true,
      pincode: pin,
      zone,
      estimatedDelivery: days,
      shippingRate: shippingBase,
      isRemote,
      carrier: 'Surface Furniture Express (Road Freight)'
    }));
  }

  // Razorpay: Get Public Key ID (never exposes secret)
  if (pathname === '/api/razorpay-key' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      keyId: process.env.RAZORPAY_KEY_ID || ''
    }));
  }

  // Razorpay: Step 1 - Create Order
  if (pathname === '/api/create-order' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const rawAmount = payload.amount;
        const amount = Number(rawAmount);
        const currency = (payload.currency || 'INR').toUpperCase();
        const receipt = payload.receipt || `rcpt_${Date.now().toString().slice(-8)}`;
        const notes = payload.notes || {};

        // Auth check: verify credentials are configured on server
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Razorpay API credentials not configured on server' }));
        }

        // Validate amount >= 100 paise (₹1 minimum per Razorpay specifications)
        if (!amount || isNaN(amount) || amount < 100) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Invalid amount. Minimum order amount is 100 paise (₹1.00)' }));
        }

        if (payload.simulate) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            success: true,
            order_id: `order_sim_${Date.now().toString().slice(-8)}`,
            amount: Math.round(amount),
            currency,
            key_id: process.env.RAZORPAY_KEY_ID || '',
            simulated: true
          }));
        }

        const orderOptions = {
          amount: Math.round(amount),
          currency,
          receipt,
          notes
        };

        const order = await razorpay.orders.create(orderOptions);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: true,
          order_id: order.id,
          amount: order.amount,
          currency: order.currency,
          key_id: process.env.RAZORPAY_KEY_ID
        }));
      } catch (err) {
        console.error('Razorpay Create Order Error:', err);
        // Distinguish auth failure (401) vs server error (500)
        const isAuthError = err?.statusCode === 401 || (err?.error?.code === 'BAD_REQUEST_ERROR' && (err?.error?.description || '').toLowerCase().includes('auth'));
        const statusCode = isAuthError ? 401 : 500;
        const errorMessage = isAuthError
          ? 'Razorpay Authentication failed: Key ID or Key Secret is invalid or expired in your Razorpay Dashboard. Please check or regenerate under Settings > API Keys.'
          : (err?.error?.description || err?.message || 'Failed to create Razorpay order');
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: errorMessage, isAuthError }));
      }
    });
    return;
  }

  // Razorpay: Step 3 - Verify Payment Signature
  if (pathname === '/api/verify-payment' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, customerData, items, total, simulated } = payload;

        if (!razorpay_order_id) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            error: 'Missing required field: razorpay_order_id is required'
          }));
        }

        // Handle simulated test payment verification
        if (simulated || razorpay_signature === 'simulated_test_signature' || (razorpay_order_id && razorpay_order_id.startsWith('order_sim_'))) {
          const orderId = 'MUDDA-' + Math.floor(100000 + Math.random() * 900000);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            success: true,
            message: 'Test payment simulated & verified successfully. Order confirmed.',
            orderId,
            razorpay_order_id,
            razorpay_payment_id: razorpay_payment_id || `pay_sim_${Date.now().toString().slice(-8)}`,
            total: total || 0,
            customerData: customerData || {},
            itemsCount: items?.length || 0,
            paidAt: new Date().toISOString(),
            simulated: true
          }));
        }

        // Validation: Missing fields
        if (!razorpay_payment_id || !razorpay_signature) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            error: 'Missing required fields: razorpay_order_id, razorpay_payment_id, and razorpay_signature are required'
          }));
        }

        if (!process.env.RAZORPAY_KEY_SECRET) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Razorpay secret key not configured on server' }));
        }

        // HMAC-SHA256 signature verification: order_id + "|" + payment_id
        const expectedSignature = crypto
          .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
          .update(`${razorpay_order_id}|${razorpay_payment_id}`)
          .digest('hex');

        // Timing-safe buffer comparison to prevent timing attacks
        let isSignatureValid = false;
        try {
          const expectedBuffer = Buffer.from(expectedSignature, 'utf-8');
          const receivedBuffer = Buffer.from(razorpay_signature, 'utf-8');
          if (expectedBuffer.length === receivedBuffer.length && crypto.timingSafeEqual(expectedBuffer, receivedBuffer)) {
            isSignatureValid = true;
          }
        } catch (cmpErr) {
          isSignatureValid = false;
        }

        if (!isSignatureValid) {
          // Signature mismatch: return 400, do NOT mark as paid
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            success: false,
            error: 'Payment verification failed: Signature mismatch. Order not marked as paid.'
          }));
        }

        // Signature verified successfully -> generate confirmed store order ID
        const orderId = 'MUDDA-' + Math.floor(100000 + Math.random() * 900000);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: true,
          message: 'Payment signature verified successfully. Order confirmed.',
          orderId,
          razorpay_order_id,
          razorpay_payment_id,
          total: total || 0,
          customerData: customerData || {},
          itemsCount: items?.length || 0,
          paidAt: new Date().toISOString()
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Invalid JSON payload for payment verification' }));
      }
    });
    return;
  }

  // Checkout API
  if (pathname === '/api/checkout' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const orderData = JSON.parse(body || '{}');
        const orderId = 'MUDDA-' + Math.floor(100000 + Math.random() * 900000);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          orderId,
          message: 'Order received successfully. Sourced directly from A to Z Mudda House, Muzaffarnagar.',
          itemsCount: orderData.items?.length || 0,
          total: orderData.total || 0,
          paymentMethod: orderData.paymentMethod || 'UPI',
          estimatedDelivery: orderData.deliveryEstimate || '4–7 business days',
          shippingAddress: orderData.shippingAddress || {}
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // Bulk Inquiry API (B2B)
  if (pathname === '/api/bulk-inquiry' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const inquiry = JSON.parse(body || '{}');
        const inquiryId = 'B2B-' + Math.floor(10000 + Math.random() * 90000);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          inquiryId,
          message: 'Thank you for your bulk inquiry. Our trade desk will share a custom commercial quote within 4 business hours.',
          data: inquiry
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // Transit Damage Claim API
  if (pathname === '/api/transit-damage' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const claim = JSON.parse(body || '{}');
        const claimId = 'CLM-' + Math.floor(10000 + Math.random() * 90000);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          claimId,
          message: 'Damage report received. Our verification team will review your photos and initiate replacement dispatch within 24 hours.',
          claim
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid claim payload' }));
      }
    });
    return;
  }

  // Default to index.html for root
  if (pathname === '/') {
    pathname = '/index.html';
  }

  const filePath = path.join(__dirname, pathname);

  // Security check to avoid directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('403 Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
      return res.end(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <title>404 - MuddaCraft</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #FBF8F3; color: #2B2118; text-align: center; padding: 60px 20px; }
            h1 { font-size: 2rem; margin-bottom: 12px; }
            p { color: #635345; margin-bottom: 24px; }
            a { display: inline-block; background: #9E6B38; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; }
          </style>
        </head>
        <body>
          <h1>Page Not Found</h1>
          <p>Looking for handcrafted traditional Muddas? Return to our storefront.</p>
          <a href="/">Return to Storefront</a>
        </body>
        </html>
      `);
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`🌿 MuddaCraft Store running at: http://localhost:${PORT}`);
  console.log(`📍 Sourced directly from A to Z Mudda House, Muzaffarnagar`);
});
