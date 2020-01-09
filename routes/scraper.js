const express = require('express');
const router = express.Router({ mergeParams: true, });
const handleScraperStart = require('../handlers/scraper');

router.get("/", handleScraperStart);

module.exports = router;
