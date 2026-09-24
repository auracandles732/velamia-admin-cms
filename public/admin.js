// CONFIG
const API_URL = window.location.origin;
let authToken = localStorage.getItem('authToken');
let currentEditingProductId = null;

// Init
window.addEventListener('DOMContentLoaded', () => {
  if (authToken) {
    showAdminPanel();
    loadData();
  } else {
    setupLoginForm();
  }
});

// ==================== AUTH ====================
function setupLoginForm() {
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (res.ok) {
        authToken = data.token;
        localStorage.setItem('authToken', authToken);
        document.getElementById('loginScreen').style.display = 'none';
        showAdminPanel();
        loadData();
      } else {
        document.getElementById('authMsg').textContent = data.error || 'Error de login';
      }
    } catch (err) {
      document.getElementById('authMsg').textContent = 'Error de conexión';
    }
  });
}

function logout() {
  if (confirm('¿Cerrar sesión?')) {
    localStorage.removeItem('authToken');
    location.reload();
  }
}

function showAdminPanel() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminPanel').style.display = 'flex';
}

// ==================== TABS ====================
function switchTab(tab, e) {
  e.preventDefault();

  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-link').forEach(t => t.classList.remove('active'));

  document.getElementById(tab).classList.add('active');
  event.target.classList.add('active');
}

// ==================== LOAD DATA ====================
async function loadData() {
  await loadProductos();
  await loadTextos();
  await loadPedidos();
  await loadStats();
}

