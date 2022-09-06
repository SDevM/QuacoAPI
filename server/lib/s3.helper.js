require('dotenv').config()
const { AWS_BUCKET_REGION, AWS_ACCESS_ID, AWS_ACCESS_KEY, AWS_BUCKET } =
	process.env
const fs = require('fs')
const S3 = require('aws-sdk/clients/s3')
const s3 = new S3({
	region: AWS_BUCKET_REGION,
	credentials: {
		accessKeyId: AWS_ACCESS_ID,
		secretAccessKey: AWS_ACCESS_KEY,
	},
})

class S3Helper {
	static upload(file) {
		const fileStream = fs.createReadStream(file.path)

		const uploadConf = {
			Bucket: AWS_BUCKET,
			Body: fileStream,
			Key: file.filename,
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
}

module.exports = S3Helper
