// CONFIG
const API_URL = window.location.origin;
let authToken = localStorage.getItem('authToken');

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
  e.currentTarget.classList.add('active');
}

// ==================== LOAD DATA ====================
async function apiGet(path) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
  });
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('authToken');
    location.reload();
    throw new Error('Sesión expirada');
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

function showTableError(tbodyId, cols, err) {
  document.getElementById(tbodyId).innerHTML =
    `<tr><td colspan="${cols}" style="text-align:center;color:#E63946;">⚠️ No se pudo cargar: ${err.message}</td></tr>`;
}

async function loadData() {
  await loadProductos();
  await loadTextos();
  await loadPedidos();
  await loadStats();
}

async function loadTextos() {
  try {
    const textos = await apiGet('/api/textos');

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
            <button onclick="formatText('underline')"><u>U</u></button>
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
    document.getElementById('textosContainer').innerHTML =
      `<p style="color:#E63946;">⚠️ No se pudieron cargar los textos: ${err.message}</p>`;
  }
}

async function loadPedidos() {
  try {
    const pedidos = await apiGet('/api/pedidos');

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
    showTableError('pedidosBody', 6, err);
  }
}

async function loadStats() {
  try {
    const stats = await apiGet('/api/pedidos/stats');
    document.getElementById('totalPedidos').textContent = stats.totalPedidos;
    document.getElementById('totalVentas').textContent = `$${stats.totalVentas}`;
    document.getElementById('pedidosMes').textContent = stats.pedidosMes;
  } catch (err) {
    ['totalPedidos', 'totalVentas', 'pedidosMes'].forEach(id => document.getElementById(id).textContent = '—');
  }
  try {
    const prods = await apiGet('/api/productos');
    document.getElementById('totalProductos').textContent = prods.filter(p => p.activo).length;
  } catch (err) {
    document.getElementById('totalProductos').textContent = '—';
  }
}

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
