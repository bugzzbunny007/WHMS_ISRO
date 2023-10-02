const Admin = require("../models/Admin");
const InitialUser = require("../models/InitialUser");
var mongoose = require('mongoose');
const { Types } = mongoose;



const addUserToAdmin = async (req, res) => {
  try {

    const { adminId, userIds } = req.body;
    console.log(adminId, userIds)
    // Find the admin by ID
    const admin = await Admin.findById(adminId);

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    //TODO implement check to add remaining user if some users are not correct
    for (const id of userIds) {
      const user = await InitialUser.findById(id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
    }

    // Assuming admin is the admin document and userIds is the array of user IDs you want to add

    // Convert the existing admin.userIds to a Set for faster membership checks
    const existingUserIdsSet = new Set(admin.userIds);

    // Create a new Set with the selected user IDs
    const newUserIdsSet = new Set(userIds);

    // Iterate through the selected user IDs and add them to the existing set if they don't already exist
    for (const userId of newUserIdsSet) {
      if (!existingUserIdsSet.has(userId)) {
        admin.userIds.push(userId); // Add the user ID to the admin's userIds array
      }
    }

    // Save the updated admin document
    await admin.save();


    res.status(200).json({ message: 'User IDs added to admin successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding user IDs to admin' });
  }
};

module.exports = {
  addUserToAdmin
};