const firebase = require("../config/firebase");
const User = require('../models/User')
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const bcrypt = require('bcrypt');

// signup
exports.signup = (req, res) => {
  if (!req.body.email || !req.body.password) {
    return res.status(422).json({
      email: "email is required",
      password: "password is required",
    });
  }
  firebase
    .auth()
    .createUserWithEmailAndPassword(req.body.email, req.body.password)
    .then(async (userCredential) => {
      // Update the user's display name
      console.log("user created mongo stuff started");
      const existingUser = await User.findOne({ email: req.body.email });
      if (existingUser) {
        
          return res.status(409).json({ error: 'Email already exists. Please login.' }); // 409 Conflict
      }

      // Encrypt the password
      // const salt = await bcrypt.genSalt(10);
      // const hashedPassword = await bcrypt.hash(req.body.password, salt);

      // Create a new user
      console.log("user uid",userCredential.user.uid);
      const newUser = new User({
          _id : userCredential.user.uid,
          name: req.body.displayName,
          email: req.body.email,
          password: req.body.password
      });

      // Save the new user to the database
      await newUser.save();
      
      console.log("User created in db"+"Welcome"+req.body.displayName)

      return userCredential.user.updateProfile({
        displayName: req.body.displayName,
      });

    })
    .then( async () => {
      // Send email verification
      return firebase.auth().currentUser.sendEmailVerification();
    })
    .then(() => {
      return res.status(201).json({ message: firebase.auth().currentUser });
    })
    .catch(function (error) {
      let errorCode = error.code;
      let errorMessage = error.message;
      if (errorCode == 'auth/email-already-in-use') {
        return res.status(409).json({ error: 'Email already exists. Please Signin.' }); // 409 Conflict
      }
      if (errorCode == "auth/weak-password") {
        return res.status(400).json({ error: errorMessage });
      } else {
        console.log(error)
        return res.status(500).json({ error: errorMessage });
      }
    });
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
exports.createMongoUser = async (req, res) => {
  try {
    console.log("Will Create mongo user");

    // Check if a user with the same authId already exists in MongoDB
    const existingUser = await User.findOne({ _id: req.user.uid });

    if (existingUser) {
      return res.status(409).json({ error: "User already exists in MongoDB" });
    }

    // Create a new user with _id as an ObjectId
    const newUser = new User({
      name: req.user.name,
      email: req.user.email,
      _id: req.user.uid, // Corrected the constructor
    });

    // Save the new user to the database
    await newUser.save();

    return res.status(201).json({ payload: { id: newUser.id } }); // 201 Created
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to create MongoDB user" });
  }
};
