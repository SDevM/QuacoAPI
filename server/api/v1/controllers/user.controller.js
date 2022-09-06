const userModel = require('../../../lib/db/models/user.model')
const { hash, compare, genSaltSync } = require('bcrypt-nodejs')
const JSONResponse = require('../../../lib/json.helper')
const Emailer = require('../../../lib/mail.helper')
const JWTHelper = require('../../../lib/jwt.helper')
const S3 = require('../../../lib/s3.helper')
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
		let manageupload = await S3Helper.upload(req.file)
		if (manageupload) body.profile_pic = manageupload.Location
		hash(body.password, genSaltSync(12), null, (err, hash) => {
			if (hash) {
				body.password = hash
				userModel
					.find({ email: body.email })
					.then((result) => {
						if (result.length > 0)
							JSONResponse.error(req, res, 409, 'User already exists.')
						else {
							let new_user = new userModel(body)
							new_user.active = false
							new_user
								.save()
								.then((result) => {
									Emailer.verifyEmail(result, res)
									JSONResponse.success(
										req,
										res,
										201,
										'Account created!'
									)
								})
								.catch((err) => {
									new_user.delete()
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
						JSONResponse.error(
							req,
							res,
							500,
							'Fatal error handling user model.',
							err
						)
					})
			} else if (err) {
				JSONResponse.error(
					req,
					res,
					500,
					'Fatal error hashing password.',
					err
				)
			}
		})
	}

	//Read
	static signIn(req, res) {
		let body = req.body
		userModel
			.findOne({ email: body.email })
			.then((result) => {
				if (result) {
					compare(
						body.password,
						Buffer.from(result.password, 'utf-8').toString(),
						(err, same) => {
							if (err) {
								JSONResponse.error(
									req,
									res,
									500,
									'Fatal error comparing hash.',
									err
								)
							} else if (same) {
								if (result.active) {
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
									JSONResponse.error(
										req,
										res,
										401,
										'Email unverified.'
									)
								}
							} else
								JSONResponse.error(
									req,
									res,
									401,
									'Password does not match.'
								)
						}
					)
				} else
					JSONResponse.error(
						req,
						res,
						404,
						'Could not find specified user.'
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

	static session(req, res) {
		JWTHelper.getToken(req, res, 'jwt_auth', (decoded) => {
			if (decoded.type == 1)
				userModel
					.findById(decoded.self)
					.then((result) => {
						if (result)
							result
								.populate('title')
								.then((result) => {
									// let blob = new Blob([result.profile_pic], {
									// 	type: 'image/*',
									// })
									let file_string = result.profile_pic.toString()
									var f = new File([file_string], 'profile.jpg', {
										type: 'image/*',
									})
									result.profile_pic = f
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
		})
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
		if (body.profile_pic) body.profile_pic = Buffer.from(body.profile_pic)
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
					JSONResponse.success(
						req,
						res,
						200,
						'Successfully removed user.',
						result
					)
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
			.then((results) => {
				if (result) {
					JSONResponse.success(
						req,
						res,
						200,
						'Successfully removed user.',
						result
					)
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
