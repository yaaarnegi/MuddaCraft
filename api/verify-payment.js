import crypto from 'crypto';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  try {
    const payload = req.body || {};
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, customerData, items, total, simulated } = payload;

    if (!razorpay_order_id) {
      return res.status(400).json({
        error: 'Missing required field: razorpay_order_id is required'
      });
    }

    // Handle simulated test payment verification
    if (simulated || razorpay_signature === 'simulated_test_signature' || (razorpay_order_id && razorpay_order_id.startsWith('order_sim_'))) {
      const orderId = 'MUDDA-' + Math.floor(100000 + Math.random() * 900000);
      return res.status(200).json({
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
      });
    }

    if (!razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        error: 'Missing required fields: razorpay_payment_id and razorpay_signature are required'
      });
    }

    if (!key_secret) {
      return res.status(500).json({ error: 'Razorpay secret key not configured on server' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', key_secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

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
      return res.status(400).json({
        success: false,
        error: 'Payment verification failed: Signature mismatch. Order not marked as paid.'
      });
    }

    const orderId = 'MUDDA-' + Math.floor(100000 + Math.random() * 900000);

    return res.status(200).json({
      success: true,
      message: 'Payment signature verified successfully. Order confirmed.',
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      total: total || 0,
      customerData: customerData || {},
      itemsCount: items?.length || 0,
      paidAt: new Date().toISOString()
    });
  } catch (err) {
    return res.status(400).json({ error: 'Invalid JSON payload for payment verification' });
  }
}
