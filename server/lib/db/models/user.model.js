const { compare } = require('bcrypt-nodejs')
const S3Helper = require('../../s3.helper.js')
const db = require('../db.js')

let userSchema = new db.Schema({
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
		minLength: [8, 'Password too short'],
		maxLength: [16, 'Password too long'],
		required: [true, 'No password provided'],
	},
	address: { type: String, required: [true, 'No address provided'] },
	profile_pic: {
		type: { key: String, link: String },
		required: [true, 'No profile avatar provided'],
	},
	active: {
		type: Boolean,
		default: false,
		required: [true, 'No active state provided'],
	},
})

userSchema.pre('save', function (next, opts) {
	this.active = false
	if (
		/^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])((?=.*[^\w\d\s:])|(?=.*[_]))([^\s])*$/gm.test(
			this.password
		)
	)
		hash(this.password, genSaltSync(12), null, (err, hash) => {
			if (err) throw err
			else {
				this.password = hash
				next()
			}
		})
	else
		throw new Error(
			'Password does not meet requirements \n Password must be between 8 and 16 characters \n Password must have one letter \n Password must have 1 number \n Password must have one symbol'
		)
})

userSchema.pre('findByIdAndUpdate', async function (next, opts) {
	if (this.profile_pic) {
		const docToUpdate = await this.model.findOne(this.getQuery())
		const now = Date.now().toString(16)
		const manageupload = await S3Helper.upload(this.profile_pic, now)
		if (manageupload) {
			this.set({ profile_pic: { key: now, link: manageupload.Location } })
			const oldKey = docToUpdate.profile_pic.key
			const managedelete = await S3Helper.delete(oldKey)
			if (managedelete) next()
		} else throw new Error('Upload failed.')
	}
})

userSchema.methods.SignIn = async function (password) {
	return new Promise((resolve, reject) => {
		compare(password, this.password, (err, same) => {
			if (err) reject(err)
			else if (same) resolve(true)
			return resolve(false)
		})
	})
}

module.exports = db.model('users', userSchema)
