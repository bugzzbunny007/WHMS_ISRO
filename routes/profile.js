const express = require("express");
const router = express.Router();
const fetchUser = require("../middleware/fetchuser");

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });

const {
    updateProfile,
    uploadDocument,
    getProfile
} = require("../controllers/profile");

router.post("/update-profile", fetchUser, updateProfile);

router.get("/get-profile", fetchUser, getProfile);

router.post("/uploadDocument", fetchUser, upload.single('file'), uploadDocument) // to do add validation

module.exports = router;