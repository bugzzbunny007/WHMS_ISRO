const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_REFRESH_SECRET } = process.env;

const fetchuser = async (req, res, next) => {
    try {
        // Get the token from the Authorization header
        const token = req.get('Authorization');
        if (!token) {
            return res.status(401).json({ error: 'Please authenticate using a valid token' });
        }

        // Determine the appropriate JWT secret based on the URL
        const jwtSecret = req.originalUrl.includes('refresh') ? JWT_REFRESH_SECRET : JWT_SECRET;

        // Verify the token and extract user data
        const decodedToken = await jwt.verify(token.split(' ')[1], jwtSecret);

        // Attach user data to the request object
        req.user = decodedToken.user;

        next();
    } catch (err) {
        console.error(err);

        if (err.name === 'TokenExpiredError') {
            return res.status(403).send('Token expired');
        } else {
            return res.status(401).json({ error: 'Invalid Token' });
        }
    }
};

module.exports = fetchuser;
