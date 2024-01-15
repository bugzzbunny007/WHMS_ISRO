const express = require("express");
const router = express.Router();
const fetchUser = require("../middleware/fetchuser");
const isAdmin = require("../middleware/isAdmin");
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });
const { addUserToAdmin, removeUserFromAdmin, getUnallocatedUsers, getAdminUsers, getUserDocById, getDeviceIds, uploadDocument, getImageByToken, getDeviceData } = require("../controllers/admin");

// Define a POST route to create an admin user

router.post('/add-users', fetchUser, isAdmin, addUserToAdmin);

router.post('/remove-users', fetchUser, isAdmin, removeUserFromAdmin);

router.get('/get-unallocated-users', fetchUser, isAdmin, getUnallocatedUsers);

router.get('/get-added-users', fetchUser, isAdmin, getAdminUsers);

router.get('/getUserDocById', fetchUser, isAdmin, getUserDocById);

router.get('/getDeviceIds', fetchUser, isAdmin, getDeviceIds);

router.post("/uploadDocument", fetchUser, isAdmin, upload.single('file'), uploadDocument) // to do add validation

router.get("/getUserDocImage", fetchUser, isAdmin, getImageByToken);// to do add validation

router.post("/getDeviceData", getDeviceData);// to do add validation

module.exports = router;