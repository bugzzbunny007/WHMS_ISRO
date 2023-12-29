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
const environmentRoutes = require("./routes/environment");
const UserRoutes = require("./routes/User");
const alertRoutes = require("./routes/alerts");



// Middlewares
app.use(bodyParser.json());

// Use CORS middleware to allow requests from specific origins
app.use(cors({
  origin: "*", // Allow requests from any origin
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true // Enable credentials (cookies, authorization headers)
}));


// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/environment", environmentRoutes);
app.use("/api/user", UserRoutes);
app.use("/api/alerts", UserRoutes);

app.get("/", (req, res) => {
  res.send("API is running");
});

// PORT
const port = 3000;

// Get current date and time
const currentDate = new Date();
const formattedDate = currentDate.toISOString().split('T')[0];
const formattedTime = currentDate.toTimeString().split(' ')[0];

// Starting a server
app.listen(port, () => {
  console.log(`App is running at http://localhost:${port} | Branch S5 | Dated - ${formattedDate} | Time - ${formattedTime}`);
});