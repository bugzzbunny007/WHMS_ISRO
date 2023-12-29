const mongoose = require('mongoose');

const UserDocumentSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    originalname: {
        type: String,
        required: true,
    },
    filename: {
        type: String,
        required: true,
    },
    contentType: {
        type: String,
        required: true,
    },
    uploadDate: {
        type: Date,
        default: Date.now,
    },
});

const UserDocument = mongoose.model('UserDocument', UserDocumentSchema);

module.exports = UserDocument;
