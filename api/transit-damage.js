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

  const claim = req.body || {};
  const ticketId = `DMG-${Date.now().toString().slice(-6)}`;

  return res.status(200).json({
    success: true,
    ticketId,
    message: 'Transit replacement claim submitted. Our team will verify and dispatch within 24 hours.',
    data: { orderId: claim.orderId, item: claim.item }
  });
}
