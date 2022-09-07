const db = require('../db.js')

let driverSchema = new db.Schema({
	title: {
		type: db.Types.ObjectId,
		required: [true, 'No title provided'],
		ref: 'titles',
	},
	name: { type: String, required: [true, 'No name provided'] },
	username: { type: String, required: [true, 'No username provided'] },
	email: {
		type: String,
		unique: [true, 'Login exists for this email'],
		required: [true, 'No email provided'],
	},
	password: {
		type: String,
		match: [
			/^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])((?=.*[^\w\d\s:])|(?=.*[_]))([^\s])*$/,
			'Password does not meet requirements',
		],
		minLength: [8, 'Password too short'],
		maxLength: [16, 'Password too long'],
		required: [true, 'No password provided'],
	},
	address: { type: String, required: [true, 'No address provided'] },
	language: { type: String, required: [true, 'No language provided'] },
	operating_areas: {
		type: [db.Types.ObjectId],
		required: [true, 'No operating areas provided'],
	}, //Google places
	license_no: { type: String, required: [true, 'No license number provided'] },
	chartered: {
		type: Boolean,
		default: false,
		required: [true, 'No chartered state provided'],
	},
	profile_pic: {
		type: { key: String, link: String },
		required: [true, 'No profile avatar provided'],
	},
	work_shift: {
		type: db.Types.ObjectId,
		ref: 'workshifts',
		required: [true, 'No work_shift provided'],
	},
})

module.exports = db.model('drivers', driverSchema)
