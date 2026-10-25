import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const filePath = path.join(process.cwd(), 'data', 'store.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    return res.status(200).send(data);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to read store data', details: err.message });
  }
}
