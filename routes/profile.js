const express = require("express");
const router = express.Router();
const fetchUser = require("../middleware/fetchuser");

const {
    updateProfile,
} = require("../controllers/profile");

router.post("/update-profile", fetchUser, updateProfile);

module.exports = router;
