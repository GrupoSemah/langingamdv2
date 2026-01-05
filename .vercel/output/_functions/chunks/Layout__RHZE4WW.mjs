import { e as createAstro, f as createComponent, h as addAttribute, l as renderScript, r as renderTemplate, m as maybeRenderHead, k as renderComponent, o as renderSlot, p as renderHead } from './astro/server_q9Jx4GKt.mjs';
import 'piccolore';
import 'clsx';
/* empty css                        */

const $$Astro$2 = createAstro("https://almacenajes-minidepositos.com");
const $$ClientRouter = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$2, $$props, $$slots);
  Astro2.self = $$ClientRouter;
  const { fallback = "animate" } = Astro2.props;
  return renderTemplate`<meta name="astro-view-transitions-enabled" content="true"><meta name="astro-view-transitions-fallback"${addAttribute(fallback, "content")}>${renderScript($$result, "C:/Users/gerenteit/Desktop/Semah/Sistemas/Landing AMD v2/landingamdv2/node_modules/astro/components/ClientRouter.astro?astro&type=script&index=0&lang.ts")}`;
}, "C:/Users/gerenteit/Desktop/Semah/Sistemas/Landing AMD v2/landingamdv2/node_modules/astro/components/ClientRouter.astro", void 0);

const defaultLang = "es";
const ui = {
  es: {
    // Navbar
    "nav.home": "Inicio",
    "nav.services": "Servicios",
    "nav.sizes": "Tamaños",
    "nav.locations": "Sucursales",
    "nav.recommendations": "Recomendaciones",
    "nav.blog": "Blog",
    "nav.quote": "Cotización",
    "nav.menu": "Abrir menú",
    // Hero
    "hero.title.line1": "Alquila un Minidepósito",
    "hero.title.line2": "y recibe",
    "hero.title.highlight": "1 MES GRATIS",
    "hero.subtitle.line1": "¡Reserva tu espacio hoy y guarda tus",
    "hero.subtitle.line2": "cosas sin costo inicial!",
    "hero.cta": "Obtén tu cotización",
    // Quote Section
    "quote.title": "¿Buscas alquiler de mini depósitos en Panamá?",
    // Form
    "form.name": "Nombre completo",
    "form.name.placeholder": "Tu nombre",
    "form.phone": "Teléfono",
    "form.phone.placeholder": "Tu número de teléfono",
    "form.email": "Correo electrónico",
    "form.email.placeholder": "tu@email.com",
    "form.company": "Empresa (opcional)",
    "form.company.placeholder": "Nombre de tu empresa",
    "form.branch": "Sucursal",
    "form.branch.placeholder": "Selecciona de la lista desplegable",
    "form.branch.vh": "Vista Hermosa",
    "form.branch.ra": "Río Abajo",
    "form.branch.al": "Albrook",
    "form.branch.sa": "San Antonio",
    "form.branch.m8": "Milla 8",
    "form.branch.co": "Coronado",
    "form.branch.go": "Gorgona",
    "form.branch.da": "David",
    "form.branch.ce": "Costa del Este",
    "form.branch.hm": "Hato Montaña",
    "form.branch.tm": "Tumba Muerto",
    "form.size": "Tamaño de depósito",
    "form.size.placeholder": "Selecciona un tamaño",
    "form.size.1x1": "1x1 - Locker pequeño",
    "form.size.1x2": "1x2 - Locker mediano",
    "form.size.1x3": "1x3 - Locker grande",
    "form.size.2x2": "2x2 - Depósito pequeño",
    "form.size.2x3": "2x3 - Depósito mediano",
    "form.size.3x3": "3x3 - Depósito grande",
    "form.size.other": "Otro tamaño",
    "form.submit": "Solicitar cotización",
    "form.sending": "Enviando...",
    "form.success": "¡Cotización enviada!",
    "form.success.message": "Gracias por tu interés. Te contactaremos pronto.",
    "form.error": "Error al enviar",
    "form.error.message": "Por favor intenta nuevamente o contáctanos directamente.",
    // Services
    "services.storage.title": "Soluciones de almacenajes",
    "services.storage.highlight": "rápido y confiable",
    "services.storage.description": "Almacenajes Minidepósitos: 40 años de experiencia en Panamá. Acceso directo a bodegas desde tu auto, seguridad 24/7 y flexibilidad a precios amigables.",
    "services.storage.tagline": "Tu tranquilidad es nuestra prioridad.",
    "services.benefits.title": "Beneficios exclusivos",
    "services.benefits.subtitle": "para tu comodidad",
    "services.benefit1.line1": "Sin amarres a",
    "services.benefit1.line2": "largos contratos",
    "services.benefit2.line1": "Acceso con",
    "services.benefit2.line2": "tu auto",
    "services.benefit3.line1": "Acceso a tu deposito",
    "services.benefit3.line2": "365 días",
    "services.benefit4.line1": "Múltiples",
    "services.benefit4.line2": "tamaños",
    "services.benefit5.line1": "Montacarga",
    "services.benefit5.line2": "gratuita",
    "services.benefit6.line1": "Carretilla",
    "services.benefit6.line2": "gratuita",
    "services.benefit7.line1": "Acceso diario a tu",
    "services.benefit7.line2": "depósito",
    "services.benefit8.line1": "Pagos seguros",
    "services.benefit8.line2": "online",
    "services.howworks.title": "¿Cómo funciona?",
    "services.step1.title": "Paso 1",
    "services.step1.description": "Selecciona el tamaño de mini depósito que necesitas",
    "services.step2.title": "Paso 2",
    "services.step2.description": "Agenda tu cita y reserva tu mini depósito GRATIS",
    "services.step3.title": "Paso 3",
    "services.step3.description": "Guarda tus cosas con un costo mínimo",
    "services.step4.title": "Paso 4",
    "services.step4.description": "Accede a tus pertenencias cuando quieras",
    // Sizes
    "sizes.title": "Tamaños de Mini Depósitos",
    "sizes.description": "Contamos con mini depósitos que se adaptan a tus necesidades. Ya sea que necesites almacenar algunos muebles, electrodomésticos, cajas o incluso el contenido completo de tu hogar u oficina, tenemos el espacio ideal para ti.",
    "sizes.cta": "Obtén tu cotización",
    // Locations
    "locations.title": "Nuestras Sucursales",
    "locations.description": "Encuentra la sucursal más cercana a ti y visítanos para conocer nuestros mini depósitos",
    "locations.select": "Selecciona una sucursal",
    // Recommendations
    "recommendations.title.line1": "Recomendaciones de",
    "recommendations.title.highlight": "almacenamiento seguro",
    "recommendations.title.line2": "y eficiente",
    // Accordion 1
    "recommendations.accordion1.title": "Evaluar la necesidad de tener espacio en casa",
    "recommendations.accordion1.content": "Observa si hay áreas de tu casa aglomeradas con objetos que no usas con frecuencia. Puedes liberar espacio en tu hogar alquilando un depósito o locker a la medida, sin tener que deshacerte de tus pertenencias.",
    // Accordion 2
    "recommendations.accordion2.title": "Organizar artículos por categorías",
    "recommendations.accordion2.content": "El volumen de tus artículos determina el tamaño del depósito que necesitas. Puedes encontrar opciones tipo locker para guardar objetos pequeños como documentos, maletas de viaje y equipo deportivo, o mini bodegas para guardar artículos más grandes como muebles.",
    // Accordion 3
    "recommendations.accordion3.title": "Empacar y etiquetar correctamente",
    "recommendations.accordion3.content": "Asegúrate de que las cajas, cintas y demás materiales de embalaje estén en condiciones óptimas. Limpia y protege los artículos delicados utilizando plástico de burbujas, papel arrugado o mantas protectoras.",
    "recommendations.accordion3.tip1": "Llena las cajas completamente para evitar aplastamientos.",
    "recommendations.accordion3.tip2": "Usa papel arrugado o plástico de burbujas para rellenar espacios vacíos.",
    "recommendations.accordion3.tip3": "Espolvorea bicarbonato de sodio para liberarlo de olores.",
    // Accordion 4
    "recommendations.accordion4.title": "Proteger artículos frágiles",
    "recommendations.accordion4.tip1": "Planifica tu mudanza con tiempo para minimizar daños, puedes contar con nuestro servicio de mudanza para el transporte seguro.",
    "recommendations.accordion4.tip2": "Te brindamos asistencia en la descarga, uso gratuito de montacargas y carretillas.",
    "recommendations.accordion4.tip3": "Tu vehículo puede ingresar hasta la puerta de tu depósito, bodega o locker.",
    // Accordion 5
    "recommendations.accordion5.title": "Maximizar el espacio de almacenamiento",
    "recommendations.accordion5.tip1": "Llena las cajas completamente para evitar que se colapsen.",
    "recommendations.accordion5.tip2": "Haz una lista del contenido y etiqueta cada caja.",
    "recommendations.accordion5.tip3": "Coloca cajas pesadas abajo y las livianas arriba.",
    // Accordion 6
    "recommendations.accordion6.title": "Proteger contra la humedad y polvo",
    // Accordion 7
    "recommendations.accordion7.title": "Consejos específicos para diferentes artículos",
    // Sub-accordion 1 - Colchones
    "recommendations.sub1.title": "Almacenamiento seguro para colchones",
    "recommendations.sub1.tip1": "Aspira y limpia tu colchón antes de guardarlo.",
    "recommendations.sub1.tip2": "Usa una funda plástica resistente para protegerlo.",
    "recommendations.sub1.tip3": "Almacena el colchón horizontalmente para evitar deformaciones.",
    "recommendations.sub1.tip4": "Espolvorea bicarbonato de sodio para liberarlo de olores.",
    // Sub-accordion 2 - Refrigeradores
    "recommendations.sub2.title": "Almacenamiento seguro para refrigeradores",
    "recommendations.sub2.tip1": "Desconecta, descongela y limpia completamente el refrigerador.",
    "recommendations.sub2.tip2": "Deja las puertas ligeramente abiertas para prevenir olores.",
    "recommendations.sub2.tip3": "Asegúrate de que esté completamente seco para evitar moho.",
    "recommendations.sub2.tip4": "Guárdalo en posición vertical.",
    // Sub-accordion 3 - Televisores
    "recommendations.sub3.title": "Almacenamiento de televisores de pantalla plana",
    "recommendations.sub3.tip1": "Protege la pantalla con material de embalaje protector.",
    "recommendations.sub3.tip2": "Guarda el TV en su caja original si es posible.",
    "recommendations.sub3.tip3": "Almacena en posición vertical para evitar daños a la pantalla.",
    "recommendations.sub3.tip4": 'Marca la caja con "Frágil" y "Manténgase vertical" en ambas caras de la caja.',
    // Sub-accordion 4 - Objetos de valor
    "recommendations.sub4.title": "Guardar objetos de valor afectivo",
    "recommendations.sub4.tip1": "Toma fotografías de recuerdo antes de almacenarlos.",
    "recommendations.sub4.tip2": "Usa cajas transparentes para identificar fácilmente el contenido.",
    "recommendations.sub4.tip3": "Aplica papel desecante en las cajas para prevenir la humedad.",
    // Additional missing content
    "recommendations.accordion3.alt_title": "Elegir el tamaño adecuado del minidepósito",
    "recommendations.accordion6.content": "Protege tus pertenencias de la humedad usando deshumidificadores o bolsas de sílica gel. Cubre los muebles con fundas protectoras y evita colocar objetos directamente en el suelo.",
    "recommendations.accordion6.tip1": "Usa deshumidificadores en espacios cerrados.",
    "recommendations.accordion6.tip2": "Coloca bolsas de sílica gel en cajas selladas.",
    "recommendations.accordion6.tip3": "Cubre muebles con fundas transpirables.",
    "recommendations.vehicle_access": "Tu vehículo puede ingresar hasta la puerta de tu depósito, bodega o locker.",
    // Accordion 6 additional tips
    "recommendations.accordion6.storage_tip1": "Coloca bienes de muy poco uso al fondo.",
    "recommendations.accordion6.storage_tip2": "Mantén bienes de uso regular al frente.",
    "recommendations.accordion6.storage_tip3": "Usa cobertores de plástico y bolsas desecantes para proteger tus bienes.",
    "recommendations.accordion6.storage_tip4": "Apila cajas hasta el techo para maximizar el espacio.",
    "recommendations.accordion6.storage_tip5": "Coloca las etiquetas visibles para fácil identificación.",
    "recommendations.accordion6.storage_tip6": "Deja espacio entre las paredes y las cajas para la circulación de aire.",
    "recommendations.accordion6.storage_tip7": "Almacena artículos frágiles en la parte trasera y pesados abajo.",
    "recommendations.accordion6.storage_tip8": "Mantén artículos de acceso frecuente cerca del frente.",
    // Footer
    "footer.company": "Almacenajes Mini Depósitos",
    "footer.description": "Tu solución confiable de almacenamiento en Panamá",
    "footer.services.title": "Servicios",
    "footer.contact.title": "Contacto",
    "footer.follow.title": "Síguenos",
    "footer.rights": "Todos los derechos reservados",
    "footer.title": "Visítanos y obtén tu minidepósito",
    "footer.access.title": "Horario de acceso a depósito",
    "footer.access.days": "Lunes a domingo",
    "footer.access.hours": "6:00 a.m a 6:00 p.m",
    "footer.access.cta": "Pregunta por nuestros horarios\nextendidos",
    "footer.office.title": "Horario de oficinas",
    "footer.office.weekdays": "Lunes a Viernes",
    "footer.office.weekhours": "8:00 a.m a 5:00 p.m",
    "footer.office.saturday": "Sábado",
    "footer.office.sathours": "8:00 a.m a 12:00 p.m",
    "footer.social": "Síguenos en nuestras redes sociales",
    "footer.copyright": "Todos los derechos reservados Almacenajes, S.A.",
    // Common
    "common.loading": "Cargando...",
    "common.error": "Ha ocurrido un error",
    "common.contact": "Contacto",
    "common.phone": "Teléfono",
    "common.email": "Email",
    "common.address": "Dirección",
    "common.more": "Ver más",
    // 404 Page
    "error.404.title": "Página no encontrada",
    "error.404.subtitle": "Lo sentimos, la página que buscas no existe.",
    "error.404.description": "Es posible que la página haya sido movida, eliminada o que hayas ingresado una URL incorrecta.",
    "error.404.home": "Volver al inicio",
    "error.404.blog": "Ir al blog",
    "error.404.contact": "Contactanos"
  },
  en: {
    // Navbar - US Native SEO optimized
    "nav.home": "Home",
    "nav.services": "Self Storage",
    "nav.sizes": "Unit Sizes",
    "nav.locations": "Locations",
    "nav.recommendations": "Storage Tips",
    "nav.blog": "Blog",
    "nav.quote": "Get Quote",
    "nav.menu": "Menu",
    // Hero - US Market focused (length matched to Spanish)
    "hero.title.line1": "Rent a Storage Unit",
    "hero.title.line2": "and get",
    "hero.title.highlight": "1 FREE MONTH",
    "hero.subtitle.line1": "Reserve your space today and store",
    "hero.subtitle.line2": "your belongings at no upfront cost!",
    "hero.cta": "Get Your Quote",
    // Quote Section - Professional US tone
    "quote.title": "Need secure storage units or warehouse space in Panamá?",
    // Form
    "form.name": "Full name",
    "form.name.placeholder": "Your name",
    "form.phone": "Phone",
    "form.phone.placeholder": "Your phone number",
    "form.email": "Email address",
    "form.email.placeholder": "your@email.com",
    "form.company": "Company (optional)",
    "form.company.placeholder": "Your company name",
    "form.branch": "Location",
    "form.branch.placeholder": "Select from the list",
    "form.branch.vh": "Vista Hermosa",
    "form.branch.ra": "Río Abajo",
    "form.branch.al": "Albrook",
    "form.branch.sa": "San Antonio",
    "form.branch.m8": "Milla 8",
    "form.branch.co": "Coronado",
    "form.branch.go": "Gorgona",
    "form.branch.da": "David",
    "form.branch.ce": "Costa del Este",
    "form.branch.hm": "Hato Montaña",
    "form.branch.tm": "Tumba Muerto",
    "form.size": "Storage unit size",
    "form.size.placeholder": "Select a size",
    "form.size.1x1": "1x1 - Small locker",
    "form.size.1x2": "1x2 - Medium locker",
    "form.size.1x3": "1x3 - Large locker",
    "form.size.2x2": "2x2 - Small unit",
    "form.size.2x3": "2x3 - Medium unit",
    "form.size.3x3": "3x3 - Large unit",
    "form.size.other": "Other size",
    "form.submit": "Request quote",
    "form.sending": "Sending...",
    "form.success": "Quote sent!",
    "form.success.message": "Thank you for your interest. We will contact you soon.",
    "form.error": "Error sending",
    "form.error.message": "Please try again or contact us directly.",
    // Services - US Professional tone
    "services.storage.title": "Premium Self Storage",
    "services.storage.highlight": "secure & convenient",
    "services.storage.description": "Almacenajes Minidepósitos: 40+ years serving Panamá. Drive-through access, advanced security systems, and flexible terms at competitive rates.",
    "services.storage.tagline": "Your belongings deserve the best protection.",
    "services.benefits.title": "Why Choose Us",
    "services.benefits.subtitle": "premium features included",
    "services.benefit1.line1": "Flexible",
    "services.benefit1.line2": "lease terms",
    "services.benefit2.line1": "Drive-up",
    "services.benefit2.line2": "access",
    "services.benefit3.line1": "Access to your unit",
    "services.benefit3.line2": "365 days",
    "services.benefit4.line1": "Multiple",
    "services.benefit4.line2": "sizes",
    "services.benefit5.line1": "Free",
    "services.benefit5.line2": "forklift",
    "services.benefit6.line1": "Free",
    "services.benefit6.line2": "cart",
    "services.benefit7.line1": "Daily access to",
    "services.benefit7.line2": "your unit",
    "services.benefit8.line1": "Secure online",
    "services.benefit8.line2": "payments",
    "services.howworks.title": "How It Works",
    "services.step1.title": "Step 1",
    "services.step1.description": "Select the storage unit size you need",
    "services.step2.title": "Step 2",
    "services.step2.description": "Schedule your appointment and reserve your unit FREE",
    "services.step3.title": "Step 3",
    "services.step3.description": "Store your belongings at minimal cost",
    "services.step4.title": "Step 4",
    "services.step4.description": "Access your belongings whenever you want",
    // Sizes - US Market terminology
    "sizes.title": "Self Storage Unit Sizes",
    "sizes.description": "Choose from a variety of storage unit sizes to fit your needs. From small lockers for documents and seasonal items to large units for entire households or business inventory - we have the perfect space.",
    "sizes.cta": "Get Free Quote",
    // Locations - Geographic SEO focus
    "locations.title": "Storage Facility Locations",
    "locations.description": "Convenient self storage locations throughout Panamá City. Visit our secure facilities to see our storage units firsthand.",
    "locations.select": "Choose location",
    // Recommendations - Expert storage authority content
    "recommendations.title.line1": "Professional storage",
    "recommendations.title.highlight": "tips & best practices",
    "recommendations.title.line2": "from experts",
    // Accordion 1 - Home decluttering expertise
    "recommendations.accordion1.title": "Evaluate your home storage needs",
    "recommendations.accordion1.content": "Identify cluttered areas in your home filled with items you rarely use. A self storage unit can free up valuable living space while keeping your belongings safe and accessible.",
    // Accordion 2 - Professional categorization
    "recommendations.accordion2.title": "Categorize items by storage requirements",
    "recommendations.accordion2.content": "The volume and type of items determine your ideal storage unit size. Choose small units for documents, seasonal items, and sports equipment, or larger units for furniture, appliances, and household goods.",
    // Accordion 3 - Professional packing standards
    "recommendations.accordion3.title": "Use professional packing techniques",
    "recommendations.accordion3.content": "Ensure all boxes, tape, and packing materials are high-quality and in excellent condition. Protect fragile items with bubble wrap, packing paper, or moving blankets.",
    "recommendations.accordion3.tip1": "Fill boxes completely to prevent crushing.",
    "recommendations.accordion3.tip2": "Use crumpled paper or bubble wrap to fill empty spaces.",
    "recommendations.accordion3.tip3": "Sprinkle baking soda to eliminate odors.",
    "recommendations.accordion3.alt_title": "Choose the right storage unit size",
    // Accordion 4
    "recommendations.accordion4.title": "Protect fragile items",
    "recommendations.accordion4.tip1": "Plan your move ahead of time to minimize damage - you can count on our moving service for safe transport.",
    "recommendations.accordion4.tip2": "We provide unloading assistance and free use of dollies and hand trucks.",
    "recommendations.accordion4.tip3": "Your vehicle can drive right up to your storage unit, warehouse, or locker door.",
    // Accordion 5
    "recommendations.accordion5.title": "Maximize storage space",
    "recommendations.accordion5.tip1": "Fill boxes completely to prevent them from collapsing.",
    "recommendations.accordion5.tip2": "Make a content list and label each box.",
    "recommendations.accordion5.tip3": "Place heavy boxes on the bottom and light ones on top.",
    // Accordion 6
    "recommendations.accordion6.title": "Protect against moisture and dust",
    "recommendations.accordion6.content": "Protect your belongings from moisture using dehumidifiers or silica gel bags. Cover furniture with protective covers and avoid placing items directly on the floor.",
    "recommendations.accordion6.tip1": "Use dehumidifiers in enclosed spaces.",
    "recommendations.accordion6.tip2": "Place silica gel bags in sealed boxes.",
    "recommendations.accordion6.tip3": "Cover furniture with breathable covers.",
    "recommendations.accordion6.storage_tip1": "Place rarely used items in the back.",
    "recommendations.accordion6.storage_tip2": "Keep regularly used items in front.",
    "recommendations.accordion6.storage_tip3": "Use plastic covers and desiccant bags to protect your belongings.",
    "recommendations.accordion6.storage_tip4": "Stack boxes up to the ceiling to maximize space.",
    "recommendations.accordion6.storage_tip5": "Place labels where they're visible for easy identification.",
    "recommendations.accordion6.storage_tip6": "Leave space between walls and boxes for air circulation.",
    "recommendations.accordion6.storage_tip7": "Store fragile items in the back and heavy items on the bottom.",
    "recommendations.accordion6.storage_tip8": "Keep frequently accessed items near the front.",
    // Accordion 7
    "recommendations.accordion7.title": "Specific tips for different items",
    // Sub-accordion 1 - Mattress storage expertise
    "recommendations.sub1.title": "Safety storage for mattresses",
    "recommendations.sub1.tip1": "Vacuum and sanitize your mattress thoroughly before storage.",
    "recommendations.sub1.tip2": "Use a high-quality mattress storage bag for protection.",
    "recommendations.sub1.tip3": "Store mattresses flat to maintain their shape and support.",
    "recommendations.sub1.tip4": "Add baking soda sachets to prevent odors and moisture.",
    // Sub-accordion 2 - Appliance storage best practices
    "recommendations.sub2.title": "Refrigerator storage guidelines",
    "recommendations.sub2.tip1": "Unplug, defrost completely, and deep clean all surfaces.",
    "recommendations.sub2.tip2": "Prop doors open slightly to maintain air circulation.",
    "recommendations.sub2.tip3": "Ensure the unit is completely dry to prevent mold growth.",
    "recommendations.sub2.tip4": "Always store refrigerators in an upright position.",
    // Sub-accordion 3 - Electronics protection
    "recommendations.sub3.title": "TV and electronics storage",
    "recommendations.sub3.tip1": "Wrap screens with specialized protective padding.",
    "recommendations.sub3.tip2": "Use original packaging when available for best protection.",
    "recommendations.sub3.tip3": "Store flat-screen TVs upright to prevent screen damage.",
    "recommendations.sub3.tip4": 'Label boxes clearly with "FRAGILE" and "THIS SIDE UP" markings.',
    // Sub-accordion 4 - Valuable items security
    "recommendations.sub4.title": "Storing valuable and sentimental items",
    "recommendations.sub4.tip1": "Document items with photos for insurance purposes.",
    "recommendations.sub4.tip2": "Use transparent storage containers for easy identification.",
    "recommendations.sub4.tip3": "Include moisture-absorbing packets in sealed containers.",
    // Additional professional features
    "recommendations.vehicle_access": "Drive-up access available - bring your vehicle directly to your storage unit door.",
    // Footer - US Market optimized
    "footer.company": "Almacenajes Self Storage",
    "footer.description": "Your trusted storage solution in Panama",
    "footer.services.title": "Services",
    "footer.contact.title": "Contact",
    "footer.follow.title": "Follow Us",
    "footer.rights": "All rights reserved",
    "footer.title": "Visit us and get your storage unit",
    "footer.access.title": "Storage unit access hours",
    "footer.access.days": "Monday through Sunday",
    "footer.access.hours": "6:00 AM to 6:00 PM",
    "footer.access.cta": "Ask about our extended\nhours availability",
    "footer.office.title": "Office hours",
    "footer.office.weekdays": "Monday to Friday",
    "footer.office.weekhours": "8:00 AM to 5:00 PM",
    "footer.office.saturday": "Saturday",
    "footer.office.sathours": "8:00 AM to 12:00 PM",
    "footer.social": "Follow us on social media",
    "footer.copyright": "All rights reserved Almacenajes, S.A.",
    // Common - US standard terminology
    "common.loading": "Loading...",
    "common.error": "Something went wrong",
    "common.contact": "Contact Us",
    "common.phone": "Phone",
    "common.email": "Email",
    "common.address": "Address",
    "common.more": "Learn more",
    // 404 Page
    "error.404.title": "Page not found",
    "error.404.subtitle": "Sorry, the page you are looking for does not exist.",
    "error.404.description": "The page may have been moved, deleted, or you may have entered an incorrect URL.",
    "error.404.home": "Go to homepage",
    "error.404.blog": "Go to blog",
    "error.404.contact": "Contact us"
  }
};

