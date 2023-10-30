const express = require("express");
const router = express.Router();
const fetchUser = require("../middleware/fetchuser");


const {
    updateEnvironment, fetchEnvironment
} = require("../controllers/environment");

router.post("/update-env", fetchUser, updateEnvironment);
router.get("/get-env", fetchUser, fetchEnvironment);

module.exports = router;