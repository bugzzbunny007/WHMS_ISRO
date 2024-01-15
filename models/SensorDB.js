const mongoose = require('mongoose');
const { Schema } = mongoose;

// Subschema for Value and Timestamp
const ValueTimestampSchema = new Schema({
    value: { type: Number, required: true },
    timestamp: { type: String, required: true },
});

// Mongoose Schema for Stored Sensor Data
const SensorDBSchema = new Schema({
    _id: { type: String, required: true },
    heartSensor: {
        type: [ValueTimestampSchema],
        default: [],
        validate: {
            validator: function (arr) {
                return arr.length <= this.maxRecordSize;
            },
            message: props => `Size of heartSensor array exceeds the maximum allowed size (${props.value.length}/${props.maxRecordSize}).`,
        },
    },
    xSensor: [ValueTimestampSchema],
    ySensor: [ValueTimestampSchema],
    heartSensorAlertTimeStamp: { type: String, default: "" },
    xSensorAlertTimeStamp: { type: String, default: "" },
    ySensorAlertTimeStamp: { type: String, default: "" },
    maxRecordSize: { type: Number, default: 60 }, // Set your desired max size here
});

// Update heartSensor array method
SensorDBSchema.methods.updateHeartSensor = function (value, timestamp) {
    // Remove excess elements if array size exceeds maxRecordSize
    if (this.heartSensor.length >= this.maxRecordSize) {
        this.heartSensor.splice(this.maxRecordSize - 1);
    }

    // Add new value
    this.heartSensor.unshift({ value, timestamp });
};

const SensorDB = mongoose.model('SensorDB', SensorDBSchema);

module.exports = SensorDB;
