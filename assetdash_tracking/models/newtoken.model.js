const mongoose = require('mongoose')

const newtokenSchema = new mongoose.Schema({
    id: String,
    created: Date,
    updated: Date,
    network_id: String,
    token_address: String,
    asset_id: String,
    platform: String,
    name: String,
    symbol: String,
    logo_url: String,
    decimals: Number,
    created_timestamp: Date,
    is_strict: Boolean,
    is_pumpfun: Boolean,
    is_gold_boosted: Boolean,
    active: Boolean,
    is_leverage: Boolean
})

const Newtoken = mongoose.model('Newtoken', newtokenSchema)

module.exports = Newtoken