require('dotenv').config();
const readline = require('node:readline');
const { getPool } = require('../src/db');
const { hashPassword } = require('../src/admin-security');
const rl = readline.createInterface({ input:process.stdin, output:process.stdout, terminal:true });
const ask = question => new Promise(resolve=>rl.question(question,resolve));
async function secret(prompt) {
  if (!process.stdin.isTTY) throw new Error('Ejecuta este comando en una terminal interactiva de VS Code.');
  rl.pause();
  process.stdout.write(prompt);
  const stdin = process.stdin;
  const wasRaw = stdin.isRaw;
  stdin.setRawMode(true);
  stdin.resume();
  let value='';
  return await new Promise((resolve,reject)=>{
    const finish=()=>{stdin.off('data',onKey);stdin.setRawMode(Boolean(wasRaw));stdin.pause();process.stdout.write('\n');rl.resume();resolve(value);};
    function onKey(buf){
      for (const c of buf.toString('utf8')) {
        if(c==='\u0003'){stdin.off('data',onKey);stdin.setRawMode(Boolean(wasRaw));stdin.pause();process.stdout.write('\n');reject(new Error('Cancelado'));return;}
        if(c==='\r'||c==='\n'){finish();return;}
        if(c==='\u007f'||c==='\b'){value=value.slice(0,-1);}
        else if(c>=' ' && value.length<256) value+=c;
      }
    }
    stdin.on('data',onKey);
  });
}
(async()=>{
  if(process.env.DEMO_MODE==='true') throw new Error('Cambia DEMO_MODE=false en .env');
  const pool=getPool();
  const [[{n}]]=await pool.execute(`SELECT COUNT(*) AS n FROM usuario u JOIN rol r ON r.id=u.rol_id WHERE r.nombre='Administrador'`);
  if(n>0){console.log('Ya existe un administrador. No se creará otra cuenta automáticamente.');return;}
  console.log('\nCONFIGURACIÓN INICIAL DEL ADMINISTRADOR (solo desarrollo local)');
  const name=(await ask('Nombre del administrador: ')).trim();
  const email=(await ask('Correo electrónico: ')).trim().toLowerCase();
  if(name.length<2||name.length>120)throw new Error('Nombre inválido');
  if(email.length>190||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Correo inválido');
  const password=await secret('Contraseña (mínimo 12 caracteres, no se mostrará): ');
  if(password.length<12||password.length>256)throw new Error('La contraseña debe tener entre 12 y 256 caracteres');
  const confirmation=await secret('Repite la contraseña: ');
  if(password!==confirmation)throw new Error('Las contraseñas no coinciden');
  const hash=await hashPassword(password);
  const [result]=await pool.execute(`INSERT INTO usuario(rol_id,nombre,email,password_hash,activo)
    SELECT id,?,?,?,1 FROM rol WHERE nombre='Administrador'`,[name,email,hash]);
  if(result.affectedRows!==1)throw new Error('No existe el rol Administrador. Revisa database/autodealer360.sql.');
  console.log('\nAdministrador creado. Abre http://localhost:3000/admin.html para iniciar sesión.');
})().catch(e=>{console.error('Error:',e.message);process.exitCode=1;}).finally(async()=>{rl.close();await getPool().end();});
