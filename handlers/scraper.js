const puppeteer = require("puppeteer");
const stream = require('stream');
const JSZip = require("jszip");

async function handleScraperStart(req, res, next) {
	const { companyName } = req.body;

	const browser = await puppeteer.launch({
		headless: true,
		defaultViewport: { width: 1440, height: 1080, },
		args: ['--no-sandbox'],
	}) ;
	const page = await browser.newPage();
	await page.goto("https://findbiz.nat.gov.tw/fts/query/QueryBar/queryInit.do", {
		waitUtil: 'networkidle2'
	});

	await page.evaluate((companyName) => {
		document.querySelector('#qryCond').value = companyName;
		document.querySelector('#qryBtn').click();
	}, companyName)

	await page.waitForNavigation({ waitUntil: 'networkidle0' })

	await page.evaluate(() => {
		document.querySelector('.moreLinkMouseOut').click()
	})

	await page.waitForNavigation({ waitUntil: 'networkidle0' })

	const image1Base64 = await page.screenshot({
		encoding: "base64",
		fullPage: true,
	});
	const image1 = new Buffer.from(image1Base64, "base64");

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

	var zip = new JSZip();
	zip.file("image1.png", image1, { binary: true, });
	zip.file("image2.png", image2, { binary: true, });
	zip.file("image3.png", image3, { binary: true, });
	zip.file("image4.png", image4, { binary: true, });
	await zip.generateAsync( { type : "nodebuffer", compression: 'DEFLATE' } )
		.then((buffer) => {
			var readStream = new stream.PassThrough();
			readStream.end(buffer);

			res.set('Content-disposition', 'attachment; filename=' + 'image.zip');
			res.set('Content-Type', 'application/buffer');

			readStream.pipe(res);
		})

	await browser.close();
};

module.exports = handleScraperStart;
