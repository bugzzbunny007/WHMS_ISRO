const firebase = require("../config/firebase");
const User = require('../models/User');
const Profile = require('../models/Profile');
const fetchUser = require("../middleware/fetchuser");
const logger = require('./logger');
const InitialUser = require('../models/InitialUser');
const today = new Date();
const formattedDate = today.toISOString().split('T')[0];
const { OTPMail, transportObject, verifiedMail, emailAlert } = require('../utils/mail')
const nodemailer = require('nodemailer')
var transport = nodemailer.createTransport(transportObject());
// getProfile
const SensorDB = require('../models/SensorDB');

exports.sendAlert = async (req, res) => {
    try {
        const _id = "8snb36T61DWQRd4PtSzvRphDeiT2";
        const requestBody = req.body;

        // Get the current timestamp
        const currentTimestamp = new Date().toISOString();//2024-01-12T07:32:14.115Z
        const sensorTimeStamps = ["heartSensorAlertTimeStamp", "xSensorAlertTimeStamp", "ySensorAlertTimeStamp"]
        const sensorThresholds = ["700", "200", "200"]

        // Iterate through sensors and update alertID based on timestamp
        for (let i = 0; i < requestBody.alertID.length; i++) {
            const sensorType = i === 0 ? 'heartSensor' : (i === 1 ? 'xSensor' : 'ySensor');

            // Check if the timestamp is not null and older than 5 minutes
            const sensorData = await SensorDB.findById(_id);
            const lastFiveValues = sensorData[sensorType].map(entry => entry.value).slice(-5);
            const lastFiveAverage = lastFiveValues.reduce((acc, value) => acc + value, 0) / lastFiveValues.length;
            console.log(lastFiveAverage)
            // console.log(sensorData[sensorType]) // OverHere
            if (

                sensorData &&
                sensorData[sensorTimeStamps[i]] &&
                (sensorData[sensorTimeStamps[i]] !== "") &&
                new Date(currentTimestamp) - new Date(sensorData[sensorTimeStamps[i]]) <= 5 * 60 * 1000 &&
                lastFiveAverage < sensorThresholds[i] &&
                requestBody.alertID[i] === 1

            ) {
                // Update alertID to 0 if conditions are met
                requestBody.alertID[i] = 0;
            }
            else {
                const updateField = {};
                updateField[sensorTimeStamps[i]] = currentTimestamp;

                await SensorDB.findByIdAndUpdate(_id, { $set: updateField });
            }

        }

        // Log the updated alertID
        console.log('Updated alertID:', requestBody.alertID);

        //Validate threshold here

        var alertFlag = false;
        // Send email with the updated alertID
        for (let i = 0; i < requestBody.alertID.length; i++) {
            if (requestBody.alertID[i] === 1) {
                alertFlag = true
            }
        }

        if (!alertFlag) {
            return res.status(200).json({ msg: "Acknowledged" });
        }
        else {
            await transport.sendMail(emailAlert("Piyush", "hastinapur6432@gmail.com", requestBody.alertID, requestBody.values));

            return res.status(201).json({ msg: "Email Alert Created" });
        }
        return res.status(200).json({ msg: "received" });
    } catch (err) {
        console.log(err)
        return res.status(500).json(err);
    }
};


