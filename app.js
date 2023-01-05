require('dotenv').config()
const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const app = express()
const API_V1 = require('./server/api/v1/hub.js')
const { NAME, CORS, SESSION_SECRET, DOMAIN, PORT } = process.env
const APP_NAME = NAME || 'Express API'

// Establish API
app.all('', (req, res) => {
	res.json({
		name: APP_NAME,
		versions: ['v1'],
		'I.P': req.socket.remoteAddress,
	})
})

// Middlewares
app.options(
	'*',
	cors({
		origin: CORS,
		credentials: true,
	})
)
app.use(
	cors({
		origin: CORS,
		credentials: true,
	})
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser(SESSION_SECRET))
app.use('/api/v1', API_V1)

// Start express app
app.listen(PORT, () => {
	console.log(`Server listening on ${DOMAIN}`)
})
