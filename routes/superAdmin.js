const express = require("express");
const router = express.Router();
const fetchUser = require("../middleware/fetchuser");
const isSuperAdmin = require("../middleware/isSuperAdmin");
const { createAdmin, testingFunction, removeAdmin, fetchAllUsers } = require("../controllers/superAdmin");


// Define a POST route to create an admin user
router.post('/upsertadmin', fetchUser, isSuperAdmin, createAdmin);

router.post('/removeadmin', fetchUser, isSuperAdmin, removeAdmin);

router.get('/getallusers', fetchUser, isSuperAdmin, fetchAllUsers);

// TODO Remove admin privilege

router.post('/testing', fetchUser, testingFunction);

module.exports = router;