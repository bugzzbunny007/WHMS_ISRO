const express = require("express");
const router = express.Router();
const fetchUser = require("../middleware/fetchuser");


const {
    updateProfile,
    getUser,
    getProfile
} = require("../controllers/profile");

router.post("/update-profile", fetchUser, updateProfile);

router.get("/get-profile", fetchUser, getProfile);

//READ
router.get("/getUser", fetchUser, (req, res) => {
    res.json({ user: req.user });
});

module.exports = router;