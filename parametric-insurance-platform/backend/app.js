const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const workerRoutes = require('./routes/worker');
const policyRoutes = require('./routes/policies');
const claimRoutes = require('./routes/claims');
const disruptionRoutes = require('./routes/disruptions');
const adminRoutes = require('./routes/admin');
const authMiddleware = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/worker', authMiddleware, workerRoutes);
app.use('/api/policies', authMiddleware, policyRoutes);
app.use('/api/disruptions', authMiddleware, disruptionRoutes);
app.use('/api/claims', authMiddleware, claimRoutes);
app.use('/api/admin', authMiddleware, adminRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend started on http://localhost:${PORT}`);
});
