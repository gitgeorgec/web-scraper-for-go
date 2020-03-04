const puppeteer = require("puppeteer");
const stream = require('stream');
const JSZip = require("jszip");
// const firstPageAction = require('./firstpage');

async function handleScraperStart(req, res, next) {
	const { companyName, startDate, endDate } = req.body;

	const startDateArry = startDate.split('-');
	const endDateArry = endDate.split('-');
	const zip = new JSZip();

	try {
		const browser = await puppeteer.launch({
			headless: true,
			defaultViewport: { width: 1440, height: 1080, },
			args: ['--no-sandbox'],
		}) ;
		const page = await browser.newPage();

		// first page
		console.log('start scrap  https://findbiz.nat.gov.tw/fts/query/QueryBar/queryInit.do')
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
		console.log('start scrap https://serv.gcis.nat.gov.tw/Fidbweb/index.jsp');

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

		const fidWebResultPagePng = await page.screenshot({
			encoding: "base64",
			format: 'A4',
			fullPage: true,
		});
		const fidWebResultPagePngBinary = new Buffer.from(fidWebResultPagePng, "base64");

		await zip.file(`fidWeb0.png`, fidWebResultPagePngBinary, { binary: true, });

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

		// 第三個
		console.log('start scrap http://fyjud.lawbank.com.tw/index.aspx')
		await page.goto('http://fyjud.lawbank.com.tw/index.aspx', {
			waitUtil: 'networkidle2'
		})

		await page.evaluate((companyName, startDateArry, endDateArry) => {
			document.querySelector('#courtFullAV').click()
			document.querySelector('#courtFullAM').click()
			document.querySelector('#kw').value = `被告${companyName}`
			document.querySelector('#dy1').value = startDateArry[0] ? startDateArry[0] : null;
			document.querySelector('#dm1').value = startDateArry[1] ? startDateArry[1] : null;
			document.querySelector('#dd1').value = startDateArry[2] ? startDateArry[2] : null;
			document.querySelector('#dy2').value = endDateArry[0] ? endDateArry[0] : null;
			document.querySelector('#dm2').value = endDateArry[1] ? endDateArry[1] : null;
			document.querySelector('#dd2').value = endDateArry[2] ? endDateArry[2] : null;
			document.querySelector('input[type=submit]').click()
		}, companyName, startDateArry, endDateArry);

		await page.waitForNavigation({ waitUntil: 'networkidle0' })

		let menuFrame = await page.frames()[2];

		await menuFrame.waitForSelector('li')

		const menuFrameList = await menuFrame.$$('li a');

		const lawbankResultPagePdf = await page.screenshot({
			encoding: "base64",
			format: 'A4',
			fullPage: true,
		});
		const lawbankResultPagePdfBinary = new Buffer.from(lawbankResultPagePdf, "base64");

		await zip.file(`lawbank0.pdf`, lawbankResultPagePdfBinary, { binary: true, });

		console.log('menuFrameList.length', menuFrameList.length)

		for (let i = 0; i < menuFrameList.length; i++) {
			const menuFrame = page.frames()[2];

			(await menuFrame.$(`li:nth-child(${i + 1}) a`)).click();

			const numberOfSearchResult = await menuFrame.evaluate((i) => {
				return parseInt(document.querySelector(`li:nth-child(${i + 1})`).textContent.split(" ").pop())
			}, i)

			const contentFrame = page.frames().find((frame) => frame.name() === 'contentFrame');

			await contentFrame.waitForSelector('#table3 > tbody > tr:nth-child(2) > td:nth-child(2) > a');

			(await contentFrame.$('#table3 > tbody > tr:nth-child(2) > td:nth-child(2) > a')).click();
			await contentFrame.waitForSelector('#law-search > div.fint-pager > span:nth-child(2) > a:nth-child(3)')

			for(let j = 0; j < numberOfSearchResult; j++) {
				const nextButtonDisplay = await contentFrame.evaluate(() => {
					const nextButton = document.querySelector('#law-search > div.fint-pager > span:nth-child(2) > a:nth-child(3)');

					if (nextButton) {
						return nextButton.style.display !== 'none'
					} else {
						return false
					}
				})

				if (nextButtonDisplay) {
					await contentFrame.waitForSelector('#law-search > div.fint-pager > span:nth-child(2) > a:nth-child(3)');
					(await contentFrame.$('#law-search > div.fint-pager > span:nth-child(2) > a:nth-child(3)')).click();
					await contentFrame.waitForNavigation({ waitUtil: 'networkidle2' })
				}


				const pdfFile = await page.pdf({
					encoding: "base64",
					format: 'A4',
					fullPage: true,
				});
				const pdfFileBinary = new Buffer.from(pdfFile, "base64");

				await zip.file(`fyjudWeb${i + 1}-${j}.pdf`, pdfFileBinary, { binary: true, });
			}
		}
		//

		// ---end---


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
		res.send(error)
	}

}

module.exports = handleScraperStart;
