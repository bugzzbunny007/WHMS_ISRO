const firebase = require("../config/firebase");
const User = require('../models/User')
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const bcrypt = require('bcrypt');
const admin = require('firebase-admin');

// signup
exports.signup = async (req, res) => {
  try {
    if (!req.body.email || !req.body.password) {
      return res.status(422).json({
        email: "email is required",
        password: "password is required",
      });
    }

    const userCredential = await firebase
      .auth()
      .createUserWithEmailAndPassword(req.body.email, req.body.password);

    console.log("user created mongo stuff started");

    const existingUser = await User.findOne({ email: req.body.email });

    if (existingUser) {
      return res.status(409).json({ error: 'Email already exists. Please login.' }); // 409 Conflict
    }

    const createUserResult = await exports.createMongoUser({
      _id: userCredential.user.uid,
      name: req.body.displayName,
      email: req.body.email,
    });

    if (createUserResult === 1) {
      // User created successfully
      await userCredential.user.updateProfile({
        displayName: req.body.displayName,
      });

      // Send email verification
      await firebase.auth().currentUser.sendEmailVerification();

      return res.status(201).json({ message: 'User Created, please verify email' });
    } else if (createUserResult === 0) {
      // User already exists
      return res.status(409).json({ error: "Email already exists. Please Signin." }); // 409 Conflict
    } else {
      // Failed to create user
      return res.status(500).json({ error: "Failed to create MongoDB user" }); // 500 Internal Server Error
    }
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      return res.status(409).json({ error: "Email already exists. Please Signin." }); // 409 Conflict

    }
    console.log(error.code);

    return res.status(500).json({ error: "Failed to create user" });
  }
};


// signin
exports.signin = (req, res) => {
  if (!req.body.email || !req.body.password) {
    return res.status(422).json({
      email: "email is required",
      password: "password is required",
    });
  }
  firebase
    .auth()
    .signInWithEmailAndPassword(req.body.email, req.body.password)
    .then((user) => {

      if (user.user.emailVerified)
        return res.status(200).json(user);
      else {
        return firebase.auth().currentUser.sendEmailVerification().then(() => {
          return res.status(403).json({
            error: "Email has not been verified. Please verify your email address to proceed.",
          });
        })
      }
    })
    .catch(function (error) {
      console.error(error)
      let errorCode = error.code;
      console.log(errorCode)
      let errorMessage = error.message;
      if (errorCode === "auth/wrong-password") {
        return res.status(401).json({ error: errorMessage });
      }
      if (errorCode === "auth/too-many-requests") {
        return res.status(429).json({ error: errorMessage });
      }
      else {
        return res.status(500).json({ error: errorMessage });
      }
    });
};

// refreshToken
exports.refresh = async (req, res) => {
  const refreshToken = req.body.refreshToken;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  try {
    // Verify the refreshToken to get the UID
    const decodedToken = await admin.auth().verifyIdToken(refreshToken);
    const uid = decodedToken.uid;

    // Create a new custom token for the user
    const newToken = await admin.auth().createCustomToken(uid);

    return res.status(200).json({ authToken: newToken });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to refresh token' });
  }
};


// verify email
// this work after signup & signin
// exports.verifyEmail = (req,res) => {
//   firebase
//     .auth()
//     .currentUser.sendEmailVerification()
//     .then(function () {
//       return res.status(200).json({ status: "Email Verification Sent!" });
//     })
//     .catch(function (error) {
//       let errorCode = error.code;
//       let errorMessage = error.message;
//       if (errorCode === "auth/too-many-requests") {
//         return res.status(500).json({ error: errorMessage });
//       }
//     });
// };


// Create an API endpoint for sending O
exports.verifyOTP = (req, res) => {
  const verificationId = req.body.verificationId; // Get the verification ID from the client
  const otpCode = req.body.otpCode; // Get the OTP code entered by the user

  admin
    .auth()
    .checkActionCode(verificationId)
    .then((info) => {
      if (info.data.phoneInfo.verificationCode === otpCode) {
        // OTP code is valid, you can proceed with user authentication or other actions
        res.status(200).json({ message: 'OTP verified successfully' });
      } else {
        // Invalid OTP code
        res.status(400).json({ error: 'Invalid OTP code' });
      }
    })
    .catch((error) => {
      // Handle errors, such as verification ID expiration
      res.status(400).json({ error: error.message });
    });
};



// forget password
exports.forgetPassword = (req, res) => {
  if (!req.body.email) {
    return res.status(422).json({ email: "email is required" });
  }
  firebase
    .auth()
    .sendPasswordResetEmail(req.body.email)
    .then(function () {
      return res.status(200).json({ status: "Password Reset Email Sent" });
    })
    .catch(function (error) {
      let errorCode = error.code;
      let errorMessage = error.message;
      if (errorCode == "auth/invalid-email") {
        return res.status(500).json({ error: errorMessage });
      } else if (errorCode == "auth/user-not-found") {
        return res.status(500).json({ error: errorMessage });
      }
    });
};

// Create Mongo User
exports.createMongoUserEndpoint = async (req, res) => {
  try {
    console.log("Will Create mongo user");

    const createUserResult = await exports.createMongoUser({
      name: req.body.name,
      email: req.body.email,
      _id: req.body._id,
    });

    if (createUserResult === 1) {
      // User created successfully
      return res.status(201).json({ payload: { id: req.body._id } }); // 201 Created
    } else if (createUserResult === 0) {
      // User already exists
      return res.status(409).json({ error: "User already exists in MongoDB" }); // 409 Conflict
    } else {
      // Failed to create user
      return res.status(500).json({ error: "Failed to create MongoDB user" }); // 500 Internal Server Error
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to create MongoDB user" });
  }
};



exports.createMongoUser = async (user) => {
  try {
    console.log("Will Create mongo user");
    console.log(user)
    console.log(user._id)
    // Check if a user with the same authId already exists in MongoDB
    const existingUser = await User.findOne({ _id: user._id });

    if (existingUser) {
      console.log("User already exists in MongoDB");
      return 2; // User already exists, return 0 for failure
    }

    // Create a new user with _id as an ObjectId
    const newUser = new User(user);

    // Save the new user to the database
    await newUser.save();

    console.log("MongoDB User created successfully");
    return 1; // User created successfully, return 1 for success
  } catch (error) {
    console.error("Failed to create MongoDB user:", error);
    return 0; // Failed to create user, return 0 for failure
  }
};
