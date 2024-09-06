const Admin = require("../models/Admin");
const User = require("../models/User");
const Device = require("../models/Device");
const InitialUser = require("../models/InitialUser");
const Environment = require("../models/Environment");
const Profile = require("../models/Profile");
var mongoose = require('mongoose');

const { Types } = mongoose;
const logger = require('./logger');
const UserDocument = require('../models/UserDocument');
const { GridFSBucket } = require('mongodb');
const { Readable } = require('stream');
const SensorDB = require("../models/SensorDB");

const nodemailer = require('nodemailer');

const { transportObject } = require('../utils/mail')
var transport = nodemailer.createTransport(transportObject());
// const path = require('path');
const today = new Date();
const formattedDate = today.toISOString().split('T')[0];

// const axios = require('axios');
// const PDFDocument = require('pdfkit');

// we can this function into getGraphdata also but it needs
async function fetchGraphData(id, sensorType, startTimeStamp, endTimeStamp) {
  function filterTimestampsInRange(sensorData, sensorType, startTimeStamp, endTimeStamp) {
    const filteredTimestamps = sensorData[sensorType].filter(dataPoint => {
      const dataPointTimestamp = new Date(dataPoint.timestamp).getTime();
      return dataPointTimestamp >= startTimeStamp && dataPointTimestamp <= endTimeStamp;
    });

    return filteredTimestamps; // An array containing objects with qualifying timestamps
  }

  const SensorData = await SensorDB.findOne({ _id: id });
  if (!SensorData) {
    throw new Error('Data not found');
  }

  const filteredTimestamps = filterTimestampsInRange(SensorData, sensorType, startTimeStamp, endTimeStamp);
  return filteredTimestamps;
}

const addUserToAdmin = async (req, res) => {
  try {

    if (req.user.uid !== req.body.adminId) {
      await InitialUser.findOne({ _id: req.user.uid }).then((user) => {
        if (!user || user['roles'][0] !== 'superadmin') {
          return res.status(401).json({ error: "Unauthorized" });
        }
      })
    }
    const { adminId, userIds } = req.body;

    // Find the admin by ID
    const admin = await Admin.findById(adminId);

    if (!admin) {
      logger.logToCloudWatch(formattedDate.toString(), `Admin not found`);

      return res.status(404).json({ message: 'Admin not found' });
    }
    const addedUserIds = [];
    const notFoundUserIds = [];

    // Iterate through the provided user IDs
    for (const userId of userIds) {
      console.log(userId)
      const user = await InitialUser.findById(userId);
      if (!user) {
        notFoundUserIds.push(userId);
      } else {
        // Add the user's ID to the admin's userIds if it doesn't already exist
        if (!admin.userIds.includes(userId)) {
          admin.userIds.push(userId);
          addedUserIds.push(userId);
        }
      }
    }

    // Save the updated admin document
    await admin.save();
    // Update the User schema with the admin ID for the added users
    console.log(addedUserIds[0])
    // await User.findOneAndUpdate(
    //   { _id: addedUserIds[0] },
    //   { $set: { admin: adminId } },
    //   { upsert: true }
    // );
    for (const userId of addedUserIds) {
      await User.findOneAndUpdate(
        { _id: userId },
        { $set: { admin: adminId } },
        { upsert: true }
      );
      await InitialUser.findOneAndUpdate({ _id: userId },
        { $set: { roles: ['user'] } },

      )
    }


    const result = {
      message: 'User IDs added to admin successfully',
      addedUserIds,
      notFoundUserIds,
    };

    res.status(200).json(result);
  } catch (error) {
    logger.logToCloudWatch(formattedDate.toString(), `${error.message}`);
    console.error(error);
    res.status(500).json({ message: 'Error adding user IDs to admin' });
  }
};

