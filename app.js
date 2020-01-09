const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors')
const app = express();
const scraperRoute = require('./routes/scraper');
const PORT = process.env.PORT || 8081;

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(bodyParser.text());

app.use("/api/scraper", scraperRoute)

app.listen(PORT, () => {
	console.log("start at " + PORT)
});
