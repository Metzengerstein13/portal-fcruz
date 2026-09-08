export const ADMIN_EMAILS: string[] = [
  'deliriumtremens365@gmail.com',
  'auxfcruz123@gmail.com',
  'fccontaaux@gmail.com'
];

export const checkIsAdmin = (email?: string | null, customAdminEmails?: string[]): boolean => {
  if (!email) return false;
  const lower = email.toLowerCase();
  if (ADMIN_EMAILS.map(e => e.toLowerCase()).includes(lower)) return true;
  if (customAdminEmails && customAdminEmails.map(e => e.toLowerCase()).includes(lower)) return true;
  return false;
};

export type UserRole = 'Administrador' | 'Ventas' | 'Almacén' | 'Colaborador' | 'Invitado';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  department: string;
  isDemo?: boolean;
}

export interface ManagedUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  department: string;
  status: 'Activo' | 'Inactivo';
  createdAt: string;
  createdBy?: string;
  notes?: string;
  updatedAt?: number;
}

export type DocumentCategory = 
  | 'Documentos Oficiales' 
  | 'Listas de Precios' 
  | 'Manuales y Fichas Técnicas' 
  | 'Fotos de Exhibición' 
  | 'Inventario y Almacén' 
  | 'Políticas y Seguridad';

export interface DocumentItem {
  id: string;
  title: string;
  description: string;
  category: DocumentCategory;
  tags: string[];
  url: string;
  fileUrl: string;
  fileType: 'pdf' | 'image' | 'sheet' | 'doc' | 'archive';
  fileSize: string;
  secure_url?: string;
  file_url?: string;
  file_type?: string;
  author?: string;
  uploadedBy: string;
  uploaderName: string;
  createdAt: string;
  created_at?: string;
  pinned?: boolean;
  downloadsCount?: number;
  updatedAt?: number;
  fileName?: string;
  format?: string;
  cloudinaryPublicId?: string;
  fileSizeBytes?: number;
}

export interface YouTubeVideoItem {
  id: string;
  youtubeId: string;
  title: string;
  description: string;
  category: string;
  publishedAt: string;
  thumbnail: string;
  duration: string;
  views: string;
  tags: string[];
  addedBy?: string;
  updatedAt?: number;
}


export interface SupplierItem {
  id: string;
  name: string;
  category: string;
  logoUrl: string;
  website: string;
  portalUrl: string;
  catalogUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  description: string;
  isFeatured?: boolean;
  popularProducts: string[];
}

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  type: 'urgente' | 'novedad' | 'evento' | 'capacitacion';
  important?: boolean;
}

export type ActiveTab = 'inicio' | 'documentos' | 'youtube' | 'proveedores' | 'buscador' | 'usuarios';
