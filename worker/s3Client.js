const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3')
const streamToBuffer = async (stream) => {
  const chunks = []
  for await (const chunk of stream) chunks.push(Buffer.from(chunk))
  return Buffer.concat(chunks)
}

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
})

async function downloadFile(bucket, key) {
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key })
  const resp = await s3.send(cmd)
  const buffer = await streamToBuffer(resp.Body)
  return buffer
}

module.exports = { downloadFile }
