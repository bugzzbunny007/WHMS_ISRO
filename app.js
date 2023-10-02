const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors"); // Import the cors package

const connectDB = require('./db');
connectDB();

const firebase = require("./config/firebase");
var admin = require("firebase-admin");
var serviceAccount = require("./serviceAccount.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();

// Routes
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const adminRoutes = require("./routes/admin")
const superAdminRoutes = require("./routes/superAdmin")

// Middlewares
app.use(bodyParser.json());

// Use CORS middleware to allow requests from specific origins
app.use(cors({
  origin: "http://localhost:5173", // Replace with your client's origin
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true // Enable credentials (cookies, authorization headers)
}));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/superadmin", superAdminRoutes);

// PORT
const port = 3000;

// Starting a server
app.listen(port, () => {
  console.log(`app is running at http://localhost:${port}`);
});