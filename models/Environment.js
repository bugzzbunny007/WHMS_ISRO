const mongoose = require('mongoose');
const { Schema } = mongoose;

// Mongoose Schema for User
const EnvironmentSchema = new Schema({
    name: { type: String },
});

module.exports = EnvironmentSchema;