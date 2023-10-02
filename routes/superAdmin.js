const express = require("express");
const router = express.Router();
const fetchUser = require("../middleware/fetchuser");
const isSuperAdmin = require("../middleware/isSuperAdmin");
const { createAdmin } = require("../controllers/superAdmin");

// Define a POST route to create an admin user
router.post('/upsertadmin', fetchUser, isSuperAdmin, createAdmin);

// TODO Remove admin privilege

// router.post('/add-users/:adminId', addUserToAdmin);

module.exports = router;