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
} = require("../controllers/auth");

router.post("/signup", signup);

router.post("/signin", signin);

router.post("/verify-otp", verifyOTP);

router.post("/forget-password", forgetPassword);

router.get("/create-mongo-user", fetchUser, createMongoUser);

module.exports = router;
