const jwt = require('jsonwebtoken')

exports.generateAccessToken = (user) =>{
    // Admin sessions last 1 day, regular users 2 hours
    const expiresIn = user.role === 'admin' ? '1d' : '2h';
    return jwt.sign(
        {id: user.id, email: user.email, role: user.role},
        process.env.JWT_SECRET,
        {expiresIn}
    );

};

exports.generateRefreshToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '30d' }
    );
};

exports.getCookieOptions = (maxAgeMs) => {
    const isProd = process.env.NODE_ENV === 'production';
    return {
        httpOnly: true,
        // only set secure flag in production or when explicitly requested
        secure: isProd && String(process.env.COOKIE_SECURE || 'true').toLowerCase() === 'true',
        sameSite: 'lax', // Changed from 'strict' to 'lax' for OAuth compatibility
        path: '/',
        maxAge: maxAgeMs
    };
};

