const mongoose = require('mongoose');
const { Schema } = mongoose;

// Mongoose Schema for Realtime Sensor Data
const LocationSchema = new Schema({
    lat: { type: Number },
    lon: { type: Number },
    timestamp: { type: String },
});

const DeviceSchema = new Schema({
    deviceId: { type: String, required: true },
    currentUserId: { type: String, default: "" },
    currentAdminId: { type: String, default: "" },
    timeStamp: { type: String, default: "" },
    heartSensor: {
        type: String, default: ""
    },
    BreathRateSensor: {
        type: String, default: ""
    },
    VentilatonSensor: {
        type: String, default: ""
    },
    TidalVolumeSensor: {
        type: String, default: ""
    },
    ActivitySensor: {
        type: String, default: ""
    },
    CadenceSensor: {
        type: String, default: ""
    },
    TemperatureSensor: {
        type: String, default: ""
    },
    OxygenSaturationSensor: {
        type: String, default: ""
    },
    BloodPressureSensor: {
        type: String, default: ""
    },
    location: {
        type: [LocationSchema],
        default: []
    }
});

const Device = mongoose.model('Device', DeviceSchema);

module.exports = Device;
