"use strict";
/* AutoDealer360 - Front-end académico. Datos demostrativos; NO se conecta a un servidor ni autentica usuarios. */
const STORAGE_KEY = "autodealer360_demo_vehiculos_v1";
const ASSET_DIR = "assets/";
const INITIAL_VEHICLES = [
  {id:1,marca:"Toyota",modelo:"RAV4",anio:2023,precio:139900000,km:34000,estado:"Disponible",transmision:"Automática",combustible:"Híbrido",imagen:"auto-plata.svg",destacado:true},
  {id:2,marca:"Mazda",modelo:"3 Touring",anio:2022,precio:92900000,km:28000,estado:"Disponible",transmision:"Automática",combustible:"Gasolina",imagen:"auto-azul.svg",destacado:true},
  {id:3,marca:"Ford",modelo:"Ranger",anio:2024,precio:187500000,km:12000,estado:"Disponible",transmision:"Automática",combustible:"Diésel",imagen:"auto-gris.svg",destacado:true},
  {id:4,marca:"BMW",modelo:"X5",anio:2023,precio:259000000,km:18000,estado:"Reservado",transmision:"Automática",combustible:"Gasolina",imagen:"auto-negro.svg",destacado:false},
  {id:5,marca:"Chevrolet",modelo:"Onix",anio:2021,precio:64900000,km:49000,estado:"Disponible",transmision:"Manual",combustible:"Gasolina",imagen:"auto-rojo.svg",destacado:false},
  {id:6,marca:"Kia",modelo:"Sportage",anio:2024,precio:155000000,km:9000,estado:"Disponible",transmision:"Automática",combustible:"Híbrido",imagen:"auto-arena.svg",destacado:false}
];
const $ = (selector) => document.querySelector(selector);
const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const cop = (amount) => new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(amount);
const imagePath = (name) => ASSET_DIR + (['auto-plata.svg','auto-azul.svg','auto-gris.svg','auto-negro.svg','auto-rojo.svg','auto-arena.svg'].includes(name) ? name : 'auto-plata.svg');
let vehicles = loadVehicles();
let toastTimer;

function loadVehicles(){
  try { const value = JSON.parse(localStorage.getItem(STORAGE_KEY)); if(Array.isArray(value)) return value; } catch (error) { console.warn("No se pudo leer localStorage",error); }
  return structuredClone(INITIAL_VEHICLES);
}
function saveVehicles(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(vehicles));}catch(error){notify("Los cambios se verán solo durante esta sesión.");}}
function notify(message){const element=$("#toast");element.textContent=message;element.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>element.classList.remove("show"),3400);}
function selectedFilters(){return {marca:$("#f-marca").value,modelo:$("#f-modelo").value.trim().toLowerCase(),anio:Number($("#f-anio").value)||0,precio:Number($("#f-precio").value)||Infinity};}
function refreshBrandOptions(){const select=$("#f-marca"),previous=select.value,brands=[...new Set(vehicles.map(v=>v.marca))].sort((a,b)=>a.localeCompare(b,'es'));select.innerHTML='<option value="">Todas las marcas</option>'+brands.map(brand=>`<option value="${escapeHTML(brand)}">${escapeHTML(brand)}</option>`).join('');select.value=brands.includes(previous)?previous:'';}
function filteredVehicles(){const {marca,modelo,anio,precio}=selectedFilters();const found=vehicles.filter(v=>v.estado!=="Vendido"&&(!marca||v.marca===marca)&&(!modelo||`${v.marca} ${v.modelo}`.toLowerCase().includes(modelo))&&(!anio||v.anio>=anio)&&v.precio<=precio);
 switch($("#orden").value){case 'precio-asc':return found.sort((a,b)=>a.precio-b.precio);case 'precio-desc':return found.sort((a,b)=>b.precio-a.precio);case 'anio-desc':return found.sort((a,b)=>b.anio-a.anio);default:return found.sort((a,b)=>Number(b.destacado)-Number(a.destacado)||b.anio-a.anio);}}
