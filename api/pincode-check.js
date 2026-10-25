export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const pin = req.query.pincode || '';
  if (!pin || !/^\d{6}$/.test(pin)) {
    return res.status(400).json({ valid: false, message: 'Please enter a valid 6-digit Indian PIN code' });
  }

  const prefix = pin.substring(0, 2);
  let zone = 'North';
  let days = '3–5 business days';
  let shippingBase = 250;

  if (['11', '12', '13', '20', '24', '25'].includes(prefix)) {
    zone = 'Local & NCR (Direct Maker Cluster)';
    days = '2–3 business days';
    shippingBase = 150;
  } else if (['40', '41', '56', '50', '60'].includes(prefix)) {
    zone = 'Metro South/West';
    days = '4–6 business days';
    shippingBase = 350;
  } else if (['78', '79', '19'].includes(prefix)) {
    zone = 'Special Transit (Hills / NE)';
    days = '7–10 business days';
    shippingBase = 500;
  }

  return res.status(200).json({
    valid: true,
    pincode: pin,
    zone,
    estimatedDays: days,
    shippingFee: shippingBase,
    courier: 'Surface Express Cargo (Heavy/Bulky Craft Carrier)'
  });
}
