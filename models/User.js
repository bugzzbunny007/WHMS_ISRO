const mongoose = require('mongoose');
const { Schema } = mongoose;
const ProfileSchema = require('./Profile');
const EnvironmentSchema = require('./Environment');

// Mongoose Schema for User
const UserSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    password: { type: String, required: true },
    googleAccount: { type: Boolean, default: false, required: true },
    timeStamp: { type: Date, default: Date.now },
    phoneVerified: { type: Boolean, default: false, required: true },
    emailVerified: { type: Boolean, default: false, required: true },
    profile: ProfileSchema,
    environment: EnvironmentSchema,
});
const User = mongoose.model('user', UserSchema);

module.exports = User;