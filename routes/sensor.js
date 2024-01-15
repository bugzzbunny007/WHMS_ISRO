const express = require("express");
const router = express.Router();
const { getHeartRateData } = require("../controllers/sensor")

router.get('/getheartrate/:id', getHeartRateData);

module.exports = router;    