const mongoose = require('mongoose');
const { Schema } = mongoose;

// Mongoose Schema for User
const ProfileSchema = new Schema({
    _id: { type: String, required: true },
    dob: { type: String },//
    weight: { type: Number },
    height: { type: Number },
    gender: { type: String },
});
const Profile = mongoose.model('profile', ProfileSchema);

module.exports = Profile;