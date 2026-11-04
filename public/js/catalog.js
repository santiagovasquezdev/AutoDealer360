(async function() {
  const form = document.querySelector('#filters-form');
  const items = document.querySelector('#vehicle-grid');
  const filterPanel = document.querySelector('#filter-panel');
  const filterToggle = document.querySelector('#filter-toggle');
  const mobileQuery = window.matchMedia('(max-width: 720px)');
  function setFiltersCollapsed(collapsed) {
    filterPanel.classList.toggle('is-collapsed', collapsed);
    filterToggle.setAttribute('aria-expanded', String(!collapsed));
    filterToggle.innerHTML = collapsed ? 'Mostrar filtros <span aria-hidden="true">▾</span>' : 'Ocultar filtros <span aria-hidden="true">▴</span>';
  }
  function updateFilterLayout() { setFiltersCollapsed(mobileQuery.matches); }
  updateFilterLayout();
  mobileQuery.addEventListener('change', updateFilterLayout);
  filterToggle.addEventListener('click', () => setFiltersCollapsed(!filterPanel.classList.contains('is-collapsed')));
  document.querySelector('#filter-show-results').addEventListener('click', () => {
    setFiltersCollapsed(true);
    document.querySelector('.catalog-results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  const summary = document.querySelector('#results-summary');
  const pagination = document.querySelector('#pagination');
  const fields = {
    marca: form.elements.namedItem('marca'), modelo: form.elements.namedItem('modelo'),
    color: form.elements.namedItem('color'), precioMin: form.elements.namedItem('precioMin'),
    precioMax: form.elements.namedItem('precioMax'), q: form.elements.namedItem('q')
  };
  let page = 1;
  let whatsapp = '';
  let filterOptions = { modelos: [] };
  let requestId = 0;
  const placeholder = '/assets/auto-gris.svg';

  function addOptions(select, values) {
    const selected = select.value;
    select.replaceChildren(new Option('Todos', ''));
    for (const v of values) select.add(new Option(v, v));
    select.value = values.includes(selected) ? selected : '';
  }
  function card(v) {
    const name = `${v.marca} ${v.modelo} ${v.version}`;
    const img = v.imagen_principal || placeholder;
    return `<article class="vehicle-card">
      <a class="vehicle-photo" href="/vehiculo.html?id=${v.id}" aria-label="Ver ${AD.clean(name)}">
        <img src="${AD.clean(img)}" alt="Imagen de ${AD.clean(name)}" loading="lazy" onerror="this.src='/assets/auto-gris.svg'" />
        <span class="vehicle-tag">DISPONIBLE</span>
      </a>
      <div class="vehicle-card-body">
        <p class="vehicle-brand">${AD.clean(v.marca)} <span class="dot">·</span> ${v.anio}</p>
        <h3>${AD.clean(v.modelo)} <span>${AD.clean(v.version)}</span></h3>
        <p class="price">${AD.money(v.precio)}</p>
        <div class="vehicle-facts"><span>↗ ${Number(v.kilometraje).toLocaleString('es-CO')} km</span><span>⚙ ${AD.clean(v.transmision)}</span><span>◉ ${AD.clean(v.color)}</span></div>
        <a class="btn btn-dark card-link" href="/vehiculo.html?id=${v.id}">Ver vehículo <span aria-hidden="true">→</span></a>
      </div>
    </article>`;
  }
  function buildParams() {
    const params = new URLSearchParams();
    for (const [key, input] of Object.entries(fields)) if (input.value.trim()) params.set(key, input.value.trim());
    params.set('pagina', String(page));
    return params;
  }
  async function load() {
    const current = ++requestId;
    summary.textContent = 'Buscando vehículos…';
    try {
      const data = await AD.json(`/api/vehiculos?${buildParams()}`);
      if (current !== requestId) return;
      items.innerHTML = data.vehiculos.length
        ? data.vehiculos.map(card).join('')
        : '<div class="empty-state"><h3>No encontramos vehículos con esos filtros</h3><p>Prueba quitando algún filtro o consulta nuestro inventario disponible.</p></div>';
      summary.textContent = `${data.total} vehículo${data.total === 1 ? '' : 's'} encontrado${data.total === 1 ? '' : 's'}`;
      pagination.replaceChildren();
      const pages = Math.ceil(data.total / data.porPagina);
      if (pages > 1) {
        const prev = document.createElement('button');
        prev.className = 'btn btn-outline'; prev.textContent = '← Anterior'; prev.disabled = page <= 1;
        prev.onclick = () => { page--; load(); window.scrollTo({ top: 300, behavior: 'smooth' }); };
        const label = document.createElement('span'); label.textContent = `Página ${page} de ${pages}`;
        const next = document.createElement('button');
        next.className = 'btn btn-outline'; next.textContent = 'Siguiente →'; next.disabled = page >= pages;
        next.onclick = () => { page++; load(); window.scrollTo({ top: 300, behavior: 'smooth' }); };
        pagination.append(prev, label, next);
      }
    } catch (err) {
      if (current !== requestId) return;
      items.innerHTML = `<div class="empty-state"><h3>No pudimos cargar el catálogo</h3><p>${AD.clean(err.message)}</p></div>`;
      summary.textContent = 'Error al consultar';
    }
  }
  let debounce;
  const trigger = () => { page = 1; clearTimeout(debounce); debounce = setTimeout(load, 180); };
  form.addEventListener('input', trigger);
  form.addEventListener('change', trigger);
  form.addEventListener('reset', () => { page = 1; setTimeout(load, 10); });
  try {
    const [config, filters] = await Promise.all([AD.json('/api/config'), AD.json('/api/filtros')]);
    whatsapp = config.whatsapp;
    filterOptions = filters;
    AD.markDemo(config.demo);
    AD.setWhatsappLinks(whatsapp);
    addOptions(fields.marca, filters.marcas);
    addOptions(fields.modelo, filters.modelos);
    addOptions(fields.color, filters.colores);
    load();
  } catch (error) {
    items.innerHTML = `<div class="empty-state"><h3>No se pudo iniciar el catálogo</h3><p>${AD.clean(error.message)}</p></div>`;
    summary.textContent = 'Sin conexión';
  }
})();
