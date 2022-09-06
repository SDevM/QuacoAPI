const db = require('../db.js')

let driverSchema = new db.Schema({
	title: { type: db.Types.ObjectId, required: true, ref: 'titles' },
	name: { type: String, required: true },
	surname: { type: String, required: true },
	username: { type: String, required: true },
	email: { type: String, required: true },
	password: { type: String, required: true },
	address: { type: String, required: true },
	language: { type: String, required: true },
	music: { type: String, required: true },
	operating_areas: { type: [String], required: true }, //Google places
	trn: { type: String, required: true },
	chartered: { type: Boolean, default: false, required: true },
	profile_pic: { type: Buffer, required: true }, //Multer
	work_shift: { type: db.Types.ObjectId, ref: "workshifts", required: true },
})

module.exports = db.model('drivers', driverSchema)
