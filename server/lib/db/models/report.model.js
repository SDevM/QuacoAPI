const db = require('../db.js')

let reportsSchema = new db.Schema({
	charter: {
		type: db.Types.ObjectId,
		ref: 'charters',
		unique: [true, 'Report thread already exists'],
		required: [true, 'No charterID provided'],
	},
	type: { type: String, required: [true, 'No type provided'] },
	filer: { type: db.Types.ObjectId, required: [true, 'No filer provided'] },
	report: {
		type: [
			{
				title: String,
				complainant: {
					type: db.Types.ObjectId,
					required: [true, 'No complainant provided'],
				},
				body: String,
				attachments: [String],
			},
		],
		required: [true, 'No report provided'],
	},
	open: { type: Boolean, required: [true, 'No open state provided'] },
})

module.exports = db.model('reports', reportsSchema)
