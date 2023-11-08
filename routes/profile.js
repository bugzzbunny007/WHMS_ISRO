const express = require("express");
const router = express.Router();
const fetchUser = require("../middleware/fetchuser");


const {
    updateProfile,

    getProfile
} = require("../controllers/profile");

router.post("/update-profile", fetchUser, updateProfile);

router.get("/get-profile", fetchUser, getProfile);


module.exports = router;