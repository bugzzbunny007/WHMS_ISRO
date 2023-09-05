const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const { JWT_SECRET, JWT_REFRESH_SECRET } = process.env;

const generateOTP = () => {
    let otp = '';
    for (let i = 0; i < 6; i++) {
        const randomVal = Math.floor(Math.random() * 10); // Use Math.floor to ensure integers from 0 to 9
        otp += randomVal;
    }
    return otp;
};

const getTokens = (id, RefreshFlag) => {
    const data = {
        user: {
            id: id,
        },
    };
    const authToken = jwt.sign(data, JWT_SECRET, { expiresIn: '30m' });
    const refreshToken = RefreshFlag ? '' : jwt.sign(data, JWT_REFRESH_SECRET, { expiresIn: '3600m' });
    return { authToken, refreshToken };
};

module.exports = { generateOTP, getTokens };