const removeUserFromAdmin = async (req, res) => {
  try {
    const { adminId, userIds } = req.body;
    console.log({ adminId, userIds })
    // Find the admin by ID

    const admin = await Admin.findById(adminId);

    if (!admin) {
      logger.logToCloudWatch(formattedDate.toString(), `Admin not found`);

      return res.status(404).json({ message: 'Admin not found' });
    }
    if (req.user.uid !== req.body.adminId) {
      await InitialUser.findOne({ _id: req.user.uid }).then((user) => {
        if (!user || user['roles'][0] !== 'superadmin') {
          return res.status(401).json({ error: "Unauthorized" });
        }
      })
    }

    const removedUserIds = [];
    const notFoundUserIds = [];
    const notOwnedUserIds = [];

    // Iterate through the provided user IDs
    for (const userId of userIds) {
      const user = await InitialUser.findById(userId);

      if (!user) {
        notFoundUserIds.push(userId);
      } else {
        // Check if the user belongs to the admin
        if (!admin.userIds.includes(userId)) {
          notOwnedUserIds.push(userId);
        } else {
          // Find and delete the user by their ID
          await User.findByIdAndDelete(userId);

          // Update the role to "new" in the InitialUser schema
          user.roles = ['unallocated']; // Set the roles to the default value

          await user.save();

          removedUserIds.push(userId);
        }
      }
    }

    // Remove the removed user IDs from the admin's userIds array
    admin.userIds = admin.userIds.filter((id) => !removedUserIds.includes(id));
    await admin.save();

    const result = {
      message: 'Users removed from admin successfully',
      removedUserIds,
      notFoundUserIds,
      notOwnedUserIds,
    };

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    logger.logToCloudWatch(formattedDate.toString(), `Error removing users from admin`);

    res.status(500).json({ message: 'Error removing users from admin' });
  }
};

const getUnallocatedUsers = async (req, res) => {
  try {
    const users = await InitialUser.find({ roles: 'unallocated' }); // Filter users by role
    res.status(200).json(users);
  } catch (error) {
    logger.logToCloudWatch(formattedDate.toString(), `Error fetching users ${error}`);
    console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
  }
}

const getAdminUsers = async (req, res) => {
  try {
    const adminId = req.body._id ? req.body._id : req.user.uid

    if (req.body._id) {
      await InitialUser.findOne({ _id: req.user.uid }).then((user) => {
        if (!user || user['roles'][0] !== 'superadmin') {
          return res.status(401).json({ error: "Unauthorized" });
        }
      })
    }
    const users = await User.find({ admin: adminId }); // Retrieve all users
    const userIds = users.map((user) => user._id); // Extract user IDs

    // Use the user IDs to find the corresponding InitialUser documents
    const initialUsers = await InitialUser.find({ _id: { $in: userIds } });

    res.status(200).json(initialUsers);
  } catch (error) {
    logger.logToCloudWatch(formattedDate.toString(), `Error fetching users ${error}`);
    console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
  }
}

const getUserDocById = async (req, res) => {
  try {
    const userId = req.body._id;
    const adminId = req.user.uid;

    // Check if the adminId exists
    const admin = await Admin.findOne({ _id: adminId });

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Check if userId belongs to the admin
    if (!admin.userIds.includes(userId)) {
      return res.status(401).json({ message: "Unauthorized: This user doesn't belong to you" });
    }

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
}

const getImageByToken = async (req, res) => {
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

const getDeviceIds = async (req, res) => {
  try {
    const adminId = req.user.uid;
    const admin = await Admin.findOne({ _id: adminId }).populate('deviceIds');
    console.log(admin)
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const devices = admin.deviceIds || [];
    // console.log()
    const data = await Device.find();
    console.log(data);
    const deviceDocuments = await Promise.all(devices.map(async (device) => {
      const deviceDocument = await Device.findOne({ deviceId: device });
      console.log(deviceDocument)
      const currentUserId = deviceDocument.currentUserId;

      const environmentData = await Environment.findOne({ _id: currentUserId });
      const initialUserData = await InitialUser.findOne({ _id: currentUserId });
      const profileData = await Profile.findOne({ _id: currentUserId });

      return {
        deviceId: device,

        timeStamp: deviceDocument.timeStamp,
        _id: deviceDocument._id,
        deviceId: deviceDocument.deviceId,
        currentUserId: deviceDocument.currentUserId,
        currentAdminId: deviceDocument.currentAdminId,
        heartSensor: deviceDocument.heartSensor,
        BreathRateSensor: deviceDocument.BreathRateSensor,
        VentilatonSensor: deviceDocument.VentilatonSensor,
        TidalVolumeSensor: deviceDocument.TidalVolumeSensor,
        ActivitySensor: deviceDocument.ActivitySensor,
        CadenceSensor: deviceDocument.CadenceSensor,
        TemperatureSensor: deviceDocument.TemperatureSensor,
        OxygenSaturationSensor: deviceDocument.OxygenSaturationSensor,
        BloodPressureSensor: deviceDocument.BloodPressureSensor,
        location: deviceDocument.location,
        __v: deviceDocument.__v,

        initialUserData,
        environmentData,
        profileData,
      };
    }));

    const response = {
      devices,
      deviceDocuments,
    };

    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};




const getDeviceData = async (req, res) => {
  try {
    const deviceId = req.body.deviceId;
    const deviceData = await Device.findOne({ deviceId: deviceId });
    console.log("in get device data")
    if (!deviceData) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Extract currentUserId from deviceData
    const currentUserId = deviceData.currentUserId;

    // Query Environment collection using currentUserId
    const environmentData = await Environment.findOne({ _id: currentUserId });

    // Query InitialUser collection using currentUserId
    const initialUserData = await InitialUser.findOne({ _id: currentUserId });

    // Query Profile collection using currentUserId
    const profileData = await Profile.findOne({ _id: currentUserId });

    // Create a response object with the retrieved data
    const responseData = {
      deviceData,
      environmentData,
      initialUserData,
      profileData,
    };
    console.log(responseData)
    return res.status(200).json(responseData);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: 'Internal Server Error', error: err });
  }
};


const getSensorDB = async (req, res) => {
  try {
    const id = req.body.id;
    console.log(id)
    console.log("in get Sensor DB")

    const SensorDBData = await SensorDB.findOne({ _id: id });

    if (!SensorDBData) {
      return res.status(404).json({ message: 'Data not found' });
    }

    return res.status(200).json(SensorDBData);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: 'Internal Server Error', error: err });
  }
};

