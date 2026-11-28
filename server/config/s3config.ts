import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Same bucket/account as WoNoMasterPanel's own config/s3config.js — set the
// same PROJECT_AWS_*/PROJECT_S3_BUCKET_NAME values in this app's .env.
const s3Client = new S3Client({
  region: process.env.PROJECT_AWS_REGION,
  credentials: {
    accessKeyId: process.env.PROJECT_AWS_ACCESS_KEY as string,
    secretAccessKey: process.env.PROJECT_AWS_SECRET_KEY as string,
  },
});

export async function uploadFileToS3(key: string, file: { buffer: Buffer; mimetype: string }) {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.PROJECT_S3_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: "public-read",
    }),
  );
  return {
    id: key,
    url: `https://${process.env.PROJECT_S3_BUCKET_NAME}.s3.${process.env.PROJECT_AWS_REGION}.amazonaws.com/${key}`,
  };
}
