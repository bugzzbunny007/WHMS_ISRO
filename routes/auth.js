const express = require('express')
const router = express.Router()
const User = require('../models/User')
const VerificationToken = require('../models/VerificationToken')
const { body, validationResult } = require('express-validator')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')
const fetchuser = require('../middleware/fetchuser')
const { isValidObjectId } = require('mongoose')
const { generateOTP, getTokens } = require('../utils/auth')
const { OTPMail, transportObject, verifiedMail } = require('../utils/mail')
const nodemailer = require('nodemailer')
var transport = nodemailer.createTransport(transportObject());

// /api/signup Endpoint
//Route 1 : POST: Create a User /signup 
//No Login Required
router.post('/signup', [
    body('name').isLength({ min: 3 }).withMessage('Enter a valid name'),
    body('email').isEmail().withMessage('Enter a valid Email'),
    body('password').isLength({ min: 5 }).withMessage('Minimum Password Length: 5')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() }); // 422 Unprocessable Entity
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            return res.status(409).json({ error: 'Email already exists. Please login.' }); // 409 Conflict
        }

        // Encrypt the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        // Create a new user
        const newUser = new User({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        });

        // Save the new user to the database
        await newUser.save();

        // Return a success response with the user's ID
        return res.status(201).json({ payload: { id: newUser.id } }); // 201 Created
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal Server Error' }); // 500 Internal Server Error
    }
})

// Route 2 : POST : Login user /login
router.post('/login', [
    body('email', 'Enter a valid Email').isEmail(),
    body('password', 'Password cannot be blank').exists()
], async (req, res) => {

    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() }); // 422 Unprocessable Entity
        }

        const { email, password } = req.body;

        // Find the user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ error: 'Invalid Credentials' }); // 401 Unauthorized
        }

        // Compare passwords
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid Credentials' }); // 401 Unauthorized
        }

        if (!user.emailVerified) {
            return res.status(403).json({ error: 'Account not Verified' }); // 403 Forbidden
        }

        // Generate and return authentication tokens
        const { authToken, refreshToken } = await getTokens(user.id, 0);

        return res.status(200).json({ payload: { authToken, refreshToken } }); // 200 OK

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal Server Error' }); // 500 Internal Server Error
    }

})


// Route 3 : POST: Get sser details /getuser
//Login Required
router.get('/getuser', fetchuser, async (req, res) => {
    try {
        const id = req.user.id
        const user = await User.findById(id).select("-password")
        if (!user) {
            return res.status(404).json({ error: 'User not found' }); // 404 Not Found
        }

        return res.status(200).json({ payload: { user } }); // 200 OK
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal Server Error' }); // 500 Internal Server Error
    }
})

// Route 4 : POST: Send Verification Code
//No Login Required
router.post('/sendverificationcode', async (req, res) => {
    try {
        const { id } = req.body
        // Check if id is missing or not a valid ObjectId
        if (!id || !isValidObjectId(id)) {
            return res.status(401).json({ error: 'Unauthorized' }); // 401 Unauthorized
        }

        // Find the user by id
        const user = await User.findById(id);

        // Check if user is not found
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' }); // 401 Unauthorized
        }

        // Check if the user's email is already verified
        if (user.emailVerified) {
            return res.status(409).json({ error: 'Account already Verified' }); // 409 Conflict
        }

        // Find and delete any existing verification token
        const existingToken = await VerificationToken.findOneAndDelete({ owner: user._id });

        // Generate a new OTP
        const OTP = generateOTP();

        // Create a new VerificationToken object
        const verificationToken = new VerificationToken({
            owner: user._id,
            token: OTP
        });

        // Save the new verification token
        await verificationToken.save();

        console.log(OTP)

        // Sending OTP Mail
        await transport.sendMail(OTPMail(user.name, user.email, OTP));

        return res.status(200).json({ payload: { msg: 'Verification Code Sent' } }); // 200 OK
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal Server Error' }); // 500 Internal Server Error
    }
})


// Route 5 : POST: Verifing Code /verifyaccount
router.post('/verifyaccount', async (req, res) => {
    try {
        const { id, otp } = req.body

        // Check if id or OTP is missing or empty
        if (!id || !otp.trim()) {
            return res.status(401).json({ error: 'Unauthorized' }); // 401 Unauthorized
        }

        // Check if id is a valid ObjectId
        if (!isValidObjectId(id)) {
            return res.status(401).json({ error: 'Unauthorized' }); // 401 Unauthorized
        }

        // Find the user by id
        const user = await User.findById(id);

        // Check if user is not found
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' }); // 401 Unauthorized
        }

        // Check if the user's email is already verified
        if (user.emailVerified) {
            return res.status(204).json({}) // 204 No Content
        }

        // Find the verification token
        const token = await VerificationToken.findOne({ owner: user._id });

        // Check if the token is not found (expired)
        if (!token) {
            return res.status(406).json({ error: 'Verification code expired' }); // 406 Not Acceptable
        }

        // Compare the provided OTP with the stored token
        const isMatched = await token.compareToken(otp);

        if (!isMatched) {
            return res.status(401).json({ error: 'Invalid Verification Code' }); // 401 Unauthorized
        }

        // Mark the user's email as verified
        user.emailVerified = true;

        // Delete the verification token
        await VerificationToken.findByIdAndDelete(token._id);

        // Save the user's updated email verification status
        await user.save();

        // Send a verification success email
        await transport.sendMail(verifiedMail(user.name, user.email));

        // Generate and return authentication tokens
        const { authToken, refreshToken } = await getTokens(user.id, 0);

        return res.status(200).json({ payload: { authToken, refreshToken } }); // 200 OK
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal Server Error' }); // 500 Internal Server Error

    }
})

// Route 6 : POST: Reffresh Access Token /refresh
//Login Required
router.post('/refresh', fetchuser, async (req, res) => {
    try {
        const user = req.user
        const { authToken } = await getTokens(user.id, 1)
        res.status(200).json({
            "payload": { authToken }
        })
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while refreshing the token.' });
    }
})

module.exports = router