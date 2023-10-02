const mongoose = require('mongoose');
const { Schema } = mongoose;

// Mongoose Schema for User
const EnvironmentSchema = new Schema({
    name: { type: String, default: "Ground" },
});

const Environment = mongoose.model('environment', EnvironmentSchema);
module.exports = Environment;