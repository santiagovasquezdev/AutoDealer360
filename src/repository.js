const { getPool } = require('./db');
const { vehiculos } = require('./demo-data');
const { selectDemo } = require('./filters');
const pageSize = 9;
const isDemo = () => process.env.DEMO_MODE === 'true';

async function findVehicles(filters) {
  if (isDemo()) return selectDemo(vehiculos, filters, pageSize);
  const clauses = ["e.nombre = 'Disponible'", 'v.publicado = 1'];
  const params = [];
  if (filters.marca) { clauses.push('ma.nombre = ?'); params.push(filters.marca); }
  if (filters.modelo) { clauses.push('mo.nombre = ?'); params.push(filters.modelo); }
  if (filters.color) { clauses.push('v.color = ?'); params.push(filters.color); }
  if (filters.precioMin !== null) { clauses.push('v.precio >= ?'); params.push(filters.precioMin); }
  if (filters.precioMax !== null) { clauses.push('v.precio <= ?'); params.push(filters.precioMax); }
  if (filters.q) {
    clauses.push('(ma.nombre LIKE ? OR mo.nombre LIKE ? OR v.version LIKE ?)');
    const term = `%${filters.q}%`;
    params.push(term, term, term);
  }
  const where = `WHERE ${clauses.join(' AND ')}`;
  const join = `FROM vehiculo v
    JOIN modelo mo ON mo.id = v.modelo_id
    JOIN marca ma ON ma.id = mo.marca_id
    JOIN estado_vehiculo e ON e.id = v.estado_id`;
  const pool = getPool();
  const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total ${join} ${where}`, params);
  const offset = (filters.pagina - 1) * pageSize;
  const sql = `SELECT v.id, ma.nombre AS marca, mo.nombre AS modelo, v.version, v.anio,
        v.precio, v.kilometraje, v.color, v.transmision, v.combustible, v.cilindraje,
        v.ciudad, v.descripcion_general, v.descripcion_mecanica, v.destacado,
        e.nombre AS estado,
        (SELECT iv.url FROM imagen_vehiculo iv WHERE iv.vehiculo_id=v.id
          ORDER BY iv.es_principal DESC, iv.orden ASC, iv.id ASC LIMIT 1) AS imagen_principal
      ${join} ${where} ORDER BY v.destacado DESC, v.id DESC LIMIT ${pageSize} OFFSET ${offset}`;
  const [rows] = await pool.execute(sql, params);
  return { vehiculos: rows, total, pagina: filters.pagina, porPagina: pageSize };
}

async function findVehicleById(id) {
  if (isDemo()) {
    const item = vehiculos.find(v => v.id === id && v.estado === 'Disponible');
    return item ? { ...item, imagenes: [item.imagen_principal] } : null;
  }
  const pool = getPool();
  const sql = `SELECT v.id, ma.nombre AS marca, mo.nombre AS modelo, v.version, v.anio,
      v.precio, v.kilometraje, v.color, v.transmision, v.combustible, v.cilindraje,
      v.ciudad, v.descripcion_general, v.descripcion_mecanica, v.destacado,
      e.nombre AS estado
    FROM vehiculo v JOIN modelo mo ON v.modelo_id=mo.id
    JOIN marca ma ON ma.id=mo.marca_id
    JOIN estado_vehiculo e ON e.id=v.estado_id
    WHERE v.id=? AND v.publicado=1 AND e.nombre='Disponible'`;
  const [rows] = await pool.execute(sql, [id]);
  if (!rows.length) return null;
  const [images] = await pool.execute('SELECT url FROM imagen_vehiculo WHERE vehiculo_id=? ORDER BY es_principal DESC, orden ASC, id ASC', [id]);
  return { ...rows[0], imagenes: images.map(i => i.url) };
}
async function listFilters() {
  if (isDemo()) {
    const available = vehiculos.filter(v => v.estado === 'Disponible');
    const unique = key => [...new Set(available.map(v => v[key]))].sort((a, b) => a.localeCompare(b, 'es'));
    return { marcas: unique('marca'), modelos: unique('modelo'), colores: unique('color') };
  }
  const pool = getPool();
  const [rows] = await pool.execute(`SELECT DISTINCT ma.nombre AS marca, mo.nombre AS modelo, v.color
    FROM vehiculo v JOIN modelo mo ON mo.id=v.modelo_id JOIN marca ma ON ma.id=mo.marca_id
    JOIN estado_vehiculo e ON e.id=v.estado_id
    WHERE v.publicado=1 AND e.nombre='Disponible'`);
  const unique = key => [...new Set(rows.map(r => r[key]))].sort((a, b) => a.localeCompare(b, 'es'));
  return { marcas: unique('marca'), modelos: unique('modelo'), colores: unique('color') };
}
module.exports = { findVehicles, findVehicleById, listFilters, isDemo };
