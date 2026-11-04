const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3Client, bucketName } = require('../config/aws');
const fs = require('fs');
const path = require('path');

class S3Service {
  async uploadFile(fileBuffer, key, mimeType) {
    const cleanKey = String(key || `audio_${Date.now()}.wav`).replace(/^\/+/, '');

    // 1. Attempt AWS S3 upload if configured
    if (bucketName && s3Client && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_ACCESS_KEY_ID !== 'your_access_key') {
      try {
        const command = new PutObjectCommand({
          Bucket: bucketName,
          Key: cleanKey,
          Body: fileBuffer,
          ContentType: mimeType || 'audio/wav',
        });

        await s3Client.send(command);
        return `https://${bucketName}.s3.amazonaws.com/${cleanKey}`;
      } catch (error) {
        console.warn('[S3Service] S3 Upload failed, saving audio locally:', error.message);
      }
    }

    // 2. Local storage fallback: save file directly into backend uploads folder
    try {
      const uploadsDir = path.resolve(__dirname, '../uploads');
      const targetFilePath = path.join(uploadsDir, cleanKey);
      const targetFileDir = path.dirname(targetFilePath);

      if (!fs.existsSync(targetFileDir)) {
        fs.mkdirSync(targetFileDir, { recursive: true });
      }

      fs.writeFileSync(targetFilePath, fileBuffer);
      return `/uploads/${cleanKey}`;
    } catch (localErr) {
      console.error('[S3Service] Local file storage error:', localErr);
      return `/uploads/${cleanKey}`;
    }
  }

  async getPresignedDownloadUrl(key, expiresIn = 3600) {
    if (!key) return '';
    if (key.startsWith('http://') || key.startsWith('https://') || key.startsWith('/') || key.startsWith('data:')) {
      return key;
    }

    if (bucketName && s3Client && process.env.AWS_ACCESS_KEY_ID) {
      try {
        const command = new GetObjectCommand({
          Bucket: bucketName,
          Key: key,
        });
        return await getSignedUrl(s3Client, command, { expiresIn });
      } catch (error) {
        console.warn('[S3Service] S3 Signed URL Error:', error.message);
      }
    }
    return `/uploads/${key.replace(/^\/+/, '')}`;
  }
}

module.exports = new S3Service();
