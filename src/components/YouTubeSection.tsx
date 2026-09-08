import React, { useState } from 'react';
import { YouTubeVideoItem, UserProfile } from '../types';
import { 
  Youtube, 
  Play, 
  Search, 
  Filter, 
  Clock, 
  Eye, 
  Plus, 
  X, 
  Calendar, 
  Tag, 
  Share2, 
  Check, 
  ExternalLink,
  ThumbsUp,
  Sparkles,
  Lock,
  Pencil,
  Trash2
} from 'lucide-react';

interface YouTubeSectionProps {
  videos: YouTubeVideoItem[];
  currentUser: UserProfile | null;
  onAddVideo: (video: Omit<YouTubeVideoItem, 'id'>) => void;
  onUpdateVideo?: (videoId: string, updated: Partial<YouTubeVideoItem>) => void;
  onDeleteVideo?: (videoId: string) => void;
  onOpenLogin: () => void;
  initialActiveVideo?: YouTubeVideoItem | null;
  onClearInitialVideo?: () => void;
}

const CATEGORIES = [
  'Todos',
  'Tutoriales',
  'Demostraciones'
];

export const YouTubeSection: React.FC<YouTubeSectionProps> = ({
  videos,
  currentUser,
  onAddVideo,
  onUpdateVideo,
  onDeleteVideo,
  onOpenLogin,
  initialActiveVideo,
  onClearInitialVideo,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal player, Add Video Modal, Edit Video Modal
  const [activeVideoModal, setActiveVideoModal] = useState<YouTubeVideoItem | null>(initialActiveVideo || null);
  const [addVideoModalOpen, setAddVideoModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<YouTubeVideoItem | null>(null);

  React.useEffect(() => {
    if (initialActiveVideo) {
      setActiveVideoModal(initialActiveVideo);
    }
  }, [initialActiveVideo]);

  const handleCloseModal = () => {
    setActiveVideoModal(null);
    if (onClearInitialVideo) onClearInitialVideo();
  };

  // Add video form state
  const [formYoutubeUrl, setFormYoutubeUrl] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('Tutoriales');
  const [formTags, setFormTags] = useState('');

  // Edit video form state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('Tutoriales');
  const [editYoutubeUrl, setEditYoutubeUrl] = useState('');
  const [editTags, setEditTags] = useState('');

  const handleOpenEdit = (video: YouTubeVideoItem) => {
    setEditingVideo(video);
    setEditTitle(video.title);
    setEditDescription(video.description);
    setEditCategory(video.category);
    setEditYoutubeUrl(video.youtubeId ? `https://www.youtube.com/watch?v=${video.youtubeId}` : '');
    setEditTags(Array.isArray(video.tags) ? video.tags.join(', ') : '');
  };

  // Extract YouTube ID from full URL or ID string
  const extractYoutubeId = (urlOrId: string) => {
    if (!urlOrId) return 'L_LupnjgBZ0';
    const clean = urlOrId.trim();
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = clean.match(regExp);
    if (match && match[1]) {
      return match[1];
    }
    if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) {
      return clean;
    }
    return clean;
  };

  const handleAddVideoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const ytId = extractYoutubeId(formYoutubeUrl);
    const tagsArray = formTags.split(',').map(t => t.trim()).filter(t => t.length > 0);

    onAddVideo({
      youtubeId: ytId,
      title: formTitle,
      description: formDescription || 'Video corporativo del canal oficial de Ferretería Cruz.',
      category: formCategory,
      publishedAt: new Date().toISOString().split('T')[0],
      duration: '08:30',
      views: '1.2K',
      thumbnail: ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=80',
      tags: tagsArray.length > 0 ? tagsArray : ['Ferretería Cruz', formCategory],
      addedBy: currentUser?.displayName || 'Ferretería Cruz'
    });

    setFormYoutubeUrl('');
    setFormTitle('');
    setFormDescription('');
    setFormTags('');
    setAddVideoModalOpen(false);
  };

  const handleEditVideoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideo || !editTitle.trim()) return;

    const ytId = editYoutubeUrl ? extractYoutubeId(editYoutubeUrl) : editingVideo.youtubeId;
    const tagsArray = editTags.split(',').map(t => t.trim()).filter(t => t.length > 0);

    const updatedFields: Partial<YouTubeVideoItem> = {
      title: editTitle.trim(),
      description: editDescription.trim(),
      category: editCategory,
      youtubeId: ytId,
      thumbnail: ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : editingVideo.thumbnail,
      tags: tagsArray.length > 0 ? tagsArray : editingVideo.tags
    };

    if (onUpdateVideo) {
      onUpdateVideo(editingVideo.id, updatedFields);
    }

    if (activeVideoModal && activeVideoModal.id === editingVideo.id) {
      setActiveVideoModal({ ...activeVideoModal, ...updatedFields });
    }

    setEditingVideo(null);
  };

  const filteredVideos = videos.filter((video) => {
    const matchesCategory = selectedCategory === 'Todos' || video.category === selectedCategory;
    const matchesSearch = 
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  if (!currentUser) {
    return (
      <div className="bg-white rounded-xl p-8 sm:p-12 text-center border border-slate-200 shadow-sm max-w-2xl mx-auto my-12">
        <div className="w-16 h-16 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-200">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900">
          Módulo Privado de Capacitación & Videos
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
          Para ver las capacitaciones exclusivas, tutoriales de productos y demostraciones técnicas de Ferretería Cruz, debes iniciar sesión con tu cuenta corporativa.
        </p>
        <button
          onClick={onOpenLogin}
          className="mt-6 px-6 py-3 rounded-lg font-bold text-xs bg-[#0f03f9] hover:bg-[#0c02cb] text-white shadow-sm transition-all inline-flex items-center gap-2"
        >
          <Lock className="w-4 h-4" />
          <span>Iniciar Sesión para Ver Videos</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Banner Canal YouTube Ferretería Cruz */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#1E293B] via-slate-900 to-slate-800 text-white rounded-xl p-6 sm:p-8 shadow-sm border border-slate-700">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full text-xs font-bold bg-red-600/30 text-red-300 border border-red-500/30">
              <Youtube className="w-3.5 h-3.5 fill-red-500 text-red-500" />
              <span>Canal Oficial de Ferretería Cruz</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Videos y Tutoriales YouTube
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Explora los últimos videos de nuestro canal: guías de instalación de herramientas, pruebas de resistencia, capacitación para colaboradores y demostraciones de marcas aliadas.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {currentUser && (
              <button
                onClick={() => setAddVideoModalOpen(true)}
                className="px-4 py-2.5 rounded-lg font-bold text-xs bg-[#0f03f9] hover:bg-[#0c02cb] text-white shadow-xs transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Video al Canal</span>
              </button>
            )}

            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-lg font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition-colors flex items-center justify-center gap-2"
            >
              <span>Ver en YouTube</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Search & Categories Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar videos por título, marca (Truper, Dewalt) o tema..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#0f03f9] focus:ring-1 focus:ring-[#0f03f9]"
            />
          </div>

          <span className="text-xs font-semibold text-slate-500 self-end sm:self-auto">
            {filteredVideos.length} videos disponibles
          </span>
        </div>

        {/* Categories Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-[#0f03f9] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Video Cards Grid */}
      {filteredVideos.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
          <Youtube className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-800">No hay videos en esta categoría</h4>
          <p className="text-xs text-slate-500 mt-1">Prueba con otra búsqueda o selecciona "Todos".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <div
              key={video.id}
              className="group bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md hover:border-blue-200 transition-all duration-300 flex flex-col justify-between"
            >
              {/* Thumbnail Container */}
              <div 
                onClick={() => setActiveVideoModal(video)}
                className="relative aspect-video bg-slate-900 cursor-pointer overflow-hidden"
              >
                <img
                  src={video.thumbnail || `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
                  alt={video.title}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.includes('mqdefault.jpg')) {
                      target.src = `https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`;
                    } else if (!target.src.includes('default.jpg')) {
                      target.src = `https://i.ytimg.com/vi/${video.youtubeId}/default.jpg`;
                    }
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                
                {/* Dark Overlay with Play Icon */}
                <div className="absolute inset-0 bg-slate-950/30 group-hover:bg-slate-950/50 transition-colors flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  </div>
                </div>

                {/* Duration Badge */}
                <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-950/80 text-white backdrop-blur-xs flex items-center gap-1">
                  <Clock className="w-3 h-3 text-red-400" />
                  <span>{video.duration}</span>
                </span>

                {/* Category Badge */}
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900/90 text-white backdrop-blur-xs">
                  {video.category}
                </span>
              </div>

              {/* Video Body Content */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 
                    onClick={() => setActiveVideoModal(video)}
                    className="font-bold text-slate-900 text-sm line-clamp-2 hover:text-red-600 cursor-pointer transition-colors leading-snug"
                  >
                    {video.title}
                  </h3>

                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {video.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {video.tags.map((tag) => (
                      <span key={tag} className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> {video.views} vistas
                    </span>
                    <span>{video.publishedAt}</span>
                  </div>

                  {/* Actions for Video (Edit / Delete) */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(video)}
                        className="px-2 py-1 rounded text-xs font-semibold text-slate-600 hover:text-[#0f03f9] hover:bg-blue-50 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Editar video"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Editar</span>
                      </button>
                      {onDeleteVideo && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`¿Estás seguro de eliminar el video "${video.title}"?`)) {
                              onDeleteVideo(video.id);
                            }
                          }}
                          className="px-2 py-1 rounded text-xs font-semibold text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Eliminar video"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Eliminar</span>
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveVideoModal(video)}
                      className="px-2.5 py-1 rounded-md bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-red-700" />
                      <span>Ver Video</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal YouTube Video Player */}
      {activeVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-4xl bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[95vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-600/20 text-red-500">
                  <Youtube className="w-5 h-5 fill-red-500 text-red-500" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-red-400 bg-red-950 px-2 py-0.5 rounded border border-red-800/40">
                    {activeVideoModal.category}
                  </span>
                  <h3 className="text-sm sm:text-base font-extrabold text-white mt-1 line-clamp-1">
                    {activeVideoModal.title}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(activeVideoModal)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Editar información del video"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>
                <button
                  onClick={handleCloseModal}
                  className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Embedded YouTube Iframe Player */}
            <div className="relative aspect-video bg-black w-full overflow-hidden">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${activeVideoModal.youtubeId}?autoplay=1&rel=0&enablejsapi=1`}
                title={activeVideoModal.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full border-0"
              />
            </div>

            {/* Direct Link Banner in case of iframe restrictions */}
            <div className="bg-slate-950 px-4 py-2.5 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-300">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span>¿Dificultad para reproducir en este visor?</span>
              </span>
              <a
                href={`https://www.youtube.com/watch?v=${activeVideoModal.youtubeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 text-xs shrink-0 shadow-xs"
              >
                <Play className="w-3 h-3 fill-white" />
                <span>Abrir directamente en YouTube</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Video Details Below Player */}
            <div className="p-6 overflow-y-auto space-y-4 bg-slate-900 text-slate-200 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-4 text-slate-400">
                  <span>Publicado: <strong className="text-white">{activeVideoModal.publishedAt}</strong></span>
                  <span>•</span>
                  <span>Vistas: <strong className="text-white">{activeVideoModal.views}</strong></span>
                  <span>•</span>
                  <span>Duración: <strong className="text-white">{activeVideoModal.duration}</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`https://www.youtube.com/watch?v=${activeVideoModal.youtubeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-colors flex items-center gap-2"
                  >
                    <span>Abrir en YouTube</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <p className="text-slate-300 leading-relaxed">
                {activeVideoModal.description}
              </p>

              <div className="flex flex-wrap gap-1.5 pt-2">
                {activeVideoModal.tags.map((tag) => (
                  <span key={tag} className="text-[11px] bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Video Modal */}
      {addVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-red-50 text-red-600">
                  <Youtube className="w-5 h-5 fill-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Agregar Video al Canal</h3>
                  <p className="text-xs text-slate-500">Publica un nuevo enlace de YouTube en la galería</p>
                </div>
              </div>
              <button
                onClick={() => setAddVideoModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddVideoSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Enlace o ID de YouTube *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. https://www.youtube.com/watch?v=q8-eI4iMUp8 o q8-eI4iMUp8"
                  value={formYoutubeUrl}
                  onChange={(e) => setFormYoutubeUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Título del Video *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Tutorial de Uso: Rotomartillos Truper 2026"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Categoría</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:border-red-600"
                >
                  <option value="Tutoriales">Tutoriales</option>
                  <option value="Demostraciones">Demostraciones</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descripción</label>
                <textarea
                  rows={3}
                  placeholder="Resumen del contenido del video y recomendaciones técnicas..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Etiquetas (separadas por comas)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Herramientas, Truper, Capacitación"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:border-red-600"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddVideoModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-md cursor-pointer"
                >
                  Publicar Video
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Video Modal */}
      {editingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-[#0f03f9]">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Editar Información del Video</h3>
                  <p className="text-xs text-slate-500">Actualiza el título, descripción o enlace</p>
                </div>
              </div>
              <button
                onClick={() => setEditingVideo(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditVideoSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Enlace o ID de YouTube *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. https://www.youtube.com/watch?v=q8-eI4iMUp8"
                  value={editYoutubeUrl}
                  onChange={(e) => setEditYoutubeUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:border-[#0f03f9]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Título del Video *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Título descriptivo del video"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:border-[#0f03f9]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Categoría</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:border-[#0f03f9]"
                >
                  <option value="Tutoriales">Tutoriales</option>
                  <option value="Demostraciones">Demostraciones</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descripción</label>
                <textarea
                  rows={3}
                  placeholder="Descripción detallada del contenido del video..."
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:border-[#0f03f9]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Etiquetas (separadas por comas)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Inventario, Tutoriales, Capacitación"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:border-[#0f03f9]"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingVideo(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0f03f9] hover:bg-[#0c02cb] shadow-md cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
