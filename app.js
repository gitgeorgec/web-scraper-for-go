const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors')
const app = express();
const scraperRoute = require('./routes/scraper');
const PORT = process.env.PORT || 8081;


// app.use(cors())
app.set("view engine", "pug")
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(bodyParser.text());

app.use("/api/scraper", scraperRoute)

app.get('/', (req, res) => {
	res.render('index')
})

app.listen(PORT, () => {
	console.log("start at " + PORT)
});
