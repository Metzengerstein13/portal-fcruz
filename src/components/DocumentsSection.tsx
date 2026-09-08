import React, { useState } from 'react';
import { DocumentItem, DocumentCategory, UserProfile } from '../types';
import { 
  downloadFile, 
  getCloudinaryDownloadUrl, 
  getDownloadUrl,
  isPdf, 
  isPdfFile,
  openFileInNewTab, 
  triggerFileDownload 
} from '../utils/downloadHelper';
import { DocImagePreview, DocPdfPreview } from './FilePreviews';
import { 
  FileText, 
  Upload, 
  Search, 
  Filter, 
  Image as ImageIcon, 
  FileSpreadsheet, 
  FileArchive, 
  FileCode, 
  Pin, 
  Trash2, 
  Download, 
  Eye, 
  X, 
  Plus, 
  Check, 
  Tag, 
  Calendar, 
  User, 
  Sparkles,
  Lock,
  Grid,
  List,
  AlertCircle,
  ExternalLink,
  Loader2,
  Pencil,
  HardDrive,
  RefreshCw
} from 'lucide-react';

const TOTAL_STORAGE_BYTES = 25 * 1024 * 1024 * 1024; // 25 GB

function calculateUsedStorageBytes(docs: DocumentItem[]): number {
  let totalBytes = 0;
  for (const doc of docs) {
    if (doc.fileSize) {
      const match = doc.fileSize.match(/^([\d.]+)\s*([A-Za-z]+)$/);
      if (match) {
        const value = parseFloat(match[1]);
        const unit = match[2].toUpperCase();
        if (unit.startsWith('G')) {
          totalBytes += value * 1024 * 1024 * 1024;
        } else if (unit.startsWith('M')) {
          totalBytes += value * 1024 * 1024;
        } else if (unit.startsWith('K')) {
          totalBytes += value * 1024;
        } else {
          totalBytes += value;
        }
      } else {
        totalBytes += 2 * 1024 * 1024;
      }
    } else if (doc.fileUrl && doc.fileUrl.startsWith('data:')) {
      totalBytes += Math.round(doc.fileUrl.length * 0.75);
    } else {
      totalBytes += 1.5 * 1024 * 1024;
    }
  }
  return totalBytes;
}

function formatStorageSize(bytes: number): string {
  if (bytes <= 0) return '0 MB';
  const k = 1024;
  if (bytes < k * k) {
    return `${(bytes / k).toFixed(1)} KB`;
  } else if (bytes < k * k * k) {
    return `${(bytes / (k * k)).toFixed(1)} MB`;
  } else {
    return `${(bytes / (k * k * k)).toFixed(2)} GB`;
  }
}

interface DocumentsSectionProps {
  documents: DocumentItem[];
  currentUser: UserProfile | null;
  onAddDocument: (
    docItem: Omit<DocumentItem, 'id' | 'createdAt'> & { fileObj?: File | null },
    onProgress?: (percent: number, statusText: string) => void
  ) => Promise<void> | void;
  onUpdateDocument: (docId: string, updatedFields: Partial<DocumentItem>) => Promise<void> | void;
  onDeleteDocument: (docId: string) => void;
  onTogglePin: (docId: string) => void;
  onOpenLogin: () => void;
  onRefresh?: () => Promise<void> | void;
  isLoading?: boolean;
}

const CATEGORIES: DocumentCategory[] = [
  'Documentos Oficiales',
  'Listas de Precios',
  'Manuales y Fichas Técnicas',
  'Fotos de Exhibición',
  'Inventario y Almacén',
  'Políticas y Seguridad',
];

// Smart Canvas Compressor for Images to fit comfortably (< 500KB)
async function compressImageFile(file: File): Promise<{ dataUrl: string; fileSizeStr: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Error al leer el archivo de imagen.'));
    reader.onload = () => {
      const result = reader.result as string;
      const img = new Image();
      img.onerror = () => reject(new Error('Formato de imagen no válido o corrupto.'));
      img.onload = () => {
        let canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        let maxDim = 1200;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        let ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            dataUrl: result,
            fileSizeStr: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        let compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);

        // If compressed image is still > 600,000 characters (~450KB), adjust quality slightly
        if (compressedDataUrl.length > 600000) {
          maxDim = 900;
          width = img.width;
          height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            compressedDataUrl = canvas.toDataURL('image/jpeg', 0.65);
          }
        }

        const sizeInKB = Math.round((compressedDataUrl.length * 0.75) / 1024);
        const sizeStr = sizeInKB > 1000 ? `${(sizeInKB / 1024).toFixed(1)} MB` : `${sizeInKB} KB`;

        resolve({
          dataUrl: compressedDataUrl,
          fileSizeStr: sizeStr
        });
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
}

