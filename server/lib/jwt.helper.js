require('dotenv').config()
const jwt = require('jsonwebtoken')
const { SESSION_SECRET } = process.env

class JWTHelper {
	static genToken(payload, expire = '1d') {
		return jwt.sign(payload, SESSION_SECRET, { expiresIn: expire })
	}
	static setToken(req, res, payload, name, expire = '1d') {
		res.cookie(name, this.genToken(payload, expire), {
			expiresIn: expire,
			httpOnly: true,
			secure: true,
			signed: true,
			sameSite: 'none',
		})
	}
	static getToken(req, res, name, expire = '1d') {
		let decoded
		try {
			decoded = jwt.verify(req.signedCookies[name], SESSION_SECRET, expire)
		} catch (err) {
			console.error(err)
			decoded = null
		}
		return decoded
	}
	static killToken(req, res, name) {
		res.cookie(name, null, {
			expiresIn: 0,
			httpOnly: true,
			secure: true,
			signed: true,
			sameSite: 'none',
		})
	}
}

module.exports = JWTHelper
