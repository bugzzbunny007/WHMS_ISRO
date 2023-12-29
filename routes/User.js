const express = require("express");
const router = express.Router();
const fetchUser = require("../middleware/fetchuser");
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });

const {
    findUserByEmail, uploadDocument, getImageByToken
} = require("../controllers/User");

router.get("/findUserByEmail/:email", findUserByEmail);

// router.post("/uploadDocument", fetchUser, upload.single('file'), uploadDocument) // to do add validation

// router.get("/getUserDocImage", fetchUser, getImageByToken);// to do add validation

module.exports = router;
