const mongoose = require('mongoose');
const { Schema } = mongoose;

const userRoles = ['user', 'admin', 'superadmin'];

// Mongoose Schema for User
const UserSchema = new Schema({
    _id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String, default: "1234567890" },
    profile: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'profile' // Reference to the Profile model
    },
    environment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'environment' // Reference to the Environment model
    },
    authId: { type: String, unique: true },
    role: { type: String, enum: userRoles, default: 'user' }

});

const User = mongoose.model('user', UserSchema);

module.exports = User;