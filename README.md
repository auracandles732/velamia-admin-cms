# 🕯️ Velamia Admin CMS

Panel administrativo para editar productos, textos y ver pedidos de Velamia Shop.

## 🚀 Deploy en Render

### Paso 1: Preparar GitHub
```bash
cd C:\Users\User\velamia-admin-cms
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/auracandles732/velamia-admin-cms.git
git push -u origin main
```

### Paso 2: Deploy en Render
1. Abre https://render.com
2. Conecta con GitHub
3. Selecciona el repo `velamia-admin-cms`
4. Elige `Node`
5. Nombre: `velamia-admin-cms`
6. Build Command: `npm install`
7. Start Command: `npm start`
8. Plan: Free
9. Agrega variables de entorno:
   - `SUPABASE_URL` = tu URL de Supabase
   - `SUPABASE_ANON_KEY` = tu anon key
   - `SUPABASE_SERVICE_KEY` = tu service key
   - `JWT_SECRET` = clave segura (cambiar en producción)
   - `ADMIN_EMAIL` = tu email
   - `ADMIN_PASSWORD` = tu contraseña

10. Deploy

## 📝 Credenciales

El acceso se configura con las variables `ADMIN_EMAIL` y `ADMIN_PASSWORD` en Render. Nunca escribirlas en este repositorio (es público).

## 📚 Estructura

- `server.js` - Backend Express con rutas API
- `public/index.html` - Interface CRM
- `public/admin.css` - Estilos
- `public/admin.js` - Lógica del cliente
- `.env` - Variables de entorno (NO commitear)

## 🔌 API Endpoints

### Auth
- `POST /api/auth/login` - Login

### Productos
- `GET /api/productos` - Listar todos
- `GET /api/productos/:id` - Obtener uno
- `POST /api/productos` - Crear
- `PUT /api/productos/:id` - Editar
- `DELETE /api/productos/:id` - Eliminar

### Textos
- `GET /api/textos` - Listar todos
- `GET /api/textos/:seccion` - Por sección
- `POST /api/textos` - Crear
- `PUT /api/textos/:id` - Editar
- `DELETE /api/textos/:id` - Eliminar

### Media
- `POST /api/media/upload` - Subir foto
- `GET /api/media` - Listar fotos

### Pedidos
- `GET /api/pedidos` - Listar todos
- `GET /api/pedidos/stats` - Estadísticas

## 🔐 Importante

- ⚠️ **NUNCA** tocar el proyecto Render actual
- ⚠️ **NUNCA** tocar el proyecto Supabase actual
- ✅ Este es un proyecto NUEVO completamente separado

## 📱 Acceso

Una vez deployado en Render:
```
https://velamia-admin-cms.render.com
```

Accesible desde:
- ✅ Computadora
- ✅ Celular (interface responsive)

## 🔄 Conexión con velamia-shop

Modificar `index.html` de velamia-shop para traer datos de la API:

```javascript
fetch('https://velamia-admin-cms.render.com/api/productos')
  .then(r => r.json())
  .then(productos => {
    // Renderizar productos dinámicamente
  });
```

---

**Desarrollado con ❤️ para Velamia Shop**
