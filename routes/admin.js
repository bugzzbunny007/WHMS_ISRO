const express = require("express");
const router = express.Router();
const fetchUser = require("../middleware/fetchuser");
const isAdmin = require("../middleware/isAdmin");
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });
const { addUserToAdmin, removeUserFromAdmin, getUnallocatedUsers, getAdminUsers, getUserDocById, getDeviceIds, getImageByToken, getDeviceData, getSensorDB, getLocation, getGraphData, sendEmailPDF, observePDF } = require("../controllers/admin");

// Define a POST route to create an admin user

router.post('/add-users', fetchUser, isAdmin, addUserToAdmin);

router.post('/remove-users', fetchUser, isAdmin, removeUserFromAdmin);

router.get('/get-unallocated-users', fetchUser, isAdmin, getUnallocatedUsers);

router.get('/get-added-users', fetchUser, isAdmin, getAdminUsers);

router.get('/getUserDocById', fetchUser, isAdmin, getUserDocById);

router.get('/getDeviceIds', fetchUser, isAdmin, getDeviceIds);

router.get("/getUserDocImage", fetchUser, isAdmin, getImageByToken);// to do add validation

router.post("/getDeviceData", getDeviceData);// to do add validation

router.post("/getSensordb", fetchUser, isAdmin, getSensorDB);// to do add validation

router.post("/getLocation", fetchUser, isAdmin, getLocation);// to do add validation

router.post("/getGraphData", getGraphData);// to do add validation

router.post("/sendEmailPdf", sendEmailPDF);

router.get("/observePDF", observePDF);


module.exports = router;