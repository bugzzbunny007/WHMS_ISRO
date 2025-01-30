const socketConfig = {
    // Allow all origins (for development only)
      cors: {
        origin: "https://whms.in",
        methods: ["GET", "POST"],
        credentials: true
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