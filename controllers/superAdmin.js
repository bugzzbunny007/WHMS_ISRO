const InitialUser = require("../models/InitialUser");
var mongoose = require('mongoose');
const User = require("../models/User");
const Device = require("../models/Device");
const Admin = require("../models/Admin");
const { Types } = mongoose;
const logger = require('./logger');
const UserDocument = require('../models/UserDocument');
const { GridFSBucket } = require('mongodb');
const { Readable } = require('stream');
const Environment = require("../models/Environment");
const Profile = require("../models/Profile");
const RealtimeSensorDoc = require("../models/RealtimeSensorDoc");
const SensorDB = require("../models/SensorDB");
const { OTPMail, transportObject, verifiedMail, emailAlert, emailAlertDocumentApproved, emailAlertDeviceAddedByUser } = require('../utils/mail')

const nodemailer = require('nodemailer')
var transport = nodemailer.createTransport(transportObject());
const today = new Date();
const formattedDate = today.toISOString().split('T')[0];

const createAdmin = async (req, res) => {
    try {
        if (!req.body._id) {
            return res.status(422).json({
                _id: "_id is required"
            });
        }
        console.log(req.body._id)
        InitialUser.findOne({ _id: req.body._id }).then((data) => {
            console.log(data)
            if (data) {
                // User found, add "admin" role and save
                data.roles = ['admin'];
                data.save().then(() => {
                    console.log('Role "admin" added to the user.');
                    // Continue with other operations if needed

                    Admin.findOne({ _id: req.body._id }).then((admin) => {
                        if (admin) {
                            console.log('admin exists')
                            // Admin already exists, update the user data
                            Admin.findOneAndUpdate({ _id: req.body._id }, { _id: req.body._id, maxUserCount: req.body.maxUserCount }, { new: true, upsert: true })
                                .then((updatedUser) => {
                                    // User updated successfully
                                    console.log('Admin updated:', updatedUser);
                                    logger.logToCloudWatch(formattedDate.toString(), `Admin Updated`);

                                    res.status(200).json({ message: 'Admin updated successfully' });
                                })
                                .catch((error) => {
                                    console.error('Error updating user:', error);
                                    res.status(500).json({ message: 'Error updating Admin' });
                                });

                        } else {
                            // Admin doesn't exist, create a new admin
                            console.log('admin not exists')
                            logger.logToCloudWatch(formattedDate.toString(), `admin not exists`);

                            const newAdmin = new Admin({
                                _id: req.body._id,
                                maxUserCount: req.body.maxUserCount
                            });

                            newAdmin.save()
                                .then(() => {
                                    // Admin created successfully
                                    console.log('Admin created:', newAdmin);
                                    res.status(200).json({ message: 'Admin created successfully' });
                                })
                                .catch((error) => {
                                    console.error('Error creating admin:', error);
                                    logger.logToCloudWatch(formattedDate.toString(), `Error creating admin:${error}`);

                                    res.status(500).json({ message: 'Error creating admin' });
                                });
                        }
                    })
                        .catch((error) => {
                            console.error('Error finding admin:', error);
                            logger.logToCloudWatch(formattedDate.toString(), `Error finding admin:${error}`);

                            res.status(500).json({ message: 'Error finding admin' });
                        });


                    // return res.status(200).json({ message: 'Role admin added to the user.' });
                }).catch((err) => {
                    console.log(err)
                    logger.logToCloudWatch(formattedDate.toString(), `Error finding admin:${err}`);

                    return res.status(500).json({ message: 'Error updating user roles' });

                });
            } else {
                return res.status(404).json({ message: 'User Not Found' });
            }
        })
        // const adminData = {
        //     _id: req.params._id, // Get _id from the URL parameter
        //     name: req.body.name,
        //     email: req.body.email,
        //     phone: req.body.phone,
        //     role: req.body.role,
        // };

        // // Create the admin user
        // const admin = new Admin(adminData);

        // // Save the admin user to the database
        // await admin.save();

        // res.status(201).json({ message: 'Admin user created successfully' });
    } catch (error) {
        console.error(error);
        logger.logToCloudWatch(formattedDate.toString(), `Error creating admin:${error}`);

        res.status(500).json({ message: 'Error creating admin user' });
    }
};

const removeAdmin = async (req, res) => {
    try {
        if (!req.body._id) {
            return res.status(422).json({
                _id: "_id is required",
            });
        }

        const adminId = req.body._id;

        // Find the admin by ID
        const admin = await Admin.findById(adminId);

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        const initialUser = await InitialUser.findById(adminId);

        if (initialUser) {
            // Update the roles in InitialUser schema to 'unallocated'
            initialUser.roles = ['unallocated'];
            initialUser.save();
        }

        // Create an array of promises to delete users and update roles in InitialUser schema
        const userDeletePromises = admin.userIds.map(async (userId) => {
            // Delete the UserSchema for each userId
            await User.findByIdAndDelete(userId);

            // Update the role in InitialUser schema to 'unallocated'
            await InitialUser.findByIdAndUpdate(userId, { $set: { roles: ['unallocated'] } });
        });

        // Execute all the promises to delete users and update roles
        await Promise.all(userDeletePromises);

        // Use the remove() method to delete the admin document
        await Admin.deleteOne({ _id: adminId });

        res.status(200).json({
            message: 'Admin and associated users deleted successfully',
        });
    } catch (error) {
        console.error(error);
        logger.logToCloudWatch(formattedDate.toString(), `Error removing admin and associated users ${error}`);

        res.status(500).json({ message: 'Error removing admin and associated users' });
    }
};


