// Definición de las secciones editables de velamia.shop. La usan el panel (formularios) y el servidor (validación).
(function (root) {
  const CATEGORIAS = [
    ['baby-shower', 'Baby Shower'], ['revelacion', 'Revelación de sexo'], ['bautizo', 'Bautizo'],
    ['xv-anos', 'XV años'], ['matrimonio', 'Matrimonio'], ['cumpleanos', 'Cumpleaños'],
    ['personajes', 'Personajes'], ['dia-madre', 'Día de la Madre'],
    ['mas-vendidos', 'Más vendidos'], ['oferta', 'Ofertas'], ['all', 'Todos']
  ];

  const encabezado = (etiqueta) => [
    { k: 'etiqueta', tipo: 'texto', label: 'Texto pequeño superior', max: 60, ayuda: etiqueta },
    { k: 'titulo', tipo: 'texto', label: 'Título', max: 80 },
    { k: 'destacado', tipo: 'texto', label: 'Parte del título resaltada en color', max: 60 }
  ];

  const SECCIONES = [
    {
      clave: 'marca', titulo: 'Marca y contacto', icono: '🏷️',
      descripcion: 'Logo, nombre y datos de contacto. Se usan en el menú, el footer, la sección de contacto y todos los botones de WhatsApp.',
      campos: [
        { k: 'nombre', tipo: 'texto', label: 'Nombre de la tienda', max: 40 },
        { k: 'logo', tipo: 'imagen', label: 'Logo (redondo)' },
        { k: 'whatsapp', tipo: 'texto', label: 'WhatsApp (solo números, con 593 al inicio)', max: 15, patron: '^[0-9]{8,15}$' },
        { k: 'whatsapp_visible', tipo: 'texto', label: 'WhatsApp como se muestra', max: 25 },
        { k: 'whatsapp_mensaje', tipo: 'texto', label: 'Mensaje inicial del chat de WhatsApp', max: 150 },
        { k: 'instagram_usuario', tipo: 'texto', label: 'Usuario de Instagram', max: 40 },
        { k: 'instagram_url', tipo: 'enlace', label: 'Enlace de Instagram' },
        { k: 'facebook_nombre', tipo: 'texto', label: 'Nombre en Facebook', max: 40 },
        { k: 'facebook_url', tipo: 'enlace', label: 'Enlace de Facebook' },
        { k: 'tiktok_usuario', tipo: 'texto', label: 'Usuario de TikTok', max: 40 },
        { k: 'tiktok_url', tipo: 'enlace', label: 'Enlace de TikTok' },
        { k: 'correo', tipo: 'texto', label: 'Correo', max: 80 },
        { k: 'ciudad', tipo: 'texto', label: 'Ciudad', max: 40 },
        { k: 'pais', tipo: 'texto', label: 'País', max: 40 },
        { k: 'maps_url', tipo: 'enlace', label: 'Enlace de Google Maps' }
      ]
    },
    {
      clave: 'menu', titulo: 'Menú superior', icono: '🧭',
      descripcion: 'Enlaces del menú y botón principal.',
      campos: [
        { k: 'enlaces', tipo: 'lista', label: 'Enlaces', max: 8, nombreItem: 'enlace', campos: [
          { k: 'texto', tipo: 'texto', label: 'Texto', max: 30 },
          { k: 'destino', tipo: 'enlace', label: 'Lleva a (ej. #productos)' }
        ] },
        { k: 'boton_texto', tipo: 'texto', label: 'Texto del botón', max: 30 }
      ]
    },
    {
      clave: 'portada', titulo: 'Portada (carrusel)', icono: '🖼️',
      descripcion: 'Foto grande del inicio. Con más de una foto se vuelve carrusel automático.',
      campos: [
        { k: 'slides', tipo: 'lista', label: 'Fotos de portada', max: 6, min: 1, nombreItem: 'foto', campos: [
          { k: 'imagen', tipo: 'imagen', label: 'Foto (horizontal)' },
          { k: 'etiqueta', tipo: 'texto', label: 'Texto pequeño superior', max: 80 },
          { k: 'titulo', tipo: 'texto', label: 'Título', max: 90 },
          { k: 'destacado', tipo: 'texto', label: 'Parte del título resaltada', max: 60 },
          { k: 'subtitulo', tipo: 'texto', label: 'Subtítulo', max: 140 },
          { k: 'boton1_texto', tipo: 'texto', label: 'Botón 1: texto', max: 30 },
          { k: 'boton1_enlace', tipo: 'enlace', label: 'Botón 1: lleva a' },
          { k: 'boton2_texto', tipo: 'texto', label: 'Botón 2 (crear pedido): texto (vacío = ocultar)', max: 30 },
          { k: 'mostrar_pagos', tipo: 'si_no', label: 'Mostrar franja "Aceptamos tarjetas"' },
          { k: 'texto_pagos', tipo: 'texto', label: 'Texto de la franja', max: 40 }
        ] }
      ]
    },
    {
      clave: 'beneficios', titulo: 'Íconos bajo la portada', icono: '✨',
      descripcion: 'Franja de beneficios (Hechas a mano, Personalización…). Usa Enter para partir el texto en dos líneas.',
      campos: [
        { k: 'items', tipo: 'lista', label: 'Beneficios', max: 8, nombreItem: 'beneficio', campos: [
          { k: 'icono', tipo: 'texto', label: 'Ícono (emoji)', max: 8 },
          { k: 'texto', tipo: 'parrafo', label: 'Texto', max: 60 }
        ] }
      ]
    },
    {
      clave: 'cinta', titulo: 'Cinta de texto en movimiento', icono: '🎞️',
      descripcion: 'Palabras que se desplazan bajo la portada.',
      campos: [
        { k: 'items', tipo: 'lista', label: 'Palabras', max: 12, nombreItem: 'palabra', campos: [
          { k: 'texto', tipo: 'texto', label: 'Texto', max: 40 }
        ] }
      ]
    },
    {
      clave: 'temporada', titulo: 'Banner de temporada', icono: '🎉',
      descripcion: 'Anuncio especial sobre la colección (fiestas, fechas especiales). Enciéndelo solo cuando aplique.',
      campos: [
        { k: 'activo', tipo: 'si_no', label: 'Mostrar el banner' },
        { k: 'fecha', tipo: 'texto', label: 'Texto pequeño (fecha / motivo)', max: 80 },
        { k: 'titulo', tipo: 'texto', label: 'Título', max: 80 },
        { k: 'subtitulo', tipo: 'parrafo', label: 'Texto', max: 240 }
      ]
    },
    {
      clave: 'coleccion', titulo: 'Colección (encabezado y eventos)', icono: '🕯️',
      descripcion: 'Títulos sobre los productos y botones de eventos.',
      campos: [
        ...encabezado(),
        { k: 'descripcion', tipo: 'parrafo', label: 'Descripción', max: 300 },
        { k: 'eventos', tipo: 'lista', label: 'Botones de eventos', max: 12, nombreItem: 'evento', campos: [
          { k: 'nombre', tipo: 'texto', label: 'Nombre visible', max: 30 },
          { k: 'categoria', tipo: 'categoria', label: 'Muestra la categoría' }
        ] },
        { k: 'sin_productos', tipo: 'texto', label: 'Mensaje cuando una categoría no tiene productos', max: 120 },
        { k: 'sin_productos_sub', tipo: 'texto', label: 'Texto secundario de ese mensaje', max: 120 }
      ]
    },
    {
      clave: 'por_que', titulo: '¿Por qué elegirnos?', icono: '💎',
      campos: [
        ...encabezado(),
        { k: 'tarjetas', tipo: 'lista', label: 'Tarjetas', max: 9, nombreItem: 'tarjeta', campos: [
          { k: 'icono', tipo: 'texto', label: 'Ícono (emoji)', max: 8 },
          { k: 'titulo', tipo: 'texto', label: 'Título', max: 50 },
          { k: 'descripcion', tipo: 'parrafo', label: 'Descripción', max: 260 }
        ] }
      ]
    },
    {
      clave: 'resenas', titulo: 'Reseñas de clientas', icono: '⭐',
      campos: [
        ...encabezado(),
        { k: 'items', tipo: 'lista', label: 'Reseñas', max: 12, nombreItem: 'reseña', campos: [
          { k: 'nombre', tipo: 'texto', label: 'Nombre', max: 40 },
          { k: 'evento', tipo: 'texto', label: 'Evento · Ciudad', max: 60 },
          { k: 'estrellas', tipo: 'numero', label: 'Estrellas (1 a 5)', min: 1, max: 5, paso: 1 },
          { k: 'texto', tipo: 'parrafo', label: 'Reseña', max: 400 }
        ] }
      ]
    },
    {
      clave: 'pagos', titulo: 'Métodos de pago y envíos', icono: '💳',
      descripcion: 'Las filas de costos de envío se generan solas con los valores de "Envíos y descuento".',
      campos: [
        ...encabezado(),
        { k: 'tarjeta_titulo', tipo: 'texto', label: 'Título del recuadro de tarjetas', max: 40 },
        { k: 'tarjetas', tipo: 'lista', label: 'Tarjetas aceptadas', max: 8, nombreItem: 'tarjeta', campos: [
          { k: 'nombre', tipo: 'texto', label: 'Nombre', max: 30 }
        ] },
        { k: 'nota_pago', tipo: 'parrafo', label: 'Nota de seguridad del pago', max: 200 },
        { k: 'envio_titulo', tipo: 'texto', label: 'Título del recuadro de envíos', max: 40 },
        { k: 'nota_envio', tipo: 'parrafo', label: 'Nota de envíos', max: 200 }
      ]
    },
    {
      clave: 'cifras', titulo: 'Cifras destacadas', icono: '📈',
      campos: [
        { k: 'items', tipo: 'lista', label: 'Cifras', max: 6, nombreItem: 'cifra', campos: [
          { k: 'numero', tipo: 'texto', label: 'Número (ej. 500+)', max: 10 },
          { k: 'texto', tipo: 'texto', label: 'Texto', max: 40 }
        ] }
      ]
    },
    {
      clave: 'proceso', titulo: 'Proceso de compra', icono: '🪜',
      campos: [
        ...encabezado(),
        { k: 'pasos', tipo: 'lista', label: 'Pasos', max: 6, nombreItem: 'paso', campos: [
          { k: 'titulo', tipo: 'texto', label: 'Título', max: 30 },
          { k: 'descripcion', tipo: 'parrafo', label: 'Descripción', max: 160 }
        ] }
      ]
    },
    {
      clave: 'contacto', titulo: 'Canales de contacto', icono: '📞',
      descripcion: 'Los canales (WhatsApp, Instagram, etc.) salen de "Marca y contacto". Si dejas un dato vacío, ese canal no se muestra.',
      campos: encabezado()
    },
    {
      clave: 'politicas', titulo: 'Políticas y condiciones', icono: '📋', listaResumen: 'politicas',
      descripcion: 'Escribe **texto** entre dos asteriscos para ponerlo en negrita.',
      campos: [
        ...encabezado(),
        { k: 'intro', tipo: 'parrafo', label: 'Introducción', max: 400 },
        { k: 'pago_seccion', tipo: 'texto', label: 'Subtítulo de métodos de pago', max: 60 },
        { k: 'pago_nombre', tipo: 'texto', label: 'Método de pago', max: 40 },
        { k: 'pago_tag', tipo: 'texto', label: 'Etiqueta del método', max: 30 },
        { k: 'pago_resumen', tipo: 'parrafo', label: 'Resumen', max: 200 },
        { k: 'pago_puntos', tipo: 'lista', label: 'Puntos del método de pago', max: 8, nombreItem: 'punto', campos: [
          { k: 'texto', tipo: 'texto', label: 'Texto', max: 120 }
        ] },
        { k: 'pago_nota', tipo: 'parrafo', label: 'Nota importante', max: 300 },
        { k: 'generales_titulo', tipo: 'texto', label: 'Subtítulo de políticas generales', max: 80 },
        { k: 'politicas', tipo: 'lista', label: 'Políticas', max: 12, nombreItem: 'política', campos: [
          { k: 'titulo', tipo: 'texto', label: 'Título', max: 90 },
          { k: 'texto', tipo: 'parrafo', label: 'Texto', max: 600 },
          { k: 'resaltada', tipo: 'si_no', label: 'Resaltar en rojo' }
        ] },
        { k: 'garantias', tipo: 'lista', label: 'Garantías', max: 6, nombreItem: 'garantía', campos: [
          { k: 'icono', tipo: 'texto', label: 'Ícono (emoji)', max: 8 },
          { k: 'titulo', tipo: 'texto', label: 'Título', max: 40 },
          { k: 'texto', tipo: 'parrafo', label: 'Texto', max: 200 }
        ] }
      ]
    },
    {
      clave: 'footer', titulo: 'Pie de página y avisos', icono: '🔻',
      campos: [
        { k: 'descripcion', tipo: 'parrafo', label: 'Descripción bajo el logo', max: 200 },
        { k: 'eventos', tipo: 'lista', label: 'Enlaces de eventos', max: 10, nombreItem: 'enlace', campos: [
          { k: 'texto', tipo: 'texto', label: 'Texto', max: 30 },
          { k: 'categoria', tipo: 'categoria', label: 'Muestra la categoría' }
        ] },
        { k: 'newsletter_texto', tipo: 'texto', label: 'Texto sobre el correo de novedades', max: 60 },
        { k: 'copyright', tipo: 'texto', label: 'Texto final (copyright)', max: 80 },
        { k: 'cookies_texto', tipo: 'parrafo', label: 'Aviso de cookies', max: 300 }
      ]
    },
    {
      clave: 'chat', titulo: 'Chat asistente', icono: '💬',
      campos: [
        { k: 'nombre', tipo: 'texto', label: 'Nombre del asistente', max: 40 },
        { k: 'sugerencias', tipo: 'lista', label: 'Preguntas sugeridas', max: 6, nombreItem: 'pregunta', campos: [
          { k: 'texto', tipo: 'texto', label: 'Pregunta', max: 60 }
        ] }
      ]
    },
    {
      clave: 'envios', titulo: 'Envíos y descuento con tarjeta', icono: '🚚',
      descripcion: '⚠️ Estos valores cambian lo que se cobra en el carrito. Revisa bien antes de publicar.',
      campos: [
        { k: 'gye_costo', tipo: 'numero', label: 'Envío en Guayaquil ($)', min: 0, max: 50, paso: 0.01 },
        { k: 'gye_gratis_desde', tipo: 'numero', label: 'Guayaquil: envío gratis desde (docenas)', min: 1, max: 50, paso: 1 },
        { k: 'prov_costo', tipo: 'numero', label: 'Envío a provincias ($)', min: 0, max: 50, paso: 0.01 },
        { k: 'prov_gratis_desde', tipo: 'numero', label: 'Provincias: envío gratis desde (docenas)', min: 1, max: 50, paso: 1 },
        { k: 'descuento_tarjeta', tipo: 'numero', label: 'Descuento por pagar con tarjeta (%)', min: 0, max: 50, paso: 1 }
      ]
    }
  ];

  const ENLACE_OK = /^(#[\w-]*|https:\/\/[^\s"'<>]+|mailto:[^\s"'<>]+|tel:[+\d]+)$/i;
  const IMAGEN_OK = /^https:\/\/[^\s"'<>]+$/i;
  const CAT_OK = new Set(CATEGORIAS.map(c => c[0]));

  // Devuelve { valor } o { error } para un valor según su campo.
  function limpiarCampo(campo, v, ruta) {
    const nombre = ruta || campo.label;
    switch (campo.tipo) {
      case 'texto':
      case 'parrafo': {
        const s = String(v ?? '').replace(/\r\n/g, '\n');
        const t = campo.tipo === 'texto' ? s.replace(/\n/g, ' ').trim() : s.trim();
        const max = campo.max || 200;
        if (t.length > max) return { error: `"${nombre}" supera ${max} caracteres` };
        if (t && campo.patron && !new RegExp(campo.patron).test(t)) return { error: `"${nombre}" no tiene un formato válido` };
        return { valor: t };
      }
      case 'imagen': {
        const t = String(v ?? '').trim();
        if (t && !IMAGEN_OK.test(t)) return { error: `"${nombre}" debe ser una foto subida (https://…)` };
        return { valor: t };
      }
      case 'enlace': {
        const t = String(v ?? '').trim();
        if (t && !ENLACE_OK.test(t)) return { error: `"${nombre}" debe empezar con #, https://, mailto: o tel:` };
        return { valor: t };
      }
      case 'si_no':
        return { valor: v === true };
      case 'numero': {
        const n = Number(v);
        if (v === '' || v === null || v === undefined || !Number.isFinite(n)) return { error: `"${nombre}" debe ser un número` };
        if (n < campo.min || n > campo.max) return { error: `"${nombre}" debe estar entre ${campo.min} y ${campo.max}` };
        if (campo.paso === 1 && !Number.isInteger(n)) return { error: `"${nombre}" debe ser un número entero` };
        return { valor: Math.round(n * 100) / 100 };
      }
      case 'categoria': {
        const t = String(v ?? '');
        if (!CAT_OK.has(t)) return { error: `"${nombre}": categoría no válida` };
        return { valor: t };
      }
      case 'lista': {
        const arr = Array.isArray(v) ? v : [];
        if (arr.length > campo.max) return { error: `"${nombre}" admite máximo ${campo.max}` };
        if (campo.min && arr.length < campo.min) return { error: `"${nombre}" necesita al menos ${campo.min}` };
        const out = [];
        for (let i = 0; i < arr.length; i++) {
          const r = limpiarObjeto(campo.campos, arr[i] || {}, `${campo.nombreItem || 'elemento'} ${i + 1}`);
          if (r.error) return r;
          out.push(r.valor);
        }
        return { valor: out };
      }
      default:
        return { error: `Campo desconocido: ${nombre}` };
    }
  }

  function limpiarObjeto(campos, obj, prefijo) {
    const out = {};
    for (const c of campos) {
      const r = limpiarCampo(c, obj[c.k], prefijo ? `${prefijo}: ${c.label}` : c.label);
      if (r.error) return r;
      out[c.k] = r.valor;
    }
    return { valor: out };
  }

  function limpiarSeccion(clave, datos) {
    const sec = SECCIONES.find(s => s.clave === clave);
    if (!sec) return { error: 'Sección desconocida' };
    return limpiarObjeto(sec.campos, datos || {});
  }

  const api = { SECCIONES, CATEGORIAS, limpiarSeccion };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SITIO_SCHEMA = api;
})(typeof window !== 'undefined' ? window : globalThis);
