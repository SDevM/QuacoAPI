const db = require('../db.js')

let workshiftlogSchema = new db.Schema({
	_driver: { type: db.Types.ObjectId, required: true, ref: 'drivers' },
	time_start: { type: Number, required: true },
	time_end: { type: Number },
})

module.exports = db.model('shiftlogs', workshiftlogSchema)
