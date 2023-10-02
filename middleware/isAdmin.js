// Import the Admin model and userRoles
const Admin = require('../models/admin');

// Define the isAdmin middleware
const isAdmin = async (req, res, next) => {
  try {
    const userId = req.user._id; // Assuming you have a user object in the request

    // Find the admin with the same user ID and role "admin"
    const admin = await Admin.findOne({ _id: userId, role: 'admin' });

    if (!admin) {
      // If the user is not an admin, return a 403 Forbidden response
      return res.status(403).json({ message: 'Access denied. User is not an admin.' });
    }

    // If the user is an admin, you can proceed with the next middleware
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = isAdmin;
