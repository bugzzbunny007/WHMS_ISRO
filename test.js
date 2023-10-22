// Import required packages
const express = require('express');
const AWS = require('aws-sdk');
const app = express();
const port = 3000;

// Middleware to parse JSON data
app.use(express.json());

// Sample route
app.get('/', (req, res) => {
  res.send('Hello, World!');
});


AWS.config.update({
  accessKeyId: 'AKIARPZTQN7CDSOXRJ4A',
  secretAccessKey: 't7eltry0hQYDtrhWI7yXHHEjDHdDkAk1KOHdnJ3r',
  region: 'ap-south-1' // Set the AWS region to 'ap-south-1' for Mumbai
});


function createLogIfNotExist(logGroupName,logStreamName){
  cloudwatchlogs.describeLogStreams({ logGroupName, logStreamNamePrefix: logStreamName }, (err, data) => {
    if (err) {
      console.error(err);
    } else {
      if (data.logStreams.length === 0) {
        cloudwatchlogs.createLogStream({ logGroupName, logStreamName }, (err, data) => {
          if (err) {
            console.error(err);
          } else {
            console.log('Log stream created:', logStreamName);
          }
        });
      }
    }
  });
}

const cloudwatchlogs = new AWS.CloudWatchLogs();
const logGroupName = 'whms_nodeapplication'; 
const logStreamName = 'harsh9';


function logToCloudWatch (logStreamName, message) {
  createLogIfNotExist(logGroupName,logStreamName);

  const params = {
    logGroupName,
    logStreamName,
    logEvents: [
      {
        message,
        timestamp: new Date().getTime(),
      },
    ],
  };

  cloudwatchlogs.putLogEvents(params, (err, data) => {
    if (err) {
      console.error('Error sending logs to CloudWatch:', err);
    } else {
      console.log('Logs sent successfully to CloudWatch:', data);
    }
  });
}

// Example usage:


// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    const today = new Date();
    

    // logToCloudWatch(logStreamName, 'This is a log message.');
});


