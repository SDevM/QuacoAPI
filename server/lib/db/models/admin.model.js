const db = require('../db.js')

let adminSchema = new db.Schema({
	title: { type: db.Types.ObjectId, required: true, ref: 'titles' },
	name: { type: String, required: true },
	surname: { type: String, required: true },
	admin: { type: String, required: true },
	token: { type: String, required: true },
	password: { type: Buffer, required: true },
	profile_pic: { type: { key: String, link: String }, required: true },
	active: { type: Boolean, default: false, required: true },
})

module.exports = db.model('admins', adminSchema)
