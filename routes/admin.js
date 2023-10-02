const express = require("express");
const router = express.Router();
const { createAdmin, addUserToAdmin } = require("../controllers/admin");

// Define a POST route to create an admin user
router.post('/:_id', createAdmin);

router.post('/add-users/:adminId', addUserToAdmin);

module.exports = router;