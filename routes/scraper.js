const express = require('express');
const router = express.Router({ mergeParams: true, });
const handleScraperStart = require('../handlers/scraper');

router.post("/", handleScraperStart);

module.exports = router;
