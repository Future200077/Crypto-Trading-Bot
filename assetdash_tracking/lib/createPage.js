const createPage = async (browser, url) => {
	const page = await browser.newPage()

	page.setDefaultNavigationTimeout(600000)

	await page.goto(url, {
		timeout: 0,
	})

	return page
}

module.exports = createPage