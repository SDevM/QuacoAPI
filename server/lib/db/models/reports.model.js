const db = require('../db.js')

let reportsSchema = new db.Schema({
	charter: {
		type: db.Types.ObjectId,
		ref: 'charters',
		unique: true,
		required: true,
	},
	type: { type: String, required: true },
	filer: { type: db.Types.ObjectId, required: true },
	report: {
		type: [
			{
				title: String,
				complainant: { type: db.Types.ObjectId, required: true },
				body: String,
				attachments: [Buffer],
			},
		],
		required: true,
	},
	open: { type: Boolean, required: true },
})

module.exports = db.model('reports', reportsSchema)
