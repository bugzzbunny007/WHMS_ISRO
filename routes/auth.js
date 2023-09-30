const express = require("express");
const router = express.Router();
const fetchUser = require("../middleware/fetchuser");

const {
  signup,
  signin,
  forgetPassword,
  signInTokenVerify,
  sendOTP,
  verifyOTP,
  verifyEmail,
  createMongoUser,
  refresh,
  createMongoUserEndpoint,
} = require("../controllers/auth");

router.post("/signup", signup);

router.post("/signin", signin);

router.post("/refresh", refresh);

router.post("/verify-otp", verifyOTP);

router.post("/forget-password", forgetPassword);

router.post("/create-mongo-user", fetchUser, createMongoUserEndpoint);

module.exports = router;
