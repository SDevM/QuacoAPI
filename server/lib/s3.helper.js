require('dotenv').config()
const { BUCKET_REGION, ACCESS_ID, ACCESS_KEY, BUCKET } = process.env
const S3 = require('aws-sdk/clients/s3')
const { bufferToStream } = require('./converters.helper')
const s3 = new S3({
	region: BUCKET_REGION,
	credentials: {
		accessKeyId: ACCESS_ID,
		secretAccessKey: ACCESS_KEY,
	},
})

class S3Helper {
	static upload(file, name) {
		const uploadConf = {
			Bucket: BUCKET,
			Body: bufferToStream(file.buffer),
			Key: name,
		}

		return new Promise((resolve, reject) => {
			s3.upload(uploadConf)
				.promise()
				.then((data) => {
					resolve(data)
				})
				.catch((err) => {
					console.error(err)
					resolve(null)
				})
		})
	}

	static delete(name) {
		const deleteConf = {
			Bucket: BUCKET,
			Key: name,
		}

		return new Promise((resolve, reject) => {
			s3.deleteObject(deleteConf)
				.promise()
				.then((data) => {
					resolve(data)
				})
				.catch((err) => {
					console.error(err)
					resolve(null)
				})
		})
	}

	static download(name) {
		const downConf = {
			Bucket: BUCKET,
			Key: name,
		}

		return new Promise((resolve, reject) => {
			s3.getObject(downConf)
				.promise()
				.then((data) => {
					resolve(data)
				})
				.catch((err) => {
					console.error(err)
					resolve(null)
				})
		})
	}
}

module.exports = S3Helper
