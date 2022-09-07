const db = require('../db.js')
const pricingModel = require('./pricing.model.js')

let charterSchema = new db.Schema({
	_user: {
		type: db.Types.ObjectId,
		ref: 'users',
		required: [true, 'No userID provided'],
	},
	_driver: { type: db.Types.ObjectId, ref: 'drivers' },
	language: { type: db.Types.ObjectId, ref: 'languages' },
	music: { type: db.Types.ObjectId, ref: 'music' },
	leave: { type: String, required: [true, 'No origin provided'] },
	arrive: { type: String, required: [true, 'No destination provided'] },
	appointment: {
		type: Date,
		required: [true, 'No appointment time provided'],
	},
	expect: { type: Date },
	price: {
		type: Number,
		required: [true, 'No price provided (Server Error)'],
	},
	timestamp: {
		type: Date,
		required: [true, 'No timestamp provided (Server Error)'],
	},
	looking: {
		type: Boolean,
		default: false,
		requirement: [true, 'No looking state (Server Error)'],
	},
})

charterSchema.pre('save', async function (next, opts) {
	try {
		this.price = (await pricingModel.findOne({ tier: 'normal' })).rate
		next(undefined)
	} catch (err) {
		next(err)
	}
})

module.exports = db.model('charters', charterSchema)
