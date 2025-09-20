import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { fileName, contentType } = req.body;
  const key = `uploads/${Date.now()}-${fileName}`;

  const cmd = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  try {
    const url = await getSignedUrl(s3, cmd, { expiresIn: 60 });
    console.log(
      "Presign success → REGION:",
      process.env.AWS_REGION,
      "BUCKET:",
      process.env.S3_BUCKET_NAME,
      "ACCESS_KEY:",
      process.env.AWS_ACCESS_KEY_ID ? "set" : "missing"
    );
    return res.status(200).json({ url, key });
  } catch (err) {
    console.error("Presign error:", err);
    return res.status(500).json({ error: err.message });
  }
}
