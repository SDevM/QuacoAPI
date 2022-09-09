const db = require('../db.js')

let workshiftlogSchema = new db.Schema({
	_driver: { type: db.Types.ObjectId, required: true, ref: 'drivers' },
	time_start: { type: Number, required: true },
	time_end: { type: Number },
})

const worklogModel = db.model('shiftlogs', workshiftlogSchema)
module.exports = worklogModel
