const express = require("express");
const router = express.Router();
const { addUserToAdmin } = require("../controllers/admin");

// Define a POST route to create an admin user

router.post('/add-users', addUserToAdmin);

module.exports = router;