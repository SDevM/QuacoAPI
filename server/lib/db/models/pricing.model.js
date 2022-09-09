const db = require('../db.js')

let priceSchema = new db.Schema({
	tier: { type: String, required: true },
	rate: { type: Number, required: true },
})

const priceModel = db.model('pricing', priceSchema)
module.exports = priceModel
