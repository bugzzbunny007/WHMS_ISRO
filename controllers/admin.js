const Admin = require("../models/Admin");
const User = require("../models/User");
const Device = require("../models/Device");
const InitialUser = require("../models/InitialUser");
const Environment = require("../models/Environment");
const Profile = require("../models/Profile");
var mongoose = require('mongoose');
const { Types } = mongoose;
const logger = require('./logger');
const UserDocument = require('../models/UserDocument');
const { GridFSBucket } = require('mongodb');
const { Readable } = require('stream');

const today = new Date();
const formattedDate = today.toISOString().split('T')[0];
const addUserToAdmin = async (req, res) => {
  try {

    if (req.user.uid !== req.body.adminId) {
      await InitialUser.findOne({ _id: req.user.uid }).then((user) => {
        if (!user || user['roles'][0] !== 'superadmin') {
          return res.status(401).json({ error: "Unauthorized" });
        }
      })
    }
    const { adminId, userIds } = req.body;

    // Find the admin by ID
    const admin = await Admin.findById(adminId);

    if (!admin) {
      logger.logToCloudWatch(formattedDate.toString(), `Admin not found`);

      return res.status(404).json({ message: 'Admin not found' });
    }
    const addedUserIds = [];
    const notFoundUserIds = [];

    // Iterate through the provided user IDs
    for (const userId of userIds) {
      console.log(userId)
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
    console.log(addedUserIds[0])
    // await User.findOneAndUpdate(
    //   { _id: addedUserIds[0] },
    //   { $set: { admin: adminId } },
    //   { upsert: true }
    // );
    for (const userId of addedUserIds) {
      await User.findOneAndUpdate(
        { _id: userId },
        { $set: { admin: adminId } },
        { upsert: true }
      );
      await InitialUser.findOneAndUpdate({ _id: userId },
        { $set: { roles: ['user'] } },

      )
    }


    const result = {
      message: 'User IDs added to admin successfully',
      addedUserIds,
      notFoundUserIds,
    };

    res.status(200).json(result);
  } catch (error) {
    logger.logToCloudWatch(formattedDate.toString(), `${error.message}`);
    console.error(error);
    res.status(500).json({ message: 'Error adding user IDs to admin' });
  }
};

const removeUserFromAdmin = async (req, res) => {
  try {
    const { adminId, userIds } = req.body;
    console.log({ adminId, userIds })
    // Find the admin by ID

    const admin = await Admin.findById(adminId);

    if (!admin) {
      logger.logToCloudWatch(formattedDate.toString(), `Admin not found`);

      return res.status(404).json({ message: 'Admin not found' });
    }
    if (req.user.uid !== req.body.adminId) {
      await InitialUser.findOne({ _id: req.user.uid }).then((user) => {
        if (!user || user['roles'][0] !== 'superadmin') {
          return res.status(401).json({ error: "Unauthorized" });
        }
      })
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
          // Find and delete the user by their ID
          await User.findByIdAndDelete(userId);

          // Update the role to "new" in the InitialUser schema
          user.roles = ['unallocated']; // Set the roles to the default value

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
    logger.logToCloudWatch(formattedDate.toString(), `Error removing users from admin`);

    res.status(500).json({ message: 'Error removing users from admin' });
  }
};

const getUnallocatedUsers = async (req, res) => {
  try {
    const users = await InitialUser.find({ roles: 'unallocated' }); // Filter users by role
    res.status(200).json(users);
  } catch (error) {
    logger.logToCloudWatch(formattedDate.toString(), `Error fetching users ${error}`);
    console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
  }
}

const getAdminUsers = async (req, res) => {
  try {
    const adminId = req.body._id ? req.body._id : req.user.uid

    if (req.body._id) {
      await InitialUser.findOne({ _id: req.user.uid }).then((user) => {
        if (!user || user['roles'][0] !== 'superadmin') {
          return res.status(401).json({ error: "Unauthorized" });
        }
      })
    }
    const users = await User.find({ admin: adminId }); // Retrieve all users
    const userIds = users.map((user) => user._id); // Extract user IDs

    // Use the user IDs to find the corresponding InitialUser documents
    const initialUsers = await InitialUser.find({ _id: { $in: userIds } });

    res.status(200).json(initialUsers);
  } catch (error) {
    logger.logToCloudWatch(formattedDate.toString(), `Error fetching users ${error}`);
    console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
  }
}

const getUserDocById = async (req, res) => {
  try {
    const userId = req.body._id;
    const adminId = req.user.uid;

    // Check if the adminId exists
    const admin = await Admin.findOne({ _id: adminId });

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Check if userId belongs to the admin
    if (!admin.userIds.includes(userId)) {
      return res.status(401).json({ message: "Unauthorized: This user doesn't belong to you" });
    }

    const db = mongoose.connection.db;
    const bucket = new GridFSBucket(db, { bucketName: 'userdocuments' });

    // Find the UserDocument with the specified _id
    const userDocument = await UserDocument.findOne({ _id: userId });

    if (!userDocument) {
      return res.status(404).json({ message: 'User document not found' });
    }

    // Open a download stream for the UserDocument's file
    const downloadStream = bucket.openDownloadStreamByName(userDocument.filename);

    // Set response headers
    res.setHeader('Content-Type', userDocument.contentType);
    res.setHeader('Content-Disposition', `inline; filename=${userDocument.originalname}`);

    // Pipe the data from MongoDB to the response
    downloadStream.pipe(res);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: 'Error retrieving image', error: err });
  }
}

