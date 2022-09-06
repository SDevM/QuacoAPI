const db = require('../db.js')

let userSchema = new db.Schema({
	title: { type: db.Types.ObjectId, required: true, ref: 'titles' },
	name: { type: String, required: true },
	surname: { type: String, required: true },
	username: { type: String, required: true },
	email: { type: String, unique: true, required: true },
	password: { type: Buffer, required: true },
	address: { type: String, required: true },
	profile_pic: { type: { key: String, link: String }, required: true },
	active: { type: Boolean, default: false, required: true },
})

module.exports = db.model('users', userSchema)
