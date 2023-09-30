const mongoose = require('mongoose');
const { Schema } = mongoose;

// Mongoose Schema for User
const ProfileSchema = new Schema({
    _id: { type: String, required: true },
    age: { type: Number },
    weight: { type: Number },
    height: { type: Number },
    sex: { type: String },
});
const Profile = mongoose.model('profile', ProfileSchema);

module.exports = Profile;