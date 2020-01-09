const puppeteer = require("puppeteer");
const stream = require('stream');

async function handleScraperStart(req, res, next) {
	const browser = await puppeteer.launch({
		headless: true,
		defaultViewport: { width: 1920, height: 1080, },
	}) ;
	const page = await browser.newPage();
	await page.goto("https://www.google.com/", {
		waitUtil: 'networkidle2'
	});
	const base64 = await page.screenshot({
		encoding: "base64",
		fullPage: true,
	});
	const image = new Buffer.from(base64, "base64");
	await browser.close();

	var readStream = new stream.PassThrough();
	readStream.end(image);

	res.set('Content-disposition', 'attachment; filename=' + 'image.png');
	res.set('Content-Type', 'image/png');

	readStream.pipe(res);
};

module.exports = handleScraperStart;
