const express = require('express');
const { 
  getLatestPolicies, 
  getPolicyByTypeAndVersion
} = require('../controllers/policiesController');

const router = express.Router();

router.get('/latest', getLatestPolicies);
router.get('/:type/:version',getPolicyByTypeAndVersion);


module.exports = router;
