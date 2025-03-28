const { getTransaction } = require('@controllers')

const { log } = require('@utils')

const checkLogin = async (page) => {

	try {
		let loginButton = await page.waitForSelector('xpath///button[contains(text(), "Log Out")]', { timeout: 1000 })
		const token = await page.evaluate(() => {
			const data = localStorage.getItem('token')
			return data
		})
		global.token = token
		log('Successfully login!')
		log('Start scrapping!')
		getTransaction()
	} catch (e){
		log('Checking logged in...')
		setTimeout(() => {
			checkLogin(page)
		}, 1000)
	}
}

module.exports = checkLogin