const firebase = require("../config/firebase");
const User = require('../models/User');
const Profile = require('../models/Profile');
const fetchUser = require("../middleware/fetchuser");
const logger = require('./logger');
const InitialUser = require('../models/InitialUser');
const today = new Date();
const formattedDate = today.toISOString().split('T')[0];

// updateProfile
exports.updateProfile = async (req, res) => {

    const uid = req.user.uid
    const { age, weight, gender, height } = req.body;
    console.log(req)
    console.log(req.body)
    // console.log(Datetime.now())
    // Use the upsert option to either update or insert the profile
    await Profile.updateOne(
        { _id: uid },
        {
            age,
            weight, gender, height
        },
        { upsert: true }
    )
        .then(async (User) => {
            console.log(User);

            // Update profile_exist to true in InitialUser schema
            await InitialUser.findOneAndUpdate(
                { _id: uid },
                { $set: { profile_exist: true } },
                { upsert: true }
            ).exec();

            return res.status(200).json({ message: "Profile updated" });
        })
        .catch(function (error) {
            let errorMessage = error.message;
            logger.logToCloudWatch(formattedDate.toString(), `${errorMessage}`);
            console.log(errorMessage);
        });
};

// getProfile
exports.getProfile = async (req, res) => {

    console.log(req.user)

    await Profile.findOne({ _id: req.user.user_id }).then((data) => {
        if (data) {
            return res.status(200).json(data)
        }
        else {
            return res.status(404).json({ message: "Profile Not Found" })
        }
    }).catch((err) => {
        return res.status(500).json(err)
    });
};