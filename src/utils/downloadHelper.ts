/**
 * Helper to check if a file, item, format, or URL corresponds to a PDF document.
 */
export const isPdfFile = (file: any): boolean => {
  if (!file) return false;
  if (typeof file === 'string') {
    const s = file.toLowerCase().trim();
    return s === 'pdf' || 
      s === 'application/pdf' || 
      s.endsWith('.pdf') || 
      s.includes('.pdf?') || 
      s.includes('.pdf#') || 
      s.includes('application/pdf') || 
      s.includes('/pdf/');
  }
  const url = String(file.file_url || file.fileUrl || file.url || file.secure_url || '').toLowerCase().trim();
  const fileType = String(file.file_type || file.fileType || file.format || file.type || '').toLowerCase().trim();
  const fileName = String(file.fileName || file.file_name || file.name || file.title || '').toLowerCase().trim();

  return url.endsWith('.pdf') || 
    url.includes('.pdf?') || 
    url.includes('.pdf#') || 
    fileType === 'pdf' || 
    fileType === 'application/pdf' || 
    fileName.endsWith('.pdf');
};

export function isPdf(itemOrUrlOrType?: any): boolean {
  return isPdfFile(itemOrUrlOrType);
}

/**
 * Transforms Cloudinary URL by inserting the fl_attachment flag to force instant download without CORS fetch issues.
 */
export const getDownloadUrl = (url?: string): string => {
  if (!url) return '#';
  let cleanUrl = url.trim();
  if (cleanUrl.includes('/upload/') && !cleanUrl.includes('fl_attachment')) {
    return cleanUrl.replace('/upload/', '/upload/fl_attachment/');
  }
  return cleanUrl;
};

/**
 * Safely opens a file in a new tab with noopener,noreferrer
 */
