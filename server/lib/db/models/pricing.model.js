const db = require('../db.js')

let priceSchema = new db.Schema({
	tier: { type: String, required: true },
	rate: { type: Number, required: true },
})

module.exports = db.model('pricing', priceSchema)
