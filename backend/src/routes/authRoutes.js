const express = require('express');
const { 
  googleLogin,
  userPasswordLogin,
  checkUser,
  checkNickname,
  register,
  confirmEmail,
  requestPasswordReset,
  validateResetToken,
  resetPassword,
  me
} = require('../controllers/authController');
const authenticateToken = require('../middlewares/authenticateToken');

const router = express.Router();

// Register and login related
router.post('/check-user', checkUser);
router.post('/check-nickname', checkNickname);
router.post('/register', register);
router.post('/google-login', googleLogin);
router.post('/login', userPasswordLogin);
router.post('/confirm-email', confirmEmail);
router.post('/request-password-reset', requestPasswordReset);
router.post('/validate-reset-token', validateResetToken);
router.post('/reset-password', resetPassword);

// Protected
router.get('/me', authenticateToken, me);

module.exports = router;
