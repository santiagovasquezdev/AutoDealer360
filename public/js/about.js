(async function() {
  try {
    const config = await AD.json('/api/config');
    AD.markDemo(config.demo);
    AD.setWhatsappLinks(config.whatsapp);
  } catch (error) { console.warn('Sin conexión con el servidor:', error.message); }
})();
