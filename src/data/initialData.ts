import { DocumentItem, YouTubeVideoItem, SupplierItem, AnnouncementItem, ManagedUser } from '../types';
import holcimImg from '../assets/holcim.png';
import rotoplasImg from '../assets/ROTOPLAS.png';
import truperImg from '../assets/truper.png';
import saltexImg from '../assets/saltex.png';
import reflexImg from '../assets/reflex.png';
import vikingoImg from '../assets/vikingo.jpg';
import hispacensaImg from '../assets/hispacensa.png';
import forjadosImg from '../assets/forjadoshierro.png';
import imacasaImg from '../assets/IMACASA.png';
import jfImg from '../assets/JF.png';
import stihlImg from '../assets/stihl.png';

export const INITIAL_MANAGED_USERS: ManagedUser[] = [
  {
    id: 'usr_carlos_lopez',
    email: 'deliriumtremens365@gmail.com',
    displayName: 'Ing. Carlos Mauricio López',
    role: 'Administrador',
    department: 'Dirección General',
    status: 'Activo',
    createdAt: '2026-08-01',
    notes: 'Administrador Principal del Portal'
  },
  {
    id: 'usr_josue_portillo',
    email: 'auxfcruz123@gmail.com',
    displayName: 'Josué Portillo',
    role: 'Administrador',
    department: 'Dirección Administrativa',
    status: 'Activo',
    createdAt: '2026-08-01',
    notes: 'Encargado de Pedidos, parte de Dirección Administrativa'
  },
  {
    id: 'usr_aux_dir_2',
    email: 'fccontaaux@gmail.com',
    displayName: 'Auxiliar Dirección 2',
    role: 'Administrador',
    department: 'Contabilidad y Dirección',
    status: 'Activo',
    createdAt: '2026-08-01'
  },
  {
    id: 'usr_manuel_nieto',
    email: 'ferreteriacruz986@gmail.com',
    displayName: 'Manuel Nieto',
    role: 'Ventas',
    department: 'Ventas y Mostrador',
    status: 'Activo',
    createdAt: '2026-08-01',
    notes: 'Gerente Mercedes Umaña'
  },
  {
    id: 'usr_carolina_bautista',
    email: 'karopineda015@gmail.com',
    displayName: 'Carolina Bautista',
    role: 'Almacén',
    department: 'Logística y Almacén',
    status: 'Activo',
    createdAt: '2026-08-01',
    notes: 'Encargado de Inventario y Recepción'
  },
  {
    id: 'usr_kevin_echeverry',
    email: 'ferreteriacruzb@gmail.com',
    displayName: 'Kevin Echeverry',
    role: 'Ventas',
    department: 'Ventas y Mostrador',
    status: 'Activo',
    createdAt: '2026-08-01',
    notes: 'Gerente Berlin'
  },
  {
    id: 'usr_emelyn_portillo',
    email: 'triunfogerencia04@gmail.com',
    displayName: 'Emelyn Rosibel Portillo de Mauricio',
    role: 'Ventas',
    department: 'Ventas y Mostrador',
    status: 'Activo',
    createdAt: '2026-08-01',
    notes: 'Gerente El Triunfo'
  },
  {
    id: 'usr_daniel_escobar',
    email: 'daniel888es@gmail.com',
    displayName: 'Lic. Daniel Escobar',
    role: 'Administrador',
    department: 'Dirección General',
    status: 'Activo',
    createdAt: '2026-08-01',
    notes: 'Contador General, parte de Dirección Administrativa'
  },
  {
    id: 'usr_saul_hernandez',
    email: 'hersaulalexis75@gmail.com',
    displayName: 'Lic. Saúl Hernández',
    role: 'Administrador',
    department: 'Dirección General',
    status: 'Activo',
    createdAt: '2026-08-01',
    notes: 'Encargado de Tranporte, Carga y Repuestos'
  }
];

export const INITIAL_ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    id: 'ann_1',
    title: 'Capacitación para Personal de Gerencia.',
    content: 'Este martes 11 y miércoles 12, desde las 2 pm hasta las 6 pm. Tendremos una capacitación sobre el trato al personal, impartida al personal de gerencia y administrativo.',
    author: 'Departamento de Capacitación - Ferretería Cruz',
    date: '08 de Agosto, 2026',
    type: 'capacitacion',
    important: true
  }
];

