const jwt = require('jsonwebtoken');
const { workers } = require('../data');
const JWT_SECRET = process.env.JWT_SECRET || 'secret_gigshield';

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token missing' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const worker = workers.find(w => w.id === payload.workerId);
    if (!worker) return res.status(401).json({ error: 'Invalid worker' });
    req.worker = worker;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
module.exports = authMiddleware;