function cardTemplate(v){return `<article class="vehicle-card"><div class="vehicle-photo"><img src="${imagePath(v.imagen)}" alt="Ilustración de ${escapeHTML(v.marca)} ${escapeHTML(v.modelo)}" width="720" height="440" loading="lazy"><span class="vehicle-badge ${v.estado==='Reservado'?'reservado':''}">${escapeHTML(v.estado)}</span></div><div class="vehicle-card-body"><h3>${escapeHTML(v.marca)} ${escapeHTML(v.modelo)}</h3><p class="vehicle-meta"><span>${v.anio}</span><span>${Number(v.km).toLocaleString('es-CO')} km</span></p><div class="vehicle-price">${cop(v.precio)} <small>COP</small></div><div class="vehicle-specs"><span>◉ ${escapeHTML(v.transmision)}</span><span>♢ ${escapeHTML(v.combustible)}</span></div><button type="button" class="btn btn-dark" data-detail="${v.id}">Ver detalles <span aria-hidden="true">→</span></button></div></article>`;}
function renderCatalog(){const data=filteredVehicles();$("#vehicle-grid").innerHTML=data.map(cardTemplate).join('');$("#result-count").textContent=`${data.length} ${data.length===1?'vehículo encontrado':'vehículos encontrados'}`;$("#empty-state").hidden=data.length!==0;}
function statusClass(status){return status==='Reservado'?'reservado':status==='Vendido'?'vendido':'';}
function renderAdmin(){const sorted=[...vehicles].sort((a,b)=>a.id-b.id);$("#stat-total").textContent=vehicles.length;$("#stat-available").textContent=vehicles.filter(v=>v.estado==='Disponible').length;$("#stat-brands").textContent=new Set(vehicles.map(v=>v.marca)).size;
  $("#admin-tbody").innerHTML=sorted.map(v=>`<tr><td><div class="admin-name">${escapeHTML(v.marca)} ${escapeHTML(v.modelo)}</div><div class="admin-sub">#${v.id}</div></td><td>${v.anio}</td><td>${cop(v.precio)}</td><td><span class="status-chip ${statusClass(v.estado)}">${escapeHTML(v.estado)}</span></td><td><div class="actions-inline"><button class="small-action" type="button" data-edit="${v.id}" aria-label="Editar ${escapeHTML(v.marca)} ${escapeHTML(v.modelo)}">Editar</button><button class="small-action delete" type="button" data-delete="${v.id}" aria-label="Eliminar ${escapeHTML(v.marca)} ${escapeHTML(v.modelo)}">Eliminar</button></div></td></tr>`).join('');}
function refreshAll(){refreshBrandOptions();renderCatalog();renderAdmin();}
function showDetails(id){const v=vehicles.find(v=>v.id===id);if(!v)return;const title=`${v.marca} ${v.modelo}`;$("#detail-content").innerHTML=`<div class="detail-grid"><div class="detail-image"><img src="${imagePath(v.imagen)}" alt="Ilustración de ${escapeHTML(title)}" width="720" height="440"></div><div class="detail-details"><p class="eyebrow eyebrow-dark">FICHA DEL VEHÍCULO</p><h2 id="detail-title">${escapeHTML(title)}</h2><p>Información referencial del inventario AutoDealer360.</p><div class="detail-price">${cop(v.precio)}</div><div class="detail-spec-list"><span><strong>Año:</strong> ${v.anio}</span><span><strong>Estado:</strong> ${escapeHTML(v.estado)}</span><span><strong>Km:</strong> ${Number(v.km).toLocaleString('es-CO')}</span><span><strong>Caja:</strong> ${escapeHTML(v.transmision)}</span><span><strong>Combustible:</strong> ${escapeHTML(v.combustible)}</span><span><strong>Código:</strong> ${v.id}</span></div></div></div><div class="detail-contact"><h3>Consulta por WhatsApp</h3><p>Personaliza el mensaje. Se abrirá WhatsApp para que elijas un destinatario; este prototipo no dispone de un número empresarial configurado.</p><label for="whatsapp-message">Mensaje</label><textarea id="whatsapp-message" maxlength="500">Hola, me interesa el vehículo ${escapeHTML(title)} (${v.anio}) publicado en AutoDealer360. ¿Podrían brindarme más información?</textarea><button type="button" class="btn btn-gold" id="btn-whatsapp">Preparar mensaje en WhatsApp ↗</button></div>`;
  $("#detail-dialog").showModal();}
