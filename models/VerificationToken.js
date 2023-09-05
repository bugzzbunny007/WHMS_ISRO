const mongoose = require('mongoose');
const { Schema } = mongoose;
const bcrypt = require('bcryptjs')

// Mongoose Schema for VerificationToken
const verificationTokenSchema = new Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    token: {
        type: String,
        required: true,
        createdAt: {
            type: Date,
            expires: 3600,
            default: Date.now()
        }
    },
});

verificationTokenSchema.pre("save", async function (next) {
    if (this.isModified("token")) {
        const hash = await bcrypt.hash(this.token, 8);
        this.token = hash;
    }
    next();
})

verificationTokenSchema.methods.compareToken = async function (token) {
    const result = await bcrypt.compareSync(token, this.token)
    return result
}
const User = mongoose.model('verificationToken', verificationTokenSchema);

module.exports = User;