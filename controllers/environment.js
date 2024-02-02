const firebase = require("../config/firebase");
const User = require('../models/User');
const InitialUser = require('../models/InitialUser');
const Environment = require('../models/Environment');
const fetchUser = require("../middleware/fetchuser");
const logger = require('./logger');

const today = new Date();
const formattedDate = today.toISOString().split('T')[0];

exports.updateEnvironment = async (req, res) => {
    const { environment } = req.body;

    try {
        // Update the Environment
        await Environment.updateOne(
            { _id: req.user.uid }, // Find the Environment with the specified _id
            { name: environment },
            { upsert: true } // Create a new Environment if it doesn't exist
        );

        // Update env_exist to true in InitialUser schema
        await InitialUser.findOneAndUpdate(
            { _id: req.user.uid },
            { $set: { env_exist: true } },
            { upsert: true }
        ).exec();

        return res.status(200).json({ message: "Environment updated" });
    } catch (error) {
        let errorMessage = error.message;
        logger.logToCloudWatch(formattedDate.toString(), `${errorMessage}`);
        console.log(errorMessage);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};


exports.fetchEnvironment = async (req, res) => {
    const env = await Environment.findOne({ _id: req.user.uid }).then((data) => {
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