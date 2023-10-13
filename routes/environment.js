const express = require("express");
const router = express.Router();
const fetchUser = require("../middleware/fetchuser");


const {
    updateEnvironment,
} = require("../controllers/environment");

router.post("/update-env", fetchUser, updateEnvironment);

module.exports = router;