const getLocation = async (req, res) => {
  try {
    const id = req.body.currentUserId;


    const DeviceData = await Device.findOne({ currentUserId: id });

    if (!DeviceData) {
      return res.status(404).json({ message: 'Data not found' });
    }
    return res.status(200).json(DeviceData.location);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: 'Internal Server Error', error: err });
  }
};

const getGraphData = async (req, res) => {
  try {
    // this endpoint takes if for sensorDB and startTimeStamp and endTimeStamp,
    // finds all data points available between that, and returns the data 
    // timestamp in unix epoch time
    function convertToTimestamp(dateTimeString) {
      if (!dateTimeString && dateTimeString !== 0) {
        throw new Error('dateTimeString is undefined or null');
      }

      if (dateTimeString === 0) {
        return 0;
      }

      // Create a new Date object from the dateTimeString
      const dateObj = new Date(dateTimeString);

      // Return the Unix epoch time in milliseconds
      return dateObj.getTime();
    }



    function filterDataInRange(sensorData, sensorType, startTimeStamp, endTimeStamp) {
      const filteredData = sensorData[sensorType].filter(dataPoint => {
        const dataPointTimestamp = dataPoint.timestamp;

        try {
          const timestamp = convertToTimestamp(dataPointTimestamp);
          console.log(`Data point timestamp: ${dataPointTimestamp}, Timestamp: ${timestamp}`);
          return timestamp >= startTimeStamp && timestamp <= endTimeStamp;
        } catch (error) {
          console.error(`Error converting timestamp: ${dataPointTimestamp}`, error);
          return false; // Filter out data points with invalid timestamps
        }
      });

      console.log(`Filtered data length: ${filteredData.length}`);
      return filteredData;
    }





    console.log(req.body)

    const startTimeStamp = req.body.startTimeStamp;
    const endTimeStamp = req.body.endTimeStamp;
    const sensorType = req.body.sensorType;
    console.log(startTimeStamp, endTimeStamp)

    console.log("timestamps")
    console.log(startTimeStamp, endTimeStamp, sensorType)
    // Input Validation
    if (!sensorType) {
      return res.status(400).json({ message: 'Sensor type is required' });
    }

    if (startTimeStamp >= endTimeStamp) {
      return res.status(400).json({ message: 'Start time must be before end time' });
    }

    // Check if startTime is in the past
    const now = new Date().getTime();
    if (startTimeStamp > now) {
      return res.status(400).json({
        message: 'Start time cannot be in the future',
        requiredAccessCode
      });
    }

    console.log(new Date().getTime())
    const SensorData = await SensorDB.findOne({ _id: req.body.id });
    if (!SensorData) {
      return res.status(404).json({ message: 'Data not found' });
    }


    const filteredTimestamps = filterDataInRange(SensorData, sensorType, startTimeStamp, endTimeStamp);
    console.log(filteredTimestamps.length)
    // console.log(SensorData["BloodPressureSensor"][100]["timestamp"])

    return res.status(200).json(filteredTimestamps);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: 'Internal Server Error', error: err });
  }
};

