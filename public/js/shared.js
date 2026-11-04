const AD = (() => {
  const money = value => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(value || 0));
  const clean = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const waUrl = (phone, vehicle) => {
    if (!phone) return null;
    const desc = vehicle ? `${vehicle.marca} ${vehicle.modelo} ${vehicle.version} (${vehicle.anio}) · Referencia #${vehicle.id}` : 'los vehículos disponibles';
    const message = `Hola, vi ${desc} en AutoDealer360 y me gustaría recibir más información.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };
  async function json(url) {
    const r = await fetch(url);
    const result = await r.json();
    if (!r.ok) throw new Error(result.error || 'Ocurrió un problema al consultar los datos');
    return result;
  }
  function markDemo(enabled) {
    const banner = document.getElementById('demo-banner');
    if (banner) banner.hidden = !enabled;
  }
  function setWhatsappLinks(phone) {
    document.querySelectorAll('[data-whatsapp-general]').forEach(a => {
      const url = waUrl(phone);
      if (url) { a.href = url; a.removeAttribute('aria-disabled'); }
      else { a.removeAttribute('href'); a.setAttribute('aria-disabled', 'true'); a.title = 'Falta configurar WHATSAPP_NUMBER en .env'; }
    });
  }
  return { money, clean, waUrl, json, markDemo, setWhatsappLinks };
})();