export function openFileInNewTab(itemOrUrl?: any) {
  if (!itemOrUrl) return;
  const url = typeof itemOrUrl === 'string' 
    ? itemOrUrl 
    : (itemOrUrl.file_url || itemOrUrl.fileUrl || itemOrUrl.url || itemOrUrl.secure_url || '');
  if (!url || url === '#') return;
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Handles reliable file download using fetch blob with object URL.
 * Falls back to window.open or attachment delivery if fetch is blocked.
 */
export const handleDownload = async (fileUrl: string, fileName?: string) => {
  if (!fileUrl) return;
  try {
    const response = await fetch(fileUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName || 'documento.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000);
  } catch (err) {
    console.warn('Direct blob download failed, falling back to window.open/attachment:', err);
    // If it is a Cloudinary URL, use fl_attachment parameter
    let targetUrl = fileUrl;
    if (targetUrl.includes('/upload/') && !targetUrl.includes('/fl_attachment/')) {
      targetUrl = targetUrl.replace('/upload/', '/upload/fl_attachment/');
    }
    const link = document.createElement('a');
    link.href = targetUrl;
    link.download = fileName || 'documento.pdf';
    link.target = '_blank';
    link.rel = 'noopener,noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

/**
 * Converts a PDF URL (especially Cloudinary) to a .jpg thumbnail preview URL.
 * Generates page 1 thumbnail (f_jpg, pg_1) for Cloudinary documents.
 */
export function getPdfThumbnailUrl(url?: string): string {
  if (!url) return '';
  const cleanUrl = url.trim();

  // Cloudinary PDF URL handling
  if (cleanUrl.includes('cloudinary.com') || cleanUrl.includes('/upload/')) {
    let thumb = cleanUrl;
    // PDF rendering requires image/upload
    thumb = thumb.replace(/\/raw\/upload\//, '/image/upload/');
    thumb = thumb.replace(/\/auto\/upload\//, '/image/upload/');

    // Inject format & page 1 parameters if not already present
    if (thumb.includes('/image/upload/') && !thumb.includes('f_jpg') && !thumb.includes('pg_1')) {
      thumb = thumb.replace('/image/upload/', '/image/upload/w_600,c_limit,f_jpg,pg_1/');
    }

    // Replace .pdf extension with .jpg
    thumb = thumb.replace(/\.pdf(\?.*)?$/i, '.jpg$1');
    return thumb;
  }

  // Generic URL ending in .pdf
  if (cleanUrl.toLowerCase().endsWith('.pdf') || cleanUrl.toLowerCase().includes('.pdf?')) {
    return cleanUrl.replace(/\.pdf(\?.*)?$/i, '.jpg$1');
  }

  return cleanUrl;
}

/**
 * Helper to generate a direct download URL from Cloudinary using /fl_attachment/
 * to force immediate download delivery across all browsers.
 */
export function getCloudinaryDownloadUrl(url?: string, fileName?: string): string {
  if (!url) return '';
  let cleanUrl = url.trim();

  // If the URL was converted to .jpg for thumbnail, ensure the download downloads the actual .pdf
  const isOriginalPdf = isPdf(url) || (fileName && isPdf(fileName));
  if (isOriginalPdf && cleanUrl.includes('.jpg') && !cleanUrl.includes('.pdf')) {
    cleanUrl = cleanUrl.replace(/\.jpg(\?.*)?$/i, '.pdf$1');
    cleanUrl = cleanUrl.replace(/w_600,c_limit,f_jpg,pg_1\/?/, '');
  }

  // If it's a Cloudinary URL
  if (cleanUrl.includes('cloudinary.com') || cleanUrl.includes('/upload/')) {
    // If it already has fl_attachment, return as is
    if (cleanUrl.includes('/fl_attachment') || cleanUrl.includes('fl_attachment/')) {
      return cleanUrl;
    }

    // Insert /fl_attachment/ directly after /upload/
    if (cleanUrl.includes('/upload/')) {
      return cleanUrl.replace('/upload/', '/upload/fl_attachment/');
    }
  }

  return cleanUrl;
}

/**
 * Executes a direct file download via object URL / fetch blob with fallback.
 * For Cloudinary URLs, handles attachment delivery to prevent browser blockages.
 */
export function triggerFileDownload(file: any) {
  if (!file) return;
  const fileUrl = typeof file === 'string' ? file : (file.file_url || file.fileUrl || file.url || file.secure_url || '');
  if (!fileUrl) return;

  const fileName = typeof file === 'object' 
    ? (file.fileName || file.title || file.name || 'documento.pdf')
    : 'documento.pdf';

  handleDownload(fileUrl, fileName);
}

/**
 * Utility to trigger reliable file downloading across all browsers for Cloudinary secure URLs,
 * Data URLs (base64), and remote HTTP/HTTPS URLs.
 */
export async function downloadFile(
  fileUrl: string, 
  title: string, 
  fileType?: string, 
  description?: string,
  fileName?: string
) {
  if (!fileUrl) return;

  try {
    const rawUrl = fileUrl.trim();

    // 1. Determine suitable extension
    let extension = '.png';
    const lowerUrl = rawUrl.toLowerCase();
    const lowerType = (fileType || '').toLowerCase();

    if (lowerType === 'pdf' || lowerUrl.includes('application/pdf') || lowerUrl.endsWith('.pdf')) {
      extension = '.pdf';
    } else if (lowerType === 'image' || lowerUrl.startsWith('data:image')) {
      if (lowerUrl.startsWith('data:image/png') || lowerUrl.endsWith('.png')) extension = '.png';
      else if (lowerUrl.startsWith('data:image/webp') || lowerUrl.endsWith('.webp')) extension = '.webp';
      else if (lowerUrl.startsWith('data:image/svg') || lowerUrl.endsWith('.svg')) extension = '.svg';
      else extension = '.jpg';
    } else if (lowerType === 'sheet' || lowerUrl.includes('sheet') || lowerUrl.includes('excel') || lowerUrl.endsWith('.xlsx')) {
      extension = '.xlsx';
    } else if (lowerType === 'doc' || lowerUrl.includes('word') || lowerUrl.endsWith('.docx')) {
      extension = '.docx';
    }

    // Sanitize title for filename
    const sanitizedTitle = (fileName || title || 'documento')
      .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s._-]/g, '')
      .trim()
      .replace(/\s+/g, '_');
    
    const finalFileName = sanitizedTitle.includes('.') 
      ? sanitizedTitle 
      : `${sanitizedTitle}${extension}`;

    // 2. Handle Data URL (Base64)
    if (rawUrl.startsWith('data:')) {
      const parts = rawUrl.split(';base64,');
      if (parts.length === 2) {
        const contentType = parts[0].split(':')[1];
        const raw = window.atob(parts[1]);
        const uInt8Array = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) {
          uInt8Array[i] = raw.charCodeAt(i);
        }
        const blob = new Blob([uInt8Array], { type: contentType });
        const blobUrl = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = finalFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
        return;
      }
    }

    // 3. For Cloudinary / Remote URLs: Use fl_attachment download link
    const downloadUrl = getCloudinaryDownloadUrl(rawUrl, finalFileName);

    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = finalFileName;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (error) {
    console.error('Download error:', error);
    // Fallback: open directly in new window
    window.open(fileUrl, '_blank');
  }
}
