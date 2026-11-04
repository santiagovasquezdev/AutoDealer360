const test = require('node:test');
const assert = require('node:assert/strict');
const { detectedMime, cloudinaryConfig, uploadImage } = require('../src/image-upload');
const png=Buffer.from([137,80,78,71,13,10,26,10,0,0]);
const jpg=Buffer.from([255,216,255,224,0,0]);
const webp=Buffer.from('RIFF\x00\x00\x00\x00WEBP', 'binary');
test('reconoce cabeceras válidas y rechaza archivos que fingen ser fotos',()=>{
  assert.equal(detectedMime(png),'image/png');
  assert.equal(detectedMime(jpg),'image/jpeg');
  assert.equal(detectedMime(webp),'image/webp');
  assert.equal(detectedMime(Buffer.from('<svg></svg>')),null);
});
test('requiere variables de Cloudinary',()=>{
  const prior={...process.env};
  delete process.env.CLOUDINARY_CLOUD_NAME;
  assert.equal(cloudinaryConfig(),null);
  process.env=prior;
});
test('sube JPEG de forma privada al servicio remoto y recibe URL HTTPS',async()=>{
  const prior={...process.env};
  process.env.CLOUDINARY_CLOUD_NAME='test-nube';
  process.env.CLOUDINARY_API_KEY='111';
  process.env.CLOUDINARY_API_SECRET='test-secret';
  let callCount=0;
  try {
    const result=await uploadImage({buffer:jpg,size:jpg.length,mimetype:'image/jpeg'}, {apiFetch:async (url,opts)=>{
      callCount++;
      assert.match(url,/^https:\/\/api\.cloudinary\.com\/v1_1\/test-nube\/image\/upload$/);
      assert.match(opts.headers.Authorization,/^Basic /);
      assert.equal(opts.body.get('folder'),'autodealer360/vehiculos');
      return {ok:true,json:async()=>({secure_url:'https://res.cloudinary.com/test-nube/image/upload/v123/test.jpg',public_id:'autodealer360/vehiculos/test'})};
    }});
    assert.equal(callCount,1);
    assert.match(result.url,/^https:\/\/res\.cloudinary\.com/);
  } finally {process.env=prior;}
});
test('impide subir HTML disfrazado de PNG',async()=>{
  const prior={...process.env};
  process.env.CLOUDINARY_CLOUD_NAME='test-nube';
  process.env.CLOUDINARY_API_KEY='111';
  process.env.CLOUDINARY_API_SECRET='test-secret';
  try{await assert.rejects(uploadImage({buffer:Buffer.from('<html/>'),size:7,mimetype:'image/png'}),/formato válido/);}
  finally{process.env=prior;}
});
