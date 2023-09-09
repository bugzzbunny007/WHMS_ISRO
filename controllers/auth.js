const firebase = require("./../config/firebase");
var admin = require("firebase-admin");
var serviceAccount = require("../serviceAccount.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

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
    .then((data) => {
      firebase
      .auth()
      .currentUser.sendEmailVerification()
      return res.status(201).json(data);
    })
    .catch(function (error) {
      let errorCode = error.code;
      let errorMessage = error.message;
      if (errorCode == "auth/weak-password") {
        return res.status(500).json({ error: errorMessage });
      } else {
        return res.status(500).json({ error: errorMessage });
      }
    });
};

// Define a route for  Sign-In Verification
 exports.signInTokenVerify = (req, res) => {
  //client auth token will be verified from here authorization bearer token
  const idToken = req.query.idToken; 
  // const idToken="ya29.a0AfB_byCgmNjIY63OrLJZxRO9f0YPOGQG5K_WRyTH1p0xnFbTC_2FlB9FRn7zbESSYNziXFCHyoll0w9IAY6O9FqiaAnv20p4YY72E95NNeCHxJTvrw2r1nfQiZ5BXQJm4pMirLwVz5HwjrZD1XJsaHWNkq43D6mOVgaCgYKAXMSARESFQHsvYlseCAyaSfKsaqkHYZDOnr91Q0169"
  admin
    .auth()
    .verifyIdToken(idToken)
    .then((decodedToken) => {
      const uid = decodedToken.uid;
      // You can access the user's UID and other information here
      res.json({ uid });
    })
    .catch((error) => {
      // Handle sign-in errors
      res.status(500).json({ error: 'Sign-In failed' });
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
      
      return res.status(200).json(user);
    })
    .catch(function (error) {

      let errorCode = error.code;
      let errorMessage = error.message;
      if (errorCode === "auth/wrong-password") {
        return res.status(500).json({ error: errorMessage });
      } else {
        return res.status(500).json({ error: errorMessage });
      }
    });
};

// verify email
// this work after signup & signin
exports.verifyEmail = (req,res) => {
  firebase
    .auth()
    .currentUser.sendEmailVerification()
    .then(function () {
      return res.status(200).json({ status: "Email Verification Sent!" });
    })
    .catch(function (error) {
      let errorCode = error.code;
      let errorMessage = error.message;
      if (errorCode === "auth/too-many-requests") {
        return res.status(500).json({ error: errorMessage });
      }
    });
};


// Create an API endpoint for sending O
exports.verifyOTP = (req, res) => {
  const verificationId = req.body.verificationId; // Get the verification ID from the client
  const otpCode = req.body.otpCode; // Get the OTP code entered by the user

  // Use the verification ID and OTP code to verify the phone number
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