// No default documents hardcoded. Supabase is the live source of truth.
export const INITIAL_DOCUMENTS: DocumentItem[] = [];

export const INITIAL_YOUTUBE_VIDEOS: YouTubeVideoItem[] = [
  {
    id: 'yt_1',
    youtubeId: 'fCBzd76Q1L8',
    title: 'Pasos para tomar Inventario Anual',
    description: 'En este video se muestra como realizar la captura de datos para realizar el inventario anual',
    category: 'Tutoriales',
    publishedAt: '2026-08-05',
    duration: '08:45',
    views: '1,420',
    thumbnail: 'https://img.youtube.com/vi/fCBzd76Q1L8/hqdefault.jpg',
    tags: ['Ferretería Cruz', 'Inventario', 'Tutoriales'],
    addedBy: 'Ferretería Cruz',
    updatedAt: 1771500000000
  },
  {
    id: 'yt_2',
    youtubeId: 'hq5avIYYGT0',
    title: 'Proceso para envíar DTE en caso de contingencia',
    description: 'Pasos a seguir para enviar los DTE luego de un evento de contingencia.',
    category: 'Tutoriales',
    publishedAt: '2026-08-02',
    duration: '10:12',
    views: '2,180',
    thumbnail: 'https://img.youtube.com/vi/hq5avIYYGT0/hqdefault.jpg',
    tags: ['DTE', 'Contingencia', 'Tutoriales'],
    addedBy: 'Ferretería Cruz',
    updatedAt: 1771500000000
  },
  {
    id: 'yt_3',
    youtubeId: '6pBDT46C-1Y',
    title: 'Anular Facturas de cortes anteriores por contingencia',
    description: 'En este video se muestra como anular facturas de contingencia de fechas anteriores.',
    category: 'Tutoriales',
    publishedAt: '2026-07-28',
    duration: '06:50',
    views: '1,890',
    thumbnail: 'https://img.youtube.com/vi/6pBDT46C-1Y/hqdefault.jpg',
    tags: ['Facturación', 'Contingencia', 'Tutoriales'],
    addedBy: 'Ferretería Cruz',
    updatedAt: 1771500000000
  }
];

