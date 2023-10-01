const firebase = require("../config/firebase");
const User = require('../models/User');
const Profile = require('../models/Profile');
const fetchUser = require("../middleware/fetchuser");


// updateProfile
exports.updateProfile = async (req, res) => {
    const { age, weight, gender, height } = req.body;
    console.log({ age, weight, gender, height })
    // Use the upsert option to either update or insert the profile
    Profile.findOneAndUpdate(

        { _id: req.user.user_id }, // Find the profile with the specified _id
        { $set: { age, weight, gender, height } }, // Update the profile with the new data
        { upsert: true, new: true } // Create a new profile if it doesn't exist and return the updated document
    )
        .then((user) => {
            if (user) {
                console.log(user);
                return res.status(200).json({ message: "Profile updated" });
            } else {
                // The profile did not exist and was created
                return res.status(201).json({ message: "Profile created" });
            }
        })
        .catch((error) => {
            let errorMessage = error.message;
            console.log(errorMessage);
            // Handle the error appropriately and return an error response
            return res.status(500).json({ error: errorMessage });
        });

};


// getProfile
exports.getProfile = async (req, res) => {

    console.log(req.user)
    // Use the upsert option to either update or insert the profile
    // Profile.updateOne(
    //     { _id: authId }, // Find the profile with the specified _id
    //     { age, weight, gender, height }, // Update the profile with the new data
    //     { upsert: true } // Create a new profile if it doesn't exist
    // ).then((User) => {
    //     console.log(User);
    //     return res.status(200).json({ message: "Profile updated" })
    // }).catch(function (error) {
    //     // let errorCode = error.code;
    //     let errorMessage = error.message;

    //     console.log(errorMessage)
    // })
    const ProfileData = await Profile.findOne({ _id: req.user.user_id }).then((data) => {
        if (data) {
            return res.status(200).json(data)
        }
        else {
            return res.status(404).json({ message: "Profile Not Found" })
        }
    }).catch((err) => {
        return res.status(500).json(err)
    })
};