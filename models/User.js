const mongoose = require('mongoose');
const { Schema } = mongoose;

// Mongoose Schema for User
const UserSchema = new Schema({
    _id: { type: String, required: true },
    admin: { type: String }
});

const User = mongoose.model('user', UserSchema);

module.exports = User;