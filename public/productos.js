// Catálogo de productos (vista tarjetas). Usa API_URL, authToken y apiGet de admin.js.
const CATEGORIAS = {
  'baby-shower': 'Baby Shower',
  'bautizo': 'Bautizo',
  'revelacion': 'Revelación de sexo',
  'matrimonio': 'Matrimonio',
  'cumpleanos': 'Cumpleaños',
  'xv-anos': 'XV años',
  'personajes': 'Personajes',
  'dia-madre': 'Día de la Madre'
};
const TIPOS_FOTO = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FOTO = 5 * 1024 * 1024;

let productos = [];
let editando = null;
let editImagenes = [];
let quickFile = null;

const $ = id => document.getElementById(id);

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function money(n) { return '$' + Number(n).toFixed(2); }
function nombreCategoria(k) { return CATEGORIAS[k] || k || 'Sin categoría'; }
function mensaje(el, texto, tipo) { el.textContent = texto; el.className = 'form-msg' + (tipo ? ' ' + tipo : ''); }

async function apiSend(method, path, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
    body: body ? JSON.stringify(body) : undefined
  });
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('authToken');
    location.reload();
    throw new Error('Sesión expirada');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

function validarFoto(file) {
  if (!TIPOS_FOTO.includes(file.type)) return 'Solo se aceptan fotos JPG, PNG o WEBP';
  if (file.size > MAX_FOTO) return `"${file.name}" pesa más de 5 MB`;
  return null;
}

async function subirFoto(file) {
  const invalida = validarFoto(file);
  if (invalida) throw new Error(invalida);
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`${API_URL}/api/media/upload`, {
    method: 'POST', headers: { 'Authorization': `Bearer ${authToken}` }, body: fd
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'No se pudo subir la foto');
  return data.url;
}

// ==================== CARGA Y RENDER ====================
function llenarCategorias() {
  const extras = [...new Set(productos.map(p => p.categoria).filter(c => c && !CATEGORIAS[c]))];
  const claves = [...Object.keys(CATEGORIAS), ...extras];
  document.querySelectorAll('.categoria-select').forEach(sel => {
    const actual = sel.value;
    const todas = sel.dataset.todas ? '<option value="">Todas las categorías</option>' : '';
    sel.innerHTML = todas + claves.map(k => `<option value="${esc(k)}">${esc(nombreCategoria(k))}</option>`).join('');
    if (actual && claves.includes(actual)) sel.value = actual;
  });
}

async function loadProductos() {
  const grid = $('productosGrid');
  try {
    productos = (await apiGet('/api/productos')).map((p, i) => ({ ...p, _pos: i }));
    llenarCategorias();
    renderProductos();
  } catch (err) {
    grid.innerHTML = `<p class="grid-msg error">⚠️ No se pudo cargar el catálogo: ${esc(err.message)}</p>`;
    $('prodResumen').textContent = '';
  }
}

function precioHtml(p) {
  const unidad = p.unidad === 'unidad' ? 'por unidad' : 'por docena';
  const oferta = p.precio_oferta != null;
  const actual = oferta ? p.precio_oferta : p.precio;
  const tachado = oferta ? (p.precio_anterior ?? p.precio) : (p.precio_anterior > p.precio ? p.precio_anterior : null);
  return `<div class="p-precio"><strong>${money(actual)}</strong> <small>${unidad}</small>` +
    (tachado != null && tachado > actual ? ` <s>${money(tachado)}</s>` : '') + '</div>';
}

