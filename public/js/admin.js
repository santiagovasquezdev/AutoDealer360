(() => {
  const loginPanel = document.querySelector('#login-panel');
  const dashboard = document.querySelector('#admin-dashboard');
  const editPanel = document.querySelector('#edit-panel');
  const list = document.querySelector('#vehicles-list');
  const alertBox = document.querySelector('#admin-alert');
  const form = document.querySelector('#vehicle-form');
  const logout = document.querySelector('#logout');
  const photoInput = document.querySelector('#photo-files');
  const uploadButton = document.querySelector('#upload-photos');
  const photoPreviews = document.querySelector('#photo-previews');
  let csrf = '';
  let editingId = null;
  let vehicles = [];
  let photosUploading = false;
  const $ = name => form.elements.namedItem(name);
  $('anio').max = String(new Date().getFullYear()+1);
  function message(text, isError=false){
    alertBox.hidden=!text; alertBox.textContent=text;
    alertBox.style.background=isError?'#fff0ee':'#eef6f1';
    alertBox.style.color=isError?'#9b342c':'#1c653b';
  }
  async function api(route, method='GET', data){
    const response = await fetch('/api/admin'+route,{method,credentials:'same-origin',headers: {
      ...(data!==undefined?{'Content-Type':'application/json'}:{}),
      ...(['POST','PUT','PATCH','DELETE'].includes(method)&&csrf?{'X-CSRF-Token':csrf}:{})
    },...(data!==undefined?{body:JSON.stringify(data)}:{})});
    let result={};try{result=await response.json();}catch{}
    if(!response.ok)throw new Error(result.error||`Error HTTP ${response.status}`);
    return result;
  }
  function signedIn(value){loginPanel.hidden=value;dashboard.hidden=!value;logout.hidden=!value;}
  async function load(){
    const data=await api('/vehiculos'); vehicles=data.vehiculos; render();
  }
  function button(label, fn, type='outline'){
    const b=document.createElement('button');b.type='button';b.textContent=label;b.className=`btn btn-${type}`;b.addEventListener('click',fn);return b;
  }
  function vehicleActions(v){
    const wrap=document.createElement('div');wrap.className='admin-actions';
    const edit=button('Editar',()=>openVehicle(v.id));
    edit.setAttribute('aria-label',`Editar ${v.marca} ${v.modelo}`);
    const sold=button('Marcar vendido',()=>markSold(v.id));
    sold.disabled=v.estado==='Vendido';
    sold.setAttribute('aria-label',`Marcar como vendido ${v.marca} ${v.modelo}`);
    const hide=button('Ocultar',()=>hideVehicle(v.id));
    hide.disabled=!v.publicado;
    hide.setAttribute('aria-label',`Ocultar ${v.marca} ${v.modelo}`);
    wrap.append(edit,sold,hide);
    return wrap;
  }
  function vehicleMobileCard(v){
    const article=document.createElement('article');article.className='admin-mobile-card';
    const top=document.createElement('div');top.className='admin-mobile-top';
    const img=document.createElement('img');img.src=v.imagen_principal||'/assets/auto-gris.svg';
    img.alt=`Fotografía de ${v.marca} ${v.modelo}`;
    img.loading='lazy';img.onerror=()=>{img.onerror=null;img.src='/assets/auto-gris.svg';};
    const details=document.createElement('div');details.className='admin-mobile-info';
    const title=document.createElement('strong');title.textContent=`${v.marca} ${v.modelo}`;
    const subtitle=document.createElement('small');subtitle.textContent=`${v.version} · ${v.anio} · #${v.id}`;
    const price=document.createElement('strong');price.className='admin-mobile-price';price.textContent=AD.money(v.precio);
    details.append(title,subtitle,price);top.append(img,details);
    const meta=document.createElement('div');meta.className='admin-mobile-meta';
    const state=document.createElement('span');state.className='admin-state'+(v.estado==='Vendido'?' sold':'');state.textContent=v.estado;
    const published=document.createElement('span');published.className='admin-publication';published.textContent=v.publicado?'Publicada':'Oculta';
    meta.append(state,published);
    article.append(top,meta,vehicleActions(v));return article;
  }
  function render(){
    list.replaceChildren();
    const count=document.createElement('p');count.textContent=`${vehicles.length} vehículo(s) en el panel (máximo 500 registros).`;
    list.append(count);
    const wrapper=document.createElement('div');wrapper.className='admin-table-wrap';
    const table=document.createElement('table');table.className='admin-table';
    const thead=document.createElement('thead');thead.innerHTML='<tr><th>Foto</th><th>Vehículo</th><th>Precio</th><th>Estado</th><th>Publicación</th><th>Acciones</th></tr>';
    table.append(thead);const tbody=document.createElement('tbody');
    for(const v of vehicles){
      const tr=document.createElement('tr');
      const photo=document.createElement('td');const img=document.createElement('img');img.src=v.imagen_principal||'/assets/auto-gris.svg';img.alt='';img.onerror=()=>{img.onerror=null;img.src='/assets/auto-gris.svg';};photo.append(img);
      const name=document.createElement('td');const bold=document.createElement('strong');bold.textContent=`${v.marca} ${v.modelo}`;const small=document.createElement('small');small.textContent=`${v.version} · ${v.anio} · #${v.id}`;name.append(bold,small);
      const price=document.createElement('td');price.textContent=AD.money(v.precio);
      const state=document.createElement('td');const tag=document.createElement('span');tag.className='admin-state'+(v.estado==='Vendido'?' sold':'');tag.textContent=v.estado;state.append(tag);
      const published=document.createElement('td');published.textContent=v.publicado?'Publicada':'Oculta';
      const acts=document.createElement('td');acts.append(vehicleActions(v));
      tr.append(photo,name,price,state,published,acts);tbody.append(tr);
    }
    table.append(tbody);wrapper.append(table);list.append(wrapper);
    const mobile=document.createElement('div');mobile.className='admin-mobile-list';
    for(const v of vehicles) mobile.append(vehicleMobileCard(v));
    list.append(mobile);
    const note=document.createElement('small');note.className='admin-list-note';note.textContent='Solo se muestran en el catálogo público los vehículos publicados y con estado Disponible.';list.append(note);
  }
  function setForm(v){
    form.reset();const data=v||{};
    const names=['marca','modelo','version','anio','precio','kilometraje','color','transmision','combustible','cilindraje','ciudad','descripcion_general','descripcion_mecanica','estado'];
    for(const n of names)if(data[n]!==undefined && data[n]!==null)$(n).value=data[n];
    $('imagenes').value=(data.imagenes||[]).join('\n');
    photoInput.value='';
    renderPhotos();
    $('publicado').checked=v?Boolean(v.publicado):true;
    $('destacado').checked=Boolean(v?.destacado);
  }
  function getPhotos() {
    return $('imagenes').value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  }
  function setPhotos(urls) {
    $('imagenes').value=urls.join('\n');renderPhotos();
  }
  function renderPhotos() {
    photoPreviews.replaceChildren();
    const photos=getPhotos();
    if (!photos.length) {const note=document.createElement('small');note.textContent='Todavía no hay fotografías asociadas.';photoPreviews.append(note);}
    for(let i=0;i<photos.length;i++) {
      const url=photos[i];
      const tile=document.createElement('div');tile.className='photo-preview';
      const image=document.createElement('img');image.alt=`Fotografía ${i+1}`;
      if (url.startsWith('https://') || url.startsWith('/assets/')) image.src=url;
      else image.src='/assets/auto-gris.svg';
      image.onerror=()=>{image.onerror=null;image.src='/assets/auto-gris.svg';};
      const caption=document.createElement('small');caption.textContent=i===0?'Fotografía principal':`Fotografía ${i+1}`;
      const actions=document.createElement('div');actions.className='photo-preview-actions';
      if (i>0) actions.append(button('↑ Principal',()=>{const next=getPhotos();[next[0],next[i]]=[next[i],next[0]];setPhotos(next);},'outline'));
      actions.append(button('Quitar',()=>{const next=getPhotos();next.splice(i,1);setPhotos(next);},'outline'));
      tile.append(image,caption,actions);photoPreviews.append(tile);
    }
  }
  $('imagenes').addEventListener('input', renderPhotos);
  async function uploadPhoto(file) {
    const fd=new FormData();fd.append('foto',file);
    const response=await fetch('/api/admin/fotos',{method:'POST',credentials:'same-origin',
      headers:{'X-CSRF-Token':csrf},body:fd});
    let result={};try {result=await response.json();}catch{}
    if(!response.ok) throw new Error(result.error||`Error HTTP ${response.status}`);
    return result.url;
  }
  uploadButton.addEventListener('click',async()=>{
    const files=[...photoInput.files];
    if(!files.length){message('Primero selecciona una o más fotografías.',true);return;}
    if(!csrf){message('Tu sesión ha caducado; inicia sesión nuevamente.',true);return;}
    if(files.length+getPhotos().length>12){message('Un vehículo admite máximo 12 fotografías.',true);return;}
    for(const file of files){
      if(!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size>6*1024*1024 || file.size===0) {
        message('Solo se permiten fotografías JPG, PNG o WebP de hasta 6 MB cada una.',true);return;
      }
    }
    photosUploading=true;uploadButton.disabled=true;photoInput.disabled=true;
    form.querySelector('button[type="submit"]').disabled=true;
    let uploaded=0;
    try {
      for(let i=0;i<files.length;i++) {
        message(`Subiendo fotografía ${i+1} de ${files.length}…`);
        const url=await uploadPhoto(files[i]);
        setPhotos([...getPhotos(),url]);uploaded++;
      }
      photoInput.value='';
      message(`${uploaded} fotografía(s) subida(s). Ahora pulsa «Guardar vehículo» para que aparezcan en el catálogo.`);
    } catch(e) {
      photoInput.value='';
      message(`${uploaded} fotografía(s) subida(s) antes del error. ${e.message}. Las ya subidas permanecen en la lista; guarda el vehículo para asociarlas.`,true);
    } finally {photosUploading=false;uploadButton.disabled=false;photoInput.disabled=false;form.querySelector('button[type="submit"]').disabled=false;}
  });
  async function openVehicle(id){
    try{
      message('');const v=await api('/vehiculos/'+id);editingId=id;setForm(v);
      document.querySelector('#form-title').textContent=`Editar vehículo #${id}`;
      editPanel.hidden=false;editPanel.scrollIntoView({behavior:'smooth',block:'start'});
    }catch(e){message(e.message,true);}
  }
  document.querySelector('#new-vehicle').addEventListener('click',()=>{
    editingId=null;setForm();document.querySelector('#form-title').textContent='Agregar vehículo';editPanel.hidden=false;message('');editPanel.scrollIntoView({behavior:'smooth'});
  });
  document.querySelector('#cancel-form').addEventListener('click',()=>{editPanel.hidden=true;editingId=null;});
  function formData(){
    return {
      marca:$('marca').value,modelo:$('modelo').value,version:$('version').value,
      anio:Number($('anio').value),precio:Number($('precio').value),kilometraje:Number($('kilometraje').value),
      color:$('color').value,transmision:$('transmision').value,combustible:$('combustible').value,
      cilindraje:$('cilindraje').value,ciudad:$('ciudad').value,
      descripcion_general:$('descripcion_general').value,descripcion_mecanica:$('descripcion_mecanica').value,
      estado:$('estado').value,publicado:$('publicado').checked,destacado:$('destacado').checked,
      imagenes:getPhotos()
    };
  }
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    if (photosUploading){message('Termina primero la subida de fotografías.',true);return;}
    if(photoInput.files.length){message('Seleccionaste fotos sin subir. Pulsa «Subir fotografías seleccionadas» antes de guardar.',true);return;}
    const save=form.querySelector('button[type="submit"]');save.disabled=true;
    try{
      const data=formData();await api(editingId?`/vehiculos/${editingId}`:'/vehiculos',editingId?'PUT':'POST',data);
      editPanel.hidden=true;editingId=null;await load();message('Vehículo guardado correctamente. Puedes comprobar el catálogo público.');
    }catch(e){message(e.message,true);}finally{save.disabled=false;}
  });
  async function markSold(id){
    if(!confirm('¿Marcar como vendido? El vehículo dejará de aparecer en el catálogo público.'))return;
    try{await api(`/vehiculos/${id}/estado`,'PATCH',{estado:'Vendido'});await load();message('Vehículo marcado como vendido.');}
    catch(e){message(e.message,true);}
  }
  async function hideVehicle(id){
    if(!confirm('¿Ocultar esta publicación? Los datos no se eliminarán.'))return;
    try{await api(`/vehiculos/${id}`,'DELETE',{});await load();message('Publicación retirada; los datos permanecen almacenados.');}
    catch(e){message(e.message,true);}
  }
  document.querySelector('#login-form').addEventListener('submit',async e=>{
    e.preventDefault();const f=e.currentTarget;const btn=f.querySelector('button');btn.disabled=true;
    try{const data=await api('/login','POST',{email:f.elements.email.value,password:f.elements.password.value});csrf=data.csrfToken;
      f.reset();signedIn(true);await load();message('Sesión iniciada correctamente.');
    }catch(err){message(err.message,true);}finally{btn.disabled=false;}
  });
  logout.addEventListener('click',async()=>{
    try{await api('/logout','POST',{});csrf='';signedIn(false);editPanel.hidden=true;message('Sesión cerrada.');}
    catch(e){message(e.message,true);}
  });
  (async()=>{try{const me=await api('/me');csrf=me.csrfToken;signedIn(true);await load();}catch{signedIn(false);}})();
})();
