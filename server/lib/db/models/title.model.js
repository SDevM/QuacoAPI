const db = require('../db.js')

let titlesSchema = new db.Schema({
	title: { type: String, required: true },
})

module.exports = db.model('titles', titlesSchema)
