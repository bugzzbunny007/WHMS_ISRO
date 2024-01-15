const mongoose = require('mongoose');
const { Schema } = mongoose;

// Mongoose Schema for Realtime Sensor Data
const DeviceSchema = new Schema({
    deviceId: { type: String, required: true },
    currentUserId: { type: String, default: null },
    currentAdminId: { type: String, default: null },
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
});

const Device = mongoose.model('Device', DeviceSchema);

module.exports = Device;
