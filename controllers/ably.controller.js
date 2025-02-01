const Ably = require('ably');

class AblyController {
  constructor() {
    this.ably = new Ably.Realtime(process.env.ABLY_API_KEY);
    this.initialize();
  }

  initialize() {
    // Connect to the same channel as Flutter
    this.channel = this.ably.channels.get('sensor-data');

    // Log connection status
    this.ably.connection.on('connected', () => {
      console.log('Ably Connected Successfully');
    });

    this.ably.connection.on('failed', () => {
      console.error('Ably Connection Failed');
    });

    // Subscribe to all messages on this channel
    this.channel.subscribe((message) => {
      console.log('Received message:', {
        event: message.name,
        data: message.data,
      });
    });

    // Or subscribe to specific events
    this.channel.subscribe('sensor-event', (message) => {
      console.log('Received sensor data:', {
        data: message.data,
        timestamp: new Date().toISOString()
      });
    });
  }

  closeConnection() {
    if (this.channel) {
      this.channel.unsubscribe();
    }
    if (this.ably) {
      this.ably.close();
    }
  }
}

module.exports = AblyController;