async function loadProductos() {
  try {
    const res = await fetch(`${API_URL}/api/productos`);
    const productos = await res.json();

    const tbody = document.getElementById('productosBody');
    tbody.innerHTML = '';

    productos.forEach(p => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${p.foto_url ? `<img src="${p.foto_url}" style="width:60px;height:60px;border-radius:4px;">` : '-'}</td>
        <td><strong>${p.nombre}</strong></td>
        <td>$${parseFloat(p.precio).toFixed(2)}</td>
        <td>${p.stock}</td>
        <td><span class="status-badge ${p.activo ? 'status-active' : 'status-inactive'}">${p.activo ? 'Activo' : 'Inactivo'}</span></td>
        <td>
          <div class="table-actions">
            <button class="btn-edit" onclick="editProducto(${p.id})">✏️ Editar</button>
            <button class="btn-delete" onclick="deleteProducto(${p.id})">🗑️ Borrar</button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error('Error loading productos:', err);
  }
}

async function loadTextos() {
  try {
    const res = await fetch(`${API_URL}/api/textos`);
    const textos = await res.json();

    const secciones = ['hero', 'politicas', 'proceso', 'faq'];
    const container = document.getElementById('textosContainer');
    container.innerHTML = '';

    secciones.forEach(seccion => {
      const textoData = textos.filter(t => t.seccion === seccion)[0];
      const card = document.createElement('div');
      card.className = 'texto-card';
      card.innerHTML = `
        <h3>📝 ${seccion.charAt(0).toUpperCase() + seccion.slice(1)}</h3>
        <div class="texto-editor">
          <div class="texto-toolbar">
            <button onclick="formatText('bold')"><b>B</b></button>
            <button onclick="formatText('italic')"><i>I</i></button>
            <button onclick="formatText('underline')<u>U</u></button>
          </div>
          <textarea class="texto-content" id="texto-${seccion}" placeholder="Escribe el contenido aquí..."></textarea>
        </div>
        <div class="texto-actions">
          <button class="btn-primary" onclick="saveTexto('${seccion}')">💾 Guardar</button>
        </div>
      `;
      container.appendChild(card);

      if (textoData) {
        document.getElementById(`texto-${seccion}`).value = textoData.contenido || '';
      }
    });
  } catch (err) {
    console.error('Error loading textos:', err);
  }
}

async function loadPedidos() {
  try {
    const res = await fetch(`${API_URL}/api/pedidos`);
    const pedidos = await res.json();

    const tbody = document.getElementById('pedidosBody');
    tbody.innerHTML = '';

    pedidos.slice(0, 20).forEach(p => {
      const row = document.createElement('tr');
      const fecha = new Date(p.fecha_pedido).toLocaleDateString('es-EC');
      row.innerHTML = `
        <td><strong>${p.numero_pedido || '-'}</strong></td>
        <td>${p.cliente_nombre}</td>
        <td>${p.cliente_email}</td>
        <td>$${parseFloat(p.total).toFixed(2)}</td>
        <td><span class="status-badge status-active">${p.estado || 'Pagado'}</span></td>
        <td>${fecha}</td>
      `;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error('Error loading pedidos:', err);
  }
}

async function loadStats() {
  try {
    const resStats = await fetch(`${API_URL}/api/pedidos/stats`);
    const stats = await resStats.json();

    document.getElementById('totalPedidos').textContent = stats.totalPedidos;
    document.getElementById('totalVentas').textContent = `$${stats.totalVentas}`;
    document.getElementById('pedidosMes').textContent = stats.pedidosMes;

    const resProds = await fetch(`${API_URL}/api/productos`);
    const prods = await resProds.json();
    document.getElementById('totalProductos').textContent = prods.filter(p => p.activo).length;
  } catch (err) {
    console.error('Error loading stats:', err);
  }
}

// ==================== PRODUCTOS ====================
function showProductForm() {
  currentEditingProductId = null;
  document.getElementById('productFormTitle').textContent = 'Crear Producto';
  document.getElementById('productForm').reset();
  document.getElementById('productFormContainer').style.display = 'block';
  document.getElementById('prodActivo').checked = true;
}

function cancelProductForm() {
  document.getElementById('productFormContainer').style.display = 'none';
  currentEditingProductId = null;
}

async function editProducto(id) {
  try {
    const res = await fetch(`${API_URL}/api/productos/${id}`);
    const p = res.json();

    currentEditingProductId = id;
    document.getElementById('productFormTitle').textContent = 'Editar Producto';
    document.getElementById('prodNombre').value = p.nombre || '';
    document.getElementById('prodPrecio').value = p.precio || '';
    document.getElementById('prodDescripcion').value = p.descripcion || '';
    document.getElementById('prodFotoUrl').value = p.foto_url || '';
    document.getElementById('prodStock').value = p.stock || 0;
    document.getElementById('prodOrden').value = p.orden || 999;
    document.getElementById('prodActivo').checked = p.activo !== false;

    if (p.scents && Array.isArray(p.scents)) {
      document.querySelectorAll('.scent-checkbox').forEach(cb => {
        cb.checked = p.scents.includes(cb.value);
      });
    }

    if (p.colores && Array.isArray(p.colores)) {
      document.querySelectorAll('.color-checkbox').forEach(cb => {
        cb.checked = p.colores.includes(cb.value);
      });
    }

    if (p.foto_url) {
      document.getElementById('fotoPreview').innerHTML = `<img src="${p.foto_url}" class="foto-preview">`;
    }

    document.getElementById('productFormContainer').style.display = 'block';
    document.getElementById('productFormContainer').scrollIntoView();
  } catch (err) {
    alert('Error cargando producto');
  }
}

document.getElementById('productForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const scents = Array.from(document.querySelectorAll('.scent-checkbox:checked')).map(c => c.value);
  const colores = Array.from(document.querySelectorAll('.color-checkbox:checked')).map(c => c.value);

  const data = {
    nombre: document.getElementById('prodNombre').value,
    descripcion: document.getElementById('prodDescripcion').value,
    precio: document.getElementById('prodPrecio').value,
    foto_url: document.getElementById('prodFotoUrl').value,
    scents,
    colores,
    stock: document.getElementById('prodStock').value,
    activo: document.getElementById('prodActivo').checked,
    orden: document.getElementById('prodOrden').value
  };

  try {
    const method = currentEditingProductId ? 'PUT' : 'POST';
    const url = currentEditingProductId
      ? `${API_URL}/api/productos/${currentEditingProductId}`
      : `${API_URL}/api/productos`;

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(data)
    });

    if (res.ok) {
      alert('✅ Producto guardado');
      cancelProductForm();
      loadProductos();
    } else {
      alert('Error guardando producto');
    }
  } catch (err) {
    alert('Error: ' + err.message);
  }
});

async function deleteProducto(id) {
  if (!confirm('¿Eliminar este producto?')) return;

  try {
    const res = await fetch(`${API_URL}/api/productos/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (res.ok) {
      alert('✅ Producto eliminado');
      loadProductos();
    }
  } catch (err) {
    alert('Error eliminando producto');
  }
}

// Upload de foto
document.getElementById('prodFotoInput')?.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch(`${API_URL}/api/media/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}` },
      body: formData
    });

    const data = await res.json();
    if (res.ok) {
      document.getElementById('prodFotoUrl').value = data.url;
      document.getElementById('fotoPreview').innerHTML = `<img src="${data.url}" class="foto-preview">`;
    }
  } catch (err) {
    alert('Error subiendo foto');
  }
});

// ==================== TEXTOS ====================
async function saveTexto(seccion) {
  const contenido = document.getElementById(`texto-${seccion}`).value;

  try {
    const res = await fetch(`${API_URL}/api/textos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        seccion,
        titulo: seccion,
        contenido,
        orden: 1
      })
    });

    if (res.ok) {
      alert('✅ Texto guardado');
    }
  } catch (err) {
    alert('Error guardando texto');
  }
}

function formatText(command) {
  document.execCommand(command, false, null);
}