const testingFunction = async (req, res) => {
    try {
        console.log(req.body)
        console.log(req.user)

        res.status(200).json({ msg: "OK" })
    } catch (err) {
        console.log(err);
    }
}

const fetchAllUsers = async (req, res) => {
    try {
        const users = await InitialUser.find(); // Retrieve all users
        res.status(200).json(users);
    } catch (error) {
        logger.logToCloudWatch(formattedDate.toString(), `Error fetching users ${error}`);
        console.error(error);
        res.status(500).json({ message: 'Error fetching users' });
    }
}

const approveAdminDocById = async (req, res) => {
    try {
        const adminID = req.body.adminID;

        // Update the doc_verified field to true for the specified adminID
        const updatedUser = await InitialUser.findOneAndUpdate(
            { _id: adminID },
            { $set: { doc_verified: true } },
            { new: true } // Return the updated document
        );
        console.log('207')
        console.log(updatedUser)
        if (!updatedUser) {
            return res.status(404).json({ message: 'Admin user not found' });
        }
        await transport.sendMail(emailAlertDocumentApproved(updatedUser.name, updatedUser.email));
        res.status(200).json({ msg: "Admin Docs approved", updatedUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating doc_verified field', error: error.message });
    }
}

const getDocById = async (req, res) => {
    try {
        const userId = req.body._id;

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

const addDeviceIdToAdmin = async (req, res) => {
    try {
        const adminId = req.body.adminId;
        const deviceIdsToAdd = req.body.deviceIds;

        // Check if any of the devices are already allocated to another admin
        const existingDevices = await Device.find({
            deviceId: { $in: deviceIdsToAdd },
            currentAdminId: { $ne: null },
        });

        // Store information about devices that are already allocated
        const allocatedDeviceIds = existingDevices.map(device => device.deviceId);

        // Find devices without a current admin and update their current admin to the new admin
        const devicesToUpdate = await Device.find({
            deviceId: { $in: deviceIdsToAdd },
            currentAdminId: null,
        });

        const updatedDeviceIds = devicesToUpdate.map(device => device.deviceId);
        const newDeviceIds = deviceIdsToAdd.filter(deviceId => !allocatedDeviceIds.includes(deviceId) && !updatedDeviceIds.includes(deviceId));

        // Update the devices to set currentAdminId to the new admin
        await Device.updateMany(
            { _id: { $in: devicesToUpdate.map(device => device._id) } },
            { $set: { currentAdminId: adminId } }
        );

        // Create a new device for each deviceId that doesn't exist
        const newDevices = newDeviceIds.map(deviceId => ({
            deviceId,
            currentAdminId: adminId,
        }));

        // Insert the new devices into the Device collection
        await Device.insertMany(newDevices);

        // Update the Admin document with the new deviceIds
        const updatedAdmin = await Admin.findByIdAndUpdate(
            adminId,
            { $addToSet: { deviceIds: { $each: deviceIdsToAdd } } },
            { new: true }
        );

        if (!updatedAdmin) {
            // Handle case where Admin with the given ID is not found
            console.log(`Admin with ID ${adminId} not found.`);
            return res.status(404).json({ message: `Admin with ID ${adminId} not found.` });
        }

        console.log(`Device IDs added to Admin with ID ${adminId}: ${updatedAdmin.deviceIds}`);

        // Provide details of added and not added device IDs
        const response = {
            message: 'Device IDs added successfully',
            newDeviceIds: newDeviceIds,
            updatedDeviceIds: updatedDeviceIds,
            notAddedDeviceIds: allocatedDeviceIds,
        };

        return res.status(200).json(response);
    } catch (error) {
        // Handle errors
        console.error(`Error adding device IDs to Admin ${error}`);
        return res.status(500).json({ message: 'Error adding device IDs', error: error.message });
    }
};


const removeDeviceIdFromAdmin = async (req, res) => {
    try {
        const adminId = req.body.adminId;
        const deviceIdsToRemove = req.body.deviceIds;

        // Update the devices to set currentAdminId to null when removing from the admin
        await Device.updateMany(
            { deviceId: { $in: deviceIdsToRemove }, currentAdminId: adminId },
            { $set: { currentAdminId: null } }
        );

        // Update the Admin document by pulling the deviceIds
        const updatedAdmin = await Admin.findByIdAndUpdate(
            adminId,
            { $pullAll: { deviceIds: deviceIdsToRemove } },
            { new: true }
        );

        if (!updatedAdmin) {
            // Handle case where Admin with the given ID is not found
            console.log(`Admin with ID ${adminId} not found.`);
            return res.status(404).json({ message: `Admin with ID ${adminId} not found.` });
        }

        console.log(`Device IDs removed from Admin with ID ${adminId}: ${updatedAdmin.deviceIds}`);
        return res.status(200).json({ message: 'Device IDs removed successfully', updatedAdmin });
    } catch (error) {
        // Handle errors
        console.error(`Error removing device IDs from Admin with ID ${adminId}: ${error}`);
        return res.status(500).json({ message: 'Error removing device IDs', error: error.message });
    }
};

const getAllAdmin = async (req, res) => {
    try {
        const admins = await InitialUser.aggregate([
            {
                $match: { roles: "admin" }
            },
            {
                $lookup: {
                    from: "admins", // The name of the Admin collection
                    localField: "_id",
                    foreignField: "_id",
                    as: "adminDetails"
                }
            }
        ]);

        return res.status(200).json({
            admins
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal Server Error', error: err });
    }
}

const disableAdmin = async (req, res) => {
    try {
        const adminId = req.body.adminId;
        const updatedAdmin = await Admin.findByIdAndUpdate(
            adminId,
            { $set: { accountEnabled: false } },
            { new: true }
        );

        if (!updatedAdmin) {
            // Handle case where Admin with the given ID is not found
            console.log(`Admin with ID ${adminId} not found.`);
            return res.status(404).json({ message: `Admin with ID ${adminId} not found.` });
        }

        console.log(`Admin with ID ${adminId} has been disabled: ${updatedAdmin}`);
        return res.status(200).json({ message: `Admin with ID ${adminId} has been disabled.`, updatedAdmin });
    } catch (error) {
        // Handle errors
        console.error(`Error disabling Admin with ID ${adminId}: ${error}`);
        return res.status(500).json({ message: `Error disabling Admin with ID ${adminId}.`, error: error.message });
    }
};

const enableAdmin = async (req, res) => {
    try {
        const adminId = req.body.adminId;
        const updatedAdmin = await Admin.findByIdAndUpdate(
            adminId,
            { $set: { accountEnabled: true } },
            { new: true }
        );

        if (!updatedAdmin) {
            // Handle case where Admin with the given ID is not found
            console.log(`Admin with ID ${adminId} not found.`);
            return res.status(404).json({ message: `Admin with ID ${adminId} not found.` });
        }

        console.log(`Admin with ID ${adminId} has been enabled: ${updatedAdmin}`);
        return res.status(200).json({ message: `Admin with ID ${adminId} has been enabled.`, updatedAdmin });
    } catch (error) {
        // Handle errors
        console.error(`Error enabling Admin with ID ${adminId}: ${error}`);
        return res.status(500).json({ message: `Error enabling Admin with ID ${adminId}.`, error: error.message });
    }
};


const deleteMongoUser = async (req, res) => {
    try {
        const userId = req.body._id;
        const deletedSchemas = [];

        // Delete from Admin collection
        const adminResult = await Admin.deleteOne({ _id: userId });
        if (adminResult.deletedCount > 0) {
            deletedSchemas.push('Admin');
        }

        // Delete from Environment collection
        const environmentResult = await Environment.deleteOne({ _id: userId });
        if (environmentResult.deletedCount > 0) {
            deletedSchemas.push('Environment');
        }

        // Delete from InitialUser collection
        const initialUserResult = await InitialUser.deleteOne({ _id: userId });
        if (initialUserResult.deletedCount > 0) {
            deletedSchemas.push('InitialUser');
        }

        // Delete from Profile collection
        const profileResult = await Profile.deleteOne({ _id: userId });
        if (profileResult.deletedCount > 0) {
            deletedSchemas.push('Profile');
        }

        // Delete from RealtimeSensorDoc collection
        const realtimeSensorResult = await RealtimeSensorDoc.deleteOne({ _id: userId });
        if (realtimeSensorResult.deletedCount > 0) {
            deletedSchemas.push('RealtimeSensorDoc');
        }

        // Delete from SensorDB collection
        const sensorDBResult = await SensorDB.deleteOne({ _id: userId });
        if (sensorDBResult.deletedCount > 0) {
            deletedSchemas.push('SensorDB');
        }

        // Delete from User collection
        const userResult = await User.deleteOne({ _id: userId });
        if (userResult.deletedCount > 0) {
            deletedSchemas.push('User');
        }

        return res.status(200).json({ msg: "Success", deletedSchemas });
    } catch (error) {
        // Handle errors
        console.log(error)
        return res.status(500).json({ message: `Error deleting ` });
    }
};

//addDeviceIdToAdmin,
//removeDeviceIdFromAdmin
module.exports = {
    createAdmin, testingFunction, removeAdmin, fetchAllUsers, approveAdminDocById, getDocById, addDeviceIdToAdmin, removeDeviceIdFromAdmin, getAllAdmin, disableAdmin, enableAdmin, deleteMongoUser
};

