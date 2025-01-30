const socketConfig = {
  cors: {
    origin: ["https://www.whms.in", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["*"]
  },
  transports: ['websocket', 'polling'],  // Allow both transports
  path: '/socket.io',  // Remove trailing slash
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  maxHttpBufferSize: 1e8
};

module.exports = socketConfig;