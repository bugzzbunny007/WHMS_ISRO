const Admin = require("../models/Admin");
var mongoose = require('mongoose');
const { Types } = mongoose;

const createAdmin = async (req, res) => {
    try {
      const adminData = {
        _id: req.params._id, // Get _id from the URL parameter
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        role: req.body.role ,
      };
  
      // Create the admin user
      const admin = new Admin(adminData);
  
      // Save the admin user to the database
      await admin.save();
  
      res.status(201).json({ message: 'Admin user created successfully', admin });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error creating admin user' });
    }
  };

  const addUserToAdmin = async (req, res) => {
    try {
        const adminId = req.params.adminId;
        const { userIds } = req.body;
    
        // Find the admin by ID
        const admin = await Admin.findById(adminId);
    
        if (!admin) {
          return res.status(404).json({ message: 'Admin not found' });
        }
    
        // Add the selected user IDs to the admin's userIds array
        admin.userIds = [...admin.userIds, ...userIds];
    
        // Save the updated admin document
        await admin.save();
    
        res.status(200).json({ message: 'User IDs added to admin successfully', admin });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error adding user IDs to admin' });
      }
  };
  
  module.exports = {
    createAdmin, addUserToAdmin
  };