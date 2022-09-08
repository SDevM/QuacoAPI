const paymentModel = require('../../../lib/db/models/payment.model')
const JSONResponse = require('../../../lib/json.helper')
const JWTHelper = require('../../../lib/jwt.helper')

class controller {
	//Read
	static get(req, res) {
		let deco = JWTHelper.getToken(req, res, 'jwt_auth')
		paymentModel
			.find({ account: deco.self })
			.then((results) => {
				if (results.length > 0)
					JSONResponse.success(
						req,
						res,
						200,
						'Collected matching payment methods',
						results
					)
				else
					JSONResponse.error(
						req,
						res,
						404,
						'Could not find any payment methods'
					)
			})
			.catch((err) => {
				JSONResponse.error(
					req,
					res,
					500,
					'Fatal error handling payment method model',
					err
				)
			})
	}

	static getAny(req, res) {
		paymentModel
			.find()
			.then((results) => {
				if (results.length > 0)
					JSONResponse.success(
						req,
						res,
						200,
						'Collected matching payment methods',
						results
					)
				else
					JSONResponse.error(
						req,
						res,
						404,
						'Could not find any payment methods'
					)
			})
			.catch((err) => {
				JSONResponse.error(
					req,
					res,
					500,
					'Fatal error handling payment method model',
					err
				)
			})
	}

	//Create
	static async addPaymentMethod(req, res) {
		let body = req.body
		let self = JWTHelper.getToken(req, res, 'jwt_auth').self
		body.account = self
		let newPaymentMethod = new paymentModel(body)
		let dupe = await newPaymentMethod.checkDupe()
		if (dupe) {
			JSONResponse.error(req, res, 409, 'Payment method already registered')
		} else {
			newPaymentMethod
				.validate()
				.then(() => {
					newPaymentMethod
						.save()
						.then((result) => {
							JSONResponse.success(
								req,
								res,
								202,
								'Payment method added successfully',
								result
							)
						})
						.catch((err) => {
							JSONResponse.error(
								req,
								res,
								500,
								'Fatal error handling payment method model',
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
							Object.keys(err.errors)[Object.keys(err.errors).length - 1]
						].properties.message,
						err.errors[
							Object.keys(err.errors)[Object.keys(err.errors).length - 1]
						]
					)
				})
		}
	}

	//Delete
	static deletePayment(req, res) {
		let deco = JWTHelper.getToken(req, res, 'jwt_auth')
		let uid = deco.self
		let pid = req.params.id
		paymentModel
			.findOneAndDelete({ account: uid, _id: pid })
			.then((result) => {
				if (result) {
					JSONResponse.success(
						req,
						res,
						200,
						'Successfully removed payment method.'
					)
				} else {
					JSONResponse.error(
						req,
						res,
						404,
						'Could not find payment method.'
					)
				}
			})
			.catch((err) => {
				JSONResponse.error(
					req,
					res,
					500,
					'Fatal error handling payment method model.',
					err
				)
			})
	}
}

module.exports = controller
