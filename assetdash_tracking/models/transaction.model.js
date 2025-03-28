const mongoose = require('mongoose')

const transactionSchema = new mongoose.Schema({
    id: String,
    created: Date,
    timestamp: Date,
    transaction_type: String,
    swap_token_id: String,
    swap_whalewatch_list: Object,
    swap_token: Object,
    trade_size: String,
    trade_amount_rounded: Number,
    token_market_cap: Number,
    is_token_first_seen: Boolean
})

const Transaction = mongoose.model('Transaction', transactionSchema)

module.exports = Transaction