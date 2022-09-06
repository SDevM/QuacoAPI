require('dotenv').config()
const nodemailer = require('nodemailer')
const JSONResponse = require('./json.helper')
const { GMAILU, GMAILP, DOMAIN } = process.env

class Emailer {
	transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: GMAILU,
			pass: GMAILP,
		},
	})

	/**
	 * Sends an email to the intended recipient.
	 * @param {*} to - The recipient or recipient array for the email
	 * @param {*} sub - The subject of the email
	 * @param {*} body - The body of the email
	 */
	sendMail(to, sub, body) {
		let mailOptions = {
			to: to,
			from: GMAIL.user,
			subject: sub,
			text: body,
		}
		this.transporter.sendMail(mailOptions, function (error, info) {
			if (error) {
				console.error(error)
			} else {
				console.log('Email sent: ' + info.response)
			}
		})
	}

	/**
	 * Sends a verification email to the alleged email of the user.
	 * @param {*} user - A new, inactive user
	 */
	verifyEmail(user, res) {
		let mailOptions = {
			to: user.email,
			from: GMAIL.user,
			subject: 'Confirm email!',
			text: `Please click the link to confirm that this is you creating an account on our platform.\n${DOMAIN}/api/v1/users/verify/${user._id}`,
		}

		this.transporter.sendMail(mailOptions, function (error, info) {
			if (error) {
				console.error(error)
				user.delete()
				JSONResponse.error(
					req,
					req,
					res,
					404,
					'Failed to send verification email, deleting inactive account!',
					error
				)
			} else {
				console.log('Email sent: ' + info.response)
				user.save()
				JSONResponse.success(
					req,
					req,
					res,
					200,
					`Verification email sent to ${user.email}`
				)
			}
		})
	}
}

module.exports = new Emailer()
