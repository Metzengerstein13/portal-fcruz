import React, { useState, useMemo } from 'react';
import { 
  UserProfile, 
  DocumentItem, 
  YouTubeVideoItem, 
  SupplierItem, 
  AnnouncementItem, 
  ActiveTab 
} from '../types';
import { 
  Search, 
  X, 
  FileText, 
  Youtube, 
  Truck, 
  Home, 
  Bell, 
  ArrowRight, 
  Tag, 
  Lock, 
  Download, 
  Building2, 
  Sparkles,
  ExternalLink,
  Compass,
  CheckCircle2,
  FolderOpen
} from 'lucide-react';

interface GlobalSearchSectionProps {
  documents: DocumentItem[];
  videos: YouTubeVideoItem[];
  suppliers: SupplierItem[];
  announcements?: AnnouncementItem[];
  setActiveTab?: (tab: ActiveTab) => void;
  onNavigate?: (tab: ActiveTab) => void;
  currentUser?: UserProfile | null;
  onOpenLogin?: () => void;
  initialQuery?: string;
  onSelectVideo?: (video: YouTubeVideoItem) => void;
}

export type SearchCategoryFilter = 'todos' | 'documentos' | 'proveedores' | 'youtube' | 'comunicados' | 'secciones';

export interface SearchResult {
  id: string;
  type: 'documento' | 'proveedor' | 'video' | 'comunicado' | 'seccion';
  title: string;
  subtitle: string;
  description: string;
  targetTab: ActiveTab;
  tags?: string[];
  isPrivate?: boolean;
  dateOrInfo?: string;
  badgeText: string;
  badgeColor: string;
  rawItem?: DocumentItem | SupplierItem | YouTubeVideoItem | AnnouncementItem;
}

