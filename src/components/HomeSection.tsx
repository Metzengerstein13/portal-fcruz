import React from 'react';
import { UserProfile, ActiveTab, AnnouncementItem, DocumentItem, YouTubeVideoItem } from '../types';
import { DocImagePreview, DocPdfPreview } from './FilePreviews';
import { isPdf, isPdfFile } from '../utils/downloadHelper';
import { 
  Building2, 
  Target, 
  HeartHandshake, 
  ShieldCheck, 
  FileText, 
  Youtube, 
  Truck, 
  ArrowRight, 
  Sparkles, 
  Bell, 
  ChevronRight,
  Upload,
  Play,
  FileSpreadsheet,
  ImageIcon,
  HardDrive,
  Search,
  ExternalLink,
  Lock
} from 'lucide-react';

interface HomeSectionProps {
  currentUser: UserProfile | null;
  setActiveTab?: (tab: ActiveTab) => void;
  onNavigate?: (tab: ActiveTab) => void;
  onOpenLogin: () => void;
  announcements: AnnouncementItem[];
  documents?: DocumentItem[];
  videos?: YouTubeVideoItem[];
  suppliers?: any[];
  onSelectVideo?: (video: YouTubeVideoItem) => void;
}

// Storage constants & helpers
const TOTAL_STORAGE_BYTES = 25 * 1024 * 1024 * 1024; // 25 GB total cloud storage quota

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

