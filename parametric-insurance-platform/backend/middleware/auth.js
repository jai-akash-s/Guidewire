const jwt = require('jsonwebtoken');
const { db, mapWorker } = require('../db');
const JWT_SECRET = process.env.JWT_SECRET || 'secret_gigshield';

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token missing' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const row = db.prepare('SELECT * FROM workers WHERE id = ?').get(payload.workerId);
    const worker = mapWorker(row);
    if (!worker) return res.status(401).json({ error: 'Invalid worker' });
    req.worker = worker;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
module.exports = authMiddleware;
