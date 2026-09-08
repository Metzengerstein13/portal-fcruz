import React, { useState } from 'react';
import { FileText, Loader2, ExternalLink, Download, Eye, Image as ImageIcon } from 'lucide-react';
import { 
  isPdf, 
  isPdfFile,
  getPdfThumbnailUrl, 
  getCloudinaryDownloadUrl, 
  getDownloadUrl,
  downloadFile,
  openFileInNewTab,
  triggerFileDownload,
  handleDownload
} from '../utils/downloadHelper';

export { 
  isPdf, 
  isPdfFile,
  getPdfThumbnailUrl, 
  getCloudinaryDownloadUrl, 
  getDownloadUrl,
  downloadFile,
  openFileInNewTab,
  triggerFileDownload,
  handleDownload
};

export async function resolveFileBlobUrl(url: string): Promise<string> {
  return url || '';
}

interface DocImagePreviewProps {
  url: string;
  alt: string;
  className?: string;
}

export const DocImagePreview: React.FC<DocImagePreviewProps> = ({ 
  url, 
  alt, 
  className = 'w-full h-full object-cover' 
}) => {
  const [hasError, setHasError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // If the provided url is actually a PDF, render DocPdfPreview seamlessly
  if (isPdfFile(url)) {
    return <DocPdfPreview url={url} title={alt} className={className} isInteractive={false} />;
  }

  if (!url || hasError) {
    return (
      <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-400 p-2 text-center">
        <ImageIcon className="w-6 h-6 text-slate-400 mb-1" />
        <span className="text-[10px] font-medium text-slate-400">Sin vista previa</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-slate-100 flex items-center justify-center overflow-hidden">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        </div>
      )}
      <img
        src={url}
        alt={alt}
        className={`${className} ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setHasError(true);
          setLoaded(true);
        }}
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

interface DocPdfPreviewProps {
  url: string;
  title: string;
  description?: string;
  className?: string;
  isInteractive?: boolean;
}

export const DocPdfPreview: React.FC<DocPdfPreviewProps> = ({
  url,
  title,
  description = '',
  className = 'w-full h-full',
  isInteractive = false,
}) => {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const thumbnailUrl = getPdfThumbnailUrl(url);

  // If interactive (modal full preview)
  if (isInteractive) {
    const previewUrl = url || '';
    const downloadUrl = previewUrl.includes('/upload/') 
      ? (previewUrl.includes('fl_attachment') ? previewUrl : previewUrl.replace('/upload/', '/upload/fl_attachment/'))
      : previewUrl;

    return (
      <div className={`flex flex-col items-center justify-center p-8 sm:p-12 bg-slate-800 rounded-xl text-white my-4 text-center ${className}`}>
        <div className="bg-red-500/20 p-6 rounded-full mb-4">
          <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.586-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
          </svg>
        </div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-slate-400 text-sm mb-6">Documento PDF listo para consultar o descargar.</p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a 
            href={previewUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow transition flex items-center gap-2 cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Abrir PDF en ventana nueva</span>
          </a>
          <a 
            href={downloadUrl} 
            download={title || 'documento.pdf'}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg shadow transition flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Archivo</span>
          </a>
        </div>
      </div>
    );
  }

  // STATIC THUMBNAIL (For Card List / Grid)
  return (
    <div className={`relative w-full h-full bg-slate-100 flex items-center justify-center overflow-hidden ${className}`}>
      {!imgError && thumbnailUrl ? (
        <>
          {!imgLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-rose-400">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          )}
          <img
            src={thumbnailUrl}
            alt={title}
            className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            referrerPolicy="no-referrer"
          />
        </>
      ) : (
        /* Fallback generic PDF vector display */
        <div className="flex flex-col items-center justify-center w-full h-full bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <svg className="w-14 h-14 text-red-500 mb-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 18h12a2 2 0 002-2V6l-4-4H4a2 2 0 00-2 2v12a2 2 0 002 2z" opacity="0.5" />
            <path d="M14 2l4 4h-4V2z" />
            <text x="5" y="15" fill="currentColor" fontSize="8" fontWeight="bold">PDF</text>
          </svg>
          <span className="text-xs font-semibold text-red-700 truncate max-w-full">{title || 'Documento PDF'}</span>
        </div>
      )}

      {/* PDF Tag Badge */}
      <div className="absolute top-2 right-2 bg-rose-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs uppercase tracking-wider flex items-center gap-1 z-10 pointer-events-none">
        <FileText className="w-2.5 h-2.5" />
        <span>PDF</span>
      </div>

      {/* Hover Action Overlay */}
      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20 backdrop-blur-2xs pointer-events-none">
        <span className="px-3 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-semibold shadow-lg flex items-center gap-1.5 scale-95 group-hover:scale-100 transition-transform">
          <Eye className="w-3.5 h-3.5 text-rose-600" />
          <span>Ver PDF</span>
        </span>
      </div>
    </div>
  );
};

