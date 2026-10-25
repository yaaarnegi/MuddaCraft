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

  const orderData = req.body || {};
  const orderId = `MC-${Date.now().toString().slice(-6)}`;

  return res.status(200).json({
    success: true,
    orderId,
    message: 'Order received successfully. Sourced directly from A to Z Mudda House, Muzaffarnagar.',
    itemsCount: orderData.items?.length || 0,
    total: orderData.total || 0,
    paymentMethod: orderData.paymentMethod || 'UPI'
  });
}