function tarjeta(p) {
  const badges = [
    p.nuevo && '<span class="badge b-nuevo">NUEVO</span>',
    p.precio_oferta != null && '<span class="badge b-oferta">OFERTA</span>',
    p.mas_vendido && '<span class="badge b-top">MÁS VENDIDO</span>',
    !p.activo && '<span class="badge b-off">NO VISIBLE</span>',
    p.oculto && '<span class="badge b-off">OCULTO</span>'
  ].filter(Boolean).join('');
  const fotos = (p.imagenes || []).length;
  const img = p.foto_url
    ? `<img src="${esc(p.foto_url)}" alt="${esc(p.nombre)}" loading="lazy">`
    : '<div class="p-sinfoto">🕯️<small>Sin foto</small></div>';

  return `<article class="p-card${!p.activo || p.oculto ? ' is-off' : ''}" data-id="${p.id}">
    <div class="p-img">${img}<div class="p-badges">${badges}</div></div>
    <div class="p-body">
      <span class="p-cat">${esc(nombreCategoria(p.categoria))}</span>
      <h4 class="p-nombre">${esc(p.nombre)}</h4>
      ${precioHtml(p)}
      <div class="p-meta">
        ${p.etiqueta ? `<span>🏷️ ${esc(p.etiqueta)}</span>` : ''}
        <span>📷 ${fotos} foto${fotos === 1 ? '' : 's'}</span>
      </div>
    </div>
    <div class="p-actions">
      <button type="button" class="btn-card" data-accion="editar">✏️ Editar</button>
      <button type="button" class="btn-card" data-accion="duplicar">⧉ Duplicar</button>
      <button type="button" class="btn-card btn-card-danger" data-accion="borrar" title="Eliminar">🗑️</button>
    </div>
  </article>`;
}

function renderProductos() {
  const q = $('prodBuscar').value.trim().toLowerCase();
  const cat = $('prodFiltroCat').value;
  const orden = $('prodOrdenar').value;

  let lista = productos.filter(p =>
    (!cat || p.categoria === cat) &&
    (!q || [p.nombre, p.descripcion, p.etiqueta].some(v => (v || '').toLowerCase().includes(q)))
  );
  const precioEf = p => p.precio_oferta ?? p.precio;
  const comparadores = {
    tienda: (a, b) => a._pos - b._pos,
    recientes: (a, b) => b.id - a.id,
    'precio-asc': (a, b) => precioEf(a) - precioEf(b),
    'precio-desc': (a, b) => precioEf(b) - precioEf(a),
    nombre: (a, b) => a.nombre.localeCompare(b.nombre, 'es')
  };
  lista = lista.sort(comparadores[orden]);

  const visibles = productos.filter(p => p.activo && !p.oculto).length;
  $('prodResumen').textContent = `${productos.length} productos · ${visibles} visibles en la tienda`;

  $('productosGrid').innerHTML = lista.length
    ? lista.map(tarjeta).join('')
    : '<p class="grid-msg">No hay productos que coincidan con la búsqueda.</p>';
}

// ==================== AGREGAR RÁPIDO ====================
function mostrarQuickPreview(file) {
  const invalida = validarFoto(file);
  if (invalida) { mensaje($('qaMsg'), invalida, 'error'); return; }
  quickFile = file;
  $('quickDropPreview').src = URL.createObjectURL(file);
  $('quickDropPreview').hidden = false;
  $('quickDropEmpty').hidden = true;
  mensaje($('qaMsg'), '');
}

function limpiarQuick() {
  $('quickAddForm').reset();
  quickFile = null;
  $('quickDropPreview').hidden = true;
  $('quickDropPreview').removeAttribute('src');
  $('quickDropEmpty').hidden = false;
}

