export const languages = {
  es: 'Español',
  en: 'English',
} as const;

export const defaultLang = 'es';

export const ui = {
  es: {
    // Navbar
    'nav.home': 'Inicio',
    'nav.services': 'Servicios',
    'nav.sizes': 'Tamaños',
    'nav.locations': 'Sucursales',
    'nav.recommendations': 'Recomendaciones',
    'nav.blog': 'Blog',
    'nav.quote': 'Cotización',
    'nav.menu': 'Abrir menú',
    
    // Hero
    'hero.title.line1': 'Alquila un Minidepósito',
    'hero.title.line2': 'y recibe',
    'hero.title.highlight': '1 MES GRATIS',
    'hero.subtitle.line1': '¡Reserva tu espacio hoy y guarda tus',
    'hero.subtitle.line2': 'cosas sin costo inicial!',
    'hero.cta': 'Obtén tu cotización',
    
    // Quote Section
    'quote.title': '¿Buscas alquiler de mini depósitos en Panamá?',
    
    // Services
    'services.storage.title': 'Soluciones de almacenajes',
    'services.storage.highlight': 'rápido y confiable',
    'services.storage.description': 'Almacenajes Minidepósitos: 40 años de experiencia en Panamá. Acceso directo a bodegas desde tu auto, seguridad 24/7 y flexibilidad a precios amigables.',
    'services.storage.tagline': 'Tu tranquilidad es nuestra prioridad.',
    'services.benefits.title': 'Beneficios exclusivos',
    'services.benefits.subtitle': 'para tu comodidad',
    'services.benefit1.line1': 'Sin amarres a',
    'services.benefit1.line2': 'largos contratos',
    'services.benefit2.line1': 'Acceso con',
    'services.benefit2.line2': 'tu auto',
    'services.benefit3.line1': 'Acceso a tu deposito',
    'services.benefit3.line2': '365 días',
    'services.benefit4.line1': 'Múltiples',
    'services.benefit4.line2': 'tamaños',
    'services.benefit5.line1': 'Montacarga',
    'services.benefit5.line2': 'gratuita',
    'services.benefit6.line1': 'Carretilla',
    'services.benefit6.line2': 'gratuita',
    'services.benefit7.line1': 'Acceso diario a tu',
    'services.benefit7.line2': 'depósito',
    'services.benefit8.line1': 'Pagos seguros',
    'services.benefit8.line2': 'online',
    'services.howworks.title': '¿Cómo funciona?',
    'services.step1.title': 'Paso 1',
    'services.step1.description': 'Selecciona el tamaño de mini depósito que necesitas',
    'services.step2.title': 'Paso 2',
    'services.step2.description': 'Agenda tu cita y reserva tu mini depósito GRATIS',
    'services.step3.title': 'Paso 3',
    'services.step3.description': 'Guarda tus cosas con un costo mínimo',
    'services.step4.title': 'Paso 4',
    'services.step4.description': 'Accede a tus pertenencias cuando quieras',
    
    // Sizes
    'sizes.title': 'Tamaños de Mini Depósitos',
    'sizes.description': 'Contamos con mini depósitos que se adaptan a tus necesidades. Ya sea que necesites almacenar algunos muebles, electrodomésticos, cajas o incluso el contenido completo de tu hogar u oficina, tenemos el espacio ideal para ti.',
    'sizes.cta': 'Obtén tu cotización',
    
    // Locations
    'locations.title': 'Nuestras Sucursales',
    'locations.description': 'Encuentra la sucursal más cercana a ti y visítanos para conocer nuestros mini depósitos',
    'locations.select': 'Selecciona una sucursal',
    
    // Recommendations
    'recommendations.title.line1': 'Recomendaciones de',
    'recommendations.title.highlight': 'almacenamiento seguro',
    'recommendations.title.line2': 'y eficiente',
    
    // Accordion 1
    'recommendations.accordion1.title': 'Evaluar la necesidad de tener espacio en casa',
    'recommendations.accordion1.content': 'Observa si hay áreas de tu casa aglomeradas con objetos que no usas con frecuencia. Puedes liberar espacio en tu hogar alquilando un depósito o locker a la medida, sin tener que deshacerte de tus pertenencias.',
    
    // Accordion 2
    'recommendations.accordion2.title': 'Organizar artículos por categorías',
    'recommendations.accordion2.content': 'El volumen de tus artículos determina el tamaño del depósito que necesitas. Puedes encontrar opciones tipo locker para guardar objetos pequeños como documentos, maletas de viaje y equipo deportivo, o mini bodegas para guardar artículos más grandes como muebles.',
    
    // Accordion 3
    'recommendations.accordion3.title': 'Empacar y etiquetar correctamente',
    'recommendations.accordion3.content': 'Asegúrate de que las cajas, cintas y demás materiales de embalaje estén en condiciones óptimas. Limpia y protege los artículos delicados utilizando plástico de burbujas, papel arrugado o mantas protectoras.',
    'recommendations.accordion3.tip1': 'Llena las cajas completamente para evitar aplastamientos.',
    'recommendations.accordion3.tip2': 'Usa papel arrugado o plástico de burbujas para rellenar espacios vacíos.',
    'recommendations.accordion3.tip3': 'Espolvorea bicarbonato de sodio para liberarlo de olores.',
    
    // Accordion 4
    'recommendations.accordion4.title': 'Proteger artículos frágiles',
    'recommendations.accordion4.tip1': 'Planifica tu mudanza con tiempo para minimizar daños, puedes contar con nuestro servicio de mudanza para el transporte seguro.',
    'recommendations.accordion4.tip2': 'Te brindamos asistencia en la descarga, uso gratuito de montacargas y carretillas.',
    'recommendations.accordion4.tip3': 'Tu vehículo puede ingresar hasta la puerta de tu depósito, bodega o locker.',
    
    // Accordion 5
    'recommendations.accordion5.title': 'Maximizar el espacio de almacenamiento',
    'recommendations.accordion5.tip1': 'Llena las cajas completamente para evitar que se colapsen.',
    'recommendations.accordion5.tip2': 'Haz una lista del contenido y etiqueta cada caja.',
    'recommendations.accordion5.tip3': 'Coloca cajas pesadas abajo y las livianas arriba.',
    
    // Accordion 6
    'recommendations.accordion6.title': 'Proteger contra la humedad y polvo',
    
    // Accordion 7
    'recommendations.accordion7.title': 'Consejos específicos para diferentes artículos',
    
    // Sub-accordion 1 - Colchones
    'recommendations.sub1.title': 'Almacenamiento seguro para colchones',
    'recommendations.sub1.tip1': 'Aspira y limpia tu colchón antes de guardarlo.',
    'recommendations.sub1.tip2': 'Usa una funda plástica resistente para protegerlo.',
    'recommendations.sub1.tip3': 'Almacena el colchón horizontalmente para evitar deformaciones.',
    'recommendations.sub1.tip4': 'Espolvorea bicarbonato de sodio para liberarlo de olores.',
    
    // Sub-accordion 2 - Refrigeradores
    'recommendations.sub2.title': 'Almacenamiento seguro para refrigeradores',
    'recommendations.sub2.tip1': 'Desconecta, descongela y limpia completamente el refrigerador.',
    'recommendations.sub2.tip2': 'Deja las puertas ligeramente abiertas para prevenir olores.',
    'recommendations.sub2.tip3': 'Asegúrate de que esté completamente seco para evitar moho.',
    'recommendations.sub2.tip4': 'Guárdalo en posición vertical.',
    
    // Sub-accordion 3 - Televisores
    'recommendations.sub3.title': 'Almacenamiento de televisores de pantalla plana',
    'recommendations.sub3.tip1': 'Protege la pantalla con material de embalaje protector.',
    'recommendations.sub3.tip2': 'Guarda el TV en su caja original si es posible.',
    'recommendations.sub3.tip3': 'Almacena en posición vertical para evitar daños a la pantalla.',
    'recommendations.sub3.tip4': 'Marca la caja con "Frágil" y "Manténgase vertical" en ambas caras de la caja.',
    
    // Sub-accordion 4 - Objetos de valor
    'recommendations.sub4.title': 'Guardar objetos de valor afectivo',
    'recommendations.sub4.tip1': 'Toma fotografías de recuerdo antes de almacenarlos.',
    'recommendations.sub4.tip2': 'Usa cajas transparentes para identificar fácilmente el contenido.',
    'recommendations.sub4.tip3': 'Aplica papel desecante en las cajas para prevenir la humedad.',
    
    // Additional missing content
    'recommendations.accordion3.alt_title': 'Elegir el tamaño adecuado del minidepósito',
    'recommendations.accordion6.content': 'Protege tus pertenencias de la humedad usando deshumidificadores o bolsas de sílica gel. Cubre los muebles con fundas protectoras y evita colocar objetos directamente en el suelo.',
    'recommendations.accordion6.tip1': 'Usa deshumidificadores en espacios cerrados.',
    'recommendations.accordion6.tip2': 'Coloca bolsas de sílica gel en cajas selladas.',
    'recommendations.accordion6.tip3': 'Cubre muebles con fundas transpirables.',
    'recommendations.vehicle_access': 'Tu vehículo puede ingresar hasta la puerta de tu depósito, bodega o locker.',
    
    // Accordion 6 additional tips
    'recommendations.accordion6.storage_tip1': 'Coloca bienes de muy poco uso al fondo.',
    'recommendations.accordion6.storage_tip2': 'Mantén bienes de uso regular al frente.',
    'recommendations.accordion6.storage_tip3': 'Usa cobertores de plástico y bolsas desecantes para proteger tus bienes.',
    'recommendations.accordion6.storage_tip4': 'Apila cajas hasta el techo para maximizar el espacio.',
    'recommendations.accordion6.storage_tip5': 'Coloca las etiquetas visibles para fácil identificación.',
    'recommendations.accordion6.storage_tip6': 'Deja espacio entre las paredes y las cajas para la circulación de aire.',
    'recommendations.accordion6.storage_tip7': 'Almacena artículos frágiles en la parte trasera y pesados abajo.',
    'recommendations.accordion6.storage_tip8': 'Mantén artículos de acceso frecuente cerca del frente.',
    
    
    // Footer
    'footer.company': 'Almacenajes Mini Depósitos',
    'footer.description': 'Tu solución confiable de almacenamiento en Panamá',
    'footer.services.title': 'Servicios',
    'footer.contact.title': 'Contacto',
    'footer.follow.title': 'Síguenos',
    'footer.rights': 'Todos los derechos reservados',
    'footer.title': 'Visítanos y obtén tu minidepósito',
    'footer.access.title': 'Horario de acceso a depósito',
    'footer.access.days': 'Lunes a domingo',
    'footer.access.hours': '6:00 a.m a 6:00 p.m',
    'footer.access.cta': 'Pregunta por nuestros horarios\nextendidos',
    'footer.office.title': 'Horario de oficinas',
    'footer.office.weekdays': 'Lunes a Viernes',
    'footer.office.weekhours': '8:00 a.m a 5:00 p.m',
    'footer.office.saturday': 'Sábado',
    'footer.office.sathours': '8:00 a.m a 12:00 p.m',
    'footer.social': 'Síguenos en nuestras redes sociales',
    'footer.copyright': 'Todos los derechos reservados Almacenajes, S.A.',
    
    // Common
    'common.loading': 'Cargando...',
    'common.error': 'Ha ocurrido un error',
    'common.contact': 'Contacto',
    'common.phone': 'Teléfono',
    'common.email': 'Email',
    'common.address': 'Dirección',
    'common.more': 'Ver más',
    
    // 404 Page
    'error.404.title': 'Página no encontrada',
    'error.404.subtitle': 'Lo sentimos, la página que buscas no existe.',
    'error.404.description': 'Es posible que la página haya sido movida, eliminada o que hayas ingresado una URL incorrecta.',
    'error.404.home': 'Volver al inicio',
    'error.404.blog': 'Ir al blog',
    'error.404.contact': 'Contactanos',
  },
  en: {
    // Navbar - US Native SEO optimized
    'nav.home': 'Home',
    'nav.services': 'Self Storage',
    'nav.sizes': 'Unit Sizes',
    'nav.locations': 'Locations',
    'nav.recommendations': 'Storage Tips',
    'nav.blog': 'Blog',
    'nav.quote': 'Get Quote',
    'nav.menu': 'Menu',
    
    // Hero - US Market focused (length matched to Spanish)
    'hero.title.line1': 'Rent a Storage Unit',
    'hero.title.line2': 'and get',
    'hero.title.highlight': '1 FREE MONTH',
    'hero.subtitle.line1': 'Reserve your space today and store',
    'hero.subtitle.line2': 'your belongings at no upfront cost!',
    'hero.cta': 'Get Your Quote',
    
    // Quote Section - Professional US tone
    'quote.title': 'Need secure storage units or warehouse space in Panamá?',
    
    // Services - US Professional tone
    'services.storage.title': 'Premium Self Storage',
    'services.storage.highlight': 'secure & convenient',
    'services.storage.description': 'Almacenajes Minidepósitos: 40+ years serving Panamá. Drive-through access, advanced security systems, and flexible terms at competitive rates.',
    'services.storage.tagline': 'Your belongings deserve the best protection.',
    'services.benefits.title': 'Why Choose Us',
    'services.benefits.subtitle': 'premium features included',
    'services.benefit1.line1': 'Flexible',
    'services.benefit1.line2': 'lease terms',
    'services.benefit2.line1': 'Drive-up',
    'services.benefit2.line2': 'access',
    'services.benefit3.line1': 'Access to your unit',
    'services.benefit3.line2': '365 days',
    'services.benefit4.line1': 'Multiple',
    'services.benefit4.line2': 'sizes',
    'services.benefit5.line1': 'Free',
    'services.benefit5.line2': 'forklift',
    'services.benefit6.line1': 'Free',
    'services.benefit6.line2': 'cart',
    'services.benefit7.line1': 'Daily access to',
    'services.benefit7.line2': 'your unit',
    'services.benefit8.line1': 'Secure online',
    'services.benefit8.line2': 'payments',
    'services.howworks.title': 'How It Works',
    'services.step1.title': 'Step 1',
    'services.step1.description': 'Select the storage unit size you need',
    'services.step2.title': 'Step 2',
    'services.step2.description': 'Schedule your appointment and reserve your unit FREE',
    'services.step3.title': 'Step 3',
    'services.step3.description': 'Store your belongings at minimal cost',
    'services.step4.title': 'Step 4',
    'services.step4.description': 'Access your belongings whenever you want',
    
    // Sizes - US Market terminology
    'sizes.title': 'Self Storage Unit Sizes',
    'sizes.description': 'Choose from a variety of storage unit sizes to fit your needs. From small lockers for documents and seasonal items to large units for entire households or business inventory - we have the perfect space.',
    'sizes.cta': 'Get Free Quote',
    
    // Locations - Geographic SEO focus
    'locations.title': 'Storage Facility Locations',
    'locations.description': 'Convenient self storage locations throughout Panamá City. Visit our secure facilities to see our storage units firsthand.',
    'locations.select': 'Choose location',
    
    // Recommendations - Expert storage authority content
    'recommendations.title.line1': 'Professional storage',
    'recommendations.title.highlight': 'tips & best practices',
    'recommendations.title.line2': 'from experts',
    
    // Accordion 1 - Home decluttering expertise
    'recommendations.accordion1.title': 'Evaluate your home storage needs',
    'recommendations.accordion1.content': 'Identify cluttered areas in your home filled with items you rarely use. A self storage unit can free up valuable living space while keeping your belongings safe and accessible.',
    
    // Accordion 2 - Professional categorization
    'recommendations.accordion2.title': 'Categorize items by storage requirements',
    'recommendations.accordion2.content': 'The volume and type of items determine your ideal storage unit size. Choose small units for documents, seasonal items, and sports equipment, or larger units for furniture, appliances, and household goods.',
    
    // Accordion 3 - Professional packing standards
    'recommendations.accordion3.title': 'Use professional packing techniques',
    'recommendations.accordion3.content': 'Ensure all boxes, tape, and packing materials are high-quality and in excellent condition. Protect fragile items with bubble wrap, packing paper, or moving blankets.',
    'recommendations.accordion3.tip1': 'Fill boxes completely to prevent crushing.',
    'recommendations.accordion3.tip2': 'Use crumpled paper or bubble wrap to fill empty spaces.',
    'recommendations.accordion3.tip3': 'Sprinkle baking soda to eliminate odors.',
    'recommendations.accordion3.alt_title': 'Choose the right storage unit size',
    
    // Accordion 4
    'recommendations.accordion4.title': 'Protect fragile items',
    'recommendations.accordion4.tip1': 'Plan your move ahead of time to minimize damage - you can count on our moving service for safe transport.',
    'recommendations.accordion4.tip2': 'We provide unloading assistance and free use of dollies and hand trucks.',
    'recommendations.accordion4.tip3': 'Your vehicle can drive right up to your storage unit, warehouse, or locker door.',
    
    // Accordion 5
    'recommendations.accordion5.title': 'Maximize storage space',
    'recommendations.accordion5.tip1': 'Fill boxes completely to prevent them from collapsing.',
    'recommendations.accordion5.tip2': 'Make a content list and label each box.',
    'recommendations.accordion5.tip3': 'Place heavy boxes on the bottom and light ones on top.',
    
    // Accordion 6
    'recommendations.accordion6.title': 'Protect against moisture and dust',
    'recommendations.accordion6.content': 'Protect your belongings from moisture using dehumidifiers or silica gel bags. Cover furniture with protective covers and avoid placing items directly on the floor.',
    'recommendations.accordion6.tip1': 'Use dehumidifiers in enclosed spaces.',
    'recommendations.accordion6.tip2': 'Place silica gel bags in sealed boxes.',
    'recommendations.accordion6.tip3': 'Cover furniture with breathable covers.',
    'recommendations.accordion6.storage_tip1': 'Place rarely used items in the back.',
    'recommendations.accordion6.storage_tip2': 'Keep regularly used items in front.',
    'recommendations.accordion6.storage_tip3': 'Use plastic covers and desiccant bags to protect your belongings.',
    'recommendations.accordion6.storage_tip4': 'Stack boxes up to the ceiling to maximize space.',
    'recommendations.accordion6.storage_tip5': 'Place labels where they\'re visible for easy identification.',
    'recommendations.accordion6.storage_tip6': 'Leave space between walls and boxes for air circulation.',
    'recommendations.accordion6.storage_tip7': 'Store fragile items in the back and heavy items on the bottom.',
    'recommendations.accordion6.storage_tip8': 'Keep frequently accessed items near the front.',
    
    // Accordion 7
    'recommendations.accordion7.title': 'Specific tips for different items',
    
    // Sub-accordion 1 - Mattress storage expertise
    'recommendations.sub1.title': 'Safety storage for mattresses',
    'recommendations.sub1.tip1': 'Vacuum and sanitize your mattress thoroughly before storage.',
    'recommendations.sub1.tip2': 'Use a high-quality mattress storage bag for protection.',
    'recommendations.sub1.tip3': 'Store mattresses flat to maintain their shape and support.',
    'recommendations.sub1.tip4': 'Add baking soda sachets to prevent odors and moisture.',
    
    // Sub-accordion 2 - Appliance storage best practices
    'recommendations.sub2.title': 'Refrigerator storage guidelines',
    'recommendations.sub2.tip1': 'Unplug, defrost completely, and deep clean all surfaces.',
    'recommendations.sub2.tip2': 'Prop doors open slightly to maintain air circulation.',
    'recommendations.sub2.tip3': 'Ensure the unit is completely dry to prevent mold growth.',
    'recommendations.sub2.tip4': 'Always store refrigerators in an upright position.',
    
    // Sub-accordion 3 - Electronics protection
    'recommendations.sub3.title': 'TV and electronics storage',
    'recommendations.sub3.tip1': 'Wrap screens with specialized protective padding.',
    'recommendations.sub3.tip2': 'Use original packaging when available for best protection.',
    'recommendations.sub3.tip3': 'Store flat-screen TVs upright to prevent screen damage.',
    'recommendations.sub3.tip4': 'Label boxes clearly with "FRAGILE" and "THIS SIDE UP" markings.',
    
    // Sub-accordion 4 - Valuable items security
    'recommendations.sub4.title': 'Storing valuable and sentimental items',
    'recommendations.sub4.tip1': 'Document items with photos for insurance purposes.',
    'recommendations.sub4.tip2': 'Use transparent storage containers for easy identification.',
    'recommendations.sub4.tip3': 'Include moisture-absorbing packets in sealed containers.',
    
    // Additional professional features
    'recommendations.vehicle_access': 'Drive-up access available - bring your vehicle directly to your storage unit door.',
    
    // Footer - US Market optimized
    'footer.company': 'Almacenajes Self Storage',
    'footer.description': 'Your trusted storage solution in Panama',
    'footer.services.title': 'Services',
    'footer.contact.title': 'Contact',
    'footer.follow.title': 'Follow Us',
    'footer.rights': 'All rights reserved',
    'footer.title': 'Visit us and get your storage unit',
    'footer.access.title': 'Storage unit access hours',
    'footer.access.days': 'Monday through Sunday',
    'footer.access.hours': '6:00 AM to 6:00 PM',
    'footer.access.cta': 'Ask about our extended\nhours availability',
    'footer.office.title': 'Office hours',
    'footer.office.weekdays': 'Monday to Friday',
    'footer.office.weekhours': '8:00 AM to 5:00 PM',
    'footer.office.saturday': 'Saturday',
    'footer.office.sathours': '8:00 AM to 12:00 PM',
    'footer.social': 'Follow us on social media',
    'footer.copyright': 'All rights reserved Almacenajes, S.A.',
    
    // Common - US standard terminology
    'common.loading': 'Loading...',
    'common.error': 'Something went wrong',
    'common.contact': 'Contact Us',
    'common.phone': 'Phone',
    'common.email': 'Email',
    'common.address': 'Address',
    'common.more': 'Learn more',
    
    // 404 Page
    'error.404.title': 'Page not found',
    'error.404.subtitle': 'Sorry, the page you are looking for does not exist.',
    'error.404.description': 'The page may have been moved, deleted, or you may have entered an incorrect URL.',
    'error.404.home': 'Go to homepage',
    'error.404.blog': 'Go to blog',
    'error.404.contact': 'Contact us',
  },
} as const;

export type UIKeys = keyof typeof ui[typeof defaultLang];
