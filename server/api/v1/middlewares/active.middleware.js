const adminModel = require('../../../lib/db/models/admin.model')
const driverModel = require('../../../lib/db/models/driver.model')
const userModel = require('../../../lib/db/models/user.model')
const JSONResponse = require('../../../lib/json.helper')
const JWTHelper = require('../../../lib/jwt.helper')

const activeCheck = async (req, res, next) => {
	let decoded = JWTHelper.getToken(req, res, 'jwt_auth')
	switch (decoded.type) {
		case 0:
			let result1 = await driverModel.findById(decoded.self)
			if (!result1.active) {
				JSONResponse.error(req, res, 401, 'Email unverified')
				return
			} else next()
			break
		case 1:
			let result2 = await userModel.findById(decoded.self)
			if (!result2.active) {
				JSONResponse.error(req, res, 401, 'Email unverified')
				return
			} else next()
			break
		case 2:
			let result3 = await adminModel.findById(decoded.self)
			if (!result3.active) {
				JSONResponse.error(req, res, 401, 'Email unverified')
				return
			} else next()
			break
	}
}

module.exports = activeCheck