export const DocumentsSection: React.FC<DocumentsSectionProps> = ({
  documents,
  currentUser,
  onAddDocument,
  onUpdateDocument,
  onDeleteDocument,
  onTogglePin,
  onOpenLogin,
  onRefresh,
  isLoading = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Modal states
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [viewDocumentModal, setViewDocumentModal] = useState<DocumentItem | null>(null);
  const [editingDoc, setEditingDoc] = useState<DocumentItem | null>(null);
  const [docToDelete, setDocToDelete] = useState<DocumentItem | null>(null);
  const [isDeletingDoc, setIsDeletingDoc] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // New Document Form State
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<DocumentCategory>('Documentos Oficiales');
  const [formFileType, setFormFileType] = useState<'pdf' | 'image' | 'sheet' | 'doc'>('pdf');
  const [formDescription, setFormDescription] = useState('');
  const [formFileUrl, setFormFileUrl] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formFileSize, setFormFileSize] = useState('');
  const [selectedFileObj, setSelectedFileObj] = useState<File | null>(null);

  // Edit Document Form State
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<DocumentCategory>('Documentos Oficiales');
  const [editDescription, setEditDescription] = useState('');
  const [editTags, setEditTags] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  
  // File processing and submit loading states
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatusText, setUploadStatusText] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Filtered documents - robust normalized matching for all document formats
  const filteredDocs = documents.filter((doc) => {
    const docCat = (doc.category || '').trim().toLowerCase();
    const selCat = (selectedCategory || '').trim().toLowerCase();
    const matchesCategory = selCat === 'todos' || docCat === selCat;

    const query = searchQuery.trim().toLowerCase();
    if (!query) return matchesCategory;

    const matchesQuery = 
      (doc.title || '').toLowerCase().includes(query) ||
      (doc.description || '').toLowerCase().includes(query) ||
      (doc.fileName || '').toLowerCase().includes(query) ||
      (doc.format || '').toLowerCase().includes(query) ||
      (doc.fileType || '').toLowerCase().includes(query) ||
      (Array.isArray(doc.tags) && doc.tags.some((t) => (t || '').toLowerCase().includes(query)));

    return matchesCategory && matchesQuery;
  });

  // Sort pinned docs first
  const sortedDocs = [...filteredDocs].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsProcessingFile(true);
    setSelectedFileObj(file);

    // Auto-fill title if empty with clean filename
    if (!formTitle.trim()) {
      const cleanName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[_-]+/g, ' ')
        .trim();
      setFormTitle(cleanName);
    }

    try {
      const lowerName = file.name.toLowerCase();
      const isImg = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(lowerName);
      const isPdf = file.type.includes('pdf') || lowerName.endsWith('.pdf');
      const isSheet = file.type.includes('sheet') || file.type.includes('excel') || file.type.includes('csv') || /\.(xlsx|xls|csv)$/i.test(lowerName);

      const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
      const sizeStr = file.size >= 1024 * 1024 ? `${sizeInMB} MB` : `${Math.round(file.size / 1024)} KB`;
      setFormFileSize(sizeStr);

      if (isImg) {
        setFormFileType('image');
        try {
          const { dataUrl, fileSizeStr } = await compressImageFile(file);
          setFormFileUrl(dataUrl);
          if (fileSizeStr) setFormFileSize(fileSizeStr);
        } catch {
          setFormFileUrl('');
        }
      } else if (isPdf) {
        setFormFileType('pdf');
        setFormFileUrl('');
      } else if (isSheet) {
        setFormFileType('sheet');
        setFormFileUrl('');
      } else {
        setFormFileType('doc');
        setFormFileUrl('');
      }
    } catch (err: any) {
      setUploadError(err.message || 'Error al procesar el archivo seleccionado.');
      setFormFileUrl('');
      setSelectedFileObj(null);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleFormSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && 'preventDefault' in e) {
      e.preventDefault();
    }
    console.log("1. Botón Guardar presionado");
    setUploadError(null);

    // Auto-generate title if missing
    let finalTitle = formTitle.trim();
    if (!finalTitle) {
      if (selectedFileObj) {
        finalTitle = selectedFileObj.name.replace(/\.[^/.]+$/, '').trim();
      } else {
        finalTitle = 'Documento';
      }
    }

    if (!formFileUrl && !selectedFileObj) {
      setUploadError('Por favor selecciona una foto o archivo desde tu dispositivo.');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(15);
    setUploadStatusText('Iniciando subida a Cloudinary...');

    try {
      const tagsArray = formTags
        ? formTags
            .split(',')
            .map((t) => t.trim())
            .filter((t) => t.length > 0)
        : [];

      const fileExtension = selectedFileObj
        ? selectedFileObj.name.split('.').pop()?.toLowerCase() || formFileType
        : formFileType;

      await onAddDocument(
        {
          title: finalTitle,
          category: formCategory,
          fileType: formFileType,
          fileUrl: formFileUrl,
          fileSize: formFileSize || '1 MB',
          fileName: selectedFileObj?.name || finalTitle,
          format: fileExtension,
          fileObj: selectedFileObj,
          description: formDescription.trim() || '',
          uploadedBy: currentUser?.email || 'deliriumtremens365@gmail.com',
          uploaderName: currentUser?.displayName || 'Ing. Carlos Mauricio López',
          tags: tagsArray.length > 0 ? tagsArray : [formCategory],
          pinned: false,
          downloadsCount: 0
        },
        (percent, statusText) => {
          setUploadProgress(percent);
          setUploadStatusText(statusText);
        }
      );

      // Successfully saved to Cloudinary and Supabase
      setUploadProgress(100);
      setUploadStatusText('¡Completado con éxito!');

      // Reset form and close modal immediately
      setFormTitle('');
      setFormDescription('');
      setFormFileUrl('');
      setFormTags('');
      setFormFileSize('');
      setSelectedFileObj(null);
      setUploadError(null);
      setUploadModalOpen(false);
    } catch (error: any) {
      console.error('Error detallado:', error);
      const errMsg = error?.message || 'Error al guardar el archivo.';
      setUploadError(errMsg);
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
      setUploadStatusText('');
    }
  };

  const handleOpenEdit = (doc: DocumentItem) => {
    setEditingDoc(doc);
    setEditTitle(doc.title);
    setEditCategory(doc.category);
    setEditDescription(doc.description || '');
    setEditTags(doc.tags ? doc.tags.join(', ') : '');
    setEditError(null);
  };

  const handleSaveEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;
    if (!editTitle.trim()) {
      setEditError('El título o nombre del archivo es obligatorio.');
      return;
    }

    setIsSavingEdit(true);
    setEditError(null);

    try {
      const tagsArray = editTags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const updatedFields: Partial<DocumentItem> = {
        title: editTitle.trim(),
        category: editCategory,
        description: editDescription.trim() || 'Sin descripción',
        tags: tagsArray.length > 0 ? tagsArray : [editCategory],
      };

      await onUpdateDocument(editingDoc.id, updatedFields);

      // If detail modal is open for this doc, update it in-place
      if (viewDocumentModal && viewDocumentModal.id === editingDoc.id) {
        setViewDocumentModal((prev) => (prev ? { ...prev, ...updatedFields } : null));
      }

      setEditingDoc(null);
    } catch (err: any) {
      console.error('Error updating document:', err);
      setEditError(err.message || 'Error al actualizar el documento.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!docToDelete) return;
    setIsDeletingDoc(true);
    setDeleteError(null);
    try {
      await onDeleteDocument(docToDelete.id);
      if (viewDocumentModal && viewDocumentModal.id === docToDelete.id) {
        setViewDocumentModal(null);
      }
      setDocToDelete(null);
    } catch (err: any) {
      console.error('Error deleting document:', err);
      setDeleteError(err.message || 'Error al eliminar el documento.');
    } finally {
      setIsDeletingDoc(false);
    }
  };

  const getFileIcon = (fileOrType: any) => {
    if (isPdf(fileOrType)) {
      return <FileText className="w-5 h-5 text-rose-600" />;
    }
    const type = typeof fileOrType === 'string' ? fileOrType : (fileOrType?.fileType || fileOrType?.file_type || '');
    switch (type) {
      case 'image':
        return <ImageIcon className="w-5 h-5 text-emerald-600" />;
      case 'sheet':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-700" />;
      case 'pdf':
        return <FileText className="w-5 h-5 text-rose-600" />;
      default:
        return <FileText className="w-5 h-5 text-blue-600" />;
    }
  };

  // Real Storage Calculation
  const usedStorageBytes = calculateUsedStorageBytes(documents);
  const usedStoragePercent = (usedStorageBytes / TOTAL_STORAGE_BYTES) * 100;
  const freeStorageBytes = Math.max(0, TOTAL_STORAGE_BYTES - usedStorageBytes);
  const freeStoragePercent = Math.max(0, 100 - usedStoragePercent);

  const usedSizeStr = formatStorageSize(usedStorageBytes);
  const freeSizeStr = formatStorageSize(freeStorageBytes);
  const usedPercentStr = usedStoragePercent < 0.1 && usedStorageBytes > 0 
    ? '< 0.1%' 
    : `${usedStoragePercent.toFixed(1)}%`;
  const freePercentStr = `${freeStoragePercent.toFixed(1)}%`;

  if (!currentUser) {
    return (
      <div className="bg-white rounded-xl p-8 sm:p-12 text-center border border-slate-200 shadow-sm max-w-2xl mx-auto my-12">
        <div className="w-16 h-16 rounded-xl bg-blue-50 text-[#0f03f9] flex items-center justify-center mx-auto mb-4 border border-blue-200">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900">
          Panel Privado de Archivos & Fotos
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
          Para proteger la confidencialidad de listas de precios, catálogos mayoristas e inventarios de Ferretería Cruz, debes iniciar sesión con tu cuenta corporativa.
        </p>
        <button
          onClick={onOpenLogin}
          className="mt-6 px-6 py-3 rounded-lg font-bold text-xs bg-[#0f03f9] hover:bg-[#0c02cb] text-white shadow-sm transition-all inline-flex items-center gap-2"
        >
          <Lock className="w-4 h-4" />
          <span>Iniciar Sesión para Ver Documentos</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-[#0f03f9] border border-blue-100 uppercase tracking-wider">
              Módulo de Archivos
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {documents.length} archivos disponibles
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">
            Archivos & Fotos
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Gestión interna de catálogos, listas de precios, manuales y fotos de exhibición.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Refresh / Sync Cloudinary button */}
          {onRefresh && (
            <button
              onClick={async () => {
                setIsRefreshing(true);
                try {
                  await onRefresh();
                } finally {
                  setTimeout(() => setIsRefreshing(false), 500);
                }
              }}
              disabled={isRefreshing || isLoading}
              className="p-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-2 text-xs font-semibold text-slate-700 transition-colors cursor-pointer disabled:opacity-50"
              title="Sincronizar directamente con Cloudinary"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#0f03f9] ${isRefreshing || isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sincronizar Cloudinary</span>
            </button>
          )}

          {/* Real Storage Quick Stats */}
          <div className="p-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-3 text-xs">
            <div className="p-1.5 bg-white text-[#0f03f9] rounded border border-slate-200 shadow-2xs">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-800">{usedSizeStr}</span>
                <span className="text-[10px] text-slate-500">de 25 GB</span>
                <span className="text-[10px] font-bold px-1 rounded bg-blue-100/80 text-[#0f03f9]">
                  {usedPercentStr}
                </span>
              </div>
              <div className="text-[10px] text-emerald-700 font-medium">
                {freeSizeStr} libres ({freePercentStr})
              </div>
            </div>
          </div>

          {currentUser?.role === 'Administrador' && (
            <button
              onClick={() => setUploadModalOpen(true)}
              className="px-4 py-2.5 rounded-lg font-bold text-xs bg-[#0f03f9] hover:bg-[#0c02cb] text-white shadow-xs transition-all flex items-center justify-center gap-2 active:scale-95 shrink-0 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Subir Archivo o Foto</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Bar & Category Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Search Field */}
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar por título, descripción o etiqueta (ej. Truper, Precios)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#0f03f9] focus:ring-1 focus:ring-[#0f03f9]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 text-xs"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* View Toggle (Grid / List) */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 self-end sm:self-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs font-semibold transition-colors ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Vista en Cuadrícula"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md text-xs font-semibold transition-colors ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Vista en Lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Categories Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('Todos')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'Todos'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Todos ({documents.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = documents.filter(
              (d) => (d.category || '').trim().toLowerCase() === cat.trim().toLowerCase()
            ).length;
            const isSelected = (selectedCategory || '').trim().toLowerCase() === cat.trim().toLowerCase();
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-[#0f03f9] text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Document Items Grid / List View */}
      {sortedDocs.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-800">No se encontraron archivos</h4>
          <p className="text-xs text-slate-500 mt-1">
            Intenta cambiar el término de búsqueda o selecciona otra categoría.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedDocs.map((doc) => (
            <div
              key={doc.id}
              className={`group bg-white rounded-xl border transition-all duration-200 hover:border-blue-300 hover:shadow-md flex flex-col justify-between overflow-hidden relative ${
                doc.pinned ? 'border-blue-300 ring-1 ring-blue-200 bg-blue-50/10' : 'border-slate-200'
              }`}
            >
              {/* Pin indicator badge */}
              {doc.pinned && (
                <div className="absolute top-3 right-3 z-10 bg-[#0f03f9] text-white p-1 rounded shadow-xs">
                  <Pin className="w-3.5 h-3.5 fill-white" />
                </div>
              )}

              {/* Preview Header / Thumbnail */}
              <div 
                onClick={() => {
                  const targetUrl = doc.fileUrl || (doc as any).file_url;
                  if (targetUrl) {
                    openFileInNewTab(targetUrl);
                  } else {
                    setViewDocumentModal(doc);
                  }
                }}
                className="relative h-44 bg-slate-100 overflow-hidden border-b border-slate-100 cursor-pointer"
                title={`Haz clic para abrir ${doc.title} en una nueva pestaña`}
              >
                {isPdfFile(doc) ? (
                  <DocPdfPreview
                    url={doc.fileUrl || (doc as any).file_url}
                    title={doc.title}
                    description={doc.description}
                    className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                    isInteractive={false}
                  />
                ) : doc.fileType === 'image' || (doc as any).file_type === 'image' ? (
                  <DocImagePreview
                    url={doc.fileUrl || (doc as any).file_url}
                    alt={doc.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : doc.fileType === 'sheet' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 p-4 text-center group-hover:scale-105 transition-transform duration-300">
                    <div className="w-12 h-12 rounded-xl bg-white shadow-xs border border-emerald-200 flex items-center justify-center mb-2 text-emerald-600">
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                      EXCEL / HOJA • {doc.fileSize}
                    </span>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 text-center group-hover:scale-105 transition-transform duration-300">
                    <div className="w-12 h-12 rounded-xl bg-white shadow-xs border border-blue-200 flex items-center justify-center mb-2 text-blue-600">
                      <FileText className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-blue-800 bg-blue-100 px-2 py-0.5 rounded border border-blue-200">
                      DOCUMENTO • {doc.fileSize}
                    </span>
                  </div>
                )}

                <div 
                  className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <a
                    href={doc.fileUrl || (doc as any).file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-md bg-[#0f03f9] text-white font-bold text-xs shadow-md hover:bg-[#0c02cb] transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Ver / Abrir</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setViewDocumentModal(doc)}
                    className="px-3 py-1.5 rounded-md bg-white text-slate-900 font-bold text-xs shadow-md hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Detalle</span>
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                      {doc.category}
                    </span>
                  </div>

                  <h3 
                    onClick={() => {
                      const targetUrl = doc.fileUrl || (doc as any).file_url;
                      if (targetUrl) openFileInNewTab(targetUrl);
                      else setViewDocumentModal(doc);
                    }}
                    className="font-bold text-slate-900 text-sm line-clamp-2 leading-snug group-hover:text-[#0f03f9] transition-colors cursor-pointer"
                    title="Haz clic para abrir el archivo"
                  >
                    {doc.title}
                  </h3>

                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">
                    {doc.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {doc.tags.map((tag) => (
                      <span key={tag} className="text-[10px] font-medium text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Metadata footer */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span className="truncate max-w-[140px]">Por: {doc.uploaderName}</span>
                    <span>{doc.createdAt}</span>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onTogglePin(doc.id)}
                        className={`p-1.5 rounded transition-colors ${
                          doc.pinned ? 'text-[#0f03f9] bg-blue-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                        }`}
                        title={doc.pinned ? 'Fijado' : 'Fijar arriba'}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleOpenEdit(doc)}
                        className="p-1.5 rounded text-slate-400 hover:text-[#0f03f9] hover:bg-blue-50 transition-colors"
                        title="Editar nombre, categoría o descripción"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          setDeleteError(null);
                          setDocToDelete(doc);
                        }}
                        className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Eliminar documento permanentemente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {(doc.fileUrl || (doc as any).file_url) && (
                        <a
                          href={doc.fileUrl || (doc as any).file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-[#0f03f9] font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                          title="Abrir archivo en nueva pestaña"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Ver / Abrir</span>
                        </a>
                      )}
                      <a
                        href={getDownloadUrl(doc.fileUrl || (doc as any).file_url)}
                        download={doc.title || 'documento.pdf'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                        title="Descargar archivo a tu dispositivo"
                      >
                        <Download className="w-3 h-3" />
                        <span>Descargar</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="divide-y divide-slate-100">
            {sortedDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 shrink-0">
                    {getFileIcon(doc)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm hover:text-[#0f03f9] cursor-pointer" onClick={() => setViewDocumentModal(doc)}>
                        {doc.title}
                      </h4>
                      {doc.pinned && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-[#0f03f9]">
                          Fijado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{doc.description}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                      <span>Categoría: <strong>{doc.category}</strong></span>
                      <span>•</span>
                      <span>Subido por: {doc.uploaderName}</span>
                      <span>•</span>
                      <span>{doc.createdAt}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {(doc.fileUrl || (doc as any).file_url) && (
                    <a
                      href={doc.fileUrl || (doc as any).file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-md bg-blue-50 hover:bg-blue-100 text-[#0f03f9] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                      title="Abrir archivo en una nueva pestaña"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Ver / Abrir</span>
                    </a>
                  )}
                  <button
                    onClick={() => setViewDocumentModal(doc)}
                    className="p-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                    title="Ver Detalle"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(doc)}
                    className="p-2 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-[#0f03f9] text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                    title="Editar nombre, categoría y descripción"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <a
                    href={getDownloadUrl(doc.fileUrl || (doc as any).file_url)}
                    download={doc.title || 'documento.pdf'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-md bg-[#0f03f9] hover:bg-[#0c02cb] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                    title="Descargar archivo a tu dispositivo"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar</span>
                  </a>
                  <button
                    onClick={() => {
                      setDeleteError(null);
                      setDocToDelete(doc);
                    }}
                    className="p-2 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                    title="Eliminar documento permanentemente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 text-[#0f03f9]">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Subir Archivo o Foto</h3>
                  <p className="text-xs text-slate-500">Agrega un nuevo documento o imagen para el equipo</p>
                </div>
              </div>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
                disabled={isSubmitting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {uploadError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{uploadError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Título del Documento o Foto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Foto Exhibidor Truper o Lista de Precios Mayo 2026"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:border-[#0f03f9]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Categoría</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as DocumentCategory)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:border-[#0f03f9]"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Archivo</label>
                  <select
                    value={formFileType}
                    onChange={(e) => setFormFileType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:border-[#0f03f9]"
                  >
                    <option value="pdf">Documento PDF</option>
                    <option value="image">Fotografía / Imagen</option>
                    <option value="sheet">Hoja de Cálculo Excel</option>
                    <option value="doc">Documento Word</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descripción</label>
                <textarea
                  rows={2}
                  placeholder="Describe brevemente el contenido, vigencia o relevancia de este archivo..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:border-[#0f03f9]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Seleccionar Archivo o Foto local *
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,.xlsx,.xls,.csv,.doc,.docx"
                  onChange={handleFileUpload}
                  disabled={isProcessingFile || isSubmitting}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-[#0f03f9] hover:file:bg-blue-100 cursor-pointer disabled:opacity-50"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Límites de tamaño: <strong className="text-slate-700">Imágenes hasta 10 MB</strong> (JPG, PNG, WebP) | <strong className="text-slate-700">Documentos hasta 25 MB</strong> (PDF, Word, Excel)
                </p>

                {isProcessingFile && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-[#0f03f9] font-medium bg-blue-50 p-2.5 rounded-lg border border-blue-100">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Leyendo y preparando archivo...</span>
                  </div>
                )}

                {isSubmitting && (
                  <div className="mt-3 p-3 bg-blue-50/80 border border-blue-200 rounded-lg space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-blue-900 flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0f03f9]" />
                        {uploadStatusText || 'Guardando en la nube...'}
                      </span>
                      <span className="font-bold text-[#0f03f9]">{uploadProgress ?? 50}%</span>
                    </div>
                    <div className="w-full bg-blue-200/60 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#0f03f9] h-2 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${uploadProgress ?? 50}%` }}
                      />
                    </div>
                  </div>
                )}

                {formFileUrl && !isProcessingFile && formFileType === 'image' && (
                  <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-3">
                    <img
                      src={formFileUrl}
                      alt="Vista previa"
                      className="w-12 h-12 rounded object-cover border border-slate-200 shrink-0"
                    />
                    <div className="text-xs">
                      <p className="font-bold text-emerald-700 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        Imagen optimizada correctamente
                      </p>
                      <p className="text-slate-500 text-[11px]">Tamaño aproximado: {formFileSize || 'Ligero'}</p>
                    </div>
                  </div>
                )}

                {formFileUrl && !isProcessingFile && formFileType !== 'image' && (
                  <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-2 text-xs text-slate-700">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Archivo listo ({formFileSize})</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Etiquetas (separadas por comas)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Truper, Precios, Almacén, Herramientas"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:border-[#0f03f9]"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleFormSubmit}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-[#0f03f9] hover:bg-[#0c02cb] shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Subiendo ({uploadProgress ?? 50}%)...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Guardar Documento</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Document Modal */}
      {viewDocumentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  {getFileIcon(viewDocumentModal.fileType)}
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#0f03f9] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {viewDocumentModal.category}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    {viewDocumentModal.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setViewDocumentModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {(isPdf(viewDocumentModal) || viewDocumentModal.fileType === 'pdf') && (
                <DocPdfPreview
                  url={viewDocumentModal.fileUrl || (viewDocumentModal as any).file_url}
                  title={viewDocumentModal.title}
                  description={viewDocumentModal.description}
                  className="w-full"
                  isInteractive={true}
                />
              )}

              {!isPdf(viewDocumentModal) && viewDocumentModal.fileType === 'image' && (
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center p-2">
                  <img
                    src={viewDocumentModal.fileUrl || (viewDocumentModal as any).file_url}
                    alt={viewDocumentModal.title}
                    className="w-full max-h-[70vh] object-contain rounded-lg"
                  />
                </div>
              )}

              {!isPdf(viewDocumentModal) && viewDocumentModal.fileType === 'sheet' && (
                <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-emerald-200 text-emerald-600 flex items-center justify-center mb-3">
                    <FileSpreadsheet className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{viewDocumentModal.fileName || viewDocumentModal.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 max-w-md">
                    Hoja de cálculo Excel / CSV lista para descargar o visualizar en tu software de hojas de cálculo.
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <a
                      href={getDownloadUrl(viewDocumentModal.fileUrl || (viewDocumentModal as any).file_url)}
                      download={viewDocumentModal.fileName || viewDocumentModal.title || 'documento.xlsx'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Descargar Excel ({viewDocumentModal.fileSize})</span>
                    </a>
                    {(viewDocumentModal.fileUrl || (viewDocumentModal as any).file_url) && (
                      <a
                        href={viewDocumentModal.fileUrl || (viewDocumentModal as any).file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-lg bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Ver / Abrir</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {!isPdfFile(viewDocumentModal) && viewDocumentModal.fileType !== 'image' && viewDocumentModal.fileType !== 'sheet' && (
                <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-blue-200 text-blue-600 flex items-center justify-center mb-3">
                    <FileText className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{viewDocumentModal.fileName || viewDocumentModal.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 max-w-md">
                    Documento listo para descargar y consultar en tu dispositivo.
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <a
                      href={getDownloadUrl(viewDocumentModal.fileUrl || (viewDocumentModal as any).file_url)}
                      download={viewDocumentModal.fileName || viewDocumentModal.title || 'documento'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Descargar ({viewDocumentModal.fileSize})</span>
                    </a>
                    {(viewDocumentModal.fileUrl || (viewDocumentModal as any).file_url) && (
                      <a
                        href={viewDocumentModal.fileUrl || (viewDocumentModal as any).file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-lg bg-white border border-blue-300 text-blue-800 hover:bg-blue-50 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Ver / Abrir</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs space-y-2">
                <p className="text-slate-800 font-medium leading-relaxed">
                  {viewDocumentModal.description}
                </p>
                <div className="grid grid-cols-2 gap-2 text-slate-500 pt-2 border-t border-slate-200">
                  <div>Subido por: <strong className="text-slate-800">{viewDocumentModal.uploaderName}</strong></div>
                  <div>Fecha: <strong className="text-slate-800">{viewDocumentModal.createdAt}</strong></div>
                  <div>Tamaño: <strong className="text-slate-800">{viewDocumentModal.fileSize}</strong></div>
                  <div>Formato: <strong className="text-slate-800 uppercase">{viewDocumentModal.fileType}</strong></div>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-700 block mb-1">Etiquetas del Documento:</span>
                <div className="flex flex-wrap gap-1.5">
                  {viewDocumentModal.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium border border-slate-200">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={() => setViewDocumentModal(null)}
                className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200 text-center cursor-pointer"
              >
                Cerrar
              </button>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {currentUser?.role === 'Administrador' && (
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError(null);
                      setDocToDelete(viewDocumentModal);
                    }}
                    className="px-3.5 py-2 rounded-lg text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                    title="Eliminar este archivo permanentemente"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleOpenEdit(viewDocumentModal)}
                  className="px-3.5 py-2 rounded-lg text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                  title="Editar nombre, categoría o descripción"
                >
                  <Pencil className="w-3.5 h-3.5 text-[#0f03f9]" />
                  <span>Editar Datos</span>
                </button>
                {(viewDocumentModal.fileUrl || (viewDocumentModal as any).file_url) && (
                  <a
                    href={viewDocumentModal.fileUrl || (viewDocumentModal as any).file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-lg text-xs font-bold text-[#0f03f9] bg-blue-50 border border-blue-200 hover:bg-blue-100 flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                    title="Abrir en nueva pestaña"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Ver / Abrir</span>
                  </a>
                )}
                <a
                  href={getDownloadUrl(viewDocumentModal.fileUrl || (viewDocumentModal as any).file_url)}
                  download={viewDocumentModal.fileName || viewDocumentModal.title || 'documento.pdf'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#0f03f9] hover:bg-[#0c02cb] shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Archivo</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {docToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 text-center">
                ¿Eliminar documento definitivamente?
              </h3>
              <p className="text-xs text-slate-600 text-center mt-2 leading-relaxed">
                Estás a punto de eliminar <strong className="text-slate-900 font-semibold">"{docToDelete.title}"</strong>. Este registro se borrará permanentemente y ya no estará accesible.
              </p>

              {deleteError && (
                <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (!isDeletingDoc) {
                      setDocToDelete(null);
                      setDeleteError(null);
                    }
                  }}
                  disabled={isDeletingDoc}
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeletingDoc}
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isDeletingDoc ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Borrando...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Sí, Eliminar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Document Modal */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 text-[#0f03f9]">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Editar Información del Archivo</h3>
                  <p className="text-xs text-slate-500">Actualiza el nombre, categoría, descripción y etiquetas</p>
                </div>
              </div>
              <button
                onClick={() => setEditingDoc(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
                disabled={isSavingEdit}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {editError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{editError}</span>
                </div>
              )}

              {/* Readonly info banner */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  {getFileIcon(editingDoc.fileType)}
                  <span className="font-semibold text-slate-800 uppercase tracking-wide">
                    Formato {editingDoc.fileType}
                  </span>
                </div>
                <span className="text-slate-500">Tamaño: {editingDoc.fileSize}</span>
              </div>

              {/* Title / Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre o Título del Archivo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Catálogo de Bloque SALTEX o Lista de Precios"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:border-[#0f03f9] focus:ring-1 focus:ring-[#0f03f9]"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Categoría</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as DocumentCategory)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:border-[#0f03f9]"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descripción</label>
                <textarea
                  rows={3}
                  placeholder="Describe el contenido, especificaciones o vigencia de este archivo..."
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:border-[#0f03f9]"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Etiquetas (separadas por comas)
                </label>
                <input
                  type="text"
                  placeholder="ej. bloque, solera, catalogo, precios"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:border-[#0f03f9] focus:ring-1 focus:ring-[#0f03f9]"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Facilita encontrar este archivo desde el buscador global.
                </p>
              </div>

              {/* Form Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  disabled={isSavingEdit}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-[#0f03f9] hover:bg-[#0c02cb] shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSavingEdit ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Guardando Cambios...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Guardar Cambios</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
