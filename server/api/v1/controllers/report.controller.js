const reportModel = require('../../../lib/db/models/report.model')
const charterModel = require('../../../lib/db/models/charter.model')
const JSONResponse = require('../../../lib/json.helper')
const Emailer = require('../../../lib/mail.helper')
const driverModel = require('../../../lib/db/models/driver.model')
const db = require('../../../lib/db/db')
const JWTHelper = require('../../../lib/jwt.helper')

class controller {
	//Create
	static openReport(req, res) {
		let body = req.body
		let { type, self } = JWTHelper.getToken(req, res, 'jwt_auth')
		type = type == 0 ? 'driver' : type == 1 ? 'user' : null
		if (type) {
			body.report.filer = self
			let new_report = new reportModel({
				charter: body.charter,
				type: type,
				report: body.report,
			})
			new_report
				.validate()
				.then(() => {
					new_report
						.save()
						.then((data) => {
							JSONResponse.success(req, res, 201, 'Report placed.', data)
						})
						.catch((err) => {
							JSONResponse.error(
								req,
								res,
								500,
								'Failed to place report.',
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
					return
				})
		} else {
			JSONResponse.error(req, res, 400, 'Bad request.')
		}
	}

	//Read
	static getReports(req, res) {
		let self = req.session.self
		let type = req.session.type
		let buffer = []
		charterModel
			.find(
				type == 0 ? { _driver: self } : type == 1 ? { _user: self } : null
			)
			.then((results) => {
				let i = 0
				let max = results.length
				let func = async (a) => {
					if (a == max) return
					reportModel
						.find({ charter: results[a].charter, open: true })
						.then((results) => {
							if (results) buffer.concat(results)
							func(++i)
						})
						.catch((err) => {
							JSONResponse.error(
								req,
								res,
								500,
								'Could not collect all reports, this is a server issue.'
							)
						})
				}
				func(i).then(() => {
					JSONResponse.success(
						req,
						res,
						200,
						'Collected all related reports.',
						buffer
					)
				})
			})
			.catch((err) => {
				JSONResponse.error(req, res, 500, 'Fatal Error! Server Down!')
			})
	}

	static getReportsAny(req, res) {
		reportModel
			.find(req.body)
			.then((results) => {
				JSONResponse.success(
					req,
					res,
					200,
					'All reports collected.',
					results
				)
			})
			.catch((err) => {
				console.error(err)
				JSONResponse.error(
					req,
					res,
					500,
					'Failure handling report model.',
					err
				)
			})
	}

	//Update
	static closeReport(req, res) {
		let rid = req.params.id
		reportModel
			.findById(rid)
			.then((result) => {
				result.open = false
				result
					.save()
					.then((result) => {
						switch (result.type) {
							case 0:
								driverModel
									.findById(result.filer)
									.then((result) => {
										if (result)
											Emailer.sendMail(
												result.email,
												'Report Closed!',
												`
                                            This report has been vetted by an administrator, fitting action has been taken and the issue is resolved.
                                        `
											)
										else
											JSONResponse.error(
												req,
												res,
												404,
												'Driver not found!'
											)
									})
									.catch((err) => {
										JSONResponse.error(
											req,
											res,
											500,
											'Fatal error handling driver model. Report closed email not sent!',
											err
										)
									})
								break
							case 1:
								break
						}
						sendMail()
						JSONResponse.success(
							req,
							res,
							200,
							'Report closed successfully.'
						)
					})
					.catch()
			})
			.catch((err) => {
				JSONResponse.error(
					req,
					res,
					500,
					'Fatal error handling report model.',
					err
				)
			})
	}

	static threadReport(req, res) {
		let self = req.session.self
		let body = req.body
		let id = req.params.id
		reportModel
			.find({
				$match: {
					_id: new db.Types.ObjectId(id),
					type: self.type,
					filer: self,
				},
			})
			.then((result) => {
				if (result) {
					result.report.push(body)
					result
						.save()
						.then((result) => {
							JSONResponse.success(
								req,
								res,
								200,
								'Report response logged.',
								result
							)
						})
						.catch((err) => {
							JSONResponse.error(
								req,
								res,
								500,
								'Failure saving report response!',
								err
							)
						})
				} else {
					JSONResponse.error(req, res, 404, 'Report not found!')
				}
			})
			.catch((err) => {
				JSONResponse.error(
					req,
					res,
					500,
					'Failure handling report model.',
					err
				)
			})
	}
}

module.exports = controller
