const userController = require('./controllers/user.controller')
const driverController = require('./controllers/driver.controller')
const adminController = require('./controllers/admin.controller')
const charterController = require('./controllers/charter.controller')
const reportController = require('./controllers/report.controller')
const typeCheck = require('./middlewares/type.middleware')
const JSONResponse = require('../../lib/json.helper')
const titlesModel = require('../../lib/db/models/titles.model')
const musicModel = require('../../lib/db/models/music.model')
const languagesModel = require('../../lib/db/models/languages.model')
const JWTHelper = require('../../lib/jwt.helper')
const router = require('express').Router()
const multer = require('multer')
const upload = multer()

router.get('', (req, res) => {
	res.json({
		name: 'QuacoAPI v1',
		version: '1.2.5',
		routes: router.stack,
	})
})

function logout(req, res) {
	JWTHelper.killToken(req, res)
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
	.post(driverController.signUp)
	.patch(typeCheck(['driver']), driverController.updateDriver)
	.delete(typeCheck(['driver']), driverController.deleteDriver)

router.route('/admins/login').post(adminController.signIn)
router.route('/admins/logout').get(logout)
router.route('/admins/:obj').get(typeCheck('...'), adminController.get)
router
	.route('/admins')
	.patch(typeCheck(['admin']), adminController.updateAdmin)
	.delete(typeCheck(['admin']), adminController.deleteAdmin)

router.route('/charters/:obj').get(typeCheck(['admin']), charterController.get)
router
	.route('/charters/:id')
	.delete(typeCheck(['user']), charterController.deleteCharter)
router
	.route('/charters')
	.post(typeCheck(['user']), charterController.createCharter)
	.patch(typeCheck(['driver']), charterController.respondCharter)

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
	.post(typeCheck(['user', 'driver']), reportController.openReport)

router.route('/titles').get((req, res) => {
	titlesModel
		.find()
		.then((results) => {
			JSONResponse.success(req, res, 200, 'Collected titles', results)
		})
		.catch((err) => {
			JSONResponse.error(req, res, 500, 'Failure handling titles model', err)
		})
})
router.route('/music').get((req, res) => {
	musicModel
		.find()
		.then((results) => {
			JSONResponse.success(req, res, 200, 'Collected titles', results)
		})
		.catch((err) => {
			JSONResponse.error(req, res, 500, 'Failure handling titles model', err)
		})
})
router.route('/languages').get((req, res) => {
	languagesModel
		.find()
		.then((results) => {
			JSONResponse.success(req, res, 200, 'Collected titles', results)
		})
		.catch((err) => {
			JSONResponse.error(req, res, 500, 'Failure handling titles model', err)
		})
})

module.exports = router
