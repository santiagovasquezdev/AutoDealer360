const { getPool } = require('./db');

const baseSelect = `SELECT v.id, ma.nombre AS marca, mo.nombre AS modelo, v.version, v.anio,
  v.precio, v.kilometraje, v.color, v.transmision, v.combustible, v.cilindraje, v.ciudad,
  v.descripcion_general, v.descripcion_mecanica, v.destacado, v.publicado,
  e.nombre AS estado,
  (SELECT iv.url FROM imagen_vehiculo iv WHERE iv.vehiculo_id=v.id
    ORDER BY iv.es_principal DESC, iv.orden ASC, iv.id ASC LIMIT 1) AS imagen_principal
  FROM vehiculo v JOIN modelo mo ON mo.id=v.modelo_id
  JOIN marca ma ON ma.id=mo.marca_id
  JOIN estado_vehiculo e ON e.id=v.estado_id`;
async function adminList() {
  const [rows] = await getPool().execute(`${baseSelect} ORDER BY v.id DESC LIMIT 500`);
  return rows;
}
async function adminFind(id) {
  const pool = getPool();
  const [rows] = await pool.execute(`${baseSelect} WHERE v.id = ?`, [id]);
  if (!rows.length) return null;
  const [images] = await pool.execute('SELECT url FROM imagen_vehiculo WHERE vehiculo_id=? ORDER BY es_principal DESC, orden ASC, id ASC', [id]);
  return { ...rows[0], imagenes: images.map(i => i.url) };
}
async function saveVehicle(data, id) {
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    let existing;
    if (id) {
      const [rows] = await conn.execute('SELECT id FROM vehiculo WHERE id=? FOR UPDATE', [id]);
      if (!rows.length) { await conn.rollback(); return null; }
      existing = rows[0];
    }
    const [brand] = await conn.execute('INSERT INTO marca(nombre) VALUES(?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)', [data.marca]);
    const [model] = await conn.execute('INSERT INTO modelo(marca_id,nombre) VALUES(?,?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)', [brand.insertId, data.modelo]);
    const [[state]] = await conn.execute('SELECT id FROM estado_vehiculo WHERE nombre=?', [data.estado]);
    if (!state) throw new Error('Estado no registrado en MySQL');
    const fields = ['modelo_id','estado_id','version','anio','precio','kilometraje','color','transmision','combustible','cilindraje','ciudad','descripcion_general','descripcion_mecanica','destacado','publicado'];
    const values = [model.insertId,state.id,data.version,data.anio,data.precio,data.kilometraje,data.color,data.transmision,data.combustible,data.cilindraje,data.ciudad,data.descripcion_general,data.descripcion_mecanica,Number(data.destacado),Number(data.publicado)];
    let vehicleId = id;
    if (existing) {
      await conn.execute(`UPDATE vehiculo SET ${fields.map(f=>`${f}=?`).join(', ')} WHERE id=?`, [...values,id]);
      await conn.execute('DELETE FROM imagen_vehiculo WHERE vehiculo_id=?', [id]);
    } else {
      const [res] = await conn.execute(`INSERT INTO vehiculo(${fields.join(',')}) VALUES(${fields.map(()=>'?').join(',')})`, values);
      vehicleId = res.insertId;
    }
    for (let i = 0; i < data.imagenes.length; i++) {
      await conn.execute('INSERT INTO imagen_vehiculo(vehiculo_id,url,orden,es_principal) VALUES(?,?,?,?)', [vehicleId,data.imagenes[i],i,i===0 ? 1 : 0]);
    }
    await conn.commit();
    return vehicleId;
  } catch(e) { await conn.rollback(); throw e; }
  finally { conn.release(); }
}
async function changeState(id, state) {
  const [res] = await getPool().execute(`UPDATE vehiculo SET estado_id=(SELECT id FROM estado_vehiculo WHERE nombre=?) WHERE id=?`, [state,id]);
  return res.affectedRows > 0;
}
async function unpublish(id) {
  const [res] = await getPool().execute('UPDATE vehiculo SET publicado=0 WHERE id=?', [id]);
  return res.affectedRows > 0;
}
module.exports = { adminList, adminFind, saveVehicle, changeState, unpublish };
