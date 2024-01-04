// middleware/fetchuser.js

const admin = require("firebase-admin");
const logger = require('../controllers/logger');


const today = new Date();
const formattedDate = today.toISOString().split('T')[0];

// Middleware to fetch the user from Firebase
const fetchUser = (req, res, next) => {
    // console.log(req.get('Authorization'))
    // Get the user's ID token from the request headers or wherever it's stored
    const idToken = req.get('Authorization');
    // console.log(idToken)
    if (!idToken) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    admin
        .auth()
        .verifyIdToken(idToken.split(" ")[1])
        .then((decodedToken) => {
            // Add the user object to the request for use in controllers
            req.user = decodedToken;
            next();
        })
        .catch((error) => {
            console.error(error)
            logger.logToCloudWatch(formattedDate.toString(), `Issue in fetchuser: ${error}`);
            return res.status(500).json({ error: "Internal Server Error" });
        });
};

module.exports = fetchUser;
