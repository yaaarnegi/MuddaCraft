import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'store.json');

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
    return {};
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // API Endpoints
  if (pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok', brand: 'MudhaCraft', timestamp: new Date() }));
  }

  if (pathname === '/api/store' && req.method === 'GET') {
    const data = getStoreData();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(data));
  }

  if (pathname === '/api/admin/store' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const update = JSON.parse(body || '{}');
        const current = getStoreData();
        const merged = { ...current, ...update };
        const saved = saveStoreData(merged);
        if (saved) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Store settings updated successfully', data: merged }));
        } else {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to write store.json' }));
        }
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid payload' }));
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
    
    // Zone heuristics based on Indian postal circles (UP origin is Zone 2)
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
          message: 'Order received successfully. Sourced directly from our Muzaffarnagar maker cluster.',
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
          message: 'Thank you for your bulk inquiry. Our Muzaffarnagar trade desk will share a custom commercial quote within 4 business hours.',
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
          <title>404 - MudhaCraft</title>
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
  console.log(`🌿 MudhaCraft Store running at: http://localhost:${PORT}`);
});
