const mongoose = require('mongoose');
const { Schema } = mongoose;

// Mongoose Schema for Realtime Sensor Data
const LocationSchema = new Schema({
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
    timestamp: { type: String, required: true },
});

const DeviceSchema = new Schema({
    deviceId: { type: String, required: true },
    currentUserId: { type: String, default: "" },
    currentAdminId: { type: String, default: "" },
    timeStamp: { type: String, default: "" },
    heartSensor: {
        type: String, default: ""
    },
    xSensor: {
        type: String, default: ""
    },
    ySensor: {
        type: String, default: ""
    },
    location: {
        type: LocationSchema,
        default: []
    }
});

const Device = mongoose.model('Device', DeviceSchema);

module.exports = Device;
