const firebase = require("../config/firebase");
const User = require('../models/User');
const Profile = require('../models/Profile');

// updateProfile
exports.updateProfile = async (req, res) => {
    const { authId, age, weight, gender, height } = req.body;

    // Use the upsert option to either update or insert the profile
    Profile.updateOne(
        { _id: authId }, // Find the profile with the specified _id
        { age, weight, gender, height }, // Update the profile with the new data
        { upsert: true } // Create a new profile if it doesn't exist
    ).then(() => {
        return res.status(200).json({ message: "Profile updated" })
    })


};
