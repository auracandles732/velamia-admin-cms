// Pestaña "Página web": edita las secciones de velamia.shop y publica. Usa $, esc, apiGet, apiSend y subirFoto de productos.js/admin.js.
const { SECCIONES: SECCIONES_SITIO, CATEGORIAS: CATEGORIAS_SITIO } = window.SITIO_SCHEMA;

let sitio = null;
let seccionActual = null;
let borrador = null;
let sucio = false;

const copia = o => JSON.parse(JSON.stringify(o));

function leerRuta(obj, ruta) {
  return ruta.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}
function escribirRuta(obj, ruta, valor) {
  const partes = ruta.split('.');
  const ultimo = partes.pop();
  const destino = partes.reduce((o, k) => o[k], obj);
  destino[ultimo] = valor;
}

// ==================== ESTADO DE PUBLICACIÓN ====================
function pintarEstado(error) {
  const dot = $('publishDot');
  const txt = $('publishEstado');
  if (error || !sitio) {
    dot.className = 'publish-dot';
    txt.textContent = error ? 'No se pudo leer el estado de publicación' : 'Revisando…';
    return;
  }
  if (!sitio.publicado_en) {
    dot.className = 'publish-dot pendiente';
    txt.textContent = 'Todavía no se ha publicado nada desde el panel';
  } else if (sitio.pendiente) {
    dot.className = 'publish-dot pendiente';
    txt.textContent = 'Hay cambios guardados que aún no están en la web';
  } else {
    dot.className = 'publish-dot ok';
    const f = new Date(sitio.publicado_en).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' });
    txt.textContent = `La web está al día · publicada ${f}`;
  }
}

function marcarPendiente() {
  if (!sitio) return;
  sitio.pendiente = true;
  pintarEstado();
}

