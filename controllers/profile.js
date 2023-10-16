const firebase = require("../config/firebase");
const User = require('../models/User');
const Profile = require('../models/Profile');
const fetchUser = require("../middleware/fetchuser");
const logger = require('./logger');

const today = new Date();
const formattedDate = today.toISOString().split('T')[0];
// updateProfile
exports.updateProfile = async (req, res) => {
    const { authId, age, weight, gender, height } = req.body;

    // Use the upsert option to either update or insert the profile
    Profile.updateOne(
        { _id: authId }, // Find the profile with the specified _id
        { age, weight, gender, height }, // Update the profile with the new data
        { upsert: true } // Create a new profile if it doesn't exist
    ).then((User) => {
        console.log(User);
        return res.status(200).json({ message: "Profile updated" })
    }).catch(function (error) {
        // let errorCode = error.code;
        let errorMessage = error.message;
        logger.logToCloudWatch(formattedDate.toString(),`${errorMessage}`);

        console.log(errorMessage)

    })
};