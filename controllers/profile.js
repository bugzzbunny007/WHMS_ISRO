const firebase = require("../config/firebase");
const User = require('../models/User');
const Profile = require('../models/Profile');
const fetchUser = require("../middleware/fetchuser");
const logger = require('./logger');

var mongoose = require('mongoose');
const InitialUser = require('../models/InitialUser');
const today = new Date();
const formattedDate = today.toISOString().split('T')[0];
const UserDocument = require('../models/UserDocument');
const { GridFSBucket } = require('mongodb');
const { Readable } = require('stream');

// updateProfile
exports.updateProfile = async (req, res) => {

    const uid = req.user.uid
    const { dob, weight, gender, height } = req.body;
    console.log(req)
    console.log(req.body)
    // console.log(Datetime.now())
    // Use the upsert option to either update or insert the profile
    await Profile.updateOne(
        { _id: uid },
        {
            dob,
            weight, gender, height
        },
        { upsert: true }
    )
        .then(async (User) => {
            console.log(User);

            // Update profile_exist to true in InitialUser schema
            await InitialUser.findOneAndUpdate(
                { _id: uid },
                { $set: { profile_exist: true } },
                { upsert: true }
            ).exec();

            return res.status(200).json({ message: "Profile updated" });
        })
        .catch(function (error) {
            let errorMessage = error.message;
            logger.logToCloudWatch(formattedDate.toString(), `${errorMessage}`);
            console.log(errorMessage);
        });
};

// getProfile
exports.getProfile = async (req, res) => {

    console.log(req.user)

    await Profile.findOne({ _id: req.user.uid }).then((data) => {
        if (data) {
            return res.status(200).json(data)
        }
        else {
            return res.status(404).json({ message: "Profile Not Found" })
        }
    }).catch((err) => {
        return res.status(500).json(err)
    });
};

exports.uploadDocument = async (req, res) => {
    try {
        const { originalname, buffer, mimetype } = req.file;
        const customId = req.user.uid; // Assuming you're using UID from token
        const deptName = req.body.deptName; // Extract deptName from request body
        const orgName = req.body.orgName; // Extract deptName from request body

        console.log(deptName,orgName)
        const db = mongoose.connection.db;
        const bucket = new GridFSBucket(db, { bucketName: 'userdocuments' });

        // Find the existing document with the given _id
        const existingDocument = await UserDocument.findOne({ _id: customId });

        // Update or create user document
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

            // Update deptName field in InitialUser model
            const updatedDocUploadedField = await InitialUser.findOneAndUpdate(
                { _id: customId },
                {
                    $set: {
                        doc_uploaded: true,
                        deptName: deptName,// Update deptName field,
                        orgName: orgName //update org name
                    }
                },
                { new: true } // Return the updated document
            );

            uploadStream.on('finish', () => {
                return res.json({ message: 'File uploaded successfully' });
            });
        } else {
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

            // Update deptName field in InitialUser model
            const updatedDocUploadedField = await InitialUser.findOneAndUpdate(
                { _id: customId },
                {
                    $set: {
                        doc_uploaded: true,
                        deptName: deptName, // Update deptName field
                        orgName: orgName //update org name
                    }
                },
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