async function publicar() {
  if (sucio && !confirm(`Tienes cambios sin guardar en "${seccionActual.titulo}". Esos cambios NO se publicarán.\n\n¿Publicar de todas formas?`)) return;
  if (!confirm('¿Publicar los cambios en velamia.shop?\n\nLa web se actualizará en menos de 1 minuto.')) return;
  const btn = $('btnPublicar');
  btn.disabled = true;
  btn.textContent = 'Publicando…';
  try {
    const r = await apiSend('POST', '/api/publicar');
    sitio.publicado_en = r.publicado_en;
    sitio.pendiente = false;
    pintarEstado();
    alert(`✅ Publicado. ${r.productos} productos y todas las secciones.\n\nEn velamia.shop se verá en menos de 1 minuto (recarga la página).`);
  } catch (err) {
    alert('⚠️ No se pudo publicar: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = '🌐 Publicar en la web';
  }
}

// ==================== LISTA DE SECCIONES ====================
async function loadSitio() {
  try {
    sitio = await apiGet('/api/sitio');
    renderListaSecciones();
    pintarEstado();
  } catch (err) {
    $('sitioLista').innerHTML = `<p class="grid-msg error">⚠️ No se pudo cargar la página: ${esc(err.message)}</p>`;
    pintarEstado(err);
  }
}

function resumenSeccion(sec, datos) {
  if (sec.clave === 'temporada') return datos.activo ? '🟢 Encendido' : '⚪ Apagado';
  if (sec.clave === 'envios') return `GYE $${datos.gye_costo} · Prov. $${datos.prov_costo} · Tarjeta ${datos.descuento_tarjeta}%`;
  const lista = sec.campos.find(c => c.tipo === 'lista' && (!sec.listaResumen || c.k === sec.listaResumen));
  const texto = datos.titulo ? `${datos.titulo} ${datos.destacado || ''}`.trim() : (datos.nombre || '');
  const partes = [];
  if (texto) partes.push(texto);
  if (lista) partes.push(`${(datos[lista.k] || []).length} ${lista.nombreItem || 'elementos'}${(datos[lista.k] || []).length === 1 ? '' : 's'}`);
  return partes.join(' · ');
}

function renderListaSecciones() {
  $('sitioLista').innerHTML = SECCIONES_SITIO.map(sec => `
    <button type="button" class="sitio-card" data-seccion="${sec.clave}">
      <span class="sitio-card-icono">${sec.icono}</span>
      <span class="sitio-card-texto">
        <strong>${esc(sec.titulo)}</strong>
        <small>${esc(resumenSeccion(sec, sitio.secciones[sec.clave]))}</small>
      </span>
      <span class="sitio-card-flecha">›</span>
    </button>`).join('');
}

// ==================== EDITOR ====================
function valorVacio(campo) {
  switch (campo.tipo) {
    case 'si_no': return false;
    case 'numero': return campo.min ?? 0;
    case 'categoria': return CATEGORIAS_SITIO[0][0];
    case 'lista': return [];
    default: return '';
  }
}

function itemVacio(campo) {
  return Object.fromEntries(campo.campos.map(c => [c.k, valorVacio(c)]));
}

function campoHtml(c, v, ruta) {
  const id = 'f_' + ruta.replace(/\./g, '_');
  const label = `<label for="${id}">${esc(c.label)}</label>`;
  switch (c.tipo) {
    case 'texto':
      return `<div class="field">${label}<input id="${id}" type="text" data-ruta="${ruta}" maxlength="${c.max || 200}" value="${esc(v)}"></div>`;
    case 'parrafo':
      return `<div class="field">${label}<textarea id="${id}" rows="3" data-ruta="${ruta}" maxlength="${c.max || 1000}">${esc(v)}</textarea></div>`;
    case 'enlace':
      return `<div class="field">${label}<input id="${id}" type="text" data-ruta="${ruta}" placeholder="#productos o https://…" value="${esc(v)}"></div>`;
    case 'numero':
      return `<div class="field">${label}<input id="${id}" type="number" data-ruta="${ruta}" data-numero="1" min="${c.min}" max="${c.max}" step="${c.paso || 1}" value="${esc(v)}"></div>`;
    case 'si_no':
      return `<label class="check-line"><input type="checkbox" data-ruta="${ruta}" ${v ? 'checked' : ''}> ${esc(c.label)}</label>`;
    case 'categoria':
      return `<div class="field">${label}<select id="${id}" data-ruta="${ruta}">${CATEGORIAS_SITIO.map(([k, n]) =>
        `<option value="${k}" ${k === v ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div>`;
    case 'imagen':
      return `<div class="field campo-imagen">${label}
        <div class="img-box">
          <div class="img-prev">${v ? `<img src="${esc(v)}" alt="">` : '<span>Sin foto</span>'}</div>
          <div class="img-acciones">
            <label class="btn-soft"><input type="file" accept="image/jpeg,image/png,image/webp" data-subir="${ruta}" hidden>📤 Subir foto</label>
            <input id="${id}" type="text" data-ruta="${ruta}" placeholder="o pega un enlace https://…" value="${esc(v)}">
          </div>
        </div></div>`;
    case 'lista': {
      const items = Array.isArray(v) ? v : [];
      const nombre = c.nombreItem || 'elemento';
      return `<fieldset class="lista-campo">
        <legend>${esc(c.label)} <small>(${items.length}/${c.max})</small></legend>
        ${items.map((item, i) => `
          <div class="lista-item">
            <div class="lista-item-top">
              <strong>${esc(nombre.charAt(0).toUpperCase() + nombre.slice(1))} ${i + 1}</strong>
              <span class="lista-botones">
                <button type="button" data-mover="${ruta}" data-i="${i}" data-dir="-1" ${i === 0 ? 'disabled' : ''} title="Subir">↑</button>
                <button type="button" data-mover="${ruta}" data-i="${i}" data-dir="1" ${i === items.length - 1 ? 'disabled' : ''} title="Bajar">↓</button>
                <button type="button" data-quitar="${ruta}" data-i="${i}" class="quitar" title="Quitar">✕</button>
              </span>
            </div>
            <div class="lista-item-campos">${c.campos.map(sc => campoHtml(sc, item[sc.k], `${ruta}.${i}.${sc.k}`)).join('')}</div>
          </div>`).join('')}
        ${items.length < c.max ? `<button type="button" class="btn-soft agregar" data-agregar="${ruta}">＋ Agregar ${esc(nombre)}</button>` : ''}
      </fieldset>`;
    }
    default:
      return '';
  }
}

function campoDeRuta(ruta) {
  const partes = ruta.split('.').filter(p => isNaN(Number(p)));
  let campos = seccionActual.campos;
  let campo = null;
  for (const k of partes) {
    campo = campos.find(c => c.k === k);
    campos = campo && campo.campos;
  }
  return campo;
}

function renderCampos() {
  const y = window.scrollY;
  $('sitioCampos').innerHTML = seccionActual.campos.map(c => campoHtml(c, borrador[c.k], c.k)).join('');
  window.scrollTo(0, y);
}

function abrirSeccion(clave) {
  seccionActual = SECCIONES_SITIO.find(s => s.clave === clave);
  borrador = copia(sitio.secciones[clave]);
  sucio = false;
  $('sitioTitulo').textContent = `${seccionActual.icono} ${seccionActual.titulo}`;
  $('sitioDescripcion').textContent = seccionActual.descripcion || '';
  mensaje($('sitioMsg'), '');
  renderCampos();
  $('sitioLista').hidden = true;
  $('sitioEditor').hidden = false;
  window.scrollTo(0, 0);
}

function cerrarSeccion() {
  if (sucio && !confirm('Tienes cambios sin guardar en esta sección. ¿Salir sin guardar?')) return;
  sucio = false;
  seccionActual = null;
  $('sitioEditor').hidden = true;
  $('sitioLista').hidden = false;
  renderListaSecciones();
}

async function guardarSeccion(e) {
  e.preventDefault();
  const btn = $('sitioGuardar');
  btn.disabled = true;
  mensaje($('sitioMsg'), 'Guardando…');
  try {
    const r = await apiSend('PUT', `/api/sitio/${seccionActual.clave}`, borrador);
    sitio.secciones[seccionActual.clave] = r.datos;
    borrador = copia(r.datos);
    sucio = false;
    renderCampos();
    marcarPendiente();
    mensaje($('sitioMsg'), '✅ Guardado. Cuando termines, toca "Publicar en la web" para que se vea en velamia.shop.', 'ok');
  } catch (err) {
    mensaje($('sitioMsg'), '⚠️ ' + err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

// ==================== EVENTOS ====================
(function initSitio() {
  $('btnPublicar').addEventListener('click', publicar);
  $('sitioVolver').addEventListener('click', cerrarSeccion);
  $('sitioForm').addEventListener('submit', guardarSeccion);
  $('sitioRestaurar').addEventListener('click', () => {
    if (!sucio || !confirm('¿Descartar los cambios que no guardaste?')) return;
    borrador = copia(sitio.secciones[seccionActual.clave]);
    sucio = false;
    renderCampos();
    mensaje($('sitioMsg'), '');
  });

  $('sitioLista').addEventListener('click', e => {
    const card = e.target.closest('[data-seccion]');
    if (card) abrirSeccion(card.dataset.seccion);
  });

  const cont = $('sitioCampos');
  const alCambiar = e => {
    const el = e.target;
    if (!el.dataset.ruta) return;
    let valor = el.type === 'checkbox' ? el.checked : el.value;
    if (el.dataset.numero) valor = el.value === '' ? '' : Number(el.value);
    escribirRuta(borrador, el.dataset.ruta, valor);
    sucio = true;
    const campo = campoDeRuta(el.dataset.ruta);
    if (campo && campo.tipo === 'imagen') {
      const prev = el.closest('.img-box').querySelector('.img-prev');
      prev.innerHTML = valor ? `<img src="${esc(valor)}" alt="">` : '<span>Sin foto</span>';
    }
  };
  cont.addEventListener('input', alCambiar);
  cont.addEventListener('change', async e => {
    const el = e.target;
    if (el.dataset.subir && el.files[0]) {
      const ruta = el.dataset.subir;
      const box = el.closest('.img-box');
      box.querySelector('.img-prev').innerHTML = '<span>Subiendo…</span>';
      try {
        escribirRuta(borrador, ruta, await subirFoto(el.files[0]));
        sucio = true;
        renderCampos();
        mensaje($('sitioMsg'), 'Foto subida. Recuerda guardar la sección.', 'ok');
      } catch (err) {
        mensaje($('sitioMsg'), '⚠️ ' + err.message, 'error');
        renderCampos();
      }
      return;
    }
    alCambiar(e);
  });

  cont.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.agregar) {
      const ruta = b.dataset.agregar;
      leerRuta(borrador, ruta).push(itemVacio(campoDeRuta(ruta)));
    } else if (b.dataset.quitar) {
      const ruta = b.dataset.quitar;
      const lista = leerRuta(borrador, ruta);
      const campo = campoDeRuta(ruta);
      if (campo.min && lista.length <= campo.min) return alert(`Debe quedar al menos ${campo.min}.`);
      if (!confirm('¿Quitar este elemento?')) return;
      lista.splice(Number(b.dataset.i), 1);
    } else if (b.dataset.mover) {
      const lista = leerRuta(borrador, b.dataset.mover);
      const i = Number(b.dataset.i);
      const j = i + Number(b.dataset.dir);
      if (j < 0 || j >= lista.length) return;
      [lista[i], lista[j]] = [lista[j], lista[i]];
    } else {
      return;
    }
    sucio = true;
    renderCampos();
  });

  window.addEventListener('beforeunload', e => {
    if (sucio) { e.preventDefault(); e.returnValue = ''; }
  });
})();
