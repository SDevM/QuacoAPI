const db = require('../db.js')

let adminSchema = new db.Schema({
	title: {
		type: db.Types.ObjectId,
		required: [true, 'No title provided'],
		ref: 'titles',
	},
	name: { type: String, required: [true, 'No name provided'] },
	admin: { type: String, required: [true, 'No admin name provided'] },
	token: { type: String, required: [true, 'No token provided'] },
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
	profile_pic: {
		type: { key: String, link: String },
		required: [true, 'No profile avatar provided'],
	},
	active: {
		type: Boolean,
		default: false,
		required: [true, 'No active state provided'],
	},
})

module.exports = db.model('admins', adminSchema)
