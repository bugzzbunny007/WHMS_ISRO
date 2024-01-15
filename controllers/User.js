const express = require('express');
const mongoose = require('mongoose');

const fs = require('fs');
const app = express();
const InitialUser = require('../models/InitialUser');


exports.findUserByEmail = async (req, res) => {
  try {
    console.log("In function findUserByEmail")
    const emailToFind = req.params.email;
    console.log("got emaIl", emailToFind);
    const existingUser = await InitialUser.findOne({ email: emailToFind });
    if (existingUser) {
      return res.status(200).json({ existingUser, message: "User found" });

    } else {
      return res.status(200).json({ message: 'User not found' });
    }
  } finally {
    console.log("Exectued finUSEREMAIL")
  }
};
