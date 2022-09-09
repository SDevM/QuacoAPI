const db = require('../db.js')

let languagesSchema = new db.Schema({
	language: { type: String, required: true },
})

const languageModel = db.model('charters', languagesSchema)
module.exports = languageModel
