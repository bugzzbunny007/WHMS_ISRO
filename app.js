const express = require("express");
const bodyParser = require("body-parser");

const connectDB = require('./db')
connectDB()

const firebase = require("./config/firebase");
var admin = require("firebase-admin");
var serviceAccount = require("./serviceAccount.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const app = express();

// Routes
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");

// Middlewares
app.use(bodyParser.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);

// PORT
const port = 3000;

// Starting a server
app.listen(port, () => {
  console.log(`app is running at ${port}`);
});
