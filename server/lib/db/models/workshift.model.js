const db = require('../db.js')

let workshiftSchema = new db.Schema({
	time_start: { type: Number, required: true },
	time_end: { type: Number, required: true },
})

module.exports = db.model('shifts', workshiftSchema)
