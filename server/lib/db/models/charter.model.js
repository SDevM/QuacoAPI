const db = require('../db.js')

let charterSchema = new db.Schema({
	_user: { type: db.Types.ObjectId, ref: 'users', required: true },
	_driver: { type: db.Types.ObjectId, ref: 'drivers' },
	language: { type: String },
	music: { type: String },
	leave: { type: String, required: true },
	arrive: { type: String, required: true },
	appointment: { type: Date, required: true },
	expect: { type: Date },
	price: { type: Number, required: true },
	timestamp: { type: Date, required: true },
	looking: { type: Boolean, default: false, requirement: true },
})

module.exports = db.model('charters', charterSchema)
