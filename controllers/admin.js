const Admin = require("../models/Admin");
const User = require("../models/User");
const InitialUser = require("../models/InitialUser");
var mongoose = require('mongoose');
const { Types } = mongoose;

const addUserToAdmin = async (req, res) => {
  try {
    const { adminId, userIds } = req.body;

    // Find the admin by ID
    const admin = await Admin.findById(adminId);

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const addedUserIds = [];
    const notFoundUserIds = [];

    // Iterate through the provided user IDs
    for (const userId of userIds) {
      const user = await InitialUser.findById(userId);
      if (!user) {
        notFoundUserIds.push(userId);
      } else {
        // Add the user's ID to the admin's userIds if it doesn't already exist
        if (!admin.userIds.includes(userId)) {
          admin.userIds.push(userId);
          addedUserIds.push(userId);
        }
      }
    }

    // Save the updated admin document
    await admin.save();

    // Update the User schema with the admin ID for the added users
    for (const userId of addedUserIds) {
      await User.findOneAndUpdate(
        { _id: userId },
        { $set: { admin: adminId } },
        { upsert: true }
      );
    }

    const result = {
      message: 'User IDs added to admin successfully',
      addedUserIds,
      notFoundUserIds,
    };

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding user IDs to admin' });
  }
};

const removeUserFromAdmin = async (req, res) => {
  try {
    const { adminId, userIds } = req.body;

    // Find the admin by ID
    const admin = await Admin.findById(adminId);

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const removedUserIds = [];
    const notFoundUserIds = [];
    const notOwnedUserIds = [];

    // Iterate through the provided user IDs
    for (const userId of userIds) {
      const user = await InitialUser.findById(userId);

      if (!user) {
        notFoundUserIds.push(userId);
      } else {
        // Check if the user belongs to the admin
        if (!admin.userIds.includes(userId)) {
          notOwnedUserIds.push(userId);
        } else {
          // Remove the admin field from the User schema
          await User.findOneAndUpdate(
            { _id: userId },
            { $unset: { admin: 1 } }
          );

          // Update the role to "new" in the InitialUser schema
          user.role = 'new';
          await user.save();

          removedUserIds.push(userId);
        }
      }
    }

    // Remove the removed user IDs from the admin's userIds array
    admin.userIds = admin.userIds.filter((id) => !removedUserIds.includes(id));
    await admin.save();

    const result = {
      message: 'Users removed from admin successfully',
      removedUserIds,
      notFoundUserIds,
      notOwnedUserIds,
    };

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error removing users from admin' });
  }
};


module.exports = {
  addUserToAdmin, removeUserFromAdmin
};