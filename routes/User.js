const express = require("express");
const router = express.Router();
const fetchUser = require("../middleware/fetchuser");


const {
    findUserByEmail, uploadDocument, getImageByToken
} = require("../controllers/User");

router.get("/findUserByEmail/:email", findUserByEmail);



module.exports = router;
