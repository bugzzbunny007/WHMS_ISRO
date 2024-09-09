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
const SensorDB = require("./models/SensorDB")
const sensorRoutes = require("./routes/sensor");
const { observePDF } = require("./controllers/admin");



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
app.use("/observePDF", observePDF)
app.use("/api/profile", profileRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/environment", environmentRoutes);
app.use("/api/user", UserRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/sensor", sensorRoutes);

// Get current date and time
const currentDate = new Date();
const formattedDate = currentDate.toISOString().split('T')[0];
const formattedTime = currentDate.toTimeString().split(' ')[0];

app.get("/", (req, res) => {
  res.send(`API is running | Branch S5 | Dated - ${formattedDate} | Time - ${formattedTime}`);
})

// PORT
const port = 3000;
// Starting a server
const server = app.listen(port, () => {
  console.log(`App is running at http://localhost:${port}`);
});


// const io = require('socket.io')(server, {
//   cors: {
//     origin: "http://localhost:5173"
//   },
// });
// let sensorData;
// io.on("connection", (socket) => {
//   try {
//     console.log("Connected to socket");
//     socket.on("setup", async (id) => {
//       socket.join(id);
//       // console.log(id);
//       sensorData = await SensorDB.findOne({ _id: id });
//       if (sensorData !== null) {
//         socket.emit("initialDatahttps://whms-dash-2pl445uln-piyushjagtap22.vercel.app/Default", { message: sensorData.heartSensor });
//       }
//     })

//     const changeStream = SensorDB.watch();

//     changeStream.on("change", async (change) => {
//       // console.log("Change detected in MongoDB collection:", change.documentKey._id);
//       // Emit the changed data to all connected clients
//       sensorData = await SensorDB.findOne({ _id: change.documentKey._id });
//       // console.log(sensorData);
//       io.emit("dataChange", { message: "Data change detected", data: sensorData });
//     });
//   } catch (err) {
//     console.log(err)
//   }
// });
