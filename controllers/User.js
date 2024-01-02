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
