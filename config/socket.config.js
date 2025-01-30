const socketConfig = {
    // Allow all origins (for development only)
      cors: {
        origin: ["https://whms.in", "http://localhost:3000"],
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket'],
      path: '/socket.io/',
   
    port: process.env.PORT || 3000,
    events: {
      CONNECTION: 'connection',
      DISCONNECT: 'disconnect',
      SENSOR_DATA: 'sensor-data',
      NEW_SENSOR_DATA: 'new-sensor-data'
    }
  };
  
  module.exports = socketConfig;