/**
 * Storage & Metadata Service for Ferretería Cruz Portal
 * File Uploads: Cloudinary (pn5kmum3)
 * Metadata Storage: Supabase REST API (https://oxneafqwpffzqnnocmxw.supabase.co/rest/v1)
 * Auth: Firebase Auth exclusively for Google Sign-in
 */

import { DocumentItem, DocumentCategory } from '../types';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/supabase';

export const CLOUDINARY_CONFIG = {
  cloudName: 'pn5kmum3',
  uploadPreset: 'ml_default',
  autoUploadUrl: 'https://api.cloudinary.com/v1_1/pn5kmum3/auto/upload'
};

/**
 * Derive high-level file type from format, url or filename
 */
export function deriveFileType(
  format?: string,
  url?: string,
  filename?: string
): 'pdf' | 'image' | 'sheet' | 'doc' | 'archive' {
  const f = (format || '').toLowerCase();
  const u = (url || '').toLowerCase();
  const n = (filename || '').toLowerCase();

  if (f === 'pdf' || u.includes('.pdf') || n.endsWith('.pdf')) return 'pdf';
  if (
    ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'avif'].includes(f) ||
    /\.(jpg|jpeg|png|webp|gif|svg|avif)/i.test(u) ||
    /\.(jpg|jpeg|png|webp|gif|svg|avif)$/i.test(n)
  ) {
    return 'image';
  }
  if (
    ['xlsx', 'xls', 'csv'].includes(f) ||
    /\.(xlsx|xls|csv)/i.test(u) ||
    /\.(xlsx|xls|csv)$/i.test(n)
  ) {
    return 'sheet';
  }
  if (
    ['doc', 'docx', 'txt', 'rtf'].includes(f) ||
    /\.(doc|docx|txt|rtf)/i.test(u) ||
    /\.(doc|docx|txt|rtf)$/i.test(n)
  ) {
    return 'doc';
  }
  if (
    ['zip', 'rar', '7z', 'tar', 'gz'].includes(f) ||
    /\.(zip|rar|7z|tar|gz)/i.test(u) ||
    /\.(zip|rar|7z|tar|gz)$/i.test(n)
  ) {
    return 'archive';
  }
  return 'doc';
}

/**
 * Format bytes into human-readable size
 */
export function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '1.5 MB';
  const kb = bytes / 1024;
  if (kb >= 1024) {
    return `${(kb / 1024).toFixed(2)} MB`;
  }
  return `${Math.round(kb)} KB`;
}

/**
 * Maps a Supabase row to the app DocumentItem interface
 */
export function mapSupabaseRowToDocumentItem(row: any): DocumentItem {
  const fileUrl = String(row.file_url || row.fileUrl || row.url || '').trim();
  const fileTypeRaw = row.file_type || row.fileType || '';
  const fileType = deriveFileType(fileTypeRaw, fileUrl);
  const rawAuthor = row.author || row.uploaderName || 'Ing. Carlos Mauricio López';
  const createdAtStr = row.created_at 
    ? String(row.created_at).split('T')[0] 
    : new Date().toISOString().split('T')[0];

  let tagsArray: string[] = [];
  if (Array.isArray(row.tags)) {
    tagsArray = row.tags.filter(Boolean);
  } else if (typeof row.tags === 'string') {
    tagsArray = row.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
  } else {
    tagsArray = ['documentos', row.category || 'Oficial'];
  }

  const rawBytes = Number(row.file_size_bytes || row.fileSizeBytes || (row.file_size ? 0 : 1572864));
  const fileSize = row.file_size || (rawBytes > 0 ? formatBytes(rawBytes) : '1.5 MB');

  return {
    id: String(row.id),
    title: row.title || 'Documento sin título',
    description: row.description || '',
    category: (row.category || 'Documentos Oficiales') as DocumentCategory,
    tags: tagsArray,
    url: fileUrl,
    fileUrl: fileUrl,
    fileType: fileType,
    fileName: row.file_name || row.fileName || (fileUrl ? fileUrl.split('/').pop() : `${row.title}.${fileTypeRaw || 'pdf'}`),
    fileSize: fileSize,
    fileSizeBytes: rawBytes || 1572864,
    secure_url: fileUrl,
    file_url: fileUrl,
    format: fileTypeRaw,
    file_type: fileTypeRaw,
    uploadedBy: row.uploaded_by || row.uploadedBy || 'deliriumtremens365@gmail.com',
    uploaderName: rawAuthor,
    author: rawAuthor,
    createdAt: createdAtStr,
    created_at: row.created_at,
    pinned: Boolean(row.pinned),
    downloadsCount: Number(row.downloads_count || row.downloadsCount || 0),
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
    cloudinaryPublicId: row.cloudinary_public_id || row.cloudinaryPublicId || String(row.id)
  };
}

