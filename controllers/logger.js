
const AWS = require('aws-sdk');

AWS.config.update({
    accessKeyId: 'AKIARPZTQN7CDSOXRJ4A',
    secretAccessKey: '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',
    region: 'ap-south-1' // Set the AWS region to 'ap-south-1' for Mumbai
  });

const cloudwatchlogs = new AWS.CloudWatchLogs();
const logGroupName = 'whms_nodeapplication'; 
const logStreamName = 'harsh9';

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

module.exports = {
    logToCloudWatch,
};
