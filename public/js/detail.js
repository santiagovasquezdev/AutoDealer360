(async function() {
  const root = document.querySelector('#detail-root');
  const id = new URLSearchParams(location.search).get('id');
  if (!id || !/^\d+$/.test(id)) {
    root.innerHTML = '<div class="empty-state"><h2>Vehículo no encontrado</h2><a href="/">Volver al catálogo</a></div>';
    return;
  }
  try {
    const [vehicle, config] = await Promise.all([
      AD.json(`/api/vehiculos/${encodeURIComponent(id)}`), AD.json('/api/config')
    ]);
    AD.markDemo(config.demo);
    AD.setWhatsappLinks(config.whatsapp);
    document.title = `${vehicle.marca} ${vehicle.modelo} | AutoDealer360`;
    const name = `${vehicle.marca} ${vehicle.modelo} ${vehicle.version}`;
    const images = vehicle.imagenes.length ? vehicle.imagenes : ['/assets/auto-gris.svg'];
    const specs = [
      ['Marca', vehicle.marca], ['Modelo', vehicle.modelo], ['Versión', vehicle.version],
      ['Año', vehicle.anio], ['Kilometraje', `${Number(vehicle.kilometraje).toLocaleString('es-CO')} km`],
      ['Color', vehicle.color], ['Transmisión', vehicle.transmision],
      ['Combustible', vehicle.combustible], ['Cilindraje', vehicle.cilindraje], ['Ciudad', vehicle.ciudad]
    ];
    const url = AD.waUrl(config.whatsapp, vehicle);
    root.innerHTML = `<a href="/" class="back-link">← Regresar al inventario</a>
      <div class="detail-layout">
        <section>
          <div class="detail-cover"><img id="main-photo" src="${AD.clean(images[0])}" alt="Fotografía de ${AD.clean(name)}" onerror="this.src='/assets/auto-gris.svg'" /></div>
          <div class="thumb-list">${images.map((image, index) => `<button class="thumb ${index === 0 ? 'active' : ''}" data-image="${AD.clean(image)}" aria-label="Ver fotografía ${index + 1}"><img src="${AD.clean(image)}" alt="Miniatura ${index+1}" onerror="this.src='/assets/auto-gris.svg'"/></button>`).join('')}</div>
          <div class="detail-section"><h2>Características del vehículo</h2><dl class="spec-grid">${specs.map(([key, value]) => `<div><dt>${AD.clean(key)}</dt><dd>${AD.clean(value)}</dd></div>`).join('')}</dl></div>
          <div class="detail-section"><h2>Descripción</h2><p class="reading">${AD.clean(vehicle.descripcion_general || 'Sin descripción disponible.')}</p></div>
          <div class="detail-section"><h2>Información mecánica</h2><p class="reading">${AD.clean(vehicle.descripcion_mecanica || 'Información mecánica por completar.')}</p></div>
        </section>
        <aside class="detail-aside"><div class="detail-summary"><span class="eyebrow">VEHÍCULO DISPONIBLE</span><h1>${AD.clean(name)}</h1><p class="detail-year">${vehicle.anio} · ${AD.clean(vehicle.ciudad)}</p><p class="detail-price">${AD.money(vehicle.precio)}</p>
          ${url ? `<a href="${AD.clean(url)}" target="_blank" rel="noopener noreferrer" class="btn btn-green full">Consultar por WhatsApp ↗</a>`
            : '<div class="contact-notice">El contacto por WhatsApp estará disponible cuando el concesionario configure su número.</div>'}
          <p class="fine-print">El asesor confirmará precio, disponibilidad y condiciones del vehículo.</p></div></aside>
      </div>`;
    root.querySelectorAll('.thumb').forEach(button => button.addEventListener('click', () => {
      root.querySelector('#main-photo').src = button.dataset.image;
      root.querySelectorAll('.thumb').forEach(b => b.classList.toggle('active', b === button));
    }));
  } catch (error) {
    root.innerHTML = `<div class="empty-state"><h2>No encontramos este vehículo</h2><p>${AD.clean(error.message)}</p><a href="/">Volver al catálogo</a></div>`;
  }
})();
