const mongoose = require('mongoose');
const { Schema } = mongoose;

// Mongoose Schema for User
const ProfileSchema = new Schema({
    age: { type: Number },
    weight: { type: Number },
    height: { type: Number },
    sex: { type: String },
});


module.exports = ProfileSchema;