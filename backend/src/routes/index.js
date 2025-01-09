const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const policyRoutes = require('./policyRoutes');

// Test route
router.get('/ping', (req, res) => {
  res.json({ message: 'Pong' });
});

router.use('/auth', authRoutes);
router.use('/policies', policyRoutes);

module.exports = router;

