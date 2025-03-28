const mongoose = require('mongoose')

const userinfoSchema = new mongoose.Schema({
    created: Date,
    groupid: Number,
    threadid: Number,
    active: Boolean,
    buy: Boolean,
    sell: Boolean,
    button: Number,
    top: Number,
    onlynew: Boolean,
    onlyfirst: Boolean,
    onlyfirstsolet: Boolean,
    solet: Boolean,
    onlyseelist: [],
    noseelist: [],
})

const Userinfo = mongoose.model('Userinfo', userinfoSchema)

module.exports = Userinfo