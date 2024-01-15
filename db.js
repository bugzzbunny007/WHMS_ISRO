const mongoose = require('mongoose');
require("dotenv").config()

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI_TEST, {
        });
        console.log("Connected to MongoDb")
    } catch (err) {
        console.log("Here")
        console.error(err.message);
        // Exit process with failure
        process.exit(1);
    }
};

module.exports = connectDB;