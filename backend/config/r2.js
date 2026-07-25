/**
 * Desafio+ — Cloudflare R2 Storage (compatível S3)
 */

const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME || 'desafio-plus-media';
const PUBLIC_URL = process.env.R2_PUBLIC_URL || '';

/**
 * Faz upload de um arquivo para o R2.
 * @param {Buffer} buffer - Conteúdo do arquivo
 * @param {string} mimetype - MIME type
 * @param {string} folder - Pasta (avatars | posts | proofs)
 * @returns {Promise<string>} URL pública do arquivo
 */
async function uploadFile(buffer, mimetype, folder = 'posts') {
  const ext = mimetype.split('/')[1] || 'bin';
  const key = `${folder}/${uuidv4()}.${ext}`;

  await r2Client.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimetype,
    CacheControl: 'public, max-age=31536000',
  }));

  return `${PUBLIC_URL}/${key}`;
}

/**
 * Gera uma URL pré-assinada para upload direto do cliente.
 */
async function getPresignedUploadUrl(folder = 'posts', mimetype = 'image/jpeg') {
  const ext = mimetype.split('/')[1] || 'bin';
  const key = `${folder}/${uuidv4()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: mimetype,
  });

  const url = await getSignedUrl(r2Client, command, { expiresIn: 300 }); // 5 min
  return { uploadUrl: url, publicUrl: `${PUBLIC_URL}/${key}`, key };
}

/**
 * Deleta um arquivo do R2.
 */
async function deleteFile(key) {
  await r2Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

module.exports = { uploadFile, getPresignedUploadUrl, deleteFile };
