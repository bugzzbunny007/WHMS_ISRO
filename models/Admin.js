const mongoose = require('mongoose');
const User = require('./User');

const userRoles = ['admin', 'superadmin'];
// Define the Admin schema
//Todo admin should not have any profile related feilds
//Todo admin should have a list of users whos under it
const adminSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    maxUserCount: { type: Number, default: 10 },
    userIds: [{ type: String, default: null }] // Reference to User model
});

// Create the Admin model
const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;