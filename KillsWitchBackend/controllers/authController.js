const { User, passwordReset, ActivityLog, Session } = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');
const { generateAccessToken, generateRefreshToken, getCookieOptions } = require("../utils/token");
const { OAuth2Client } = require("google-auth-library");
const { sendEmail } = require("../utils/email");
const { otpEmailTemplate } = require("../utils/emailTemplates");
const { where } = require("sequelize");
const { generateState, generateCodeVerifier, Google } = require("arctic");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function parseUa(req) {
  return (req.headers['user-agent'] || '').slice(0, 512);
}

exports.register = async (req, res) => {
  const { email, password, name, phoneno } = req.body;
  try {
    const exit = await User.findOne({ where: { email } });
    if (exit) {
      return res.status(400).json({ message: "Email already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      phoneno,
    });
    // Issue tokens & session
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await Session.create({
      userId: user.id,
      tokenHash,
      userAgent: parseUa(req),
      ipAddress: req.ip,
      expiresAt
    });

    // Admin sessions last 1 day, regular users 7 days (extended persistence)
    const accessTokenDuration = user.role === 'admin' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
    
    res
      .cookie('access_token', accessToken, getCookieOptions(accessTokenDuration))
      .cookie('refresh_token', refreshToken, getCookieOptions(30 * 24 * 60 * 60 * 1000))
      .status(201)
      .json({ message: "User Register", user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    const activitylog = await ActivityLog.create({
      user_email: user.email,
      activity: "User Created",
      details: {
        user_name: user.name,
        user_phoneno: user.phoneno,
        email: user.email,
        timestamp: new Date(),
      },
    });
    console.log(activitylog);
    // optional: admin notification can be implemented via utils/email
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await Session.create({
      userId: user.id,
      tokenHash,
      userAgent: parseUa(req),
      ipAddress: req.ip,
      expiresAt
    });

    // Admin sessions last 1 day, regular users 7 days (extended persistence)
    const accessTokenDuration = user.role === 'admin' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
    
    res
      .cookie('access_token', accessToken, getCookieOptions(accessTokenDuration))
      .cookie('refresh_token', refreshToken, getCookieOptions(30 * 24 * 60 * 60 * 1000))
      .json({ accessToken, refreshToken });
    await ActivityLog.create({
      user_email: user.email,
      activity: "User Login",
      details: {
        user_name: user.name,
        email: user.email,
        timestamp: new Date(),
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Login error' });
  }
};

// exports.googleLogin = async (req, res) => {
//   const { tokenId } = req.body;

//   try {
//     const ticket = await client.verifyIdToken({
//       idToken: tokenId,
//       audience: process.env.GOOGLE_CLIENT_ID,
//     });

//     const { email, sub: googleId } = ticket.getPayload();

//     const user = await User.findOne({
//       where: {
//         [Op.or]: [
//           { email },
//           { googleId }
//         ]
//       }
//     });

//     if (user && !user.isGoogleAuth) {
//       return res.status(403).json({
//         error: 'Email registered with password. Use email login instead.'
//       });
//     }

//     if (!user) {
//       const { name } = ticket.getPayload();
//       const newUser = await User.create({
//         email,
//         googleId,
//         name,
//         isGoogleAuth: true,
//         password: null
//       });
//       return res.status(201).json({ newUser});
//     }

//     const accessToken = generateAccessToken(user);
//     console.log(accessToken);

//   } catch (err) {
//     res.status(401).json({ error: err.message });
//   }
// };
exports.googleSignup = async (req, res) => {
  const { tokenId } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: tokenId,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email, sub: googleId, name } = ticket.getPayload();

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        error: "Email already registered. Try logging in instead.",
      });
    }

    const newUser = await User.create({
      email,
      googleId,
      name,
      isGoogleAuth: true,
      password: null,
    });

    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await Session.create({ userId: newUser.id, tokenHash, userAgent: parseUa(req), ipAddress: req.ip, expiresAt });

    res
      .cookie('access_token', accessToken, getCookieOptions(15 * 60 * 1000))
      .cookie('refresh_token', refreshToken, getCookieOptions(30 * 24 * 60 * 60 * 1000))
      .redirect(`${process.env.WEB_ORIGIN}?token=${accessToken}`);
  } catch (err) {
    res.status(500).json({
      error: "Google signup failed",
      details: err.message,
    });
  }
};

// Refresh access & refresh tokens with rotation
exports.refresh = async (req, res) => {
  try {
    const provided = (req.body && req.body.refreshToken) || (req.cookies && req.cookies.refresh_token);
    if (!provided) return res.status(401).json({ error: 'Refresh token required' });

    const payload = jwt.verify(provided, process.env.REFRESH_TOKEN_SECRET);
    const tokenHash = hashToken(provided);

    const session = await Session.findOne({ where: { userId: payload.id, tokenHash, revokedAt: null } });
    if (!session) return res.status(403).json({ error: 'Invalid session' });
    if (new Date(session.expiresAt) < new Date()) return res.status(403).json({ error: 'Session expired' });

    // Rotate: revoke old, create new
    session.revokedAt = new Date();
    await session.save();

    const user = await User.findByPk(payload.id);
    const newAccess = generateAccessToken(user);
    const newRefresh = generateRefreshToken(user);
    const newHash = hashToken(newRefresh);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await Session.create({ userId: user.id, tokenHash: newHash, userAgent: parseUa(req), ipAddress: req.ip, expiresAt });

    return res
      .cookie('access_token', newAccess, getCookieOptions(15 * 60 * 1000))
      .cookie('refresh_token', newRefresh, getCookieOptions(30 * 24 * 60 * 60 * 1000))
      .json({ accessToken: newAccess, refreshToken: newRefresh });
  } catch (err) {
    return res.status(403).json({ error: err.message });
  }
};

// Logout current session
exports.logout = async (req, res) => {
  try {
    const provided = (req.body && req.body.refreshToken) || (req.cookies && req.cookies.refresh_token);
    if (!provided) return res.status(200).clearCookie('access_token').clearCookie('refresh_token').json({ success: true });

    const tokenHash = hashToken(provided);
    await Session.update({ revokedAt: new Date() }, { where: { tokenHash } });
    return res
      .clearCookie('access_token')
      .clearCookie('refresh_token')
      .json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Logout all sessions for user
exports.logoutAll = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    await Session.update({ revokedAt: new Date() }, { where: { userId, revokedAt: null } });
    return res.clearCookie('access_token').clearCookie('refresh_token').json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
exports.forgePassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ err: " User Not Found" });
    }

    const otp = Math.floor(10000 + Math.random() * 90000);
    const ExpireAt = new Date(Date.now() + 10 * 60 * 1000);
    console.log({
      email,
      otp: otp,
      otpType: typeof otp.toString(),
      expireAt: ExpireAt,
    });

    await passwordReset.create({
      email,
      otp: otp.toString(),
      expireAt: ExpireAt,
    });
    const fromAddress =
      process.env.SMTP_FROM ||
      process.env.EMAIL_FROM ||
      process.env.email_from ||
      process.env.SMTP_USER ||
      process.env.EMAIL_USER ||
      process.env.email_user;

    const { subject, html } = otpEmailTemplate({ otp, appName: "Killswitch", validityMinutes: 10 });

    await sendEmail(fromAddress, email, subject, html);
    res.json({
      message: "OTP sent to  email",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const record = await passwordReset.findOne({
      where: { email, otp },
      order: [["createdAt", "DESC"]],
    });
    if (!otp) {
      return res.status(404).json({ err: " OTP Not Found" });
    }
    if (!record || new Date() > record.expireAt) {
      return res.status(400).json({ error: " OTP  Expired" });
    }
    if (record.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }
    res.status(200).json({ message: "OTP Verified" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.resetPassword = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ err: " User Not Found" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();
    await passwordReset.destroy({ where: { email: email } });
    res.json({ message: "Password Reset Successfully" });
    await ActivityLog.create({
      user_email: user.email,
      activity: "Password Reset",
      details: {
        user: user.email,
        timestamp: new Date(),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// return profile with additional fields read from database
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id','email','name','phoneno','role','sameShippingBillingDefault']
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// allow logged in user to update their own name/email/phone
exports.updateProfile = async (req, res) => {
  const { name, email, phoneno, password, sameShippingBillingDefault } = req.body;
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (phoneno !== undefined) user.phoneno = phoneno;
    if (sameShippingBillingDefault !== undefined) user.sameShippingBillingDefault = sameShippingBillingDefault;
    if (password) {
      const bcrypt = require('bcrypt');
      user.password = await bcrypt.hash(password, 10);
    }
    await user.save();
    return res.json({ success: true, user: { id: user.id, email: user.email, name: user.name, phoneno: user.phoneno, role: user.role, sameShippingBillingDefault: user.sameShippingBillingDefault } });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.updateUserRole = async (req, res) => {
  const { email, newRole } = req.body;

  if (!email || !newRole) {
    return res.status(400).json({ message: "Email and newRole are required" });
  }

  // only allow the two roles we support
  const allowedRoles = ["admin", "user"];
  if (!allowedRoles.includes(newRole)) {
    return res.status(400).json({ message: "Invalid role specified" });
  }

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.role = newRole;
    await user.save();

    return res.json({
      success: true,
      message: `User role updated to '${newRole}' successfully.`,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    return res
      .status(500)
      .json({
        success: false,
        message: "Internal server error",
        error: err.message,
      });
  }
};
// exports.getGoogleLoginPage = async(req,res)=>{
//   if(req.user) return res.redirect("/");
//   const state = generateState();
//   const codeVerifier = generateCodeVerifier();
//   const url = google.createAuthorizationURL(state, codeVerifier, [
//     "openid",
//     "profile",
//     "email",

//   ])
// }