export const GlobalSearchSection: React.FC<GlobalSearchSectionProps> = ({
  documents,
  videos,
  suppliers,
  announcements = [],
  setActiveTab,
  onNavigate,
  currentUser = null,
  onOpenLogin = () => {},
  initialQuery = '',
  onSelectVideo,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState<SearchCategoryFilter>('todos');

  const navigateTab = (tab: ActiveTab) => {
    if (typeof setActiveTab === 'function') {
      setActiveTab(tab);
    } else if (typeof onNavigate === 'function') {
      onNavigate(tab);
    }
  };

  // Static portal sections for universal navigation
  const portalSections: SearchResult[] = [
    {
      id: 'sec_inicio',
      type: 'seccion',
      title: 'Escritorio / Inicio',
      subtitle: 'Nuestra Empresa, Misión, Visión, Valores y Comunicados Internos',
      description: 'Página principal del portal privado de Ferretería Cruz. Revisa la filosofía corporativa, comunicados recientes y avisos a gerencia.',
      targetTab: 'inicio',
      tags: ['misión', 'visión', 'valores', 'comunicados', 'empresa', 'inicio', 'anuncios'],
      badgeText: 'Módulo',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200'
    },
    {
      id: 'sec_documentos',
      type: 'seccion',
      title: 'Archivos & Fotos (Panel Privado)',
      subtitle: 'Listas de precios, fichas técnicas, catálogos en PDF e imágenes de exhibición',
      description: 'Repositorio oficial para descargar archivos corporativos, circulares, listas de precios Truper/Dewalt y fotos de almacén.',
      targetTab: 'documentos',
      tags: ['pdf', 'precios', 'fichas técnicas', 'manuales', 'documentos', 'fotos', 'inventario'],
      isPrivate: true,
      badgeText: 'Módulo Privado',
      badgeColor: 'bg-blue-50 text-[#0f03f9] border-blue-200'
    },
    {
      id: 'sec_youtube',
      type: 'seccion',
      title: 'Videos de Capacitación YouTube',
      subtitle: 'Videotutoriales, demostraciones de herramientas y capacitaciones técnicas',
      description: 'Galería de videos interactivos para personal de mostrador, ventas y almacén sobre marcas oficiales.',
      targetTab: 'youtube',
      tags: ['videos', 'youtube', 'capacitación', 'tutoriales', 'demostración', 'herramientas'],
      isPrivate: true,
      badgeText: 'Módulo Privado',
      badgeColor: 'bg-red-50 text-red-600 border-red-200'
    },
    {
      id: 'sec_proveedores',
      type: 'seccion',
      title: 'Directorio de Proveedores & Marcas B2B',
      subtitle: 'Contactos, portales oficiales de fabricantes y catálogos de marcas',
      description: 'Directorio completo con enlaces directos a Truper, Dewalt, Urrea, Rotoplas, Phillips, Comex, Bellota, Schneider y Amanco.',
      targetTab: 'proveedores',
      tags: ['proveedores', 'marcas', 'truper', 'dewalt', 'urrea', 'rotoplas', 'b2b', 'contacto', 'teléfono'],
      badgeText: 'Módulo',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    }
  ];

  // Quick suggestion query chips
  const quickChips = [
    'Truper',
    'Capacitación',
    'Listas de Precios',
    'Dewalt',
    'Rotoplas',
    'Fichas Técnicas',
    'Misión',
    'Cerrajería'
  ];

  // Perform multi-source global search
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    const results: SearchResult[] = [];

    // 1. Search Portal Sections
    portalSections.forEach((sec) => {
      const matchTitle = sec.title.toLowerCase().includes(q);
      const matchSubtitle = sec.subtitle.toLowerCase().includes(q);
      const matchDesc = sec.description.toLowerCase().includes(q);
      const matchTags = sec.tags?.some((t) => t.toLowerCase().includes(q));

      if (!q || matchTitle || matchSubtitle || matchDesc || matchTags) {
        if (q || activeCategory === 'secciones') {
          results.push(sec);
        }
      }
    });

    // 2. Search Documents
    documents.forEach((docItem) => {
      const matchTitle = docItem.title.toLowerCase().includes(q);
      const matchDesc = docItem.description.toLowerCase().includes(q);
      const matchCategory = docItem.category.toLowerCase().includes(q);
      const matchTags = docItem.tags.some((t) => t.toLowerCase().includes(q));
      const matchAuthor = docItem.uploaderName.toLowerCase().includes(q);

      if (q && (matchTitle || matchDesc || matchCategory || matchTags || matchAuthor)) {
        results.push({
          id: docItem.id,
          type: 'documento',
          title: docItem.title,
          subtitle: `${docItem.category} • ${docItem.fileType.toUpperCase()} (${docItem.fileSize})`,
          description: docItem.description,
          targetTab: 'documentos',
          tags: docItem.tags,
          isPrivate: true,
          dateOrInfo: `Publicado: ${docItem.createdAt} por ${docItem.uploaderName}`,
          badgeText: `Archivo (${docItem.fileType.toUpperCase()})`,
          badgeColor: 'bg-blue-50 text-[#0f03f9] border-blue-200',
          rawItem: docItem
        });
      }
    });

    // 3. Search Suppliers
    suppliers.forEach((sup) => {
      const matchName = sup.name.toLowerCase().includes(q);
      const matchDesc = sup.description.toLowerCase().includes(q);
      const matchCategory = sup.category.toLowerCase().includes(q);
      const matchProducts = sup.popularProducts.some((p) => p.toLowerCase().includes(q));

      if (q && (matchName || matchDesc || matchCategory || matchProducts)) {
        results.push({
          id: sup.id,
          type: 'proveedor',
          title: sup.name,
          subtitle: `Marca/Proveedor • ${sup.category}`,
          description: sup.description,
          targetTab: 'proveedores',
          tags: sup.popularProducts,
          isPrivate: false,
          dateOrInfo: `Sitio Oficial: ${sup.website}`,
          badgeText: 'Proveedor B2B',
          badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          rawItem: sup
        });
      }
    });

    // 4. Search Videos
    videos.forEach((vid) => {
      const matchTitle = vid.title.toLowerCase().includes(q);
      const matchDesc = vid.description.toLowerCase().includes(q);
      const matchCategory = vid.category.toLowerCase().includes(q);
      const matchTags = vid.tags.some((t) => t.toLowerCase().includes(q));

      if (q && (matchTitle || matchDesc || matchCategory || matchTags)) {
        results.push({
          id: vid.id,
          type: 'video',
          title: vid.title,
          subtitle: `Video Capacitación • ${vid.category} (${vid.duration})`,
          description: vid.description,
          targetTab: 'youtube',
          tags: vid.tags,
          isPrivate: true,
          dateOrInfo: `Visualizaciones: ${vid.views}`,
          badgeText: 'Video (Privado)',
          badgeColor: 'bg-red-50 text-red-600 border-red-200',
          rawItem: vid
        });
      }
    });

    // 5. Search Announcements
    announcements.forEach((ann) => {
      const matchTitle = ann.title.toLowerCase().includes(q);
      const matchContent = ann.content.toLowerCase().includes(q);
      const matchAuthor = ann.author.toLowerCase().includes(q);

      if (q && (matchTitle || matchContent || matchAuthor)) {
        results.push({
          id: ann.id,
          type: 'comunicado',
          title: ann.title,
          subtitle: `Aviso Interno • ${ann.type.toUpperCase()} (${ann.date})`,
          description: ann.content,
          targetTab: 'inicio',
          isPrivate: false,
          dateOrInfo: `Emisor: ${ann.author}`,
          badgeText: 'Comunicado',
          badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
          rawItem: ann
        });
      }
    });

    // Filter by category tab if selected
    if (activeCategory === 'documentos') {
      return results.filter((r) => r.type === 'documento');
    }
    if (activeCategory === 'proveedores') {
      return results.filter((r) => r.type === 'proveedor');
    }
    if (activeCategory === 'youtube') {
      return results.filter((r) => r.type === 'video');
    }
    if (activeCategory === 'comunicados') {
      return results.filter((r) => r.type === 'comunicado');
    }
    if (activeCategory === 'secciones') {
      return results.filter((r) => r.type === 'seccion');
    }

    return results;
  }, [query, activeCategory, documents, videos, suppliers, announcements]);

  // Handle result click
  const handleNavigate = (result: SearchResult) => {
    if (result.isPrivate && !currentUser) {
      onOpenLogin();
      return;
    }
    if (result.type === 'video' && result.rawItem && onSelectVideo) {
      onSelectVideo(result.rawItem as YouTubeVideoItem);
    } else {
      navigateTab(result.targetTab);
    }
  };

  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'documento':
        return <FileText className="w-5 h-5 text-[#0f03f9]" />;
      case 'proveedor':
        return <Truck className="w-5 h-5 text-emerald-600" />;
      case 'video':
        return <Youtube className="w-5 h-5 text-red-600" />;
      case 'comunicado':
        return <Bell className="w-5 h-5 text-amber-600" />;
      case 'seccion':
        return <FolderOpen className="w-5 h-5 text-slate-700" />;
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#1E293B] via-slate-900 to-slate-800 text-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-700">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white border border-white/20">
            <Search className="w-3.5 h-3.5 text-white" />
            <span>Buscador General del Portal</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-bold text-white">
            Encuentra cualquier archivo, proveedor, video o sección
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Escribe palabras clave para buscar en tiempo real en todo el catálogo corporativo de Ferretería Cruz.
          </p>
        </div>

        {/* Big Search Input Box */}
        <div className="mt-6 relative max-w-3xl">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Escribe lo que buscas (ej. Truper, Precios, Capacitación, Fichas Técnicas, Rotoplas)..."
              className="w-full pl-12 pr-10 py-3.5 bg-white text-slate-900 placeholder-slate-400 rounded-xl border-2 border-slate-300 text-xs sm:text-sm font-medium focus:outline-hidden focus:border-[#0f03f9] focus:ring-2 focus:ring-[#0f03f9]/20 transition-all shadow-md"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Limpiar búsqueda"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Suggestion Chips */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] text-slate-400 font-medium mr-1">Sugerencias rápidas:</span>
            {quickChips.map((chip) => (
              <button
                key={chip}
                onClick={() => setQuery(chip)}
                className="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-[#0f03f9] text-slate-300 hover:text-white border border-slate-700 transition-colors text-[11px] font-medium"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Category Tabs */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200">
        <div className="flex items-center gap-2 shrink-0">
          {[
            { id: 'todos', label: 'Todos los Resultados' },
            { id: 'documentos', label: 'Archivos & Fotos' },
            { id: 'proveedores', label: 'Proveedores' },
            { id: 'youtube', label: 'Videos' },
            { id: 'comunicados', label: 'Comunicados' },
            { id: 'secciones', label: 'Secciones del Portal' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as SearchCategoryFilter)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-[#0f03f9] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-500 font-medium shrink-0">
          {searchResults.length} {searchResults.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
        </span>
      </div>

      {/* Results List or Empty State */}
      {searchResults.length > 0 ? (
        <div className="space-y-3">
          {searchResults.map((result) => (
            <div
              key={result.id}
              className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 hover:border-blue-300 hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
            >
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 shrink-0 group-hover:bg-blue-50/60 transition-colors">
                  {getResultIcon(result.type)}
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${result.badgeColor}`}>
                      {result.badgeText}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium truncate">
                      {result.subtitle}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-[#0f03f9] transition-colors leading-snug">
                    {result.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {result.description}
                  </p>

                  {result.tags && result.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {result.tags.slice(0, 4).map((t) => (
                        <span key={t} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}

                  {result.dateOrInfo && (
                    <p className="text-[11px] text-slate-400 pt-0.5">
                      {result.dateOrInfo}
                    </p>
                  )}
                </div>
              </div>

              {/* Redirect Action Button */}
              <button
                onClick={() => handleNavigate(result)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-xs font-bold bg-[#0f03f9] hover:bg-[#0c02cb] text-white shadow-xs transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95"
              >
                <span>Ir al Contenido</span>
                {result.isPrivate && !currentUser ? (
                  <Lock className="w-3.5 h-3.5 text-blue-200" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-8 sm:p-12 text-center border border-slate-200 shadow-xs max-w-2xl mx-auto my-6 space-y-4">
          <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            No se encontraron coincidencias para "{query}"
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
            Intenta buscar términos más generales como <strong className="text-slate-700">Truper</strong>, <strong className="text-slate-700">Precios</strong>, <strong className="text-slate-700">Dewalt</strong>, <strong className="text-slate-700">Capacitación</strong> o borra los filtros de búsqueda.
          </p>
          <button
            onClick={() => {
              setQuery('');
              setActiveCategory('todos');
            }}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors inline-flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            <span>Restablecer Búsqueda</span>
          </button>
        </div>
      )}

      {/* Portal Modules Direct Map */}
      <div className="mt-8 bg-slate-50 border border-slate-200 rounded-xl p-6">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Compass className="w-4 h-4 text-[#0f03f9]" />
          <span>Acceso Directo a los Módulos del Portal</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigateTab('inicio')}
            className="p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-xs transition-all text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center mb-2 group-hover:bg-blue-50 group-hover:text-[#0f03f9]">
              <Home className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#0f03f9]">Escritorio / Inicio</h4>
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">Misión, Visión, Valores y Avisos Internos</p>
          </button>

          <button
            onClick={() => {
              if (!currentUser) onOpenLogin();
              else navigateTab('documentos');
            }}
            className="p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-xs transition-all text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0f03f9] flex items-center justify-center mb-2">
              <FileText className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#0f03f9] flex items-center justify-between">
              <span>Archivos & Fotos</span>
              {!currentUser && <Lock className="w-3 h-3 text-[#0f03f9]" />}
            </h4>
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">PDFs, Listas de precios y Fotos de exhibición</p>
          </button>

          <button
            onClick={() => {
              if (!currentUser) onOpenLogin();
              else navigateTab('youtube');
            }}
            className="p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-xs transition-all text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mb-2">
              <Youtube className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#0f03f9] flex items-center justify-between">
              <span>Videos YouTube</span>
              {!currentUser && <Lock className="w-3 h-3 text-red-600" />}
            </h4>
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">Capacitaciones y demostraciones de productos</p>
          </button>

          <button
            onClick={() => navigateTab('proveedores')}
            className="p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-xs transition-all text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2">
              <Truck className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#0f03f9]">Directorio Proveedores</h4>
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">Portales B2B, marcas y contactos oficiales</p>
          </button>
        </div>
      </div>
    </div>
  );
};
