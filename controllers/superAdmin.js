const InitialUser = require("../models/InitialUser");
const Admin = require("../models/Admin");
var mongoose = require('mongoose');
const { Types } = mongoose;

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
                            Admin.findOneAndUpdate({ _id: req.body._id }, { _id: req.body._id, maxUserCount: req.body.maxUserCount, userIds: req.body.userIds }, { new: true, upsert: true })
                                .then((updatedUser) => {
                                    // User updated successfully
                                    console.log('Admin updated:', updatedUser);
                                    res.status(200).json({ message: 'Admin updated successfully' });
                                })
                                .catch((error) => {
                                    console.error('Error updating user:', error);
                                    res.status(500).json({ message: 'Error updating Admin' });
                                });

                        } else {
                            // Admin doesn't exist, create a new admin
                            console.log('admin not exists')
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
                                    res.status(500).json({ message: 'Error creating admin' });
                                });
                        }
                    })
                        .catch((error) => {
                            console.error('Error finding admin:', error);
                            res.status(500).json({ message: 'Error finding admin' });
                        });


                    // return res.status(200).json({ message: 'Role admin added to the user.' });
                }).catch((err) => {
                    console.log(err)
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
        res.status(500).json({ message: 'Error creating admin user' });
    }
};

module.exports = {
    createAdmin
};