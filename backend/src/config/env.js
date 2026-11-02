const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 8000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/crt_db',
  HRMS_MONGODB_URI: process.env.HRMS_MONGODB_URI || '',
  JWT_SECRET_KEY: process.env.JWT_SECRET_KEY || 'versant-default-secret-key-2024',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  JWT_REFRESH_SECRET_KEY: process.env.JWT_REFRESH_SECRET_KEY || 'versant-refresh-secret-key-2024',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || 'versant-audio-bucket',
  AI_SERVER_URL: process.env.AI_SERVER_URL || 'http://localhost:8001',
  BREVO_API_KEY: process.env.BREVO_API_KEY || '',
  SENDER_EMAIL: process.env.SENDER_EMAIL || 'noreply@versant.com',
  SENDER_NAME: process.env.SENDER_NAME || 'VERSANT System',
  CORS_ORIGINS: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:5173'],
  DB_HOST: process.env.DB_HOST || '',
  DB_PORT: parseInt(process.env.DB_PORT || '3306', 10),
  DB_USER: process.env.DB_USER || '',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'student_database',
  DB_SSL: process.env.DB_SSL === 'true',
  USE_RDS_ORG_DATA: process.env.USE_RDS_ORG_DATA === 'true',
  MYSQL_RDS_READ_ONLY: process.env.MYSQL_RDS_READ_ONLY === 'true'
};
