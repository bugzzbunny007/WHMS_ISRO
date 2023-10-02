const mongoose = require('mongoose');
const { Schema } = mongoose;

const userRoles = ['user', 'admin', 'superadmin'];

// Mongoose Schema for User
const UserSchema = new Schema({
    _id: { type: String, required: true },
    admin: { type: String }
});

const User = mongoose.model('user', UserSchema);

module.exports = User;