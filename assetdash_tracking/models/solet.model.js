const mongoose = require('mongoose')

const soletSchema = new mongoose.Schema({
    message: String,    
    ca: String
})

const Solet = mongoose.model('Solet', soletSchema)

module.exports = Solet