export const HomeSection: React.FC<HomeSectionProps> = ({
  currentUser,
  setActiveTab,
  onNavigate,
  onOpenLogin,
  announcements,
  documents = [],
  videos = [],
  onSelectVideo,
}) => {
  const handleNavigate = (tab: ActiveTab) => {
    if (typeof setActiveTab === 'function') {
      setActiveTab(tab);
    } else if (typeof onNavigate === 'function') {
      onNavigate(tab);
    }
  };

  const isAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'admin';

  // Real storage calculation
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
  const progressBarPercent = Math.max(usedStorageBytes > 0 ? 2 : 0, Math.min(100, usedStoragePercent));
  return (
    <div className="space-y-6 pb-12">
      {/* Internal Announcements Bar */}
      {announcements.length > 0 && (
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <Bell className="w-4 h-4 text-[#0f03f9]" />
              <span>Comunicados y Avisos Internos</span>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              Recientes
            </span>
          </div>

          <div className={`grid grid-cols-1 ${announcements.length > 1 ? 'md:grid-cols-3' : ''} gap-3`}>
            {announcements.map((ann) => (
              <div 
                key={ann.id}
                className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 hover:border-blue-200 transition-colors"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${
                    ann.type === 'urgente' 
                      ? 'bg-rose-100 text-rose-700' 
                      : 'bg-blue-100 text-[#0f03f9]'
                  }`}>
                    {ann.type}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">{ann.date}</span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">{ann.title}</h4>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{ann.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quick Global Search Bar */}
      <section className="bg-gradient-to-r from-[#1E293B] via-slate-900 to-slate-800 rounded-xl p-4 sm:p-5 text-white border border-slate-700 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
            <Search className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Buscador General del Portal</h3>
            <p className="text-xs text-slate-300">Busca al instante archivos PDF, listas de precios, proveedores o videos de capacitación.</p>
          </div>
        </div>

        <button
          onClick={() => handleNavigate('buscador')}
          className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-[#0f03f9] hover:bg-[#0c02cb] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shrink-0 shadow-xs"
        >
          <span>Abrir Buscador</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>

      {/* Main Sleek Grid (12 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (4 Cols): Nuestra Empresa & Proveedores Rápidos */}
        <section className="lg:col-span-4 flex flex-col space-y-6">
          
          {/* Card: Nuestra Empresa */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-4 pb-3 border-b border-slate-100">
                <Building2 className="w-5 h-5 text-[#0f03f9]" />
                <h2 className="font-bold text-slate-800 text-base">Nuestra Empresa</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-[#0f03f9] uppercase tracking-wider mb-1">
                    Misión
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium italic">
                    “Ofrecemos productos de calidad, innovadores, competitivos y con la capacidad de satisfacer las necesidades de nuestros clientes”.
                  </p>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-[#0f03f9] uppercase tracking-wider mb-1">
                    Visión
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium italic">
                    “Liderar sobre las empresas ferreteras de la zona norte de Usulután”.
                  </p>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-[#0f03f9] uppercase tracking-wider mb-1">
                    Valores
                  </h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                    {[
                      'Honestidad',
                      'Humildad',
                      'Trabajo en equipo',
                      'Calidad',
                      'Servicio al cliente',
                      'Respeto'
                    ].map((valor) => (
                      <li key={valor} className="flex items-center space-x-2 text-xs text-slate-700 font-medium bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0f03f9] shrink-0" />
                        <span>{valor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 text-[11px]">Portal Privado v2.4</span>
              <span className="text-[#0f03f9] font-bold text-[11px]">Ferretería Cruz</span>
            </div>
          </div>

          {/* Card: Enlaces de Proveedores (Sleek Dark Accent) */}
          <div className="bg-[#1E293B] rounded-xl shadow-sm border border-slate-700 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-white flex items-center text-sm">
                <Truck className="w-4 h-4 mr-2 text-white" />
                Enlaces de Proveedores
              </h2>
              <button 
                onClick={() => handleNavigate('proveedores')}
                className="text-xs font-bold text-white hover:text-slate-200 hover:underline"
              >
                Ver todos
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <a 
                href="https://www.holcim.com.sv/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-3 py-2 bg-slate-700/80 hover:bg-slate-700 rounded-lg text-xs font-medium text-slate-200 transition-colors text-left group"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 mr-2 shrink-0"></div>
                <span className="truncate flex-1">Holcim</span>
                <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
              </a>

              <a 
                href="https://www.truper.com/banco-contenido-digital/elsalvador"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-3 py-2 bg-slate-700/80 hover:bg-slate-700 rounded-lg text-xs font-medium text-slate-200 transition-colors text-left group"
              >
                <div className="w-2 h-2 rounded-full bg-amber-400 mr-2 shrink-0"></div>
                <span className="truncate flex-1">Truper</span>
                <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
              </a>

              <a 
                href="https://gruposaltex.com.sv/catalogos/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-3 py-2 bg-slate-700/80 hover:bg-slate-700 rounded-lg text-xs font-medium text-slate-200 transition-colors text-left group"
              >
                <div className="w-2 h-2 rounded-full bg-blue-400 mr-2 shrink-0"></div>
                <span className="truncate flex-1">Saltex</span>
                <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
              </a>

              <a 
                href="https://reflex.com.sv/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-3 py-2 bg-slate-700/80 hover:bg-slate-700 rounded-lg text-xs font-medium text-slate-200 transition-colors text-left group"
              >
                <div className="w-2 h-2 rounded-full bg-purple-400 mr-2 shrink-0"></div>
                <span className="truncate flex-1">Reflex</span>
                <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
              </a>
            </div>
          </div>

        </section>

        {/* Right Column (8 Cols): Documentos & Galería YouTube */}
        <section className="lg:col-span-8 flex flex-col space-y-6">
          
          {/* Documentos Recientes Container */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-slate-500" />
                <h2 className="font-bold text-slate-800 text-base">Documentos y Archivos Recientes</h2>
              </div>

              {currentUser?.role === 'Administrador' ? (
                <button 
                  onClick={() => {
                    handleNavigate('documentos');
                  }}
                  className="flex items-center space-x-1 text-xs font-bold text-[#0f03f9] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>SUBIR ARCHIVO</span>
                </button>
              ) : (
                <button 
                  onClick={() => {
                    if (!currentUser) onOpenLogin();
                    else handleNavigate('documentos');
                  }}
                  className="flex items-center space-x-1 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <span>VER TODOS</span>
                </button>
              )}
            </div>

            {/* Document Preview Cards */}
            <div className="p-6">
              {documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 px-4 text-center bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
                  <div className="w-12 h-12 bg-blue-50 text-[#0f03f9] flex items-center justify-center rounded-xl mb-2.5">
                    <FileText className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">Sin documentos registrados</p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                    El repositorio centralizado de Cloudinary está listo. Sube tus manuales, listas de precios y archivos corporativos.
                  </p>
                  {isAdmin ? (
                    <button
                      onClick={() => handleNavigate('documentos')}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0f03f9] hover:bg-blue-700 rounded-lg transition-colors shadow-2xs cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Subir Primer Documento</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleNavigate('documentos')}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs cursor-pointer"
                    >
                      <span>Ir al Módulo de Documentos</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {documents.slice(0, 3).map((doc) => (
                    <div 
                      key={doc.id}
                      onClick={() => {
                        if (!currentUser) onOpenLogin();
                        else handleNavigate('documentos');
                      }}
                      className="flex flex-col items-center p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-blue-200 cursor-pointer transition-all hover:shadow-2xs group"
                    >
                      <div className="w-12 h-12 rounded-lg mb-2 overflow-hidden flex items-center justify-center shrink-0 border border-slate-200 bg-slate-50">
                        {isPdfFile(doc) ? (
                          <DocPdfPreview
                            url={doc.fileUrl}
                            title={doc.title}
                            description={doc.description}
                            className="w-full h-full rounded-lg"
                            isInteractive={false}
                          />
                        ) : doc.fileType === 'image' ? (
                          <DocImagePreview
                            url={doc.fileUrl}
                            alt={doc.title}
                            className="object-cover h-full w-full rounded-lg"
                          />
                        ) : doc.fileType === 'sheet' ? (
                          <div className="w-full h-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xs">
                            XLS
                          </div>
                        ) : (
                          <div className="w-full h-full bg-blue-100 text-[#0f03f9] flex items-center justify-center font-black text-xs">
                            DOC
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] font-bold text-slate-700 text-center truncate w-full group-hover:text-[#0f03f9] transition-colors" title={doc.title}>
                        {doc.title}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-0.5">{doc.createdAt}</p>
                    </div>
                  ))}

                  <div 
                    onClick={() => {
                      if (!currentUser) onOpenLogin();
                      else handleNavigate('documentos');
                    }}
                    className="flex flex-col items-center p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-blue-200 cursor-pointer transition-all hover:shadow-2xs group opacity-90"
                  >
                    <div className="w-12 h-12 bg-slate-200 text-slate-600 flex items-center justify-center rounded-lg mb-2">
                      <FileText className="w-6 h-6" />
                    </div>
                    <p className="text-[11px] font-bold text-slate-700 text-center truncate w-full group-hover:text-[#0f03f9]">
                      Ver todos...
                    </p>
                    <p className="text-[9px] text-slate-400 mt-0.5">{documents.length} archivos</p>
                  </div>
                </div>
              )}
            </div>

            {/* Storage Meter Bar */}
            <div className="mt-auto p-4 sm:p-5 bg-blue-50/60 border-t border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-white rounded-lg shadow-2xs text-[#0f03f9] border border-blue-100 shrink-0">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-800">Espacio del Equipo Corporativo</p>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100/80 text-[#0f03f9]">
                      {usedPercentStr} en uso
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    <strong className="text-slate-900 font-semibold">{usedSizeStr}</strong> utilizados ({usedPercentStr}) • <span className="text-emerald-700 font-medium">{freeSizeStr} disponibles ({freePercentStr})</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                <div className="w-28 sm:w-36 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#0f03f9] rounded-full transition-all duration-500" 
                    style={{ width: `${progressBarPercent}%` }}
                    title={`${usedPercentStr} consumido`}
                  ></div>
                </div>
                <span className="text-[11px] font-bold text-slate-700 w-12 text-right">
                  {freePercentStr} libre
                </span>
              </div>
            </div>
          </div>

          {/* Videos y Tutoriales YouTube */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-2">
                <Youtube className="w-5 h-5 text-red-600 fill-red-600" />
                <h2 className="font-bold text-slate-800 text-base">Videos y Tutoriales YouTube</h2>
                {!currentUser && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-600" />
                    <span>Módulo Privado</span>
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Canal Oficial
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5">
              {videos.slice(0, 3).map((video) => (
                <div 
                  key={video.id}
                  onClick={() => {
                    if (!currentUser) {
                      onOpenLogin();
                    } else if (onSelectVideo) {
                      onSelectVideo(video);
                    } else {
                      handleNavigate('youtube');
                    }
                  }}
                  className="group cursor-pointer"
                >
                  <div className="relative rounded-lg overflow-hidden mb-2 aspect-video bg-slate-200">
                    <img 
                      src={video.thumbnail || (video.youtubeId ? `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg` : 'https://img.youtube.com/vi/fCBzd76Q1L8/hqdefault.jpg')} 
                      alt={video.title}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (video.youtubeId && !target.src.includes('mqdefault.jpg')) {
                          target.src = `https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`;
                        } else if (video.youtubeId && !target.src.includes('default.jpg')) {
                          target.src = `https://i.ytimg.com/vi/${video.youtubeId}/default.jpg`;
                        }
                      }}
                      className={`object-cover w-full h-full group-hover:scale-105 transition-transform duration-300 ${!currentUser ? 'filter blur-[1px] brightness-90' : ''}`} 
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      {currentUser ? (
                        <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white shadow-md">
                          <Play className="w-4 h-4 fill-white ml-0.5" />
                        </div>
                      ) : (
                        <div className="px-2.5 py-1 bg-black/80 backdrop-blur-xs text-white rounded-md text-[10px] font-bold flex items-center gap-1.5 shadow-md border border-white/20">
                          <Lock className="w-3 h-3 text-amber-400" />
                          <span>Acceso Restringido</span>
                        </div>
                      )}
                    </div>
                    <span className="absolute bottom-1 right-1 bg-black/80 text-[9px] text-white px-1 rounded font-mono">{video.duration}</span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-800 line-clamp-2 group-hover:text-red-600 transition-colors">
                    {video.title}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </section>
      </div>
    </div>
  );
};

