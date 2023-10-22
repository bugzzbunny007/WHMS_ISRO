const express = require("express");
const router = express.Router();
const fetchUser = require("../middleware/fetchuser");
const isAdmin = require("../middleware/isAdmin");
const { addUserToAdmin, removeUserFromAdmin } = require("../controllers/admin");

// Define a POST route to create an admin user

router.post('/add-users', fetchUser, isAdmin, addUserToAdmin);

router.post('/remove-users', fetchUser, isAdmin, removeUserFromAdmin);


module.exports = router;