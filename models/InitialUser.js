const mongoose = require('mongoose');
const { Schema } = mongoose;

// Mongoose Schema for User
const InitialUserSchema = new Schema({
    _id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String, required: true },
    roles: {
        type: [String],
        default: ['unallocated'], // Default role(s)
    },
    profile_exist: { type: Boolean, default: false },
    env_exist: { type: Boolean, default: false },
    doc_verified: { type: Boolean, default: false },
    doc_uploaded: { type: Boolean, default: false },
    deptName: { type: String },
    orgName: { type: String }

});

const InitialUser = mongoose.model('initialuser', InitialUserSchema);

module.exports = InitialUser;