// const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');
const chrome = require('@sparticuz/chromium');
const production = process.env.NODE_ENV === 'production';
// const stealth = require('puppeteer-extra-plugin-stealth');
const https = require('https');

const sendEmailPDF = async (req, res) => {
  try {
    const { id, startTimeStamp, endTimeStamp, sensorType } = req.body;

    if (!id || !startTimeStamp || !endTimeStamp || !sensorType) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    const startDate = new Date(Number(startTimeStamp));
    const endDate = new Date(Number(endTimeStamp));

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ message: 'Invalid timestamps provided' });
    }

    const graphData = await fetchGraphData(id, sensorType, startTimeStamp, endTimeStamp);
    if (!graphData || graphData.length === 0) {
      return res.status(404).json({ message: 'No data found for the given parameters' });
    }

    const DeviceData = await Device.findOne({ currentUserId: id });
    if (!DeviceData) {
      return res.status(404).json({ message: 'Device data not found' });
    }

    const userID = await InitialUser.findOne({ _id: DeviceData.currentUserId });
    if (!userID) {
      return res.status(404).json({ message: 'User data not found' });
    }

    const adminID = await InitialUser.findOne({ _id: DeviceData.currentAdminId });
    if (!adminID) {
      return res.status(404).json({ message: 'Admin data not found' });
    }

    const labels = graphData.map(data => new Date(data.timestamp).toLocaleTimeString());
    const values = graphData.map(data => data.value);
    const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify({
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Sensor Data',
          data: values,
          backgroundColor: 'rgba(124, 214, 171, 0.2)',
          borderColor: '#7CD6AB',
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 0
        }]
      },
    }))}`;

    const fetchChartImage = (url) => {
      return new Promise((resolve, reject) => {
        https.get(url, (response) => {
          let data = [];
          response.on('data', (chunk) => data.push(chunk));
          response.on('end', () => {
            const imageData = Buffer.concat(data).toString('base64');
            resolve(`data:image/png;base64,${imageData}`);
          });
        }).on('error', (err) => reject(err));
      });
    };

    const chartImage = await fetchChartImage(chartUrl);

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            h1 { text-align: center; }
            .container { width: 100%; padding: 20px; }
            .details { margin-bottom: 20px; }
            .details p { margin: 5px 0; }
            .chart { text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Graph Data Report</h1>
            <div class="details">
              <p><strong>Name:</strong> ${userID.name}</p>
              <p><strong>Email:</strong> ${userID.email}</p>
              <p><strong>Phone:</strong> ${userID.phone}</p>
              <p><strong>Sensor:</strong> ${sensorType}</p>
              <p><strong>Start:</strong> ${startDate.toLocaleString()}</p>
              <p><strong>End:</strong> ${endDate.toLocaleString()}</p>
            </div>
            <div class="chart">
              <img src="${chartImage}" alt="Sensor Data Chart"/>
            </div>
          </div>
        </body>
      </html>
    `;

    // Launch Puppeteer using chrome-aws-lambda
    // const browser = await puppeteer.launch({
    //   args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
    //   executablePath: await chromium.executablePath,
    //   headless: chromium.headless,
    //   ignoreHTTPSErrors: true,
    // });
    const browser = await puppeteer.launch(
      production ? {
        args: chrome.args,
        defaultViewport: chrome.defaultViewport,
        executablePath: await chrome.executablePath(),
        headless: 'new',
        ignoreHTTPSErrors: true
      } : {
        headless: 'new',
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      }
    );

    const page = await browser.newPage();
    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({ format: 'A4' });
    await browser.close();

    const mailOptions = {
      from: process.env.NODE_MAILER_USEREMAIL,
      to: userID.email,
      cc: 'pjtempid@gmail.com',
      subject: 'Graph Data Report',
      text: `Hi ${userID.name},\n\nPlease find attached the Graph Data Report.\n\nBest regards,\nYour Company`,
      attachments: [
        {
          filename: `GraphDataReport_${id}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    await transport.sendMail(mailOptions);

    res.status(200).json({ message: 'PDF generated and email sent successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error generating PDF or sending email', error: error.message });
  }
};








module.exports = {
  addUserToAdmin, removeUserFromAdmin, getUnallocatedUsers, getAdminUsers, getUserDocById, getDeviceIds, getImageByToken, getDeviceData, getSensorDB, getLocation, getGraphData, sendEmailPDF
};