export const INITIAL_SUPPLIERS: SupplierItem[] = [
  {
    id: 'sup_holcim',
    name: 'Holcim',
    category: 'Construcción & Cemento',
    logoUrl: holcimImg,
    website: 'https://www.holcim.com.sv/',
    portalUrl: 'https://www.holcim.com.sv/',
    description: 'Líder mundial en soluciones de construcción e infraestructura, cementos de alta resistencia y concretos.',
    isFeatured: true,
    popularProducts: ['Cemento Holcim Fuerte', 'Cemento de Albañilería', 'Concretos Específicos']
  },
  {
    id: 'sup_rotoplas',
    name: 'Rotoplas',
    category: 'Plomería & Agua',
    logoUrl: rotoplasImg,
    website: 'https://rotoplascentroamerica.com/',
    portalUrl: 'https://rotoplascentroamerica.com/',
    description: 'Soluciones integrales de agua: tinacos, cisternas, tubería PPR Tuboplus, biodigestores y purificadores.',
    isFeatured: true,
    popularProducts: ['Tinacos Tricapa', 'Tubería PPR Tuboplus', 'Biodigestores', 'Filtros de Agua']
  },
  {
    id: 'sup_truper',
    name: 'Truper',
    category: 'Herramientas',
    logoUrl: truperImg,
    website: 'https://www.truper.com/banco-contenido-digital/elsalvador',
    portalUrl: 'https://www.truper.com/banco-contenido-digital/elsalvador',
    description: 'Catálogo y banco de contenido digital oficial de herramientas Truper y Pretul para El Salvador.',
    isFeatured: false,
    popularProducts: ['Herramientas Truper/Pretul', 'Carretillas', 'Palas y Piochas', 'Juegos de Dados']
  },
  {
    id: 'sup_saltex',
    name: 'Grupo Saltex',
    category: 'Construcción',
    logoUrl: saltexImg,
    website: 'https://gruposaltex.com.sv/catalogos/',
    portalUrl: 'https://gruposaltex.com.sv/catalogos/',
    description: 'Prefabricados de concreto, adoquines, bloques, soleras.',
    isFeatured: false,
    popularProducts: ['Bloques', 'Adoquines', 'Soleras']
  },
  {
    id: 'sup_reflex',
    name: 'Reflex',
    category: 'Repellos, Morteros, Acabados, Adhesivos',
    logoUrl: reflexImg,
    website: 'https://reflex.com.sv/',
    portalUrl: 'https://reflex.com.sv/',
    description: 'Materiales esenciales para la construcción, Repellos, Morteros, Acabados, Adhesivos',
    isFeatured: false,
    popularProducts: ['Repellos', 'Morteros', 'Acabados', 'Adhesivos']
  },
  {
    id: 'sup_vikingo',
    name: 'Herramientas Vikingo',
    category: 'Herramientas',
    logoUrl: vikingoImg,
    website: 'https://www.herramientas-vikingo.com/#blog',
    portalUrl: 'https://www.herramientas-vikingo.com/#blog',
    description: 'Herramientas de trabajo pesado y artículos especializados para talleres y ferretería industrial.',
    isFeatured: false,
    popularProducts: ['Herramienta Manual', 'Equipos de Taller', 'Accesorios de Seguridad']
  },
  {
    id: 'sup_hispacensa',
    name: 'Hispacensa',
    category: 'Piso & Cerámica',
    logoUrl: hispacensaImg,
    website: 'https://catalogo.hispacensa.com/',
    portalUrl: 'https://catalogo.hispacensa.com/',
    description: 'Catálogo digital de pisos cerámicos, revestimientos de alta calidad y porcelanatos.',
    isFeatured: false,
    popularProducts: ['Pisos Cerámicos', 'Revestimientos de Pared', 'Porcelanatos']
  },
  {
    id: 'sup_forjados',
    name: 'Forjados en Hierro',
    category: 'Cerrajería & Estructuras',
    logoUrl: forjadosImg,
    website: 'https://www.forjadosenhierro.com/default.aspx',
    portalUrl: 'https://www.forjadosenhierro.com/default.aspx',
    description: 'Elementos decorativos de hierro forjado, pasamanos, piezas ornamentales y herrería fina.',
    isFeatured: false,
    popularProducts: ['Piezas de Hierro Forjado', 'Pasamanos y Portones', 'Ornamentos Metalúrgicos']
  },
  {
    id: 'sup_imacasa',
    name: 'Imacasa',
    category: 'Herramientas & Agrícola',
    logoUrl: imacasaImg,
    website: 'https://imacasa.com/',
    portalUrl: 'https://imacasa.com/',
    description: 'Herramientas manuales, agrícolas e industriales con liderazgo regional en Centroamérica.',
    isFeatured: false,
    popularProducts: ['Machetes y Cuchillos', 'Palas y Piochas', 'Herramientas de Corte']
  },
  {
    id: 'sup_jf',
    name: 'JF Products',
    category: 'Plomería & Accesorios',
    logoUrl: jfImg,
    website: 'https://jfproducts.com/elsalvador/',
    portalUrl: 'https://jfproducts.com/elsalvador/',
    description: 'Productos y accesorios de plomería, grifería, válvulas y conexiones para fluidos en El Salvador.',
    isFeatured: false,
    popularProducts: ['Válvulas y Llaves', 'Conexiones de Plomería', 'Accesorios para Baño']
  },
  {
    id: 'sup_stihl',
    name: 'Indupal (Stihl)',
    category: 'Equipos & Maquinaria',
    logoUrl: stihlImg,
    website: 'https://indupal.com/stihl',
    portalUrl: 'https://indupal.com/stihl',
    description: 'Distribuidor de motores, motosierras, motoguadañas y equipos agroforestales Stihl en Indupal.',
    isFeatured: false,
    popularProducts: ['Motosierras Stihl', 'Motoguadañas', 'Sopladoras y Fumigadoras']
  }
];
