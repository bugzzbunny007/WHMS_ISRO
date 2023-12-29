const mongoose = require('mongoose');
const User = require('./User');

const userRoles = ['admin', 'superadmin'];
// Define the Admin schema
const adminSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    maxUserCount: { type: Number, default: 10 },
    userIds: [{ type: String, default: null }],// Reference to User model
    deviceIds: [{ type: String, default: null }],
    accountEnabled: { type: Boolean, default: false },
});

// Create the Admin model
const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;