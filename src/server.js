require('dotenv').config();
const path = require('node:path');
const express = require('express');
const { parseFilters } = require('./filters');
const { findVehicles, findVehicleById, listFilters, isDemo } = require('./repository');
const app = express();
app.use(express.json({ limit: '40kb' }));
app.use('/api/admin', require('./admin-routes'));
const port = Number(process.env.PORT) || 3000;
if (isDemo() && process.env.NODE_ENV === 'production') {
  console.error('DEMO_MODE no puede estar activo en producción.');
  process.exit(1);
}
app.disable('x-powered-by');
app.use(express.static(path.join(__dirname, '..', 'public'), { extensions: ['html'] }));

app.get('/api/config', (req, res) => {
  const raw = process.env.WHATSAPP_NUMBER || '';
  res.json({
    concesionario: process.env.DEALERSHIP_NAME || 'AutoDealer360',
    whatsapp: /^\d{10,15}$/.test(raw) ? raw : '',
    demo: isDemo()
  });
});
app.get('/api/filtros', async (req, res, next) => {
  try { res.json(await listFilters()); } catch (error) { next(error); }
});
app.get('/api/vehiculos', async (req, res, next) => {
  try {
    const filters = parseFilters(req.query);
    res.json(await findVehicles(filters));
  } catch (error) { next(error); }
});
app.get('/api/vehiculos/:id', async (req, res, next) => {
  try {
    if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ error: 'Identificador inválido' });
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: 'Identificador inválido' });
    const vehicle = await findVehicleById(id);
    if (!vehicle) return res.status(404).json({ error: 'Vehículo no disponible' });
    return res.json(vehicle);
  } catch (error) { next(error); }
});
app.use('/api', (req, res) => res.status(404).json({ error: 'Recurso no encontrado' }));
app.use((error, req, res, next) => {
  if (error.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'La fotografía supera 6 MB' });
  if (error.code && error.code.startsWith('LIMIT_')) return res.status(400).json({ error: 'Carga de fotografías inválida' });
  if ([400, 413, 502, 503].includes(error.status)) return res.status(error.status).json({ error: error.message });
  if (error.type === 'entity.too.large') return res.status(413).json({ error: 'Solicitud demasiado grande' });
  if (error instanceof SyntaxError && error.status === 400) return res.status(400).json({ error: 'JSON inválido' });
  if (error.message && /inválid|precio|Precio|Filtro|Página/.test(error.message)) {
    return res.status(400).json({ error: error.message });
  }
  console.error('[AutoDealer360]', error);
  return res.status(500).json({ error: 'No fue posible procesar la solicitud. Revisa la conexión con MySQL.' });
});
if (require.main === module) {
  app.listen(port, () => {
    console.log(`AutoDealer360 iniciado: http://localhost:${port}`);
    console.log(isDemo() ? 'MODO DEMOSTRACIÓN (sin MySQL)' : 'MODO MYSQL (base de datos real)');
  });
}
module.exports = app;
