const express = require("express");
const router = express.Router();
const fetchUser = require("../middleware/fetchuser");
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });

const {

    sendAlert, sendDocumentApprovedAlert
} = require("../controllers/alerts");

router.post("/sendAlert", fetchUser, sendAlert);

router.post("/sendDocumentApprovedAlert", fetchUser, sendDocumentApprovedAlert);


module.exports = router;
