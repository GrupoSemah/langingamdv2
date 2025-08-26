// Configuración SEO optimizada para Almacenajes Mini Depósitos
// Keywords research basado en volumen de búsqueda y competencia en Panamá

export const seoConfig = {
  es: {
    // Página principal
    home: {
      title: 'Mini Depósitos en Panamá | Almacenamiento Seguro 24/7 | Almacenajes',
      description: 'Renta mini depósitos seguros en Panamá. Self storage 24/7 con acceso vehicular, cámaras de seguridad y 1 MES GRATIS. ¡Reserva tu espacio hoy!',
      keywords: 'mini depósitos panamá, self storage panamá, almacenamiento seguro, bodegas alquiler panamá, mini bodegas, depósitos seguros, storage panamá, almacenaje panamá, guardar cosas panamá, espacios almacenamiento, mini warehouse panama, deposito seguro panama, alquiler bodegas panama, self storage panama city'
    },
    // Servicios
    services: {
      title: 'Servicios de Almacenamiento | Mini Depósitos Seguros en Panamá',
      description: 'Descubre nuestros servicios de mini depósitos: diferentes tamaños, acceso 24/7, seguridad garantizada y precios competitivos en toda la ciudad de Panamá.',
      keywords: 'servicios almacenamiento panamá, mini depósitos tamaños, self storage servicios, bodegas diferentes tamaños, almacenamiento personal, almacenamiento comercial, depósitos pequeños, depósitos grandes'
    },
    // Ubicaciones
    locations: {
      title: 'Sucursales Mini Depósitos Panamá | 10+ Ubicaciones Estratégicas',
      description: 'Encuentra la sucursal de mini depósitos más cercana. Ubicaciones en Vista Hermosa, Albrook, Costa del Este y más. Acceso fácil y conveniente.',
      keywords: 'sucursales mini depósitos panamá, ubicaciones self storage, depósitos vista hermosa, depósitos albrook, depósitos costa del este, mini bodegas cerca de mi, storage locations panama'
    },
    // Recomendaciones
    recommendations: {
      title: 'Consejos de Almacenamiento | Cómo Usar Mini Depósitos Correctamente',
      description: 'Aprende cómo empacar, organizar y proteger tus pertenencias en mini depósitos. Consejos expertos para maximizar el espacio y mantener todo seguro.',
      keywords: 'consejos almacenamiento, como empacar mini depósito, organizar bodega, proteger pertenencias, tips storage, consejos self storage, empacar correctamente'
    }
  },
  en: {
    // Homepage - Optimized for #1 ranking in US market
    home: {
      title: 'Self Storage Panama | Secure Storage Units | 1 FREE Month',
      description: 'Premium self storage facilities in Panama City. Secure storage units with 24/7 access, climate control, and vehicle access. Get 1 FREE month - limited time offer!',
      keywords: 'self storage panama, storage units panama city, secure storage facility, climate controlled storage, 24/7 storage access, storage rental panama, personal storage units, business storage panama, mini warehouse rental, storage facility near me'
    },
    
    // Services - US market focused
    services: {
      title: 'Storage Services Panama | Self Storage Solutions | Secure Facilities',
      description: 'Professional storage services in Panama. Personal and business storage units with advanced security, climate control, and flexible rental terms.',
      keywords: 'storage services panama, self storage solutions, business storage units, personal storage facility, secure storage rental, climate controlled units, storage facility panama city, warehouse storage panama'
    },
    
    // Locations - Geographic SEO optimization
    locations: {
      title: 'Storage Facilities Panama | Self Storage Locations | Vista Hermosa',
      description: 'Convenient self storage locations across Panama City. Vista Hermosa and multiple facilities with easy vehicle access, top security, and competitive rates.',
      keywords: 'storage facilities panama, self storage locations panama city, storage units vista hermosa, storage facility near me, warehouse rental panama, secure storage centers'
    },
    
    // Recommendations - Expert authority content
    recommendations: {
      title: 'Storage Unit Tips | How to Pack Storage Units | Expert Storage Guide',
      description: 'Professional storage tips from experts. Learn proper packing techniques, organization strategies, and protection methods for your storage unit.',
      keywords: 'storage unit tips, how to pack storage unit, storage packing guide, organize storage unit, storage unit best practices, self storage advice, storage protection tips'
    }
  }
};

// URLs canónicas para cada idioma
export const canonicalUrls = {
  es: {
    home: 'https://almacenajes-minidepositos.com/',
    services: 'https://almacenajes-minidepositos.com/#servicios',
    locations: 'https://almacenajes-minidepositos.com/#sucursales',
    recommendations: 'https://almacenajes-minidepositos.com/#recomendaciones'
  },
  en: {
    home: 'https://almacenajes-minidepositos.com/en/',
    services: 'https://almacenajes-minidepositos.com/en/#services',
    locations: 'https://almacenajes-minidepositos.com/en/#locations',
    recommendations: 'https://almacenajes-minidepositos.com/en/#recommendations'
  }
};

// Configuración de Open Graph images por sección
export const ogImages = {
  home: '/Images/og-home.webp',
  services: '/Images/og-services.webp',
  locations: '/Images/og-locations.webp',
  recommendations: '/Images/og-recommendations.webp'
};

// Schema.org adicional para diferentes secciones
export const additionalSchemas = {
  faq: {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "¿Cuánto cuesta rentar un mini depósito?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Los precios varían según el tamaño del depósito. Contamos con opciones desde lockers pequeños hasta mini bodegas grandes. Contáctanos para una cotización personalizada."
        }
      },
      {
        "@type": "Question", 
        "name": "¿Puedo acceder a mi depósito las 24 horas?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sí, nuestras instalaciones tienen acceso las 24 horas del día, los 7 días de la semana para tu comodidad."
        }
      }
    ]
  },
  breadcrumb: {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Inicio",
        "item": "https://almacenajes-minidepositos.com/"
      }
    ]
  }
};
