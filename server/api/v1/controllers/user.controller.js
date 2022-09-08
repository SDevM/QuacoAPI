const userModel = require('../../../lib/db/models/user.model')
const JSONResponse = require('../../../lib/json.helper')
const Emailer = require('../../../lib/mail.helper')
const JWTHelper = require('../../../lib/jwt.helper')
const S3Helper = require('../../../lib/s3.helper')

class controller {
	//Read
	static getSome(req, res) {
		let body = JSON.parse(req.params.obj)
		userModel
			.find(body ?? {})
			.then((results) => {
				if (results.length > 0)
					JSONResponse.success(
						req,
						res,
						200,
						'Collected matching users.',
						results
					)
				else JSONResponse.error(req, res, 404, 'Could not find any users.')
			})
			.catch((err) => {
				JSONResponse.error(
					req,
					res,
					500,
					'Fatal error handling user model.',
					err
				)
			})
	}

	//Create
	static async signUp(req, res) {
		let body = req.body
		let now = Date.now().toString(16)
		let manageupload = await S3Helper.upload(req.file, now)
		if (manageupload)
			body.profile_pic = { key: now, link: manageupload.Location }
		let new_user = new userModel(body)
		new_user
			.validate()
			.then(() => {
				new_user
					.save()
					.then((result) => Emailer.verifyEmail(req, res, result))
					.catch((err) => {
						JSONResponse.error(req, res, 500, err.message, err)
					})
			})
			.catch((err) => {
				JSONResponse.error(
					req,
					res,
					400,
					err.errors[
						Object.keys(err.errors)[Object.keys(err.errors).length - 1]
					].properties.message,
					err.errors[
						Object.keys(err.errors)[Object.keys(err.errors).length - 1]
					]
				)
				return
			})
	}

	//Read
	static signIn(req, res) {
		let body = req.body
		userModel
			.findOne({ email: body.email })
			.then(async (result) => {
				if (result) {
					if (!result.active) {
						JSONResponse.error(req, res, 401, 'Email unverified.')
						return
					}
					const login = await result.SignIn(body.password).catch((err) => {
						JSONResponse.error(
							req,
							res,
							500,
							'Fatal error comparing hash.',
							err
						)
					})
					if (login) {
						JWTHelper.setToken(
							req,
							res,
							{
								type: 1,
								self: result._id,
							},
							'jwt_auth'
						)
						return JSONResponse.success(
							req,
							res,
							200,
							'Successful login.'
						)
					} else {
						JSONResponse.error(req, res, 401, 'Password does not match.')
					}
				}
			})
			.catch((err) => {
				JSONResponse.error(
					req,
					res,
					500,
					'Fatal error handling user model.',
					err
				)
			})
	}

	static session(req, res) {
		let decoded = JWTHelper.getToken(req, res, 'jwt_auth')
		if (decoded.type == 1)
			userModel
				.findById(decoded.self)
				.then((result) => {
					if (result)
						result
							.populate('title')
							.then((result) => {
								JSONResponse.success(
									req,
									res,
									200,
									'Session resumed.',
									result
								)
							})
							.catch((err) => {
								JSONResponse.error(
									req,
									res,
									500,
									'Failure handling user model',
									err
								)
							})
				})
				.catch((err) => {
					JSONResponse.error(
						req,
						res,
						500,
						'Failure handling user model',
						err
					)
				})
		else JSONResponse.error(req, res, 401, 'No session!')
	}

	//Update
	static verifyUser(req, res) {
		let uid = req.params.id
		userModel
			.findById(uid)
			.then((result) => {
				if (result) {
					result.active = true
					result
						.save()
						.then((result) => {
							JSONResponse.success(
								req,
								res,
								200,
								'User verified successfully.'
							)
						})
						.catch((err) => {
							JSONResponse.error(
								req,
								res,
								500,
								'Fatal error handling user model.',
								err
							)
						})
				}
			})
			.catch((err) => {
				JSONResponse.error(req, res, 400, 'Invalid user!', err)
			})
	}

	static updateUser(req, res) {
		let body = req.body
		body.profile_pic = req.file
		let uid = req.session.self
		userModel.findByIdAndUpdate(uid, body, (err, result) => {
			if (err)
				JSONResponse.error(
					req,
					res,
					500,
					'Fatal error handling user model.',
					err
				)
			else if (result) {
				req.session.self = result
				JSONResponse.success(
					req,
					res,
					200,
					'Successfully updated user.',
					result
				)
			} else
				JSONResponse.error(req, res, 404, 'Could not find specified user.')
		})
	}

	static updateUserAny(req, res) {
		let body = req.body
		let uid = req.params.id
		userModel.findByIdAndUpdate(uid, body, (err, result) => {
			if (err) {
				JSONResponse.error(
					req,
					res,
					500,
					'Fatal error handling user model.',
					err
				)
			} else if (result.length == 1)
				JSONResponse.success(
					req,
					res,
					200,
					'Successfully updated user.',
					result
				)
			else
				JSONResponse.error(req, res, 404, 'Could not find specified user.')
		})
	}

	//Delete
	static deleteUser(req, res) {
		let uid = req.session.self
		userModel
			.findByIdAndDelete(uid)
			.then((result) => {
				if (result) {
					JSONResponse.success(req, res, 200, 'Successfully removed user.')
				} else {
					JSONResponse.error(
						req,
						res,
						404,
						'Could not find specified user.'
					)
				}
			})
			.catch((err) => {
				JSONResponse.error(
					req,
					res,
					500,
					'Fatal error handling user model.',
					err
				)
			})
	}

	static deleteUserAny(req, res) {
		let uid = req.params.id
		userModel
			.findByIdAndDelete(uid)
			.then((result) => {
				if (result) {
					JSONResponse.success(req, res, 200, 'Successfully removed user.')
				} else {
					JSONResponse.error(
						req,
						res,
						404,
						'Could not find specified user.'
					)
				}
			})
			.catch((err) => {
				JSONResponse.error(
					req,
					res,
					500,
					'Fatal error handling user model.',
					err
				)
			})
	}
}
module.exports = controller
