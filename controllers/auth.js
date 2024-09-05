const firebase = require("../config/firebase");
const InitialUser = require('../models/InitialUser')
const Profile = require('../models/Profile')
const Admin = require('../models/Admin')
const User = require('../models/User')
const Environment = require('../models/Environment')
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const bcrypt = require('bcrypt');
const admin = require('firebase-admin');
const logger = require('./logger');
const RealtimeSensorDoc = require('../models/RealtimeSensorDoc');
const Device = require('../models/Device');
const SensorDB = require('../models/SensorDB');

const { OTPMail, transportObject, verifiedMail, emailAlert, emailAlertDocumentApproved, emailAlertDeviceAddedByUser } = require('../utils/mail')

const nodemailer = require('nodemailer')
var transport = nodemailer.createTransport(transportObject());

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
        logger.logToCloudWatch(formattedDate.toString(), `User sign up successfully ${req.body.email}`);
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
        logger.logToCloudWatch(formattedDate.toString(), `User Created`);

        return res.status(201).json({ message: 'User Created, please verify email' });

      })
      .catch((error) => {
        console.error(error)
        if (error.code === 'auth/email-already-in-use') {
          logger.logToCloudWatch(formattedDate.toString(), `Email already Used ${error}`);
          return res.status(409).json({ error: "Email already used, please sign in" });
        }
        logger.logToCloudWatch(formattedDate.toString(), `Failed to create user`);
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
    .then(async (user) => {


      if (user.user.emailVerified) {
        // var customToken = await admin.auth().createCustomToken(user.user.uid)
        return res.status(200).json(user);
      }
      else {
        return firebase.auth().currentUser.sendEmailVerification().then(() => {
          logger.logToCloudWatch(formattedDate.toString(), `Sign in failed due to email is not verified ${req.body.email}`);
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

        logger.logToCloudWatch(formattedDate.toString(), ` ${errorMessage}`);

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
    logger.logToCloudWatch(formattedDate.toString(), `New auth token generated sucessfully`);

    return res.status(200).json({ authToken: newToken });
  } catch (error) {
    console.error(error);
    logger.logToCloudWatch(formattedDate.toString(), ` ${error}`);
    return res.status(500).json({ error: 'Failed to refresh token' });
  }
};


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
        logger.logToCloudWatch(formattedDate.toString(), `OTP verified successfully`);

        res.status(200).json({ message: 'OTP verified successfully' });
      } else {
        // Invalid OTP code
        logger.logToCloudWatch(formattedDate.toString(), `Invalid OTP Code`);

        res.status(400).json({ error: 'Invalid OTP code' });
      }
    })
    .catch((error) => {
      // Handle errors, such as verification ID expiration
      logger.logToCloudWatch(formattedDate.toString(), `${error.message}`);

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
    console.log("Will Create mongo user bunny");
    console.log(req.body.name)

    console.log(req.body.role)
    const createUserResult = await exports.createMongoUser({
      name: req.body.name, //firebase does not responde with displayName so used body
      email: req.user.email,
      _id: req.user.uid,
      profile_exist: false,
      env_exist: false,
      role: req.body.role,
      phone: req.user.phone_number,
    });

    if (createUserResult === 1) {
      // User created successfully
      // Example: Call createSensorDocs to create sensor documents
      const sensorData = {
        _id: req.user.uid,
        heartSensor: { value: 0, timestamp: '0', unit: '', range: '' }, // Modify this based on your requirements
        BreathRateSensor: { value: 0, timestamp: '0', unit: '', range: '' },
        VentilatonSensor: { value: 0, timestamp: '0', unit: '', range: '' },
        TidalVolumeSensor: { value: 0, timestamp: '0', unit: '', range: '' },
        ActivitySensor: { value: 0, timestamp: '0', unit: '', range: '' },
        CadenceSensor: { value: 0, timestamp: '0', unit: '', range: '' },
        TemperatureSensor: { value: 0, timestamp: '0', unit: '', range: '' },
        OxygenSaturationSensor: { value: 0, timestamp: '0', unit: '', range: '' },
        BloodPressureSensor: { value: 0, timestamp: '0', unit: '', range: '' },

        location: { lat: 28.6131663, lon: 77.2278253, timestamp: '' },

      };

      await exports.createSensorDocs(sensorData);

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
    // Check if a user with the same authId already exists in MongoDB
    const existingUser = await InitialUser.findOne({ _id: user._id });

    if (existingUser) {
      console.log("User already exists in MongoDB");
      return 2; // User already exists, return 2 for failure
    }

    // Create a new user with _id as an ObjectId
    const newInitialUser = new InitialUser(user);

    // Update roles if provided in req.body
    if (user.role) {
      newInitialUser.roles = [user.role]; // Set the roles field with the provided role
    }

    // Save the new user to the database
    await newInitialUser.save();

    // Check if the user's role is 'admin' and upsert an Admin schema
    if (user.role === 'admin') {
      await Admin.findByIdAndUpdate(
        user._id,
        { $setOnInsert: { _id: user._id } },
        { upsert: true, new: true }
      );
    }

    console.log("MongoDB User created successfully");
    return 1; // User created successfully, return 1 for success
  } catch (error) {
    console.error("Failed to create MongoDB user:", error);
    return 0; // Failed to create user, return 0 for failure
  }
};


// Get Mongo User
exports.getMongoUser = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const userData = {};

    // Search for the user in InitialUser schema
    const initialUser = await InitialUser.findOne({ _id: userId }).exec();
    if (initialUser) {
      userData.InitialUserSchema = initialUser;
    }

    // Search for the user in Profile schema
    const profile = await Profile.findOne({ _id: userId }).exec();
    if (profile) {
      userData.ProfileSchema = profile;
    }

    const admin = await Admin.findOne({ _id: userId }).exec();
    if (admin) {
      userData.AdminSchema = admin;
    }

    const user = await User.findOne({ _id: userId }).exec();
    if (user) {
      userData.UserSchema = user;
    }

    const environment = await Environment.findOne({ _id: userId }).exec();
    if (environment) {
      userData.EnvironmentSchema = environment;
    }

    // Check if userData is still an empty object
    if (Object.keys(userData).length === 0) {
      // Return a 404 Not Found status code
      return res.status(204).json({ error: "User data not found" });
    }

    // Return the collected data in a JSON format
    return res.status(200).json(userData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to get MongoDB user" });
  }
};


// Create Sensor Documents
exports.createSensorDocs = async (sensorData) => {
  try {
    // Create a new document for RealtimeSensorDoc
    const newRealtimeSensorDoc = new RealtimeSensorDoc(sensorData);
    await newRealtimeSensorDoc.save();

    // Create a new document for SensorDB
    const newSensorDB = new SensorDB({
      _id: sensorData._id,
      heartSensor: sensorData.heartSensor,
      BreathRateSensor: sensorData.BreathRateSensor,
      VentilatonSensor: sensorData.VentilatonSensor,
      TidalVolumeSensor: sensorData.TidalVolumeSensor,
      ActivitySensor: sensorData.ActivitySensor,
      CadenceSensor: sensorData.CadenceSensor,
      TemperatureSensor: sensorData.TemperatureSensor,
      OxygenSaturationSensor: sensorData.OxygenSaturationSensor,
      BloodPressureSensor: sensorData.BloodPressureSensor,
      location: sensorData.location,
    });
    await newSensorDB.save();

    console.log("Sensor documents created successfully");
    return 1; // Success
  } catch (error) {
    console.error("Failed to create sensor documents:", error);
    return 0; // Failure
  }
};

//update device Id
// update device Id
exports.updateDeviceId = async (req, res) => {
  try {
    // const id = req.user.uid
    const id = req.user.uid;
    const deviceIdToUpdate = req.body.deviceId;

    // Find the device by deviceId and update currentUserId
    const updatedDevice = await Device.findOneAndUpdate(
      { deviceId: deviceIdToUpdate },
      { currentUserId: id },
      { new: true } // to return the updated document
    );

    if (!updatedDevice) {
      return res.status(404).json({ error: "Device not found" });
    }

    const admin = await Admin.findOne({ deviceIds: deviceIdToUpdate });

    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }
    const initialDataAdmin = await InitialUser.findOne({ _id: admin._id })

    console.log(initialDataAdmin)

    await transport.sendMail(emailAlertDeviceAddedByUser(req.user.name, req.user.email, initialDataAdmin.name, initialDataAdmin.email, deviceIdToUpdate));


    return res.status(200).json({ msg: `Updated currentUserId for device ${deviceIdToUpdate}` });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to update device" });
  }
};
