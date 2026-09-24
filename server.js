require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
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

// Multer para upload de fotos
const upload = multer({ dest: 'uploads/' });

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
      .order('orden', { ascending: true });

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

app.post('/api/productos', authenticateToken, async (req, res) => {
  try {
    const { nombre, descripcion, precio, foto_url, scents, colores, stock, activo, orden } = req.body;

    const { data, error } = await supabase
      .from('productos')
      .insert([{
        nombre,
        descripcion,
        precio: parseFloat(precio),
        foto_url,
        scents: scents || [],
        colores: colores || [],
        stock: parseInt(stock) || 0,
        activo: activo !== false,
        orden: parseInt(orden) || 999
      }])
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/productos/:id', authenticateToken, async (req, res) => {
  try {
    const { nombre, descripcion, precio, foto_url, scents, colores, stock, activo, orden } = req.body;

    const { data, error } = await supabase
      .from('productos')
      .update({
        nombre,
        descripcion,
        precio: parseFloat(precio),
        foto_url,
        scents: scents || [],
        colores: colores || [],
        stock: parseInt(stock) || 0,
        activo: activo !== false,
        orden: parseInt(orden) || 999,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select();

    if (error) throw error;
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
app.post('/api/media/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    const fileBuffer = fs.readFileSync(req.file.path);
    const fileName = `${Date.now()}-${req.file.originalname}`;
    const filePath = `products/${fileName}`;

    const { data, error } = await supabase.storage
      .from('admin-storage')
      .upload(filePath, fileBuffer);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('admin-storage')
      .getPublicUrl(filePath);

    const { data: mediaData, error: mediaError } = await supabase
      .from('media')
      .insert([{ filename: fileName, url: publicUrl, tipo: 'producto' }])
      .select();

    if (mediaError) throw mediaError;

    fs.unlinkSync(req.file.path);
    res.json({ url: publicUrl, id: mediaData[0].id });
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