/**
 * Fetch documents from the server backup store if Supabase is initializing
 */
async function fetchServerDocuments(): Promise<DocumentItem[]> {
  try {
    const res = await fetch('/api/documents');
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.documents)) {
        return data.documents;
      }
    }
  } catch (e) {
    // silently catch server error
  }
  return [];
}

/**
 * Consulta de documentos (fetchFiles)
 */
export const fetchFiles = async (): Promise<DocumentItem[]> => {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/documents?select=*&order=created_at.desc`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map(mapSupabaseRowToDocumentItem);
      }
    } else {
      const errorText = await response.text().catch(() => '');
      console.warn('Respuesta Supabase:', response.status, errorText);
    }
  } catch (error) {
    console.error('Error consultando Supabase:', error);
  }

  // Backup fallback to keep UI populated
  return await fetchServerDocuments();
};

export const loadFiles = fetchFiles;
export const syncDocumentsFromCloudinary = fetchFiles;

/**
 * Upload file to Cloudinary, then save metadata row directly in Supabase
 */
export async function uploadDocumentToCloudinary(params: {
  file: File | Blob | string;
  title: string;
  description: string;
  category: DocumentCategory;
  tags?: string[];
  uploadedBy?: string;
  uploaderName?: string;
  fileName?: string;
  onProgress?: (percent: number, statusText: string) => void;
}): Promise<DocumentItem> {
  const {
    file,
    title,
    description,
    category,
    uploaderName,
    fileName,
    onProgress
  } = params;

  onProgress?.(20, 'Preparando archivo para Cloudinary...');

  const resolvedFileName = fileName || (file instanceof File ? file.name : (typeof file === 'string' ? file : ''));
  const fileExtension = (resolvedFileName.split('.').pop() || '').toLowerCase().split('?')[0].split('#')[0];
  const fileTypeString = (file instanceof File || file instanceof Blob) ? (file.type || '').toLowerCase() : '';

  // PDFs and image files (.jpg, .png, .webp, etc.) MUST be uploaded with resource_type = 'image' for page 1 preview generation.
  // Only Excel (.xlsx, .xls), Word (.docx, .doc), .csv, and .zip are uploaded with resource_type = 'raw'.
  const isPdf = fileExtension === 'pdf' || fileTypeString.includes('pdf');
  const isRawDocument = !isPdf && (
    ['xlsx', 'xls', 'docx', 'doc', 'zip', 'csv', 'rar', '7z', 'tar', 'gz', 'txt', 'rtf', 'pptx', 'ppt'].includes(fileExtension) ||
    fileTypeString.includes('spreadsheet') ||
    fileTypeString.includes('wordprocessingml') ||
    fileTypeString.includes('zip') ||
    fileTypeString.includes('csv') ||
    fileTypeString.includes('msword') ||
    fileTypeString.includes('excel') ||
    fileTypeString.includes('presentationml')
  );

  const resourceType = isRawDocument ? 'raw' : 'image';
  const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/${resourceType}/upload`;

  const formData = new FormData();
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);

  if (typeof file === 'string') {
    formData.append('file', file);
  } else {
    const rawFileName = fileName || (file instanceof File ? file.name : `documento.${fileExtension || (isRawDocument ? 'bin' : 'jpg')}`);
    formData.append('file', file, rawFileName);
  }

  onProgress?.(45, 'Subiendo archivo a Cloudinary...');

  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: formData
  });

  const result = await response.json();

  if (!response.ok || result.error) {
    console.error('Cloudinary upload error:', result);
    throw new Error(result.error?.message || `Error al subir a Cloudinary (${response.status})`);
  }

  onProgress?.(80, 'Guardando metadatos en Supabase...');

  const authorName = uploaderName || 'Ing. Carlos Mauricio López';
  const isFinalPdf = fileExtension === 'pdf' || 
    fileTypeString.includes('pdf') || 
    result.format === 'pdf' || 
    (result.secure_url && result.secure_url.toLowerCase().includes('.pdf')) ||
    (result.original_filename && result.original_filename.toLowerCase().endsWith('.pdf'));

  const fileTypeFormat = isFinalPdf ? 'pdf' : (fileExtension || result.format || (isRawDocument ? 'doc' : (result.resource_type || 'image')));

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify([{
        title: title.trim(),
        description: (description || '').trim(),
        category: category,
        file_url: result.secure_url,
        file_type: isFinalPdf ? 'pdf' : fileTypeFormat,
        author: authorName
      }])
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Error al guardar');
    }

    const data = await res.json();
    alert('¡Documento guardado con éxito!');
    await fetchFiles();

    onProgress?.(100, '¡Archivo guardado exitosamente!');

    if (Array.isArray(data) && data.length > 0) {
      return mapSupabaseRowToDocumentItem(data[0]);
    }
  } catch (err: any) {
    alert('Error de conexión: ' + (err.message || err));
  }

  const fallbackItem: DocumentItem = {
    id: String(result.public_id || `doc_${Date.now()}`),
    title: title.trim(),
    description: (description || '').trim(),
    category: category,
    tags: [category, 'documentos'],
    url: result.secure_url,
    fileUrl: result.secure_url,
    fileType: isFinalPdf ? 'pdf' : deriveFileType(fileTypeFormat, result.secure_url),
    fileName: fileName || (file instanceof File ? file.name : `${title}.${isFinalPdf ? 'pdf' : fileTypeFormat}`),
    fileSize: result.bytes ? formatBytes(result.bytes) : '1.5 MB',
    fileSizeBytes: result.bytes || 1572864,
    secure_url: result.secure_url,
    file_url: result.secure_url,
    format: isFinalPdf ? 'pdf' : fileTypeFormat,
    file_type: isFinalPdf ? 'pdf' : fileTypeFormat,
    uploadedBy: 'deliriumtremens365@gmail.com',
    uploaderName: authorName,
    author: authorName,
    createdAt: new Date().toISOString().split('T')[0],
    pinned: false,
    downloadsCount: 0,
    updatedAt: Date.now(),
    cloudinaryPublicId: result.public_id || `cld_${Date.now()}`
  };

  // Sync to local server backup
  fetch('/api/documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fallbackItem)
  }).catch(() => null);

  return fallbackItem;
}

