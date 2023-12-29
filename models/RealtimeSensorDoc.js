const mongoose = require('mongoose');
const { Schema } = mongoose;

// Mongoose Schema for Realtime Sensor Data
const RealtimeSensorDocSchema = new Schema({
    _id: { type: String, required: true },
    heartSensor: {
        value: Number,
        timestamp: String,
        unit: String,
        range: String,
    },
    xSensor: {
        value: Number,
        timestamp: String,
        unit: String,
        range: String,
    },
    ySensor: {
        value: Number,
        timestamp: String,
        unit: String,
        range: String,
    },

});
const RealtimeSensorDoc = mongoose.model('RealtimeSensorDoc', RealtimeSensorDocSchema);

module.exports = RealtimeSensorDoc;