function getLangFromUrl(url) {
  const [, lang] = url.pathname.split("/");
  if (lang in ui) return lang;
  return defaultLang;
}
function useTranslations(lang) {
  return function t(key) {
    return ui[lang][key] || ui[defaultLang][key];
  };
}
function removeLocaleFromPath(pathname) {
  const segments = pathname.split("/");
  if (segments[1] && segments[1] in ui) {
    return "/" + segments.slice(2).join("/");
  }
  return pathname;
}
function getAlternateLocale(currentLocale) {
  return currentLocale === "es" ? "en" : "es";
}
function getLocalizedUrl(url, targetLocale) {
  getLangFromUrl(url);
  const pathWithoutLocale = removeLocaleFromPath(url.pathname);
  if (targetLocale === defaultLang) {
    return pathWithoutLocale + url.search + url.hash;
  }
  return `/${targetLocale}${pathWithoutLocale}` + url.search + url.hash;
}

const $$Astro$1 = createAstro("https://almacenajes-minidepositos.com");
const $$CookieConsent = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$CookieConsent;
  const lang = getLangFromUrl(Astro2.url);
  return renderTemplate`<!-- Cookie Consent Banner -->${maybeRenderHead()}<div id="cookie-consent" class="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-[var(--color-primary)] shadow-lg z-50 p-4 transform translate-y-full transition-transform duration-300 ease-in-out" data-astro-cid-garwan2p> <div class="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4" data-astro-cid-garwan2p> <div class="flex-1" data-astro-cid-garwan2p> <h3 class="font-semibold text-[var(--color-dark)] mb-1" data-astro-cid-garwan2p> ${lang === "es" ? "Uso de Cookies" : "Cookie Usage"} </h3> <p class="text-sm text-gray-600" data-astro-cid-garwan2p> ${lang === "es" ? "Utilizamos cookies esenciales para el funcionamiento del sitio y servicios de terceros (Mapbox, Pipedrive, Google) para mejorar tu experiencia. Estas cookies pueden ser restringidas en el futuro." : "We use essential cookies for site functionality and third-party services (Mapbox, Pipedrive, Google) to enhance your experience. These cookies may be restricted in the future."} </p> </div> <div class="flex gap-3" data-astro-cid-garwan2p> <button id="cookie-accept" class="bg-[var(--color-primary)] text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors font-medium" data-astro-cid-garwan2p> ${lang === "es" ? "Aceptar" : "Accept"} </button> <button id="cookie-decline" class="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium" data-astro-cid-garwan2p> ${lang === "es" ? "Solo Esenciales" : "Essential Only"} </button> </div> </div> </div> ${renderScript($$result, "C:/Users/gerenteit/Desktop/Semah/Sistemas/Landing AMD v2/landingamdv2/src/components/CookieConsent.astro?astro&type=script&index=0&lang.ts")} `;
}, "C:/Users/gerenteit/Desktop/Semah/Sistemas/Landing AMD v2/landingamdv2/src/components/CookieConsent.astro", void 0);

