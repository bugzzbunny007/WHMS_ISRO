const firebase = require("../config/firebase");
const User = require('../models/User');
const Environment = require('../models/Environment');
const fetchUser = require("../middleware/fetchuser");
const logger = require('./logger');

const today = new Date();
const formattedDate = today.toISOString().split('T')[0];
// updateProfile
exports.updateEnvironment = async (req, res) => {
    const { environment, _id } = req.body;

    // Use the upsert option to either update or insert the profile
    Environment.updateOne(
        
            {_id: _id}, // Find the profile with the specified _id
            {name: environment},
            { upsert: true } // Create a new profile if it doesn't exist

         // Find the profile with the specified _id
    ).then((User) => {
        console.log(User);
        return res.status(200).json({ message: "Environment updated" })
    }).catch(function (error) {
        // let errorCode = error.code;
        let errorMessage = error.message;
        logger.logToCloudWatch(formattedDate.toString(),`${errorMessage}`);

        console.log(errorMessage)

    })
};

exports.fetchEnvironment = async (req,res) => {
    const env = await Environment.findOne({ _id: req.user.user_id }).then((data) => {
        if (data) {
            return res.status(200).json(data)
        }
        else {
            return res.status(404).json({ message: "Env Not Found" })
        }
    }).catch((err) => {
        return res.status(500).json(err)
    });
}