const express = require('express');
const router = express.Router();
const {auth} = require('../middleware/auth')
const { register, login, googleLogin, forgePassword, verifyOtp, resetPassword, updateUserRole, googleSignup, refresh, logout, logoutAll, getProfile, updateProfile } = require('../controllers/authController');
const { User } = require('../models');
const jwt = require('jsonwebtoken');
require('dotenv').config();


const { generateAccessToken, generateRefreshToken } = require('../utils/token');
const isAdmin = require('../middleware/isAdmin');
const passport = require('../config/passport');

router.post('/register', register);
router.post('/login', login);
// get or update profile
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.post('/refresh-token', refresh);
router.post('/logout', logout);
router.post('/logout-all', auth, logoutAll);
// router.get('/google', 
//     passport.authenticate('google', { scope: ['profile', 'email'] })
//   );
// router.get(
//     '/google/callback',
//     passport.authenticate('google', { 
//       failureRedirect: '/login',
//       successRedirect: '/dashboard'
//     })
//   );
// router.get('/logout', (req, res) => {
//     req.logout((err) => {
//       if (err) {
//         return res.status(500).json({ error: 'Error during logout' });
//       }
//       res.redirect('/');
//     });
//   });
// router.get('/', (req, res) => {
//     res.send(`
//       <h1>Welcome to Google OAuth Example</h1>
//       ${req.user 
//         ? `<p>Logged in as: ${req.user.email}</p><a href="/logout">Logout</a>` 
//         : `<a href="/auth/google">Login with Google</a>`
//       }
//     `);
//   });
// router.get('/login', (req, res) => {
//     res.send(`
//       <h1>Login</h1>
//       <a href="/auth/google">Login with Google</a>
//     `);
//   });
// router.post('/google/signup', googleSignup); 
// router.post('/google/login', googleLogin);
router.post('/forget-password', forgePassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);
router.put('/update-role', auth, isAdmin, updateUserRole);

// development helper: list users (admins only)
router.get('/all-users', auth, isAdmin, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'email', 'name', 'role', 'isGoogleAuth', 'googleId'],
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



module.exports = router;    