const express = require('express');
const router = express.Router();
const ablyController = require('../controllers/ably.controller');

const ably = new ablyController();
ably.initialize();

router.post('/sensor-data', async (req, res) => {
  try {
    await ably.publishSensorData(req.body);
    res.status(200).json({ message: 'Data published successfully' });
  } catch (error) {
    console.error('Error publishing data:', error);
    res.status(500).json({ error: 'Failed to publish data' });
  }
});

router.get('/sensor-data', async (req, res) => {
  await ably.subscribeToChannel('sensor-data');
  res.status(200).json({ message: 'Subscribed to channel' });
});

module.exports = router;