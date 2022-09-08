require('dotenv').config()
const charterModel = require('../../../lib/db/models/charter.model')
const pricingModel = require('../../../lib/db/models/pricing.model')
const JSONResponse = require('../../../lib/json.helper')
const db = require('../../../lib/db/db')
const { Client } = require('@googlemaps/google-maps-services-js')
const Emailer = require('../../../lib/mail.helper')
const { CHARTERCOOL } = process.env
const workshiftlogModel = require('../../../lib/db/models/workshiftlog.model')
const client = new Client()

class controller {
	//Read
	static get(req, res) {
		let body = JSON.parse(req.params.obj)
		charterModel
			.find(body)
			.then((results) => {
				if (results.length > 0)
					JSONResponse.success(
						req,
						res,
						200,
						'Collected matching charters.',
						results
					)
				else {
					JSONResponse.error(req, res, 404, 'Could not find any charters.')
				}
			})
			.catch((err) => {
				JSONResponse.error(
					req,
					res,
					500,
					'Fatal error handling charter model.'
				)
			})
	}

	//Create
	static createCharter(req, res) {
		let body = req.body
		pricingModel
			.findOne({ tier: 'normal' })
			.then((result) => {
				body.price = body.return ? 2 * result.rate : result.rate
				body.timestamp = new Date()
				charterModel
					.find({ email: body.email })
					.then((result) => {
						if (result.length == 0) {
							new charterModel(body)
								.save()
								.then((result) => {
									if (result)
										JSONResponse.success(
											req,
											res,
											202,
											'Charter placed successfully.',
											result
										)
									else
										JSONResponse.error(
											req,
											res,
											409,
											'Could not place charter.'
										)
								})
								.catch((err) => {
									JSONResponse.error(
										req,
										res,
										500,
										'Fatal error handling charter model.',
										err
									)
								})
						} else {
							JSONResponse.error(
								req,
								res,
								409,
								'Only one charter may be placed at a time.'
							)
						}
					})
					.catch((err) => {
						JSONResponse.error(
							req,
							res,
							500,
							'Fatal error handling charter model.',
							err
						)
					})
			})
			.catch((err) => {
				JSONResponse.error(req, res, 404, 'Could not find price.')
			})
	}

	static respondCharter(req, res) {
		let did = req.session._id
		let body = req.body
		let driver = body.self
		function recursive() {
			if (
				!req.session.self.chartered &&
				!(
					new Date().getMilliseconds() / 1000 / 60 >=
					req.session.shift.time_end
				)
			)
				charterModel
					.findOne({
						$where: function () {
							return (
								!this._driver &&
								this.language == driver.language &&
								this.music == driver.music &&
								(() => {
									let flagA = false
									let flagB = false
									for (
										let i = 0;
										i < driver.operating_areas.length;
										i++
									) {
										if (
											new RegExp(driver.operating_areas[i]).test(
												this.leave
											)
										)
											flagA = true
										else if (
											new RegExp(driver.operating_areas[i]).test(
												this.arrive
											)
										)
											flagB = true
										if (flagA && flagB) break
									}
									return flagA && flagB
								})()
							)
						},
						sort: { appointment: -1 },
					})
					.then((result) => {
						result.looking = true
						result
							.save()
							.then((result) => {
								if (result) {
									let time
									client
										.directions({
											origin: body.location,
											destination: result.leave,
											avoidTolls: true,
											optimizeWaypoints: true,
											drivingOptions: {
												departureTime: new Date(),
											},
										})
										.then((resp) => {
											time =
												resp.data.routes[0].legs[0].duration.value
										})
										.catch((err) => {
											time = 0
										})
									let future = new Date(
										new Date().getMilliseconds() + time * 1000
									)
									if (future > result.appointment) {
										setTimeout(() => {
											result.looking = false
											result
												.save()
												.then(recursive)
												.catch((err) => {
													console.error(err)
												})
										}, 500)
									} else {
										result._driver = did
										result.expect = new Date(
											new Date().getMilliseconds() + time * 1000
										)
										result
											.save()
											.then((result) => {
												result
													.populate('_user')
													.then((composite) => {
														Emailer.sendMail(
															composite._user.email,
															'Charter matched!',
															`Dear Customer,\n
												Your charter, requested for ${composite.appointment} - delivering you from ${
																composite.leave
															} to ${
																composite.arrive
															} has been arranged. Estimated time to pickup: ${
																time + 5
															} minutes.
											`
														)
														Emailer.sendMail(
															composite._user.email,
															'Charter matched!',
															`Dear Driver,\n
												You have a new charter, requested for ${composite.appointment} - delivering ${
																composite.title
															}. ${
																composite.name +
																' ' +
																composite.surname
															} from ${composite.leave} to ${
																composite.arrive
															}. Please be punctual and follow company pickup guidelines.
											`
														)
														req.session.self.chartered = true
														req.session.self
															.save(recursive)
															.catch((err) => {
																console.error(err)
																req.session.destroy()
																sendMail(
																	req.session.self.email,
																	"You've been signed out",
																	`Dear Driver,\n
																		Due to a server error you have been logged out, the server might be down, if this is the case rest assured out team is working on resolving the issue.`
																)
															})
													})
													.catch((err) => {
														console.error(err)
														result.looking = false
														result
															.save()
															.then(recursive)
															.catch((err) => {
																console.error(err)
															})
													})
											})
											.catch((err) => {
												console.error(err)
												result.looking = false
												result
													.save()
													.then(recursive)
													.catch((err) => {
														console.error(err)
													})
											})
									}
								} else {
									console.error(err)
									result.looking = false
									result
										.save()
										.then(recursive)
										.catch((err) => {
											console.error(err)
										})
								}
							})
							.catch((err) => {
								console.error(err)
								result.looking = false
								result
									.save()
									.then(recursive)
									.catch((err) => {
										console.error(err)
									})
							})
					})
					.catch((err) => {
						console.error(err)
						result.looking = false
						result
							.save()
							.then(recursive)
							.catch((err) => {
								console.error(err)
							})
					})
			else if (
				!(
					new Date().getMilliseconds() / 1000 / 60 >=
					req.session.shift.time_end
				)
			)
				setTimeout(() => {
					if (req.session) recursive()
				}, 1000 * 60 * parseInt(CHARTERCOOL))
			else {
				workshiftlogModel
					.findById(req.session.self.work_shift)
					.then((result) => {
						result.time_end = new Date().getMilliseconds() / 1000 / 60
						req.session.destroy()
					})
					.catch((err) => {
						req.session.destroy()
					})
			}
		}
		recursive()
	}

	static deleteCharter(req, res) {
		let cid = req.params.id
		charterModel
			.findOneAndDelete({
				$match: { _id: new db.Types.ObjectId(cid), _driver: null },
			})
			.then((result) => {
				if (result) {
					JSONResponse.success(
						req,
						res,
						200,
						'Successfully removed charter.',
						result
					)
				} else {
					JSONResponse.error(req, res, 404, 'No matching charter found.')
				}
			})
			.catch((err) => {
				JSONResponse.error(
					req,
					res,
					500,
					'Fatal error handling charter model.',
					err
				)
			})
	}
}

module.exports = controller
