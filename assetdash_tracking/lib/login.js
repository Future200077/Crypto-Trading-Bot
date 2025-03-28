const { log } = require('@utils')

const login = async (page) => {

	log('Login page')

	let loginButton = await page.waitForSelector('xpath///button[contains(text(), "Log In")]', { timeout: 0 })
	await loginButton.click()

	await page.waitForNavigation({ timeout: 0 })

	await page.type('#email', process.env.ASSETDASH_EMAIL)
	await page.type('#password', process.env.ASSETDASH_PASSWORD)

	let submitButton = await page.waitForSelector('button[type="submit"]', { timeout: 0 });
	await submitButton.click()	

}

module.exports = login