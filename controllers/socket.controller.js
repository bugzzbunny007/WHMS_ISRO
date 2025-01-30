const { Server } = require('socket.io');
const socketConfig = require('../config/socket.config');

class SocketController {
  constructor(httpServer) {

    this.io = new Server(httpServer, socketConfig);
    this.connectedUsers = new Map(); // Store active connections
    
  }

  initialize() {
    this.io.on('connection', (socket) => {
      console.log('New connection:', socket.id);

      // Handle sensor data
      socket.on('sensor-data', (data) => {
        this.handleSensorData(data);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  handleSensorData(data) {
    const { userID, timestamp, sensor_data } = data;

    // Log the received data
    console.log(`Received data from user ${userID}:`, data);

    // Emit to specific channel for this user
    this.io.emit(`${userID}/sensorData`, {
      timestamp,
      userID,
      sensor_data
    });
  }
}

module.exports = SocketController;