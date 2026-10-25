import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'store.json');
const PRODUCTS_DIR = path.join(__dirname, 'assets', 'products');

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

  // Checkout API
  if (pathname === '/api/checkout' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const orderData = JSON.parse(body || '{}');
        const orderId = 'MUDHA-' + Math.floor(100000 + Math.random() * 900000);
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
          <p>Looking for handcrafted traditional Mudhas? Return to our storefront.</p>
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
