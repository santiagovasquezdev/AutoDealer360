const express = require('express');
const { getPool } = require('./db');
const { receiveImage, uploadImage } = require('./image-upload');
const { validateVehicle } = require('./admin-validation');
const { adminList, adminFind, saveVehicle, changeState, unpublish } = require('./admin-repository');
const { verifyPassword, newToken, tokenHash, safeSame, cookieName, cookieOptions } = require('./admin-security');
const router = express.Router();
const loginAttempts = new Map();

// En un despliegue con varias instancias sustituir por un limitador compartido (Redis).
function limitLogin(req, res, next) {
  const key = req.ip;
  const now = Date.now();
  if (loginAttempts.size > 1000) for (const [k,v] of loginAttempts) if (v.until < now) loginAttempts.delete(k);
  const current = loginAttempts.get(key) || { count:0, until:now+15*60*1000 };
  if (current.until <= now) { current.count=0; current.until=now+15*60*1000; }
  current.count++;
  loginAttempts.set(key,current);
  if (current.count > 8) return res.status(429).json({error:'Demasiados intentos. Prueba dentro de 15 minutos.'});
  next();
}
function jsonOnly(req,res,next) {
  if (!req.is('application/json')) return res.status(415).json({ error:'Se requiere Content-Type: application/json' });
  next();
}
function sameOrigin(req,res,next) {
  if (!['POST','PUT','PATCH','DELETE'].includes(req.method)) return next();
  const origin=req.get('Origin');
  if (origin) {
    try { if (new URL(origin).host === req.get('host')) return next(); } catch {}
    return res.status(403).json({error:'Origen no permitido'});
  }
  // Los navegadores modernos envían Sec-Fetch-Site; cierra peticiones de otros sitios.
  const site=req.get('Sec-Fetch-Site');
  if (site && !['same-origin','none'].includes(site)) return res.status(403).json({error:'Origen no permitido'});
  next();
}
router.use(sameOrigin);
router.post('/login', jsonOnly, limitLogin, async (req,res,next) => {
  try {
    const email=req.body?.email;
    const password=req.body?.password;
    if (typeof email!=='string'||email.length>190||typeof password!=='string'||password.length>256) return res.status(400).json({error:'Correo y contraseña inválidos'});
    const [rows]=await getPool().execute(`SELECT u.id,u.nombre,u.password_hash,u.activo FROM usuario u
      JOIN rol r ON r.id=u.rol_id WHERE u.email=? AND r.nombre='Administrador' LIMIT 1`, [email.trim().toLowerCase()]);
    if (!rows.length||!rows[0].activo||!(await verifyPassword(password,rows[0].password_hash))) return res.status(401).json({error:'Credenciales incorrectas'});
    const token=newToken(), csrf=newToken();
    await getPool().execute(`INSERT INTO admin_sesion(usuario_id,token_hash,csrf_token,vence_en)
      VALUES (?,?,?,DATE_ADD(UTC_TIMESTAMP(),INTERVAL 12 HOUR))`,[rows[0].id,tokenHash(token),csrf]);
    res.cookie(cookieName,token,cookieOptions());
    loginAttempts.delete(req.ip);
    res.json({usuario:{id:rows[0].id,nombre:rows[0].nombre},csrfToken:csrf});
  } catch(e){next(e);}
});
async function requiresAdmin(req,res,next) {
  try {
    const token=req.cookies?.[cookieName] || (req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName+'='))?.slice(cookieName.length+1);
    if (!token || !/^[a-f\d]{64}$/.test(token)) return res.status(401).json({error:'Inicia sesión como administrador'});
    const [rows]=await getPool().execute(`SELECT u.id,u.nombre,s.csrf_token FROM admin_sesion s
      JOIN usuario u ON u.id=s.usuario_id JOIN rol r ON r.id=u.rol_id
      WHERE s.token_hash=? AND s.vence_en>UTC_TIMESTAMP() AND u.activo=1 AND r.nombre='Administrador' LIMIT 1`,[tokenHash(token)]);
    if (!rows.length) return res.status(401).json({error:'Sesión vencida. Inicia sesión nuevamente.'});
    req.admin=rows[0];req.sessionHash=tokenHash(token);next();
  } catch(e){next(e);}
}
router.use(requiresAdmin);
router.use((req,res,next)=>{
  if (['POST','PUT','PATCH','DELETE'].includes(req.method) && !safeSame(req.get('X-CSRF-Token'),req.admin.csrf_token))
    return res.status(403).json({error:'Token de seguridad inválido. Recarga la página.'});
  next();
});
router.get('/me',(req,res)=>res.json({usuario:{id:req.admin.id,nombre:req.admin.nombre},csrfToken:req.admin.csrf_token}));
router.post('/logout',jsonOnly,async(req,res,next)=>{
  try{await getPool().execute('DELETE FROM admin_sesion WHERE token_hash=?',[req.sessionHash]);res.clearCookie(cookieName,{ ...cookieOptions(), maxAge: undefined });res.json({ok:true});}
  catch(e){next(e);}
});
// Endpoint exclusivo para administradores. El navegador nunca recibe las credenciales de Cloudinary.
router.post('/fotos', receiveImage, async (req,res,next) => {
  try {
    if (!req.is('multipart/form-data')) return res.status(415).json({error:'Se requiere una fotografía en multipart/form-data'});
    const result=await uploadImage(req.file);
    res.status(201).json({ok:true, url:result.url});
  } catch(e) { next(e); }
});
router.get('/vehiculos',async(req,res,next)=>{try{res.json({vehiculos:await adminList()});}catch(e){next(e);}});
router.get('/vehiculos/:id',async(req,res,next)=>{
  try{const id=validId(req.params.id);const v=await adminFind(id);if(!v)return res.status(404).json({error:'Vehículo no encontrado'});res.json(v);}catch(e){next(e);}
});
router.post('/vehiculos',jsonOnly,async(req,res,next)=>{
  try{const data=validateVehicle(req.body);const id=await saveVehicle(data);res.status(201).json({id,ok:true});}catch(e){next(e);}
});
router.put('/vehiculos/:id',jsonOnly,async(req,res,next)=>{
  try{const id=validId(req.params.id);const data=validateVehicle(req.body);const saved=await saveVehicle(data,id);if(!saved)return res.status(404).json({error:'Vehículo no encontrado'});res.json({id:saved,ok:true});}catch(e){next(e);}
});
router.patch('/vehiculos/:id/estado',jsonOnly,async(req,res,next)=>{
  try{const id=validId(req.params.id);const state=req.body?.estado;if(!['Disponible','Reservado','Vendido'].includes(state))return res.status(400).json({error:'Estado inválido'});
    if(!await changeState(id,state))return res.status(404).json({error:'Vehículo no encontrado'});res.json({ok:true});
  }catch(e){next(e);}
});
router.delete('/vehiculos/:id',jsonOnly,async(req,res,next)=>{
  try{const id=validId(req.params.id);if(!await unpublish(id))return res.status(404).json({error:'Vehículo no encontrado'});res.json({ok:true,mensaje:'Publicación retirada; los datos se conservaron'});}catch(e){next(e);}
});
function validId(raw){ const n=Number(raw);if(!/^\d+$/.test(raw)||!Number.isSafeInteger(n)||n<1||n>4294967295){const e=new Error('ID de vehículo inválido');e.status=400;throw e;}return n; }
module.exports=router;
