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
	static addPaymentMethod(req, res) {
		let body = req.body
		let newPaymentMethod = new paymentModel(body)
		newPaymentMethod.validate().catch((err) => {
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
