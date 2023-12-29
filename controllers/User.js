const express = require('express');
const mongoose = require('mongoose');

const fs = require('fs');
const app = express();
const InitialUser = require('../models/InitialUser');
const UserDocument = require('../models/UserDocument');
const { GridFSBucket } = require('mongodb');
const { Readable } = require('stream');

exports.findUserByEmail = async (req, res) => {
  try {
    const emailToFind = req.params.email;
    console.log("got emaIl", emailToFind);
    const existingUser = await InitialUser.findOne({ email: emailToFind });
    if (existingUser) {
      res.json({ existingUser, message: "User found" });
    } else {
      res.json({ message: 'User not found' });
    }
  } finally {
    console.log("Exectued finUSEREMAIL")
  }
};





exports.uploadDocument = async (req, res) => {
  try {
    const { originalname, buffer, mimetype } = req.file;
    const customId = req.user.uid; // pass normal id if not using token
    console.log(req.file);
    console.log(customId);

    const db = mongoose.connection.db;
    const bucket = new GridFSBucket(db, { bucketName: 'userdocuments' });

    // Check if a document with the given _id already exists
    const existingDocument = await UserDocument.findOne({ _id: customId });

    if (existingDocument) {
      // Handle the case where a document with the given _id already exists
      return res.status(409).json({ message: 'Document with the specified _id already exists' });
    }

    // Create a readable stream from the buffer
    const bufferStream = new Readable();
    bufferStream.push(buffer);
    bufferStream.push(null); // Signals the end of the stream

    // Manually set the _id field
    const userDocument = new UserDocument({
      _id: customId,
      originalname: originalname,
      filename: `${customId}_${originalname}`,
      contentType: mimetype,
    });

    // Save the user document to MongoDB
    await userDocument.save();

    const uploadStream = bucket.openUploadStream(userDocument.filename, {
      contentType: mimetype,
    });

    bufferStream.pipe(uploadStream);

    uploadStream.on('finish', () => {
      return res.json({ message: 'File uploaded successfully' });
    });
  } catch (err) {
    console.log(err);

    // Check for duplicate key error
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Duplicate key error. Document with the specified _id already exists.' });
    }

    return res.status(400).json({ message: 'Error uploading file', error: err });
  }
};

exports.getImageByToken = async (req, res) => {
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