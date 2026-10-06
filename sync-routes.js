const crypto = require('crypto');
const { productoTienda, extraConOferta, BUCKET } = require('./sitio-routes');

/**
 * Sincronización con el CRM (Nexly): el Catálogo del CRM manda. Nombre, descripción, precio, categoría, unidad, fotos y
 * si se muestra llegan desde el CRM; ofertas, etiqueta, "nuevo", "más vendido" y orden se siguen manejando aquí.
 * El CRM se identifica con la llave CRM_SYNC_KEY (encabezado X-Sync-Key). Sin esa variable la sincronización está apagada
 * y el panel funciona como siempre.
 */

const gestionado = fila => !!(fila && fila.extra && fila.extra.crm_id);

function llaveValida(req) {
  const esperada = String(process.env.CRM_SYNC_KEY || '');
  const llegó = String(req.headers['x-sync-key'] || '');
  if (!esperada || !llegó) return false;
  const a = crypto.createHash('sha256').update(esperada).digest();
  const b = crypto.createHash('sha256').update(llegó).digest();
  return crypto.timingSafeEqual(a, b);
}

function requiereLlave(req, res, next) {
  if (!process.env.CRM_SYNC_KEY) return res.status(503).json({ error: 'La sincronización con el CRM no está configurada (falta CRM_SYNC_KEY)' });
  if (!llaveValida(req)) return res.status(401).json({ error: 'Llave inválida' });
  next();
}

const UNIDADES = ['docena', 'unidad'];

/** Lo que manda el CRM, revisado. null si el producto no es válido. */
function desdeCrm(p) {
  const nombre = String(p && p.nombre || '').trim().slice(0, 120);
  const precio = Number(p && p.precio);
  const crmId = String(p && p.crm_id || '').trim();
  if (!nombre || !(precio > 0) || !/^[0-9a-f-]{36}$/i.test(crmId)) return null;
  const imagenes = (Array.isArray(p.imagenes) ? p.imagenes : []).filter(u => typeof u === 'string' && u.startsWith('https://')).slice(0, 10);
  return {
    crmId,
    id: Number.isInteger(Number(p.id)) && Number(p.id) > 0 ? Number(p.id) : null,
    fila: {
      nombre,
      descripcion: String(p.descripcion || '').trim().slice(0, 600),
      precio: Math.round(precio * 100) / 100,
      categoria: String(p.categoria || '').trim().slice(0, 60) || null,
      unidad: UNIDADES.includes(p.unidad) ? p.unidad : 'docena',
      imagenes,
      foto_url: imagenes[0] || null,
      oculto: p.oculto === true,
      activo: true
    }
  };
}

/** Publica solo los productos: las secciones quedan como se publicaron por última vez (los borradores no salen). */
async function publicarProductos(supabase) {
  const { data: archivo, error: eDesc } = await supabase.storage.from(BUCKET).download('sitio.json');
  if (eDesc || !archivo) return { publicado: false, motivo: 'Todavía no se ha publicado la web desde el panel' };
  const actual = JSON.parse(Buffer.from(await archivo.arrayBuffer()).toString('utf8'));
  const { data: filas, error } = await supabase.from('productos').select('*').eq('activo', true)
    .order('orden', { ascending: true }).order('id', { ascending: false });
  if (error) throw error;
  if (!filas.some(f => !f.oculto)) return { publicado: false, motivo: 'No hay productos visibles: la tienda quedaría vacía' };
  const publicadoEn = new Date().toISOString();
  const cuerpo = Buffer.from(JSON.stringify({ ...actual, publicado_en: publicadoEn, productos: filas.map(productoTienda) }));
  const up = await supabase.storage.from(BUCKET).upload('sitio.json', cuerpo, { contentType: 'application/json', cacheControl: '30', upsert: true });
  if (up.error) throw up.error;
  await supabase.storage.from(BUCKET).upload(`historial/${publicadoEn.replace(/[:.]/g, '-')}-crm.json`, cuerpo, { contentType: 'application/json', upsert: true });
  return { publicado: true, productos: filas.length };
}

module.exports = function registrarSync(app, supabase, auth) {
  // Para el panel: si está activa, los productos se editan en el CRM.
  app.get('/api/sync/estado', auth, (req, res) => {
    res.json({ activo: !!process.env.CRM_SYNC_KEY });
  });

  app.get('/api/sync/productos', requiereLlave, async (req, res) => {
    try {
      const { data, error } = await supabase.from('productos').select('*').order('id', { ascending: true });
      if (error) throw error;
      res.json({
        productos: (data || []).map(f => ({
          id: f.id, nombre: f.nombre, descripcion: f.descripcion || '', precio: Number(f.precio), precio_oferta: f.precio_oferta,
          categoria: f.categoria || '', unidad: f.unidad || 'docena', imagenes: f.imagenes || [], oculto: !!f.oculto,
          activo: f.activo !== false, crm_id: gestionado(f) ? f.extra.crm_id : null
        }))
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/sync/productos', requiereLlave, async (req, res) => {
    try {
      const lista = Array.isArray(req.body && req.body.productos) ? req.body.productos : null;
      if (!lista || lista.length > 3000) return res.status(400).json({ error: 'Lista de productos inválida' });
      const { data: filas, error } = await supabase.from('productos').select('*');
      if (error) throw error;
      const porId = new Map(filas.map(f => [f.id, f]));
      const porCrm = new Map(filas.filter(gestionado).map(f => [f.extra.crm_id, f]));
      const ids = {};
      const recibidos = new Set();
      for (const crudo of lista) {
        const p = desdeCrm(crudo);
        if (!p) continue;
        recibidos.add(p.crmId);
        let fila = porCrm.get(p.crmId);
        if (!fila && p.id && porId.has(p.id)) {
          const otra = porId.get(p.id);
          // Ese id ya es de otro producto del CRM: se crea uno nuevo en lugar de pisarlo.
          if (!gestionado(otra) || otra.extra.crm_id === p.crmId) fila = otra;
        }
        if (fila) {
          const cambios = { ...p.fila, extra: { ...(fila.extra || {}), crm_id: p.crmId }, updated_at: new Date().toISOString() };
          // Una oferta igual o mayor al precio nuevo ya no es oferta: se quita.
          if (fila.precio_oferta != null && Number(fila.precio_oferta) >= cambios.precio) {
            cambios.precio_oferta = null;
            cambios.extra = extraConOferta(cambios.extra, fila.precio_oferta, { ...cambios, precio_oferta: null, precio_anterior: fila.precio_anterior });
          }
          const { error: eUp } = await supabase.from('productos').update(cambios).eq('id', fila.id);
          if (eUp) throw eUp;
          ids[p.crmId] = fila.id;
        } else {
          const { data: nueva, error: eIns } = await supabase.from('productos')
            .insert([{ ...p.fila, orden: 0, nuevo: false, mas_vendido: false, extra: { crm_id: p.crmId } }]).select('id');
          if (eIns) throw eIns;
          ids[p.crmId] = nueva[0].id;
        }
      }
      // Los que el CRM ya no manda (se borraron allá) se ocultan; los que nunca fueron del CRM no se tocan.
      for (const f of filas.filter(gestionado)) {
        if (!recibidos.has(f.extra.crm_id) && !f.oculto) {
          const { error: eOc } = await supabase.from('productos').update({ oculto: true, updated_at: new Date().toISOString() }).eq('id', f.id);
          if (eOc) throw eOc;
        }
      }
      const publicacion = await publicarProductos(supabase);
      res.json({ ok: true, ids, ...publicacion });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
};

module.exports.gestionado = gestionado;
module.exports.desdeCrm = desdeCrm;
