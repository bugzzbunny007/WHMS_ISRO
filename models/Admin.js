const mongoose = require('mongoose');
const User = require('./User');

const userRoles = ['admin', 'superadmin'];
// Define the Admin schema
//Todo admin should not have any profile related feilds
//Todo admin should have a list of users whos under it
const adminSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    role: { type: String, required: true, enum: userRoles },
    userIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] // Reference to User model
});

// Create the Admin model
const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;