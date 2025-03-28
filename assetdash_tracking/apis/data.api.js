const mongoose = require('mongoose')

const { log } = require('@utils')

module.exports = {
	listen: async (uri) => {

		await mongoose.connect(uri, {})
		log(`DataAPI connected in ${uri}`)

	}
}