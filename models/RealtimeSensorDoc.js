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
    BreathRateSensor: {
        value: Number,
        timestamp: String,
        unit: String,
        range: String,
    },
    TidalVolumeSensor: {
        value: Number,
        timestamp: String,
        unit: String,
        range: String,
    },
    ActivitySensor: {
        value: Number,
        timestamp: String,
        unit: String,
        range: String,
    },
    CadenceSensor: {
        value: Number,
        timestamp: String,
        unit: String,
        range: String,
    },
    TemperatureSensor: {
        value: Number,
        timestamp: String,
        unit: String,
        range: String,
    },
    OxygenSaturationSensor: {
        value: Number,
        timestamp: String,
        unit: String,
        range: String,
    },
    BloodPressureSensor: {
        value: Number,
        timestamp: String,
        unit: String,
        range: String,
    }
});
const RealtimeSensorDoc = mongoose.model('RealtimeSensorDoc', RealtimeSensorDocSchema);

module.exports = RealtimeSensorDoc;