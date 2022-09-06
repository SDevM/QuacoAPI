const db = require('../db.js')

let musicSchema = new db.Schema({
	music: { type: String, required: true },
})

module.exports = db.model('music', musicSchema)
