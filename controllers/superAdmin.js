const InitialUser = require("../models/InitialUser");
var mongoose = require('mongoose');
const User = require("../models/User");
const Admin = require("../models/Admin");
const { Types } = mongoose;


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
                                    logger.logToCloudWatch(formattedDate.toString(),`Admin Updated`);

                                    res.status(200).json({ message: 'Admin updated successfully' });
                                })
                                .catch((error) => {
                                    console.error('Error updating user:', error);
                                    res.status(500).json({ message: 'Error updating Admin' });
                                });

                        } else {
                            // Admin doesn't exist, create a new admin
                            console.log('admin not exists')
                            logger.logToCloudWatch(formattedDate.toString(),`admin not exists`);

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
                                    logger.logToCloudWatch(formattedDate.toString(),`Error creating admin:${error}`);

                                    res.status(500).json({ message: 'Error creating admin' });
                                });
                        }
                    })
                        .catch((error) => {
                            console.error('Error finding admin:', error);
                            logger.logToCloudWatch(formattedDate.toString(),`Error finding admin:${error}`);

                            res.status(500).json({ message: 'Error finding admin' });
                        });


                    // return res.status(200).json({ message: 'Role admin added to the user.' });
                }).catch((err) => {
                    console.log(err)
                    logger.logToCloudWatch(formattedDate.toString(),`Error finding admin:${err}`);
                    
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
        logger.logToCloudWatch(formattedDate.toString(),`Error creating admin:${error}`);

        res.status(500).json({ message: 'Error creating admin user' });
    }
};

const removeAdmin = async (req, res) => {
    try {

        if (!req.body._id) {
            return res.status(422).json({
                _id: "_id is required"
            });
        }

        const adminId = req.body._id;
      // Find the admin by ID

      
      const admin = await Admin.findById(adminId);
      console.log(admin);
      admin.delete();
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }
  
      const initialUser = await InitialUser.findById(adminId);
      
      if (initialUser) {
        initialUser.roles = ['new'];
        await initialUser.save();
      }

      console.log(initialUser.roles);
  
      const userDeletePromises = admin.userIds.map(async (userId) => {
        const deletedUser = await User.findByIdAndDelete(userId);
        return deletedUser;
      });
  
      const deletedUsers = await Promise.all(userDeletePromises);
  
      // Delete the admin from Admin model
    //   await admin.delete();
  
      res.status(200).json({
        message: 'Admin and associated users deleted successfully',
        deletedUsers,
      });
    } catch (error) {
      console.error(error);
      logger.logToCloudWatch(formattedDate.toString(),`Error removing admin and associated users ${error}`);
      
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
        logger.logToCloudWatch(formattedDate.toString(),`Error fetching users ${error}`);
        console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
    }
}

module.exports = {
    createAdmin, testingFunction, removeAdmin, fetchAllUsers
};