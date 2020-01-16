const puppeteer = require("puppeteer");
const stream = require('stream');
const JSZip = require("jszip");

async function handleScraperStart(req, res, next) {
	const browser = await puppeteer.launch({
		headless: true,
		defaultViewport: { width: 1440, height: 1080, },
		args: ['--no-sandbox'],
	}) ;
	const page = await browser.newPage();
	await page.goto("https://findbiz.nat.gov.tw/fts/query/QueryBar/queryInit.do", {
		waitUtil: 'networkidle2'
	});

	await page.evaluate(() => {
		document.querySelector('#qryCond').value = '台灣積體電路'
		document.querySelector('#qryBtn').click()
	})

	await page.waitForNavigation({ waitUntil: 'networkidle0' })

	await page.evaluate(() => {
		document.querySelector('.moreLinkMouseOut').click()
	})

	await page.waitForNavigation({ waitUntil: 'networkidle0' })

	const image1Base64 = await page.screenshot({
		encoding: "base64",
		fullPage: true,
	});
	const image = new Buffer.from(image1Base64, "base64");


	await page.evaluate(() => {
		document.querySelector('#tabShareHolder').click()
	})

	const image2Base64 = await page.screenshot({
		encoding: "base64",
		fullPage: true,
	});
	const image2 = new Buffer.from(image2Base64, "base64");
	await page.evaluate(() => {
		document.querySelector('#tabMgr').click()
	})

	const image3Base64 = await page.screenshot({
		encoding: "base64",
		fullPage: true,
	});
	const image3 = new Buffer.from(image3Base64, "base64");

	await page.evaluate(() => {
		document.querySelector('#tabBrCmpy').click()
	})

	const image4Base64 = await page.screenshot({
		encoding: "base64",
		fullPage: true,
	});
	const image4 = new Buffer.from(image4Base64, "base64");

	// var zip = new JSZip();
	// zip.file("image1.png", image1Base64, {base64: true});
	// zip.file("image2.png", image2Base64, {base64: true});
	// zip.file("image3.png", image3Base64, {base64: true});
	// zip.file("image4.png", image4Base64, {base64: true});
	// var content = zip.generate();


	var readStream = new stream.PassThrough();
	readStream.end(image);

	await browser.close();
	res.set('Content-disposition', 'attachment; filename=' + 'image.png');
	// res.set('Content-Type', 'image/png');


	readStream.pipe(res);
};

module.exports = handleScraperStart;
