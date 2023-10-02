const mongoose = require('mongoose');
const { Schema } = mongoose;

const userRoles = ['user', 'admin', 'superadmin'];

// Mongoose Schema for User
const UserSchema = new Schema({
    _id: { type: String, required: true },
    data: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'initialuser' // Reference to the Profile model
    },
    environment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'environment' // Reference to the Environment model
    }

});

const User = mongoose.model('user', UserSchema);

module.exports = User;