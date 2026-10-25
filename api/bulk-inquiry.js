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

  const inquiry = req.body || {};
  const inquiryId = `INQ-${Date.now().toString().slice(-6)}`;

  return res.status(200).json({
    success: true,
    inquiryId,
    message: 'Thank you for your bulk inquiry. Our trade desk will share a custom commercial quote within 4 business hours.',
    data: inquiry
  });
}
