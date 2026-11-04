const test = require('node:test');
const assert = require('node:assert/strict');
const { parseFilters, selectDemo } = require('../src/filters');
const { vehiculos } = require('../src/demo-data');
test('El catálogo de demostración muestra seis vehículos', () => {
  const result = selectDemo(vehiculos, parseFilters());
  assert.equal(result.total, 6);
});
test('Combina filtros por marca y color', () => {
  const result = selectDemo(vehiculos, parseFilters({ marca: 'Volkswagen', color: 'Gris' }));
  assert.equal(result.total, 1);
  assert.equal(result.vehiculos[0].modelo, 'Gol');
});
test('Respeta rango de precios', () => {
  const result = selectDemo(vehiculos, parseFilters({ precioMin: '50000000', precioMax: '70000000' }));
  assert.equal(result.total, 3);
});
test('Rechaza filtros inconsistentes', () => {
  assert.throws(() => parseFilters({ precioMin: '80000000', precioMax: '30000000' }));
});
