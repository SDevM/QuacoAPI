const userController = require('./controllers/user.controller')
const driverController = require('./controllers/driver.controller')
const adminController = require('./controllers/admin.controller')
const charterController = require('./controllers/charter.controller')
const reportController = require('./controllers/report.controller')
const paymentController = require('./controllers/payment.controller')
const typeCheck = require('./middlewares/type.middleware')
const JSONResponse = require('../../lib/json.helper')
const musicModel = require('../../lib/db/models/music.model')
const languagesModel = require('../../lib/db/models/language.model')
const JWTHelper = require('../../lib/jwt.helper')
const router = require('express').Router()
const multer = require('multer')
const activeCheck = require('./middlewares/active.middleware')
const upload = multer()

router.get('', (req, res) => {
	let concat = []
	for (let layer of router.stack) {
		concat.push(
			layer.route.path +
				' : ' +
				JSON.stringify(Object.keys(layer.route.methods))
		)
	}
	let body = {
		name: 'QuacoAPI v1',
		version: '1.2.8',
	}
	concat.forEach((e, index) => {
		body[`<p>Route(${index.toString()})`] = e + '</p>'
	})
	let view = ''
	Object.keys(body).forEach((e) => {
		view += `${e.toUpperCase()} ${body[e]} <br>`
	})
	res.send(view)
})

function logout(req, res) {
	JWTHelper.killToken(req, res, 'jwt_auth')
	JSONResponse.success(req, res, 200, 'Logged out successfully!')
}

router.route('/users/verify/:id').get(userController.verifyUser)
router.route('/users/login').post(userController.signIn)
router.route('/users/logout').get(logout)
router.route('/users/:obj').get(typeCheck(['admin']), userController.getSome)
router
	.route('/users/:id')
	.patch(typeCheck(['admin']), userController.updateUserAny)
	.delete(typeCheck(['admin']), userController.deleteUserAny)
router
	.route('/users')
	.get(userController.session)
	.post(upload.single('profile_pic'), userController.signUp)
	.patch(typeCheck(['user']), userController.updateUser)
	.delete(typeCheck(['user']), userController.deleteUser)

router.route('/drivers/verify/:id').get(driverController.verifyDriver)
router.route('/drivers/login').post(driverController.signIn)
router.route('/drivers/logout').get(logout)
router.route('/drivers/:obj').get(typeCheck(['admin']), driverController.get)
router
	.route('/drivers/:id')
	.patch(typeCheck(['admin']), driverController.updateDriverAny)
	.delete(typeCheck(['admin']), driverController.deleteDriverAny)
router
	.route('/drivers')
	.get(driverController.session)
	.post(upload.single('profile_pic'), driverController.signUp)
	.patch(typeCheck(['driver']), driverController.updateDriver)
	.delete(typeCheck(['driver']), driverController.deleteDriver)

router.route('/admins/login').post(adminController.signIn)
router.route('/admins/logout').get(logout)

router
	.route('/admins')
	.get(typeCheck(['admin']), adminController.session)
	.patch(typeCheck(['admin']), adminController.updateAdmin)
	.delete(typeCheck(['admin']), adminController.deleteAdmin)

router.route('/charters/:obj').get(typeCheck(['admin']), charterController.get)
router
	.route('/charters/:id')
	.delete(typeCheck(['user']), charterController.deleteCharter)
router
	.route('/charters')
	.post(typeCheck(['user']), activeCheck, charterController.createCharter)
	.patch(typeCheck(['driver']), activeCheck, charterController.respondCharter)

router
	.route('/reports/all')
	.get(typeCheck(['admin']), reportController.getReportsAny)
router
	.route('/reports/:id')
	.patch(typeCheck(['user', 'driver']), reportController.threadReport)
	.delete(typeCheck(['admin']), reportController.closeReport)
router
	.route('/reports')
	.get(typeCheck(['user', 'driver']), reportController.getReports)
	.post(
		typeCheck(['user', 'driver']),
		activeCheck,
		reportController.openReport
	)

router
	.route('/payments/all')
	.get(typeCheck(['admin']), paymentController.getAny)
router
	.route('/payments/:id')
	.delete(typeCheck(['user']), paymentController.deletePayment)
router
	.route('/payments')
	.get(typeCheck(['user']), paymentController.get)
	.post(typeCheck(['user']), activeCheck, paymentController.addPaymentMethod)

router.route('/music').get((req, res) => {
	musicModel
		.find()
		.then((results) => {
			JSONResponse.success(req, res, 200, 'Collected music', results)
		})
		.catch((err) => {
			JSONResponse.error(req, res, 500, 'Fatal Error! Server Down!', err)
		})
})
router.route('/languages').get((req, res) => {
	languagesModel
		.find()
		.then((results) => {
			JSONResponse.success(req, res, 200, 'Collected languages', results)
		})
		.catch((err) => {
			JSONResponse.error(req, res, 500, 'Fatal Error! Server Down!', err)
		})
})

module.exports = router
