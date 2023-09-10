const mongoose = require('mongoose');
const { Schema } = mongoose;

// Mongoose Schema for User
const UserSchema = new Schema({
    _id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    profile: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'profile' // Reference to the Profile model
    },
    environment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'environment' // Reference to the Environment model
    },
    authId: { type: String, unique: true }
});

const User = mongoose.model('user', UserSchema);

module.exports = User;
