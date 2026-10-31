
const jwt = require('jsonwebtoken');

function authUser(req, res, next) {
    const token = req.cookies?.token;

    if (!token) {
        return res.status(401).json({
            message: 'Unauthorized access. No token provided'
        });
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        console.log('DECODED TOKEN:', decoded);

        // JWT se user ID set karo
        req.userId = decoded.userId;

        // Controller ke liye user object bhi set karo
        req.user = {
            _id: decoded.userId
        };

        next();

    } catch (error) {
        console.error('JWT Error:', error);

        return res.status(401).json({
            message: 'Invalid token'
        });
    }
}

module.exports = { authUser };
