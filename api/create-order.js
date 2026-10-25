import Razorpay from 'razorpay';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_live_TsDk75vQP2YBgw';
  const key_secret = process.env.RAZORPAY_KEY_SECRET || '7HQNh2u8ZzBIoBiLDzhxEJmz';

  try {
    const payload = req.body || {};
    const rawAmount = payload.amount;
    const amount = Number(rawAmount);
    const currency = (payload.currency || 'INR').toUpperCase();
    const receipt = payload.receipt || `rcpt_${Date.now().toString().slice(-8)}`;
    const notes = payload.notes || {};
    const simulate = !!payload.simulate;

    if (!amount || isNaN(amount) || amount < 100) {
      return res.status(400).json({ error: 'Invalid amount. Minimum order amount is 100 paise (₹1.00)' });
    }

    // Demo/Simulated test order support
    if (simulate) {
      return res.status(200).json({
        success: true,
        order_id: `order_sim_${Date.now().toString().slice(-8)}`,
        amount: Math.round(amount),
        currency,
        key_id,
        simulated: true
      });
    }

    if (!key_id || !key_secret) {
      return res.status(401).json({
        error: 'Razorpay API credentials not configured on server',
        isAuthError: true
      });
    }

    const razorpay = new Razorpay({
      key_id,
      key_secret
    });

    const orderOptions = {
      amount: Math.round(amount),
      currency,
      receipt,
      notes
    };

    const order = await razorpay.orders.create(orderOptions);

    return res.status(200).json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id
    });
  } catch (err) {
    console.error('Razorpay Create Order Error:', err);
    const isAuthError = err?.statusCode === 401 || (err?.error?.code === 'BAD_REQUEST_ERROR' && (err?.error?.description || '').toLowerCase().includes('auth'));
    const statusCode = isAuthError ? 401 : 500;
    const errorMessage = isAuthError
      ? 'Razorpay Authentication failed: Key ID or Key Secret is invalid or expired in your Razorpay Dashboard. Please check or regenerate under Settings > API Keys.'
      : (err?.error?.description || err?.message || 'Failed to create Razorpay order');

    return res.status(statusCode).json({
      error: errorMessage,
      isAuthError
    });
  }
}
