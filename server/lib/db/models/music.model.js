const db = require('../db.js')

let musicSchema = new db.Schema({
	music: { type: String, required: true },
})

const musicModel = db.model('music', musicSchema)
module.exports = musicModel
