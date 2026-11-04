'use strict';

const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const allowed = new Set(['image/jpeg','image/png','image/webp']);

function detectedMime(buffer) {
  if (!Buffer.isBuffer(buffer)) return null;
  if (buffer.length >= 3 && buffer[0]===0xff && buffer[1]===0xd8 && buffer[2]===0xff) return 'image/jpeg';
  if (buffer.length >= 8 && buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'image/png';
  if (buffer.length >= 12 && buffer.toString('ascii',0,4)==='RIFF' && buffer.toString('ascii',8,12)==='WEBP') return 'image/webp';
  return null;
}

let photoReceiver;
function receiveImage(req,res,next) {
  if (!photoReceiver) {
    const multer = require('multer');
    photoReceiver = multer({
      storage:multer.memoryStorage(),
      limits:{ fileSize:MAX_IMAGE_BYTES, files:1, fields:0, parts:1 },
      fileFilter(_req,file,callback) {
        if (!allowed.has(file.mimetype)) {
          const e = new Error('Solo se aceptan fotografías JPG, PNG o WebP'); e.status = 400;
          return callback(e);
        }
        callback(null,true);
      }
    }).single('foto');
  }
  return photoReceiver(req,res,next);
}

function cloudinaryConfig() {
  const cloud = (process.env.CLOUDINARY_CLOUD_NAME||'').trim();
  const key = (process.env.CLOUDINARY_API_KEY||'').trim();
  const secret = (process.env.CLOUDINARY_API_SECRET||'').trim();
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(cloud) || !key || !secret) return null;
  return { cloud, key, secret };
}
async function uploadImage(file, { apiFetch = fetch } = {}) {
  const config = cloudinaryConfig();
  if (!config) { const e = new Error('Falta configurar Cloudinary en el archivo .env'); e.status=503; throw e; }
  if (!file || !file.buffer || !allowed.has(file.mimetype) || !file.size || file.size>MAX_IMAGE_BYTES || detectedMime(file.buffer)!==file.mimetype) {
    const e = new Error('La fotografía no tiene un formato válido (JPG, PNG o WebP)'); e.status=400; throw e;
  }
  const form = new FormData();
  form.append('folder','autodealer360/vehiculos');
  form.append('file',new Blob([file.buffer],{type:file.mimetype}), 'foto.'+({ 'image/jpeg':'jpg','image/png':'png','image/webp':'webp' }[file.mimetype]));
  let response;
  try {
    response = await apiFetch(`https://api.cloudinary.com/v1_1/${config.cloud}/image/upload`, {
      method:'POST',
      headers: { Authorization:'Basic '+Buffer.from(config.key+':'+config.secret).toString('base64') },
      body:form,
      signal:AbortSignal.timeout(30000)
    });
  } catch {
    const e = new Error('No fue posible contactar Cloudinary. Revisa Internet e inténtalo de nuevo.');e.status=502;throw e;
  }
  if (!response.ok) {
    const e = new Error('Cloudinary rechazó la fotografía. Revisa tus claves y la configuración de tu cuenta.');e.status=502;throw e;
  }
  let payload;
  try { payload=await response.json(); } catch {}
  try {
    const url=new URL(payload.secure_url);
    if(url.protocol!=='https:' || url.hostname!=='res.cloudinary.com' || !payload.public_id)throw Error();
  } catch {
    const e=new Error('Cloudinary devolvió una respuesta inesperada'); e.status=502;throw e;
  }
  return { url:payload.secure_url, publicId:payload.public_id };
}
module.exports = { MAX_IMAGE_BYTES, detectedMime, receiveImage, cloudinaryConfig, uploadImage };
