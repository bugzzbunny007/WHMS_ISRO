const firebase = require("../config/firebase");
const User = require('../models/User');
const Profile = require('../models/Profile');
const fetchUser = require("../middleware/fetchuser");
const logger = require('./logger');
const InitialUser = require('../models/InitialUser');
const today = new Date();
const formattedDate = today.toISOString().split('T')[0];

// getProfile
exports.sendAlert = async (req, res) => {

    req.body.alertJSON;

    try {

    } catch (err) {
        return res.status(500).json(err)
    };
};