const $$BfcacheOptimizer = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderScript($$result, "C:/Users/gerenteit/Desktop/Semah/Sistemas/Landing AMD v2/landingamdv2/src/components/BfcacheOptimizer.astro?astro&type=script&index=0&lang.ts")} `;
}, "C:/Users/gerenteit/Desktop/Semah/Sistemas/Landing AMD v2/landingamdv2/src/components/BfcacheOptimizer.astro", void 0);

const $$PerformanceMonitor = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderScript($$result, "C:/Users/gerenteit/Desktop/Semah/Sistemas/Landing AMD v2/landingamdv2/src/components/PerformanceMonitor.astro?astro&type=script&index=0&lang.ts")} <!-- Performance debug panel (only visible in development) -->${maybeRenderHead()}<div class="performance-debug" id="performance-debug" data-astro-cid-kjkazaz7> <div data-astro-cid-kjkazaz7>Performance Monitor Active</div> <div id="performance-metrics" data-astro-cid-kjkazaz7></div> </div>`;
}, "C:/Users/gerenteit/Desktop/Semah/Sistemas/Landing AMD v2/landingamdv2/src/components/PerformanceMonitor.astro", void 0);

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro("https://almacenajes-minidepositos.com");
const $$Layout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Layout;
  const lang = getLangFromUrl(Astro2.url);
  const defaultTitles = {
    es: "Almacenajes Minidep\xF3sitos",
    en: "Almacenajes Minidep\xF3sitos - Self Storage"
  };
  const defaultDescriptions = {
    es: "Servicios profesionales de almacenamiento y mini dep\xF3sitos. An\xE1lisis de movimientos, precios transparentes y soluciones personalizadas para tus necesidades.",
    en: "Professional storage services and self storage units. Movement analysis, transparent pricing, and customized solutions for your storage needs."
  };
  const {
    title = defaultTitles[lang],
    description = defaultDescriptions[lang]
  } = Astro2.props;
  return renderTemplate(_a || (_a = __template(["<html", ` data-astro-cid-sckkx6r4> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover"><!-- Google Tag Manager --><script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
		new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
		j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
		'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
		})(window,document,'script','dataLayer','GTM-T4XZCLXC');<\/script><!-- End Google Tag Manager --><!-- Security headers (X-Frame-Options moved to _headers file) --><meta http-equiv="X-Content-Type-Options" content="nosniff"><meta http-equiv="X-XSS-Protection" content="1; mode=block"><meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin"><!-- Preconnect to external domains for faster loading --><link rel="preconnect" href="https://www.googletagmanager.com"><link rel="preconnect" href="https://api.mapbox.com" crossorigin><link rel="preconnect" href="https://webforms.pipedrive.com" crossorigin><!-- Preload Gilroy fonts for better performance --><link rel="preload" href="/fonts/Gilroy-Light.woff" as="font" type="font/woff" crossorigin><link rel="preload" href="/fonts/Gilroy-Extrabold.woff" as="font" type="font/woff" crossorigin><!-- Favicon optimizado --><link rel="icon" type="image/webp" href="/favicon.webp"><link rel="manifest" href="/site.webmanifest"><!-- Meta tags b\xE1sicos --><meta name="generator"`, "><title>", '</title><meta name="description"', '><!-- Theme color para PWA --><meta name="theme-color" content="#EF7B34"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="default"><!-- Gilroy Font Declarations -->', `<!-- Google tag (gtag.js) - GA4 & Google Ads --><script async src="https://www.googletagmanager.com/gtag/js?id=G-W9FEEJYKVT"><\/script><script>
			window.dataLayer = window.dataLayer || [];
			function gtag(){dataLayer.push(arguments);}
			gtag('js', new Date());
			
			// Google Analytics 4
			gtag('config', 'G-W9FEEJYKVT');
			
			// Google Ads Conversion Tracking
			gtag('config', 'AW-976110472');
		<\/script><!-- Microsoft Clarity (mapa de calor) --><script type="text/javascript">
			(function(c,l,a,r,i,t,y){
				c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
				t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
				y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
			})(window, document, "clarity", "script", "rnouqnobtw");
		<\/script><!-- Slot para SEO component desde pages -->`, "", '</head> <body data-astro-cid-sckkx6r4> <!-- Google Tag Manager (noscript) --> <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-T4XZCLXC" height="0" width="0" style="display:none;visibility:hidden" data-astro-cid-sckkx6r4></iframe></noscript> <!-- End Google Tag Manager (noscript) --> <!-- Skip to main content para accesibilidad --> <a href="#main-content" class="skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded" data-astro-cid-sckkx6r4>\nSaltar al contenido principal\n</a> ', " <!-- Cookie Consent Banner --> ", " <!-- bfcache Optimization --> ", " <!-- Performance Monitoring --> ", ' <!-- Structured data para breadcrumbs --> <script type="application/ld+json">\n		{\n			"@context": "https://schema.org",\n			"@type": "BreadcrumbList",\n			"itemListElement": [\n				{\n					"@type": "ListItem",\n					"position": 1,\n					"name": "Inicio",\n					"item": "https://almacenajes-minidepositos.com/"\n				}\n			]\n		}\n		<\/script> </body> </html> '])), addAttribute(lang, "lang"), addAttribute(Astro2.generator, "content"), title, addAttribute(description, "content"), renderComponent($$result, "ClientRouter", $$ClientRouter, { "data-astro-cid-sckkx6r4": true }), renderSlot($$result, $$slots["seo"]), renderHead(), renderSlot($$result, $$slots["default"]), renderComponent($$result, "CookieConsent", $$CookieConsent, { "data-astro-cid-sckkx6r4": true }), renderComponent($$result, "BfcacheOptimizer", $$BfcacheOptimizer, { "data-astro-cid-sckkx6r4": true }), renderComponent($$result, "PerformanceMonitor", $$PerformanceMonitor, { "data-astro-cid-sckkx6r4": true }));
}, "C:/Users/gerenteit/Desktop/Semah/Sistemas/Landing AMD v2/landingamdv2/src/layouts/Layout.astro", void 0);

export { $$Layout as $, getLocalizedUrl as a, getAlternateLocale as b, getLangFromUrl as g, useTranslations as u };
