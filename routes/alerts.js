const express = require("express");
const router = express.Router();
const fetchUser = require("../middleware/fetchuser");
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });

const {

    sendAlert
} = require("../controllers/alerts");

router.post("/sendAlert", sendAlert);


module.exports = router;
