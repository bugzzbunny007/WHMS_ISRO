const express = require("express");
const router = express.Router();
const fetchUser = require("../middleware/fetchuser");


const {
    updateProfile,
    getUser,
} = require("../controllers/profile");

router.post("/update-profile", fetchUser, updateProfile);

//READ
router.get("/getUser", fetchUser, (req, res) => {
    res.json({ user: req.user });
});

module.exports = router;