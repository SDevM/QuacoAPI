const { compare, hash, genSaltSync } = require('bcrypt-nodejs')
const S3Helper = require('../../s3.helper.js')
const db = require('../db.js')

let driverSchema = new db.Schema({
	title: {
		type: db.Types.ObjectId,
		required: [true, 'No title provided'],
		ref: 'titles',
	},
	name: { type: String, required: [true, 'No name provided'] },
	username: { type: String, required: [true, 'No username provided'] },
	email: {
		type: String,
		unique: [true, 'Login exists for this email'],
		required: [true, 'No email provided'],
	},
	password: {
		type: String,
		match: [
			/^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])((?=.*[^\w\d\s:])|(?=.*[_]))([^\s])*$/,
			'Password does not meet requirements',
		],
		minLength: [8, 'Password too short'],
		maxLength: [16, 'Password too long'],
		required: [true, 'No password provided'],
	},
	address: { type: String, required: [true, 'No address provided'] },
	language: { type: String, required: [true, 'No language provided'] },
	operating_areas: {
		type: [db.Types.ObjectId],
		required: [true, 'No operating areas provided'],
	}, //Google places
	license_no: { type: String, required: [true, 'No license number provided'] },
	chartered: {
		type: Boolean,
		default: false,
		required: [true, 'No chartered state provided'],
	},
	profile_pic: {
		type: { key: String, link: String },
		required: [true, 'No profile avatar provided'],
	},
	work_shift: {
		type: db.Types.ObjectId,
		ref: 'workshifts',
		required: [true, 'No work_shift provided'],
	},
})

driverSchema.pre('save', function (next, opts) {
	if (
		/^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])((?=.*[^\w\d\s:])|(?=.*[_]))([^\s])*$/gm.test(
			this.password
		)
	)
		hash(this.password, genSaltSync(12), null, (err, hash) => {
			if (err) throw err
			else this.password = hash
		})
	else
		throw new Error(
			'Password does not meet requirements \n Password must be between 8 and 16 characters \n Password must have one letter \n Password must have 1 number \n Password must have one symbol'
		)
})

driverSchema.pre('findByIdAndUpdate', async function (next, opts) {
	if (this.profile_pic) {
		const docToUpdate = await this.model.findOne(this.getQuery())
		const now = Date.now().toString(16)
		const manageupload = await S3Helper.upload(this.profile_pic, now)
		if (manageupload) {
			this.set({ profile_pic: { key: now, link: manageupload.Location } })
			const oldKey = docToUpdate.profile_pic.key
			const managedelete = await S3Helper.delete(oldKey)
			if (managedelete) next()
		} else throw new Error('Upload failed')
	}
})

const driverModel = db.model('charters', driverSchema)
module.exports = driverModel
