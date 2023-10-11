const firebase = require("../config/firebase");
const InitialUser = require('../models/InitialUser')
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const bcrypt = require('bcrypt');
const admin = require('firebase-admin');
const logger = require('./logger');



const today = new Date();
const formattedDate = today.toISOString().split('T')[0];
// signup
exports.signup = async (req, res) => {
  try {
    if (!req.body.email || !req.body.password) {
      return res.status(422).json({
        email: "email is required",
        password: "password is required",
      });
    }

    firebase
      .auth()
      .createUserWithEmailAndPassword(req.body.email, req.body.password)
      .then((userCredential) => {
        logger.logToCloudWatch(formattedDate.toString(),`User singup successfully ${req.body.email}`);
        return userCredential.user.updateProfile({
          displayName: req.body.displayName
        });
      })
      .then(() => {
        // Send email verification

        return firebase.auth().currentUser.sendEmailVerification();
      })
      .then(() => {
        // Handle the result or additional asynchronous operations here
        console.log('Firebase user created!')
        logger.logToCloudWatch(formattedDate.toString(),`User Created`);

        return res.status(201).json({ message: 'User Created, please verify email' });

      })
      .catch((error) => {
        console.error(error)
        if (error.code === 'auth/email-already-in-use') {
        logger.logToCloudWatch(formattedDate.toString(),`Email already Used ${error}`);
          return res.status(409).json({ error: "Email already used, please sign in" });
        }
        logger.logToCloudWatch(formattedDate.toString(),`Failed to create user`);
        return res.status(500).json({ error: "Failed to create user" });
      
      });




    // const existingUser = await User.findOne({ email: req.body.email });
    // console.log(existingUser)
    // if (existingUser) {
    //   return res.status(409).json({ error: 'Email already exists. Please login.' }); // 409 Conflict
    // }

    // const createUserResult = await exports.createMongoUser({
    //   uid: userCredential.user.uid,
    //   displayName: req.body.displayName,
    //   email: req.body.email,
    // });

    // if (createUserResult === 1) {
    //   // Update user's profile with the 'Roles' field
    //   await userCredential.user.updateProfile({
    //     displayName: req.body.displayName,
    //     // Add the 'Roles' field with the desired value
    //     roles: [], // You can set a default role if not provided
    //   });

    // Send email verificationrol
    // await firebase.auth().currentUser.sendEmailVerification();


  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to create user" });
  }
};

// signin
exports.signin = (req, res)  => {
  if (!req.body.email || !req.body.password) {
    return res.status(422).json({
      email: "email is required",
      password: "password is required",
    });
  }
  firebase
    .auth()
    .signInWithEmailAndPassword(req.body.email, req.body.password)
    .then(async (user) => {
      
      
      if (user.user.emailVerified){
        var customToken = await admin.auth().createCustomToken(user.user.uid)
        return res.status(200).json(customToken);
      }
      else {
        return firebase.auth().currentUser.sendEmailVerification().then(() => {
          logger.logToCloudWatch(formattedDate.toString(),`Sign in failed due to email is not verified ${req.body.email}`);
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
       
        logger.logToCloudWatch(formattedDate.toString(),` ${errorMessage}`);
        
        return res.status(401).json({ error: errorMessage });
      }
      if (errorCode === "auth/too-many-requests") {
        res.status(403).json({
          error: "Email has not been verified. Please verify your email address to proceed.",
        });
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
    logger.logToCloudWatch(formattedDate.toString(),`New auth token generated sucessfully`);

    return res.status(200).json({ authToken: newToken });
  } catch (error) {
    console.error(error);
    logger.logToCloudWatch(formattedDate.toString(),` ${error}`);
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
        logger.logToCloudWatch(formattedDate.toString(),`OTP verified successfully`);
        
        res.status(200).json({ message: 'OTP verified successfully' });
      } else {
        // Invalid OTP code
        logger.logToCloudWatch(formattedDate.toString(),`Invalid OTP Code`);

        res.status(400).json({ error: 'Invalid OTP code' });
      }
    })
    .catch((error) => {
      // Handle errors, such as verification ID expiration
      logger.logToCloudWatch(formattedDate.toString(),`${error.message}`);
      
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
      name: req.user.name,
      email: req.user.email,
      _id: req.user.uid,
    });

    if (createUserResult === 1) {
      // User created successfully
      return res.status(201).json({ payload: { id: req.user.uid } }); // 201 Created
    } else if (createUserResult === 2) {
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
    const existingUser = await InitialUser.findOne({ _id: user._id });

    if (existingUser) {
      console.log("User already exists in MongoDB");
      return 2; // User already exists, return 0 for failure
    }

    // Create a new user with _id as an ObjectId
    const newInitialUser = new InitialUser(user);

    // Save the new user to the database
    await newInitialUser.save();

    console.log("MongoDB User created successfully");
    return 1; // User created successfully, return 1 for success
  } catch (error) {
    console.error("Failed to create MongoDB user:", error);
    return 0; // Failed to create user, return 0 for failure
  }
};
