const driverModel = require('../../../lib/db/models/driver.model')
const { hash, compare, genSaltSync } = require('bcrypt-nodejs')
const JSONResponse = require('../../../lib/json.helper')
const Emailer = require('../../../lib/mail.helper')
const { respondCharter } = require('./charter.controller')
const workshiftlogModel = require('../../../lib/db/models/workshiftlog.model')
const JWTHelper = require('../../../lib/jwt.helper')

class controller {
	//Read
	static get(req, res) {
		let body = JSON.parse(req.params.obj)
		driverModel
			.find(body)
			.then((results) => {
				if (results.length > 0)
					JSONResponse.success(
						req,
						res,
						200,
						'Collected matching drivers',
						results
					)
				else JSONResponse.error(req, res, 404, 'Could not find any drivers')
			})
			.catch((err) => {
				JSONResponse.error(
					req,
					res,
					500,
					'Fatal error handling driver model',
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
		hash(body.password, genSaltSync(12), null, (err, hash) => {
			if (hash) {
				body.password = hash
				let new_driver = new driverModel(body)
				new_driver
					.validate()
					.then(() => {
						new_driver
							.save()
							.then((result) => Emailer.verifyEmail(req, res, result))
							.catch((err) => {
								JSONResponse.error(
									req,
									res,
									500,
									'Fatal error handing driver model',
									err
								)
							})
					})
					.catch((err) => {
						JSONResponse.error(
							req,
							res,
							400,
							err.errors[
								Object.keys(err.errors)[
									Object.keys(err.errors).length - 1
								]
							].properties.message,
							err.errors[
								Object.keys(err.errors)[
									Object.keys(err.errors).length - 1
								]
							]
						)
						return
					})
			} else if (err) {
				JSONResponse.error(
					req,
					res,
					500,
					'Fatal error hashing password',
					err
				)
			}
		})
	}

	//Read
	static signIn(req, res) {
		let body = req.body
		driverModel
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
									'Fatal error comparing hash',
									err
								)
							} else if (same) {
								if (result.active) {
									JWTHelper.setToken(
										req,
										res,
										{
											type: 0,
											self: result._id,
										},
										'jwt_auth'
									)
									result
										.populate(['work_shift'])
										.then((result) => {
											let decoded = JWTHelper.getToken(
												req,
												res,
												'jwt_auth'
											)
											decoded.shift = result.work_shift
											JWTHelper.setToken(
												req,
												res,
												decoded,
												'jwt_auth'
											)
											if (
												new Date().getMilliseconds() / 1000 / 60 <
												result.work_shift.time_start
											)
												JSONResponse.error(
													req,
													res,
													425,
													'Your shift has not yet started!'
												)
											else if (
												new Date().getMilliseconds() / 1000 / 60 >=
												result.work_shift.time_end
											)
												JSONResponse.error(
													req,
													res,
													423,
													'Your shift has already ended!'
												)
											else {
												let workshift = new workshiftlogModel()
												workshift._driver = result._id
												workshift.time_start =
													new Date().getMilliseconds() / 1000 / 60
												workshift
													.save()
													.then(() => {
														JSONResponse.success(
															req,
															res,
															200,
															'Successful login'
														)
														respondCharter(req, res)
													})
													.catch((err) => {
														JSONResponse.error(
															req,
															res,
															500,
															'Fatal handling workshiftlog model',
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
												'Fatal handling driver model',
												err
											)
										})
								} else {
									JSONResponse.error(req, res, 401, 'Email unverified')
								}
							} else {
								JSONResponse.error(
									req,
									res,
									401,
									'Password does not match'
								)
							}
						}
					)
				} else
					JSONResponse.error(
						req,
						res,
						404,
						'Account does not exist'
					)
			})
			.catch((err) => {
				JSONResponse.error(
					req,
					res,
					500,
					'Fatal error handling driver model',
					err
				)
			})
	}

	static session(req, res) {
		let decoded = JWTHelper.getToken(req, res, 'jwt_auth')
		if (decoded.type == 0)
			driverModel
				.findById(decoded.self)
				.then((result) => {
					if (result)
						JSONResponse.success(req, res, 200, 'Session resumed', result)
					else JSONResponse.error(req, res, 404, 'No user found')
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
	static verifyDriver(req, res) {
		let did = req.params.id
		driverModel
			.findById(did)
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
								'User verified successfully'
							)
						})
						.catch((err) => {
							JSONResponse.error(
								req,
								res,
								500,
								'Fatal error handling user model',
								err
							)
						})
				}
			})
			.catch((err) => {
				JSONResponse.error(req, res, 400, 'Invalid user!', err)
			})
	}

	static updateDriver(req, res) {
		let body = req.body
		let decoded = JWTHelper.getToken(req, res, 'jwt_auth')
		let uid = decoded.self
		driverModel.findByIdAndUpdate(uid, body, (err, result) => {
			if (err) {
				JSONResponse.error(
					req,
					res,
					500,
					'Fatal error handling driver model',
					err
				)
			} else if (result.length == 1) {
				JSONResponse.success(
					req,
					res,
					200,
					'Successfully updated driver',
					result
				)
			} else {
				JSONResponse.error(req, res, 404, 'Could not find specified driver')
			}
		})
	}

	static updateDriverAny(req, res) {
		let body = req.body
		let uid = req.params.id
		driverModel.findByIdAndUpdate(uid, body, (err, result) => {
			if (err) {
				JSONResponse.error(
					req,
					res,
					500,
					'Fatal error handling driver model',
					err
				)
			} else if (result.length == 1) {
				JSONResponse.success(
					req,
					res,
					200,
					'Successfully updated driver',
					result
				)
			} else {
				JSONResponse.error(req, res, 404, 'Could not find specified driver')
			}
		})
	}

	//Delete
	static deleteDriver(req, res) {
		let did = JWTHelper.getToken(req, res, 'jwt_auth').self
		driverModel
			.findByIdAndDelete(did)
			.then((result) => {
				if (result) {
					JSONResponse.success(
						req,
						res,
						200,
						'Successfully deleted driver'
					)
				} else {
					JSONResponse.error(
						req,
						res,
						404,
						'Could not find specified driver'
					)
				}
			})
			.catch((err) => {
				JSONResponse.error(
					req,
					res,
					500,
					'Fatal error handling driver model',
					err
				)
			})
	}

	static deleteDriverAny(req, res) {
		let did = JWTHelper.getToken(req, res, 'jwt_auth').self
		driverModel
			.findByIdAndDelete(did)
			.then((result) => {
				if (result) {
					JSONResponse.success(
						req,
						res,
						200,
						'Successfully deleted driver'
					)
				} else {
					JSONResponse.error(
						req,
						res,
						404,
						'Could not find specified driver'
					)
				}
			})
			.catch((err) => {
				JSONResponse.error(
					req,
					res,
					500,
					'Fatal error handling driver model',
					err
				)
			})
	}
}

module.exports = controller
