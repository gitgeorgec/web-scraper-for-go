const puppeteer = require("puppeteer");
const stream = require('stream');
const JSZip = require("jszip");

async function handleScraperStart(req, res, next) {
	const { companyName } = req.body;
	const zip = new JSZip();

	try {
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

		const image1Base64 = await page.pdf({
			encoding: "base64",
			fullPage: true,
		});
		const image1 = new Buffer.from(image1Base64, "base64");

		await page.evaluate(() => {
			document.querySelector('#tabShareHolder').click()
		})

		const image2Base64 = await page.pdf({
			encoding: "base64",
			fullPage: true,
		});
		const image2 = new Buffer.from(image2Base64, "base64");
		await page.evaluate(() => {
			document.querySelector('#tabMgr').click()
		})

		const image3Base64 = await page.pdf({
			encoding: "base64",
			fullPage: true,
		});
		const image3 = new Buffer.from(image3Base64, "base64");

		await page.evaluate(() => {
			document.querySelector('#tabBrCmpy').click()
		})

		const image4Base64 = await page.pdf({
			encoding: "base64",
			fullPage: true,
		});
		const image4 = new Buffer.from(image4Base64, "base64");

		zip.file("image1.pdf", image1, { binary: true, });
		zip.file("image2.pdf", image2, { binary: true, });
		zip.file("image3.pdf", image3, { binary: true, });
		zip.file("image4.pdf", image4, { binary: true, });
		// --------- 第二個

		await page.goto("https://serv.gcis.nat.gov.tw/Fidbweb/index.jsp", {
			waitUtil: 'networkidle2'
		});

		const searchFrame = await page.frames()[2];

		await searchFrame.evaluate((companyName) => {
			document.querySelector('input[name=factName]').value = companyName;
			document.querySelector('input[type=submit]').click();
		}, companyName)

		const showFrame = await page.frames()[3];
		await showFrame.waitForNavigation({
			waitUtil: 'networkidle2'
		})

		const totalPages = [...await showFrame.$$('option')].length;

		let showList = [];

		for(let i = 0; i < totalPages; i++) {
			const newList = await showFrame.evaluate(() => {
				let pageList = [];
				[...document.querySelectorAll('tr > td[width="30%"] > a')].forEach((aTag) => {
					pageList.push(aTag.href);
				})
				return pageList;
			});

			showList = [...showList, ...newList];

			await showFrame.evaluate(() => {
				document.querySelector(`a[href="javascript:postAction('nextPage');"]`).click()
			})
			await showFrame.waitForNavigation({
				waitUtil: 'networkidle2'
			})
		}

		console.log(showList.length)

		const fidWebResultPage = await browser.newPage()

		for(let i =0; i < showList.length; i++) {
			await fidWebResultPage.goto(showList[i], {
				waitUtil: 'networkidle2'
			})
			const pdfFile = await fidWebResultPage.pdf({
				encoding: "base64",
				format: 'A4',
				fullPage: true,
			});
			const pdfFileBinary = new Buffer.from(pdfFile, "base64");

			await zip.file(`fidWeb${i + 1}.pdf`, pdfFileBinary, { binary: true, });

			await fidWebResultPage.goto('about:blank', {
				waitUtil: 'networkidle2'
			})
		}

		await fidWebResultPage.close();
		await zip.generateAsync( { type : "nodebuffer", compression: 'DEFLATE' } )
			.then((buffer) => {
				var readStream = new stream.PassThrough();
				readStream.end(buffer);

				res.set('Content-disposition', 'attachment; filename=' + 'image.zip');
				res.set('Content-Type', 'application/buffer');

				readStream.pipe(res);
			})

		await page.goto('about:blank', {
			waitUtil: 'networkidle2'
		})
		await browser.close();
		// res.redirect('/')
	} catch (error) {
		console.log(error)
		// res.send('some thing wrong!!')
	}

};

module.exports = handleScraperStart;
