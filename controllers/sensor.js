const SensorDB = require("../models/SensorDB");


exports.getHeartRateData = async (req, res) => {
    console.log("called");
    const sensorId = req.params.id
    console.log(sensorId);
    try {
        const sensorData = await SensorDB.findOne({ _id: sensorId });

        if (!sensorData) {
            return res.status(404).json({ message: 'Sensor data not found for the provided _id.' });
        }

        res.json({ heartrate: sensorData.heartSensor });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}