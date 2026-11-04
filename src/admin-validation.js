function invalid(msg) { const e = new Error(msg); e.status = 400; throw e; }
function string(value, name, limit, { required = true } = {}) {
  if (typeof value !== 'string') { if (!required && (value === undefined || value === null)) return ''; invalid(`${name} inválido`); }
  const v = value.trim();
  if ((required && !v) || v.length > limit) invalid(`${name} debe tener entre ${required ? 1 : 0} y ${limit} caracteres`);
  return v;
}
function integer(value, name, min, max) {
  if (typeof value !== 'number' && typeof value !== 'string') invalid(`${name} inválido`);
  if (typeof value === 'string' && !/^\d+$/.test(value.trim())) invalid(`${name} inválido`);
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < min || n > max) invalid(`${name} fuera de rango`);
  return n;
}
function parseImageUrls(raw) {
  if (!Array.isArray(raw) || raw.length > 12) invalid('Máximo 12 fotografías por vehículo');
  return raw.map(value => {
    const str = string(value, 'URL de fotografía', 1000);
    if (/^\/assets\/[a-zA-Z0-9._/-]+$/.test(str) && !str.includes('..')) return str;
    try {
      const url = new URL(str);
      if (url.protocol === 'https:' && url.username === '' && url.password === '' && url.hostname && !url.hash) return str;
    } catch {}
    invalid('Cada fotografía debe tener una URL HTTPS válida');
  });
}
function validateVehicle(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) invalid('Datos del vehículo inválidos');
  const anioMax = new Date().getFullYear() + 1;
  return {
    marca: string(body.marca, 'Marca', 80), modelo: string(body.modelo, 'Modelo', 80),
    version: string(body.version, 'Versión', 100),
    anio: integer(body.anio, 'Año', 1950, anioMax),
    precio: integer(body.precio, 'Precio', 100000, 9999999999999),
    kilometraje: integer(body.kilometraje, 'Kilometraje', 0, 3000000),
    color: string(body.color, 'Color', 60),
    transmision: string(body.transmision, 'Transmisión', 40),
    combustible: string(body.combustible, 'Combustible', 40),
    cilindraje: string(body.cilindraje, 'Cilindraje', 40),
    ciudad: string(body.ciudad, 'Ciudad', 80),
    descripcion_general: string(body.descripcion_general, 'Descripción general', 8000, { required: false }),
    descripcion_mecanica: string(body.descripcion_mecanica, 'Información mecánica', 8000, { required: false }),
    estado: ['Disponible','Reservado','Vendido'].includes(body.estado) ? body.estado : invalid('Estado inválido'),
    publicado: typeof body.publicado === 'boolean' ? body.publicado : invalid('Publicado debe ser verdadero o falso'),
    destacado: typeof body.destacado === 'boolean' ? body.destacado : invalid('Destacado debe ser verdadero o falso'),
    imagenes: parseImageUrls(body.imagenes || [])
  };
}
module.exports = { validateVehicle, parseImageUrls };
