function parseNonnegativeNumber(raw, field) {
  if (raw === undefined || raw === '') return null;
  if (!/^\d+$/.test(String(raw))) throw new Error(`${field} debe ser un número entero válido`);
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value > 9999999999999) {
    throw new Error(`${field} está fuera del rango permitido`);
  }
  return value;
}
function parseFilters(query = {}) {
  const first = (key, maxLength = 80) => {
    const value = query[key];
    if (value === undefined || value === '') return '';
    if (typeof value !== 'string' || value.length > maxLength) {
      throw new Error(`Filtro ${key} inválido`);
    }
    return value.trim();
  };
  const min = parseNonnegativeNumber(query.precioMin, 'Precio mínimo');
  const max = parseNonnegativeNumber(query.precioMax, 'Precio máximo');
  if (min !== null && max !== null && min > max) throw new Error('El precio mínimo no puede superar el máximo');
  const pageRaw = query.pagina || '1';
  if (!/^\d+$/.test(String(pageRaw)) || Number(pageRaw) < 1 || Number(pageRaw) > 10000) {
    throw new Error('Página inválida');
  }
  return {
    marca: first('marca'), modelo: first('modelo'), color: first('color'),
    q: first('q', 100), precioMin: min, precioMax: max, pagina: Number(pageRaw)
  };
}
function selectDemo(vehicles, filters, pageSize = 9) {
  const list = vehicles.filter(v => {
    const text = `${v.marca} ${v.modelo} ${v.version} ${v.descripcion_general}`.toLocaleLowerCase('es');
    return v.estado === 'Disponible'
      && (!filters.marca || v.marca === filters.marca)
      && (!filters.modelo || v.modelo === filters.modelo)
      && (!filters.color || v.color === filters.color)
      && (filters.precioMin === null || v.precio >= filters.precioMin)
      && (filters.precioMax === null || v.precio <= filters.precioMax)
      && (!filters.q || text.includes(filters.q.toLocaleLowerCase('es')));
  }).sort((a, b) => b.id - a.id);
  return { vehiculos: list.slice((filters.pagina - 1)*pageSize, filters.pagina*pageSize), total: list.length, pagina: filters.pagina, porPagina: pageSize };
}
module.exports = { parseFilters, selectDemo };
