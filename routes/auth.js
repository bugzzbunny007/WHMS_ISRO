const express = require("express");
const router = express.Router();

const {
  signup,
  signin,
  forgetPassword,
  signInTokenVerify,
  sendOTP,
  verifyOTP,
  verifyEmail,
} = require("../controllers/auth");

router.post("/signup", signup);

router.post("/signin", signin);

router.post("/signin-verify",signInTokenVerify); 

router.post("/verify-otp",verifyOTP); 


router.post("/forget-password", forgetPassword);


module.exports = router;
