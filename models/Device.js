const mongoose = require('mongoose');
const { Schema } = mongoose;

// Mongoose Schema for Realtime Sensor Data
const DeviceSchema = new Schema({
    deviceId: { type: String, required: true },
    currentUserId: { type: String, default: null },
    currentAdminId: { type: String, default: null },
    heartSensor: {
        value: { type: Number, default: null },
        timestamp: { type: String, default: null },
        unit: { type: String, default: null },
        range: { type: String, default: null },
    },
    xSensor: {
        value: { type: Number, default: null },
        timestamp: { type: String, default: null },
        unit: { type: String, default: null },
        range: { type: String, default: null },
    },
    ySensor: {
        value: { type: Number, default: null },
        timestamp: { type: String, default: null },
        unit: { type: String, default: null },
        range: { type: String, default: null },
    },
});

const Device = mongoose.model('Device', DeviceSchema);

module.exports = Device;