const uploadDocument = async (req, res) => {
  try {
    const { originalname, buffer, mimetype } = req.file;
    const customId = req.user.uid; // pass normal id if not using token
    console.log("in upload document")
    console.log(customId);

    const db = mongoose.connection.db;
    const bucket = new GridFSBucket(db, { bucketName: 'userdocuments' });

    // Find the existing document with the given _id
    const existingDocument = await UserDocument.findOne({ _id: customId });

    // If a document with the given _id already exists, update it
    if (existingDocument) {
      const updateResult = await UserDocument.findOneAndUpdate(
        { _id: customId },
        {
          originalname: originalname,
          filename: `${customId}_${originalname}`,
          contentType: mimetype,
        },
        { new: true } // Return the updated document
      );

      const uploadStream = bucket.openUploadStream(updateResult.filename, {
        contentType: mimetype,
      });

      const bufferStream = new Readable();
      bufferStream.push(buffer);
      bufferStream.push(null);

      bufferStream.pipe(uploadStream);
      const updatedDocUploadedField = await InitialUser.findOneAndUpdate(
        { _id: customId },
        { $set: { doc_uploaded: true } },
        { new: true } // Return the updated document
      );

      uploadStream.on('finish', () => {
        return res.json({ message: 'File uploaded successfully' });
      });
    } else {
      // If the document with the given _id doesn't exist, create a new one
      const bufferStream = new Readable();
      bufferStream.push(buffer);
      bufferStream.push(null);

      const userDocument = new UserDocument({
        _id: customId,
        originalname: originalname,
        filename: `${customId}_${originalname}`,
        contentType: mimetype,
      });

      await userDocument.save();

      const uploadStream = bucket.openUploadStream(userDocument.filename, {
        contentType: mimetype,
      });

      bufferStream.pipe(uploadStream);
      const updatedDocUploadedField = await InitialUser.findOneAndUpdate(
        { _id: customId },
        { $set: { doc_uploaded: true } },
        { new: true } // Return the updated document
      );
      uploadStream.on('finish', () => {
        return res.json({ message: 'File uploaded successfully' });
      });
    }
  } catch (err) {
    console.log(err);

    if (err.code === 11000) {
      return res
        .status(409)
        .json({
          message:
            'Duplicate key error. Document with the specified _id already exists.',
        });
    }

    return res
      .status(400)
      .json({ message: 'Error uploading file', error: err });
  }
};

const getImageByToken = async (req, res) => {
  try {
    const userId = req.user.uid;

    const db = mongoose.connection.db;
    const bucket = new GridFSBucket(db, { bucketName: 'userdocuments' });

    // Find the UserDocument with the specified _id
    const userDocument = await UserDocument.findOne({ _id: userId });

    if (!userDocument) {
      return res.status(404).json({ message: 'User document not found' });
    }

    // Open a download stream for the UserDocument's file
    const downloadStream = bucket.openDownloadStreamByName(userDocument.filename);

    // Set response headers
    res.setHeader('Content-Type', userDocument.contentType);
    res.setHeader('Content-Disposition', `inline; filename=${userDocument.originalname}`);

    // Pipe the data from MongoDB to the response
    downloadStream.pipe(res);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: 'Error retrieving image', error: err });
  }
};


const getDeviceIds = async (req, res) => {
  try {
    const adminId = req.user.uid;
    // Find the admin with the specified _id and populate the deviceIds
    const admin = await Admin.findOne({ _id: adminId }).populate('deviceIds');

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Extract deviceIds and associated device data from the found admin document
    const devices = admin.deviceIds || [];
    console.log(devices);

    // Retrieve the entire Device documents for the admin's device IDs
    const deviceDocuments = await Promise.all(devices.map(async (device) => {
      const deviceDocument = await Device.findOne({ deviceId: device });

      // Fetch data from other schemas using currentUserId
      const currentUserId = deviceDocument.currentUserId;

      const environmentData = await Environment.findOne({ _id: currentUserId });
      const initialUserData = await InitialUser.findOne({ _id: currentUserId });
      const profileData = await Profile.findOne({ _id: currentUserId });

      return {
        deviceId: device,
        deviceData: deviceDocument,
        environmentData,
        initialUserData,
        profileData,
      };
    }));

    // Return the entire device schema data and documents for the admin's device IDs
    return res.status(200).json({ devices: deviceDocuments });
  } catch (error) {
    logger.logToCloudWatch(formattedDate.toString(), `Error fetching deviceIds ${error}`);
    console.error(error);
    res.status(500).json({ message: 'Error fetching device data' });
  }
};



const getDeviceData = async (req, res) => {
  try {
    const deviceId = req.body.deviceId;
    const deviceData = await Device.findOne({ deviceId: "deviceId1" });

    if (!deviceData) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Extract currentUserId from deviceData
    const currentUserId = deviceData.currentUserId;

    // Query Environment collection using currentUserId
    const environmentData = await Environment.findOne({ _id: currentUserId });

    // Query InitialUser collection using currentUserId
    const initialUserData = await InitialUser.findOne({ _id: currentUserId });

    // Query Profile collection using currentUserId
    const profileData = await Profile.findOne({ _id: currentUserId });

    // Create a response object with the retrieved data
    const responseData = {
      deviceData,
      environmentData,
      initialUserData,
      profileData,
    };

    return res.status(200).json(responseData);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: 'Internal Server Error', error: err });
  }
};



module.exports = {
  addUserToAdmin, removeUserFromAdmin, getUnallocatedUsers, getAdminUsers, getUserDocById, getDeviceIds, getImageByToken, uploadDocument, getDeviceData,
};