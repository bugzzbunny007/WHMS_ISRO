const mongoose = require('mongoose');
const { Schema } = mongoose;

// Mongoose Schema for User
const InitialUserSchema = new Schema({
    _id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String, default: "1234567890" },
    roles: {
        type: [String],
        default: ['unallocated'], // Default role(s)
    },
    profile_exist:{type: Boolean,default: false },
    env_exist:{type: Boolean,default: false }
});

const InitialUser = mongoose.model('initialuser', InitialUserSchema);

module.exports = InitialUser;