function openVehicleForm(id){const edit = Number.isInteger(id),v=edit?vehicles.find(item=>item.id===id):null; if(edit&&!v)return;
  $("#vehicle-form").reset();$("#vehicle-id").value=edit?String(id):'';$("#form-title").textContent=edit?'Editar vehículo':'Registrar vehículo';
  if(v){for(const key of ['marca','modelo','anio','precio','km','estado','transmision','combustible']){$(`#v-${key}`).value=v[key];}}
  $("#vehicle-dialog").showModal();}
function handleVehicleSubmit(event){event.preventDefault();const form=$("#vehicle-form");if(!form.reportValidity())return;const oldId=Number($("#vehicle-id").value);const previous=vehicles.find(v=>v.id===oldId);
 const data={marca:$("#v-marca").value.trim(),modelo:$("#v-modelo").value.trim(),anio:Number($("#v-anio").value),precio:Number($("#v-precio").value),km:Number($("#v-km").value),estado:$("#v-estado").value,transmision:$("#v-transmision").value,combustible:$("#v-combustible").value};
 if(!data.marca||!data.modelo||data.precio<=0||data.km<0){notify('Verifica los campos obligatorios.');return;}
 if(previous){Object.assign(previous,data);notify('Vehículo actualizado en este navegador.');}
 else {vehicles.push({...data,id:Math.max(0,...vehicles.map(v=>v.id))+1,imagen:'auto-plata.svg',destacado:false});notify('Vehículo registrado en este navegador.');}
 saveVehicles();refreshAll();$("#vehicle-dialog").close();}
function removeVehicle(id){const item=vehicles.find(v=>v.id===id);if(!item)return;
 if(!window.confirm(`¿Eliminar ${item.marca} ${item.modelo} del inventario de demostración?`))return;
 vehicles=vehicles.filter(v=>v.id!==id);saveVehicles();refreshAll();notify('Vehículo eliminado de este navegador.');}
function clearFilters(){ $("#search-form").reset();$("#orden").value='destacados';renderCatalog();}
function setup(){refreshAll();
  $("#search-form").addEventListener('submit',event=>{event.preventDefault();renderCatalog();});
  $("#orden").addEventListener('change',renderCatalog);$("#reset-filters").addEventListener('click',clearFilters);$("#empty-reset").addEventListener('click',clearFilters);
  $("#vehicle-grid").addEventListener('click',event=>{const btn=event.target.closest('[data-detail]');if(btn)showDetails(Number(btn.dataset.detail));});
  $("#admin-tbody").addEventListener('click',event=>{const edit=event.target.closest('[data-edit]'),del=event.target.closest('[data-delete]');if(edit)openVehicleForm(Number(edit.dataset.edit));if(del)removeVehicle(Number(del.dataset.delete));});
  $("#btn-add").addEventListener('click',()=>openVehicleForm());$("#vehicle-form").addEventListener('submit',handleVehicleSubmit);
  $("#btn-login").addEventListener('click',()=>$("#login-dialog").showModal());
  $("#continue-demo").addEventListener('click',()=>{$("#login-dialog").close();document.getElementById('administracion').scrollIntoView({behavior:'smooth'});notify('Modo de demostración: no se ha iniciado sesión real.');});
  document.querySelectorAll('[data-close]').forEach(btn=>btn.addEventListener('click',()=>document.getElementById(btn.dataset.close).close()));
  document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();}));
  $("#detail-dialog").addEventListener('click',event=>{if(event.target.closest('#btn-whatsapp')){const msg=$("#whatsapp-message").value.trim();if(!msg){notify('Escribe un mensaje antes de continuar.');return;}window.open('https://wa.me/?text='+encodeURIComponent(msg),'_blank','noopener,noreferrer');notify('Se abrió WhatsApp para elegir el destinatario.');}});
  const toggle=$(".nav-toggle"),nav=$("#main-nav");toggle.addEventListener('click',()=>{const opened=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(opened));toggle.setAttribute('aria-label',opened?'Ocultar menú':'Mostrar menú');});
  document.querySelectorAll('#main-nav a').forEach(link=>link.addEventListener('click',()=>{nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Mostrar menú');}));
}
document.addEventListener('DOMContentLoaded',setup);
