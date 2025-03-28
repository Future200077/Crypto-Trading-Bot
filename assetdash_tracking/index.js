require('module-alias/register')

const dotenv = require('dotenv')

const { DataAPI, TelegramAPI } = require('@apis')
const { createBrowser, createPage, login, checkLogin }  = require('@lib')
const { log } = require('@utils')

dotenv.config({ path: '.env' })

const start = async () => {
	
	await DataAPI.listen(process.env.MONGODB_URI)
	TelegramAPI.listen()

	log('Opening browser!')
		const browser = await createBrowser()
		const page = await createPage(browser, process.env.BASE_URL)
	log('Go to login page!')
		setTimeout(() => {
			checkLogin(page)
		}, 1000)
		await login(page)

}

start()