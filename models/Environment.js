const mongoose = require('mongoose');
const { Schema } = mongoose;

// Mongoose Schema for User
const EnvironmentSchema = new Schema({
    _id: { type: String, required: true },
    name: { type: String, required: true },
});

const Environment = mongoose.model('environment', EnvironmentSchema);
module.exports = Environment;