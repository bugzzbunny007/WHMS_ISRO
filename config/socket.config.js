const socketConfig = {
    cors: {
      origin: '*', // Allow all origins (for development only)
    },
    port: process.env.PORT || 3000,
    events: {
      CONNECTION: 'connection',
      DISCONNECT: 'disconnect',
      SENSOR_DATA: 'sensor-data',
      NEW_SENSOR_DATA: 'new-sensor-data'
    }
  };
  
  module.exports = socketConfig;