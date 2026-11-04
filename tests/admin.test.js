const test=require('node:test');const assert=require('node:assert/strict');
const { hashPassword, verifyPassword, newToken, tokenHash, safeSame }=require('../src/admin-security');
const { validateVehicle }=require('../src/admin-validation');
const sample={marca:'Volkswagen',modelo:'Gol',version:'Trendline',anio:2021,precio:45000000,
  kilometraje:50000,color:'Blanco',transmision:'Manual',combustible:'Gasolina',
  cilindraje:'1.6 L',ciudad:'Bogotá',estado:'Disponible',destacado:false,publicado:true,
  imagenes:['https://example.org/foto.jpg']};
test('La contraseña se almacena como hash scrypt y se verifica',async()=>{
 const stored=await hashPassword('Contraseña muy segura 123!');
 assert.match(stored,/^scrypt\$/);assert.equal(await verifyPassword('Contraseña muy segura 123!',stored),true);
 assert.equal(await verifyPassword('incorrecta',stored),false);
});
test('Tokens criptográficos diferentes y verificación de igualdad',()=>{
 const a=newToken(),b=newToken();assert.notEqual(a,b);assert.equal(tokenHash(a).length,64);
 assert.equal(safeSame(a,a),true);assert.equal(safeSame(a,b),false);
});
test('Valida el vehículo y acepta fotos HTTPS',()=>{
 const v=validateVehicle(sample);assert.equal(v.precio,45000000);assert.deepEqual(v.imagenes,['https://example.org/foto.jpg']);
});
test('No permite urls javascript ni precios negativos',()=>{
 assert.throws(()=>validateVehicle({...sample,imagenes:['javascript:alert(1)']}));
 assert.throws(()=>validateVehicle({...sample,precio:-1}));
 assert.throws(()=>validateVehicle({...sample,estado:'Inventado'}));
});
