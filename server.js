require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Auth middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// ==================== AUTH ====================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '30d' });
      res.json({ token, email });
    } else {
      res.status(401).json({ error: 'Credenciales inválidas' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== PRODUCTOS ====================
app.get('/api/productos', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('orden', { ascending: true })
      .order('id', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/productos/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const UNIDADES = ['docena', 'unidad'];

function precioOpcional(v) {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
}

// Devuelve { fila } o { error } a partir del body del panel.
function productoDesdeBody(b) {
  const nombre = String(b.nombre || '').trim();
  const precio = Number(b.precio);
  if (!nombre) return { error: 'El nombre es obligatorio' };
  if (!Number.isFinite(precio) || precio <= 0) return { error: 'El precio debe ser mayor a 0' };

  const precio_oferta = precioOpcional(b.precio_oferta);
  const precio_anterior = precioOpcional(b.precio_anterior);
  if (Number.isNaN(precio_oferta) || Number.isNaN(precio_anterior)) return { error: 'Precio de oferta inválido' };

  const imagenes = Array.isArray(b.imagenes) ? b.imagenes.filter(u => typeof u === 'string' && u.startsWith('https://')) : [];

  return {
    fila: {
      nombre,
      descripcion: String(b.descripcion || '').trim(),
      precio,
      precio_oferta,
      precio_anterior,
      categoria: String(b.categoria || '').trim() || null,
      etiqueta: String(b.etiqueta || '').trim() || null,
      unidad: UNIDADES.includes(b.unidad) ? b.unidad : 'docena',
      imagenes,
      foto_url: imagenes[0] || null,
      activo: b.activo !== false,
      nuevo: b.nuevo === true,
      mas_vendido: b.mas_vendido === true,
      oculto: b.oculto === true,
      ...(b.orden !== undefined && Number.isFinite(Number(b.orden)) ? { orden: Number(b.orden) } : {})
    }
  };
}

app.post('/api/productos', authenticateToken, async (req, res) => {
  try {
    const { fila, error: invalido } = productoDesdeBody(req.body);
    if (invalido) return res.status(400).json({ error: invalido });
    if (fila.orden === undefined) fila.orden = 0;

    const { data, error } = await supabase.from('productos').insert([fila]).select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/productos/:id', authenticateToken, async (req, res) => {
  try {
    const { fila, error: invalido } = productoDesdeBody(req.body);
    if (invalido) return res.status(400).json({ error: invalido });

    const { data, error } = await supabase
      .from('productos')
      .update({ ...fila, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select();

    if (error) throw error;
    if (!data.length) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/productos/:id', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== TEXTOS ====================
app.get('/api/textos', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('textos')
      .select('*')
      .order('orden', { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/textos/:seccion', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('textos')
      .select('*')
      .eq('seccion', req.params.seccion);

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/textos', authenticateToken, async (req, res) => {
  try {
    const { seccion, titulo, contenido, orden } = req.body;

    const { data, error } = await supabase
      .from('textos')
      .insert([{ seccion, titulo, contenido, orden: parseInt(orden) || 999 }])
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/textos/:id', authenticateToken, async (req, res) => {
  try {
    const { seccion, titulo, contenido, orden } = req.body;

    const { data, error } = await supabase
      .from('textos')
      .update({ seccion, titulo, contenido, orden: parseInt(orden) || 999, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/textos/:id', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('textos')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== MEDIA (FOTOS) ====================
const TIPOS_IMAGEN = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

app.post('/api/media/upload', authenticateToken, (req, res, next) => {
  upload.single('file')(req, res, err => {
    if (err) return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'La foto pesa más de 5 MB' : err.message });
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió ninguna foto' });
    const ext = TIPOS_IMAGEN[req.file.mimetype];
    if (!ext) return res.status(400).json({ error: 'Solo se aceptan fotos JPG, PNG o WEBP' });

    const base = path.parse(req.file.originalname).name
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 60) || 'foto';
    const fileName = `${base}_${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from('productos')
      .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });
    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage.from('productos').getPublicUrl(fileName);
    await supabase.from('media').insert([{ filename: fileName, url: publicUrl, tipo: 'producto' }]);

    res.json({ url: publicUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/media', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== PEDIDOS ====================
app.get('/api/pedidos', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .order('fecha_pedido', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/pedidos/stats', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*');

    if (error) throw error;

    const totalPedidos = data.length;
    const totalVentas = data.reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0);
    const pedidosMes = data.filter(p => {
      const fecha = new Date(p.fecha_pedido);
      const ahora = new Date();
      return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
    }).length;

    res.json({ totalPedidos, totalVentas: totalVentas.toFixed(2), pedidosMes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve admin panel
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
