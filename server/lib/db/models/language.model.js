const db = require('../db.js')

let languagesSchema = new db.Schema({
	language: { type: String, required: true },
})

module.exports = db.model('languages', languagesSchema)