/**
 * Delete a document by its ID
 */
export async function deleteDocumentFromSharedCatalog(fileId: string): Promise<void> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/documents?id=eq.${encodeURIComponent(fileId)}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Error eliminando documento en Supabase');
    }

    await fetchFiles();
  } catch (err: any) {
    console.warn('Eliminación Supabase:', err?.message || err);
  }

  try {
    await fetch(`/api/documents/${encodeURIComponent(fileId)}`, {
      method: 'DELETE'
    });
  } catch (e) {
    // ignore
  }
}

/**
 * Update document fields
 */
export async function updateDocumentInSharedCatalog(
  fileId: string,
  updatedFields: Partial<DocumentItem>
): Promise<void> {
  const payload: any = {};
  if (updatedFields.title !== undefined) payload.title = updatedFields.title;
  if (updatedFields.description !== undefined) payload.description = updatedFields.description;
  if (updatedFields.category !== undefined) payload.category = updatedFields.category;
  if (updatedFields.pinned !== undefined) payload.pinned = updatedFields.pinned;
  if (updatedFields.downloadsCount !== undefined) payload.downloads_count = updatedFields.downloadsCount;

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/documents?id=eq.${encodeURIComponent(fileId)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(payload)
    });

    await fetchFiles();
  } catch (err: any) {
    console.warn('Actualización Supabase:', err?.message || err);
  }

  try {
    await fetch(`/api/documents/${encodeURIComponent(fileId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedFields)
    });
  } catch (e) {
    // ignore
  }
}
