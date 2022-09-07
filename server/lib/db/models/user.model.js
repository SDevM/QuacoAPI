const db = require('../db.js')

let userSchema = new db.Schema({
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

userSchema.pre('save', function (next, opts) {
	this.active = false
})

module.exports = db.model('users', userSchema)