async function agregarRapido(e) {
  e.preventDefault();
  const msg = $('qaMsg');
  const nombre = $('qaNombre').value.trim();
  const precio = Number($('qaPrecio').value);
  if (!nombre) return mensaje(msg, 'Escribe el nombre del producto', 'error');
  if (!(precio > 0)) return mensaje(msg, 'Escribe un precio mayor a 0', 'error');

  const btn = $('qaSubmit');
  btn.disabled = true;
  try {
    let imagenes = [];
    if (quickFile) {
      mensaje(msg, 'Subiendo foto…');
      imagenes = [await subirFoto(quickFile)];
    }
    mensaje(msg, 'Guardando…');
    await apiSend('POST', '/api/productos', {
      nombre, precio,
      unidad: $('qaUnidad').value,
      categoria: $('qaCategoria').value,
      etiqueta: $('qaEtiqueta').value,
      imagenes, activo: true, nuevo: true
    });
    limpiarQuick();
    mensaje(msg, `✅ "${nombre}" agregado. Aparece primero en la lista.`, 'ok');
    $('prodOrdenar').value = 'tienda';
    await loadProductos();
    loadStats();
  } catch (err) {
    mensaje(msg, '⚠️ ' + err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

// ==================== ACCIONES DE TARJETA ====================
function datosProducto(p) {
  return {
    nombre: p.nombre, descripcion: p.descripcion, precio: p.precio,
    precio_oferta: p.precio_oferta, precio_anterior: p.precio_anterior,
    categoria: p.categoria, etiqueta: p.etiqueta, unidad: p.unidad,
    imagenes: p.imagenes || [], activo: p.activo, nuevo: p.nuevo,
    mas_vendido: p.mas_vendido, oculto: p.oculto, orden: p.orden
  };
}

async function duplicar(p) {
  try {
    await apiSend('POST', '/api/productos', { ...datosProducto(p), nombre: `${p.nombre} (copia)`, activo: false });
    await loadProductos();
    loadStats();
  } catch (err) {
    alert('No se pudo duplicar: ' + err.message);
  }
}

async function borrar(p) {
  if (!confirm(`¿Eliminar "${p.nombre}"?\n\nEsta acción no se puede deshacer.`)) return;
  try {
    await apiSend('DELETE', `/api/productos/${p.id}`);
    await loadProductos();
    loadStats();
  } catch (err) {
    alert('No se pudo eliminar: ' + err.message);
  }
}

// ==================== MODAL EDITAR ====================
function renderFotosEdit() {
  const cont = $('editFotos');
  cont.innerHTML = editImagenes.length
    ? editImagenes.map((u, i) => `<div class="foto-item${i === 0 ? ' portada' : ''}">
        <img src="${esc(u)}" alt="Foto ${i + 1}">
        ${i === 0 ? '<span class="foto-tag">Portada</span>' : `<button type="button" class="foto-btn foto-portada" data-i="${i}" title="Usar como portada">★</button>`}
        <button type="button" class="foto-btn foto-quitar" data-i="${i}" title="Quitar foto">✕</button>
      </div>`).join('')
    : '<p class="fotos-vacio">Este producto no tiene fotos.</p>';
}

function abrirEditar(p) {
  editando = p;
  editImagenes = [...(p.imagenes || [])];
  $('editTitulo').textContent = `Editar: ${p.nombre}`;
  $('edNombre').value = p.nombre || '';
  $('edDescripcion').value = p.descripcion || '';
  $('edPrecio').value = p.precio ?? '';
  $('edUnidad').value = p.unidad || 'docena';
  $('edCategoria').value = p.categoria || '';
  $('edEtiqueta').value = p.etiqueta || '';
  $('edPrecioOferta').value = p.precio_oferta ?? '';
  $('edPrecioAnterior').value = p.precio_anterior ?? '';
  $('edActivo').checked = p.activo !== false;
  $('edNuevo').checked = !!p.nuevo;
  $('edMasVendido').checked = !!p.mas_vendido;
  $('edOculto').checked = !!p.oculto;
  mensaje($('editMsg'), '');
  renderFotosEdit();
  $('editModal').hidden = false;
  document.body.style.overflow = 'hidden';
  $('edNombre').focus();
}

function cerrarEditar() {
  $('editModal').hidden = true;
  document.body.style.overflow = '';
  editando = null;
}

async function agregarFotosEdit(files) {
  const msg = $('editMsg');
  for (const file of files) {
    try {
      mensaje(msg, `Subiendo ${file.name}…`);
      editImagenes.push(await subirFoto(file));
      renderFotosEdit();
    } catch (err) {
      mensaje(msg, '⚠️ ' + err.message, 'error');
      return;
    }
  }
  mensaje(msg, '✅ Fotos agregadas. Recuerda guardar los cambios.', 'ok');
}

async function guardarEdit(e) {
  e.preventDefault();
  const msg = $('editMsg');
  const precio = Number($('edPrecio').value);
  const oferta = $('edPrecioOferta').value;
  if (!$('edNombre').value.trim()) return mensaje(msg, 'El nombre es obligatorio', 'error');
  if (!(precio > 0)) return mensaje(msg, 'El precio debe ser mayor a 0', 'error');
  if (oferta !== '' && !(Number(oferta) > 0 && Number(oferta) < precio)) {
    return mensaje(msg, 'El precio de oferta debe ser mayor a 0 y menor al precio normal', 'error');
  }

  const btn = $('editGuardar');
  btn.disabled = true;
  mensaje(msg, 'Guardando…');
  try {
    await apiSend('PUT', `/api/productos/${editando.id}`, {
      ...datosProducto(editando),
      nombre: $('edNombre').value,
      descripcion: $('edDescripcion').value,
      precio,
      unidad: $('edUnidad').value,
      categoria: $('edCategoria').value,
      etiqueta: $('edEtiqueta').value,
      precio_oferta: oferta,
      precio_anterior: $('edPrecioAnterior').value,
      imagenes: editImagenes,
      activo: $('edActivo').checked,
      nuevo: $('edNuevo').checked,
      mas_vendido: $('edMasVendido').checked,
      oculto: $('edOculto').checked
    });
    cerrarEditar();
    await loadProductos();
    loadStats();
  } catch (err) {
    mensaje(msg, '⚠️ ' + err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

// ==================== EVENTOS ====================
(function initProductos() {
  const drop = $('quickDrop');
  $('quickFoto').addEventListener('change', e => e.target.files[0] && mostrarQuickPreview(e.target.files[0]));
  ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('drag'); }));
  ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('drag'); }));
  drop.addEventListener('drop', e => e.dataTransfer.files[0] && mostrarQuickPreview(e.dataTransfer.files[0]));
  $('quickAddForm').addEventListener('submit', agregarRapido);

  $('prodBuscar').addEventListener('input', renderProductos);
  $('prodFiltroCat').addEventListener('change', renderProductos);
  $('prodOrdenar').addEventListener('change', renderProductos);

  const grid = $('productosGrid');
  let vista = 'grid';
  try { vista = localStorage.getItem('velamiaVista') || 'grid'; } catch (_) {}
  const aplicarVista = v => {
    grid.classList.toggle('lista', v === 'lista');
    document.querySelectorAll('.view-toggle button').forEach(b => b.classList.toggle('active', b.dataset.vista === v));
    try { localStorage.setItem('velamiaVista', v); } catch (_) {}
  };
  aplicarVista(vista);
  document.querySelectorAll('.view-toggle button').forEach(b => b.addEventListener('click', () => aplicarVista(b.dataset.vista)));

  grid.addEventListener('click', e => {
    const btn = e.target.closest('[data-accion]');
    if (!btn) return;
    const p = productos.find(x => x.id === Number(btn.closest('.p-card').dataset.id));
    if (!p) return;
    ({ editar: abrirEditar, duplicar, borrar })[btn.dataset.accion](p);
  });

  const modal = $('editModal');
  modal.addEventListener('click', e => { if (e.target === modal || e.target.closest('[data-cerrar]')) cerrarEditar(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) cerrarEditar(); });
  $('editForm').addEventListener('submit', guardarEdit);
  $('editFotoInput').addEventListener('change', e => { agregarFotosEdit([...e.target.files]); e.target.value = ''; });
  $('editFotos').addEventListener('click', e => {
    const btn = e.target.closest('.foto-btn');
    if (!btn) return;
    const i = Number(btn.dataset.i);
    if (btn.classList.contains('foto-quitar')) editImagenes.splice(i, 1);
    else editImagenes.unshift(editImagenes.splice(i, 1)[0]);
    renderFotosEdit();
  });
})();
