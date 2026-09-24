// Contenido actual de velamia.shop (public/index.html, 2026-09-23). Es el punto de partida del panel.
const WEB = 'https://velamia.shop/images/';

module.exports = {
  marca: {
    nombre: 'Velamia',
    logo: WEB + 'brand1.webp',
    whatsapp: '593995448686',
    whatsapp_visible: '+593 99 544 8686',
    whatsapp_mensaje: 'Hola! Quiero hacer un pedido de velas Velamia 🕯️',
    instagram_usuario: '@velamia.ec',
    instagram_url: 'https://instagram.com/velamia.ec',
    facebook_nombre: 'Velamia',
    facebook_url: 'https://www.facebook.com/share/1CjFqX6MLv/?mibextid=wwXIfr',
    tiktok_usuario: '@velamia.ec',
    tiktok_url: 'https://www.tiktok.com/@velamia.ec',
    correo: 'contacto@velamia.shop',
    ciudad: 'Guayaquil',
    pais: 'Ecuador',
    maps_url: 'https://maps.google.com/?q=Guayaquil+Ecuador'
  },
  menu: {
    enlaces: [
      { texto: 'Colección', destino: '#productos' },
      { texto: 'Pagos', destino: '#pagos' },
      { texto: 'Proceso', destino: '#proceso' },
      { texto: 'Políticas', destino: '#politicas' },
      { texto: 'Contacto', destino: '#contacto' }
    ],
    boton_texto: 'Hacer pedido'
  },
  portada: {
    slides: [{
      imagen: WEB + 'brand2.webp',
      etiqueta: 'Velas artesanales · Guayaquil, Ecuador',
      titulo: 'Velas personalizadas para',
      destacado: 'momentos inolvidables',
      subtitulo: 'Detalles que iluminan tus mejores recuerdos.',
      boton1_texto: 'Ver diseños',
      boton1_enlace: '#productos',
      boton2_texto: 'Crear mi pedido',
      mostrar_pagos: true,
      texto_pagos: '💳 Aceptamos tarjetas'
    }]
  },
  beneficios: {
    items: [
      { icono: '🤍', texto: 'Hechas a mano\ncon amor' },
      { icono: '✍️', texto: 'Personalización\nincluida' },
      { icono: '🎁', texto: 'Empaque\nindividual' },
      { icono: '🚚', texto: 'Envíos a todo\nEcuador' }
    ]
  },
  cinta: {
    items: ['Velas artesanales', 'Baby shower', 'Bautizos', 'Bodas', 'Cumpleaños', 'XV años', 'Pedidos bajo reserva'].map(texto => ({ texto }))
  },
  temporada: {
    activo: false,
    fecha: '25 de Julio · Fundación de Guayaquil',
    titulo: '¡Felices Fiestas Julianas! 🎉',
    subtitulo: 'Desde Guayaquil celebramos a nuestra ciudad con velas hechas con amor para tus momentos más especiales. 🕯️'
  },
  coleccion: {
    etiqueta: 'Nuestra colección',
    titulo: 'Diseños para cada',
    destacado: 'momento especial',
    descripcion: 'Elige un diseño, revisa el precio por cantidad y personalízalo con tu nombre, colores y detalles del evento.',
    eventos: [
      { nombre: 'Baby Shower', categoria: 'baby-shower' },
      { nombre: 'Revelación de Sexo', categoria: 'revelacion' },
      { nombre: 'Bautizos', categoria: 'bautizo' },
      { nombre: 'XV Años', categoria: 'xv-anos' },
      { nombre: 'Matrimonio', categoria: 'matrimonio' },
      { nombre: 'Cumpleaños', categoria: 'cumpleanos' },
      { nombre: 'Personajes Animados', categoria: 'personajes' },
      { nombre: 'Día de la Madre', categoria: 'dia-madre' }
    ],
    sin_productos: '🕯️ Próximamente más diseños en esta categoría',
    sin_productos_sub: 'Escríbenos por WhatsApp para pedidos personalizados'
  },
  por_que: {
    etiqueta: '¿Por qué elegirnos?',
    titulo: 'Calidad que se',
    destacado: 've y se siente',
    tarjetas: [
      { icono: '🤲', titulo: '100% Hecho a Mano', descripcion: 'Cada vela es elaborada artesanalmente con atención al detalle. No somos producción en serie, somos arte.' },
      { icono: '✏️', titulo: 'Totalmente Personalizable', descripcion: 'Nombres, colores, diseños y empaques a tu medida. Tu evento es único y tus velas también lo serán.' },
      { icono: '⚡', titulo: 'Entrega Rápida', descripcion: 'Entregamos en 48 horas en Guayaquil. Para pedidos grandes coordinamos con anticipación para cumplir tu fecha.' },
      { icono: '💎', titulo: 'Materiales Premium', descripcion: 'Usamos cera de alta calidad, pigmentos seguros y empaques elegantes que complementan cada diseño.' },
      { icono: '🎁', titulo: 'Empaque Incluido', descripcion: 'Todos nuestros diseños incluyen empaque y nombre personalizado sin costo adicional. Listo para regalar.' },
      { icono: '🚚', titulo: 'Envío a Todo Ecuador', descripcion: 'Enviamos a Guayaquil y a todas las provincias. Envío gratis desde 2 docenas en Guayaquil y 3 en provincia.' }
    ]
  },
  resenas: {
    etiqueta: 'Lo que dicen nuestras clientas',
    titulo: 'Amor que se',
    destacado: 'comparte',
    items: [
      { nombre: 'Sofía Zambrano', evento: 'Bautizo · Quito', estrellas: 5, texto: 'Hice el pedido desde Quito y llegó perfectamente empacado. Las velitas del bautizo de mi niña quedaron preciosas, todos los invitados me pidieron el contacto. ¡100% recomendada!' },
      { nombre: 'Daniela Ríos', evento: 'Baby Shower · Cuenca', estrellas: 5, texto: 'Viví nerviosa por pedir a distancia pero fue todo un éxito. Las velas del baby shower llegaron a Cuenca intactas, en sus cajitas, tal cual las vi en Instagram. Hermosas de verdad.' },
      { nombre: 'Karina Salazar', evento: 'Revelación de Sexo · Ambato', estrellas: 5, texto: 'Me encantó la atención desde el primer mensaje. Pedí las velas para la revelación de sexo de mi bebé y superaron todo lo que imaginé. Mis amigas en Ambato quedaron enamoradas.' },
      { nombre: 'Gabriela Moreira', evento: 'Matrimonio · Manta', estrellas: 5, texto: 'Pedí los recuerditos de matrimonio desde Manta y el envío fue rapidísimo. La personalización quedó exactamente como la pedí. Todos mis invitados se fueron encantados con el detallito.' },
      { nombre: 'Michelle Ojeda', evento: 'Baby Shower · Loja', estrellas: 5, texto: 'Le regalé a mi hermana la vela de mamá embarazada para su baby shower en Loja y lloró de emoción al abrirla. La calidad es impresionante, parece hecha por artistas. Vale cada centavo.' },
      { nombre: 'Paola Narváez', evento: 'Bautizo · Ibarra', estrellas: 5, texto: 'Ya van tres pedidos desde Ibarra y siempre quedan espectaculares. La atención es súper personalizada, te asesoran en todo. No existe otro lugar donde se consiga esta calidad en Ecuador.' }
    ]
  },
  pagos: {
    etiqueta: 'Métodos de pago',
    titulo: 'Paga de forma',
    destacado: 'fácil y segura',
    tarjeta_titulo: 'Pago con Tarjeta',
    tarjetas: ['Visa', 'Mastercard', 'Diners Club', 'American Express'].map(nombre => ({ nombre })),
    nota_pago: '🔒 Pago 100% seguro procesado por Nuvei. Tus datos de tarjeta nunca son almacenados por Velamia.',
    envio_titulo: 'Política de Envíos',
    nota_envio: '📦 El costo de envío se calcula automáticamente en tu carrito según tu ubicación y cantidad.'
  },
  cifras: {
    items: [
      { numero: '500+', texto: 'Pedidos realizados' },
      { numero: '100%', texto: 'Hecho a mano' },
      { numero: '10+', texto: 'Diseños disponibles' },
      { numero: '48h', texto: 'Tiempo de entrega' }
    ]
  },
  proceso: {
    etiqueta: '¿Cómo funciona?',
    titulo: 'Tu pedido en',
    destacado: '4 pasos',
    pasos: [
      { titulo: 'Elige', descripcion: 'Escoge tu diseño favorito y agrégalo al carrito.' },
      { titulo: 'Personaliza', descripcion: 'Indica la cantidad de docenas y tu ubicación.' },
      { titulo: 'Paga', descripcion: 'Paga de forma segura con tu tarjeta de crédito o débito.' },
      { titulo: 'Recibe', descripcion: 'Te contactamos y entregamos tu pedido. 🕯️' }
    ]
  },
  contacto: {
    etiqueta: 'CONECTA CON NOSOTROS',
    titulo: 'Canales de',
    destacado: 'Comunicación'
  },
  politicas: {
    etiqueta: 'Importante',
    titulo: 'Políticas y',
    destacado: 'Condiciones',
    intro: 'Para garantizar un servicio de calidad y cumplir con todos nuestros clientes, te pedimos leer y aceptar nuestras políticas antes de realizar tu pedido. Al confirmar tu compra aceptas estos términos.',
    pago_seccion: '💳 Métodos de pago disponibles',
    pago_nombre: 'Pago con Tarjeta',
    pago_tag: 'Via Nuvei',
    pago_resumen: '**Pago del 100%** al momento del pedido.',
    pago_puntos: [
      '✓ Confirmación instantánea del pedido',
      '✓ Acepta tarjetas de crédito y débito',
      '✓ Posibilidad de diferir el pago (según tu banco)',
      '✓ Pago seguro 100% encriptado'
    ].map(texto => ({ texto })),
    pago_nota: '**Importante:** Una vez procesado el pago con tarjeta NO se acepta devolución de dinero bajo ninguna circunstancia.',
    generales_titulo: '📋 Políticas Generales (aplican a ambos métodos de pago)',
    politicas: [
      { titulo: 'Confirmación del pedido', resaltada: false, texto: 'El pedido se considera confirmado únicamente cuando se recibe el pago al 100% con tarjeta. Sin pago, el pedido no entra en producción ni se reserva fecha.' },
      { titulo: '🚫 No se acepta devolución de dinero', resaltada: true, texto: '**Una vez confirmado el pedido y recibido el pago (parcial o total), NO se acepta devolución de dinero bajo ninguna circunstancia**, debido a la naturaleza personalizada y artesanal de nuestros productos.' },
      { titulo: 'Reserva de fecha — Compromiso del cliente', resaltada: false, texto: 'Velamia agenda los pedidos por fecha. Una vez pactada la fecha de entrega, esta no puede modificarse y queda reservada exclusivamente para ese pedido.' },
      { titulo: 'Confirmación de diseño y personalización', resaltada: false, texto: 'El nombre y los detalles de personalización deben confirmarse por escrito antes de iniciar producción. No se aceptan cambios una vez comenzada la elaboración.' },
      { titulo: 'Productos personalizados — Sin devolución de productos', resaltada: false, texto: 'Por ser productos personalizados y hechos a mano, no admiten devolución ni cambio, salvo defecto de fábrica comprobable. Cualquier defecto debe reportarse dentro de las 24 horas de recibido el pedido, acompañado de fotografías.' }
    ],
    garantias: [
      { icono: '🤝', titulo: 'Garantía de calidad', texto: 'Todos nuestros productos son revisados antes del envío. Si llega con defecto de fábrica, te lo reponemos sin costo.' },
      { icono: '💬', titulo: 'Atención directa', texto: 'Cualquier duda la resolvemos por WhatsApp. Nuestro compromiso es tu satisfacción total.' },
      { icono: '📸', titulo: 'Fotos de avance', texto: 'Te enviamos fotos del progreso de tu pedido para que tengas total tranquilidad.' }
    ]
  },
  footer: {
    descripcion: 'Velas artesanales hechas con amor para iluminar tus momentos más especiales. Guayaquil, Ecuador.',
    eventos: [
      { texto: 'Baby shower', categoria: 'baby-shower' },
      { texto: 'Bautizos', categoria: 'bautizo' },
      { texto: 'Bodas', categoria: 'matrimonio' },
      { texto: 'Cumpleaños', categoria: 'cumpleanos' },
      { texto: 'Revelación de sexo', categoria: 'revelacion' },
      { texto: 'XV años', categoria: 'xv-anos' }
    ],
    newsletter_texto: 'Recibe novedades y promociones',
    copyright: '© 2026 Velamia · Inspira, Crea e Ilumina',
    cookies_texto: '🍪 Usamos cookies y Meta Pixel para mejorar tu experiencia y mostrarte publicidad relevante. Al continuar navegando aceptas nuestra política de privacidad.'
  },
  chat: {
    nombre: 'Velamia · Asistente',
    sugerencias: ['¿Qué diseños tienen?', '¿Cuánto cuesta la docena?', '¿Hacen envíos?', '¿Cómo hago un pedido?'].map(texto => ({ texto }))
  },
  envios: {
    gye_costo: 3,
    gye_gratis_desde: 2,
    prov_costo: 5,
    prov_gratis_desde: 3,
    descuento_tarjeta: 10
  }
};
