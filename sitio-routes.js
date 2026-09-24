const { SECCIONES, limpiarSeccion } = require('./public/sitio-schema');
const DEFAULTS = require('./sitio-defaults');

const BUCKET = 'sitio';
const CLAVE_PUBLICACION = '_publicacion';
const CLAVE_CAMBIO = '_cambio';
const CLAVES = SECCIONES.map(s => s.clave);

// Convierte una fila de `productos` al formato que usa el código de la tienda (PRODUCTS en index.html).
function productoTienda(r) {
  const extra = r.extra || {};
  const id = r.shop_id ?? 100000 + r.id;
  const imgs = (r.imagenes || []).map((_, i) => `cms_${id}_${i}`);
  const p = {
    ...extra,
    id,
    name: r.nombre,
    desc: r.descripcion || '',
    price: Number(r.precio),
    tag: r.etiqueta || '',
    img: imgs[0] || '',
    cat: r.categoria || '',
    unit: r.unidad === 'unidad' ? 'unidad' : 'docena'
  };
  if (imgs.length > 1) p.imgs = imgs;
  if (r.oculto) p.oculto = true;
  if (r.nuevo) p.nuevo = true;
  if (r.mas_vendido) p.extra = 'mas-vendidos'; else delete p.extra;

  if (r.precio_oferta != null) {
    p.salePrice = Number(r.precio_oferta);
    p.originalPrice = Number(r.precio_anterior ?? r.precio);
  } else if (extra.onSale) {
    p.salePrice = p.price;
    p.originalPrice = Number(r.precio_anterior ?? r.precio);
  }
  return { producto: p, imagenes: r.imagenes || [] };
}

// Ajusta las marcas de oferta de la tienda cuando el precio de oferta cambia desde el panel.
function extraConOferta(extraActual, ofertaAnterior, fila) {
  const extra = { ...(extraActual || {}) };
  const antes = ofertaAnterior == null ? null : Number(ofertaAnterior);
  if (antes === fila.precio_oferta) return extra;
  delete extra.cardPrice;
  delete extra.saleDiscount;
  if (fila.precio_oferta == null) {
    ['onSale', 'alwaysSale', 'fixedSale', 'oferta', 'saleText', 'sinDescuento'].forEach(k => delete extra[k]);
  } else {
    const base = fila.precio_anterior ?? fila.precio;
    Object.assign(extra, {
      onSale: true, alwaysSale: true, fixedSale: true, oferta: true, sinDescuento: true,
      saleDiscount: Math.max(1, Math.round((1 - fila.precio_oferta / base) * 100))
    });
  }
  return extra;
}

async function leerSecciones(supabase) {
  const { data, error } = await supabase.from('textos').select('seccion, contenido, updated_at');
  if (error) throw error;
  const secciones = {};
  let publicadoEn = null;
  let ultimaEdicion = null;
  for (const row of data) {
    if (row.seccion === CLAVE_PUBLICACION) {
      try { publicadoEn = JSON.parse(row.contenido).publicado_en; } catch (_) {}
      continue;
    }
    if (row.seccion === CLAVE_CAMBIO) {
      if (!ultimaEdicion || row.updated_at > ultimaEdicion) ultimaEdicion = row.updated_at;
      continue;
    }
    if (!CLAVES.includes(row.seccion)) continue;
    try { secciones[row.seccion] = JSON.parse(row.contenido); } catch (_) { continue; }
    if (!ultimaEdicion || row.updated_at > ultimaEdicion) ultimaEdicion = row.updated_at;
  }
  for (const c of CLAVES) if (!secciones[c]) secciones[c] = DEFAULTS[c];
  return { secciones, publicadoEn, ultimaEdicion };
}

async function guardarFila(supabase, seccion, contenido) {
  const payload = { seccion, titulo: seccion, contenido: JSON.stringify(contenido), orden: 0, updated_at: new Date().toISOString() };
  const { data: existe, error: e1 } = await supabase.from('textos').select('id').eq('seccion', seccion).limit(1);
  if (e1) throw e1;
  const q = existe.length
    ? supabase.from('textos').update(payload).eq('id', existe[0].id)
    : supabase.from('textos').insert([payload]);
  const { error } = await q;
  if (error) throw error;
}

async function asegurarBucket(supabase) {
  const { data } = await supabase.storage.listBuckets();
  if (data && data.some(b => b.id === BUCKET)) return;
  const { error } = await supabase.storage.createBucket(BUCKET, { public: true, fileSizeLimit: '2MB' });
  if (error && !/exists/i.test(error.message)) throw error;
}

module.exports = function registrarSitio(app, supabase, auth) {
  app.get('/api/sitio', auth, async (req, res) => {
    try {
      const { secciones, publicadoEn, ultimaEdicion } = await leerSecciones(supabase);
      res.json({
        secciones,
        publicado_en: publicadoEn,
        pendiente: !publicadoEn || Boolean(ultimaEdicion && new Date(ultimaEdicion) > new Date(publicadoEn))
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/sitio/:clave', auth, async (req, res) => {
    try {
      const { clave } = req.params;
      if (!CLAVES.includes(clave)) return res.status(404).json({ error: 'Sección desconocida' });
      const { valor, error } = limpiarSeccion(clave, req.body);
      if (error) return res.status(400).json({ error });
      await guardarFila(supabase, clave, valor);
      res.json({ ok: true, datos: valor });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/publicar', auth, async (req, res) => {
    try {
      const { secciones } = await leerSecciones(supabase);
      const limpias = {};
      for (const c of CLAVES) {
        const { valor, error } = limpiarSeccion(c, secciones[c]);
        if (error) return res.status(400).json({ error: `Sección "${SECCIONES.find(s => s.clave === c).titulo}": ${error}` });
        limpias[c] = valor;
      }

      const { data: filas, error: eProd } = await supabase.from('productos').select('*').eq('activo', true)
        .order('orden', { ascending: true }).order('id', { ascending: false });
      if (eProd) throw eProd;
      if (!filas.some(f => !f.oculto)) return res.status(400).json({ error: 'No hay productos visibles: la tienda quedaría vacía' });

      const publicadoEn = new Date().toISOString();
      const snapshot = {
        version: 1,
        publicado_en: publicadoEn,
        secciones: limpias,
        productos: filas.map(productoTienda)
      };
      const cuerpo = Buffer.from(JSON.stringify(snapshot));

      await asegurarBucket(supabase);
      const up = await supabase.storage.from(BUCKET).upload('sitio.json', cuerpo, {
        contentType: 'application/json', cacheControl: '30', upsert: true
      });
      if (up.error) throw up.error;
      await supabase.storage.from(BUCKET).upload(`historial/${publicadoEn.replace(/[:.]/g, '-')}.json`, cuerpo, {
        contentType: 'application/json', upsert: true
      });
      await guardarFila(supabase, CLAVE_PUBLICACION, { publicado_en: publicadoEn });

      res.json({ ok: true, publicado_en: publicadoEn, productos: filas.length });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
};

module.exports.extraConOferta = extraConOferta;
module.exports.marcarCambio = supabase => guardarFila(supabase, CLAVE_CAMBIO, {});
