import React, { useState, useEffect } from 'react';
import { 
  UserProfile, 
  DocumentItem, 
  DocumentCategory,
  YouTubeVideoItem, 
  SupplierItem, 
  AnnouncementItem, 
  ActiveTab,
  ManagedUser,
  checkIsAdmin
} from './types';
import { 
  INITIAL_DOCUMENTS, 
  INITIAL_YOUTUBE_VIDEOS, 
  INITIAL_SUPPLIERS, 
  INITIAL_ANNOUNCEMENTS,
  INITIAL_MANAGED_USERS
} from './data/initialData';
import { Header } from './components/Header';
import { HomeSection } from './components/HomeSection';
import { DocumentsSection } from './components/DocumentsSection';
import { YouTubeSection } from './components/YouTubeSection';
import { SuppliersSection } from './components/SuppliersSection';
import { GlobalSearchSection } from './components/GlobalSearchSection';
import { UserManagementSection } from './components/UserManagementSection';
import { LoginModal } from './components/LoginModal';
import { Logo } from './components/Logo';
import { auth, logOutUser } from './lib/firebase';
import { 
  saveUsersToIndexedDb,
  getUsersFromIndexedDb
} from './utils/indexedDbStorage';
import { 
  uploadDocumentToCloudinary, 
  fetchFiles, 
  deleteDocumentFromSharedCatalog, 
  updateDocumentInSharedCatalog 
} from './utils/cloudinaryStorage';
import { onAuthStateChanged } from 'firebase/auth';
import { Heart, ShieldCheck, ExternalLink } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('inicio');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [isDocsLoading, setIsDocsLoading] = useState<boolean>(true);

  // Managed Users collection (IndexedDB + LocalStorage)
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>(() => {
    const map = new Map<string, ManagedUser>();
    INITIAL_MANAGED_USERS.forEach((u) => map.set(u.id, u));
    try {
      const saved = localStorage.getItem('fc_managed_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const legacyIds = ['usr_admin_1', 'usr_admin_2', 'usr_admin_3', 'usr_ventas_1', 'usr_almacen_1'];
          parsed.forEach((u: ManagedUser) => {
            if (u && u.id && !legacyIds.includes(u.id)) {
              map.set(u.id, u);
            }
          });
        }
      }
    } catch (e) {
      console.warn('Failed to load saved managed users');
    }
    return Array.from(map.values());
  });

  // App State collections - Documents loaded directly from centralized Cloudinary & shared API
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [videos, setVideos] = useState<YouTubeVideoItem[]>(() => {
    try {
      const saved = localStorage.getItem('fc_videos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
    return INITIAL_YOUTUBE_VIDEOS;
  });
  const [suppliers] = useState<SupplierItem[]>(INITIAL_SUPPLIERS);
  const [announcements] = useState<AnnouncementItem[]>(INITIAL_ANNOUNCEMENTS);

  // Centralized fetch and sync function for Supabase documents
  const loadSharedFiles = async (showLoadingSpinner: boolean = false) => {
    if (showLoadingSpinner) setIsDocsLoading(true);
    try {
      const supDocs = await fetchFiles();
      if (supDocs && Array.isArray(supDocs)) {
        // Guarantee unique keys across all loaded documents
        const seenIds = new Set<string>();
        const uniqueDocs: DocumentItem[] = [];
        for (const doc of supDocs) {
          if (!doc) continue;
          let docId = doc.id || `doc_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
          if (seenIds.has(docId)) {
            docId = `${docId}_${Math.random().toString(36).substring(2, 7)}`;
          }
          seenIds.add(docId);
          uniqueDocs.push({ ...doc, id: docId });
        }
        setDocuments(uniqueDocs);
      }
    } catch (err) {
      console.warn('Error loading files from Supabase:', err);
    } finally {
      setIsDocsLoading(false);
    }
  };

  // 1. Initial Mount: Load users and fetch centralized Cloudinary documents
  useEffect(() => {
    // Load users from IndexedDB
    getUsersFromIndexedDb().then((idbUsers) => {
      if (idbUsers && idbUsers.length > 0) {
        setManagedUsers((prevUsers) => {
          const map = new Map<string, ManagedUser>();
          INITIAL_MANAGED_USERS.forEach((u) => map.set(u.id, u));
          prevUsers.forEach((u) => map.set(u.id, u));
          const legacyIds = ['usr_admin_1', 'usr_admin_2', 'usr_admin_3', 'usr_ventas_1', 'usr_almacen_1'];
          idbUsers.forEach((u) => {
            if (u && u.id && !legacyIds.includes(u.id)) {
              const existing = map.get(u.id);
              if (!existing || (u.updatedAt || 0) >= (existing.updatedAt || 0)) {
                map.set(u.id, u);
              }
            }
          });
          return Array.from(map.values());
        });
      }
    });

    // Synchronize documents from centralized Cloudinary source
    loadSharedFiles(true);

    // Periodic synchronization every 15s to keep all browsers & incognito sessions in sync
    const interval = setInterval(() => {
      loadSharedFiles(false);
    }, 15000);

    const onFocus = () => {
      loadSharedFiles(false);
    };
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  // 2. Save managedUsers to IndexedDB and localStorage
  useEffect(() => {
    saveUsersToIndexedDb(managedUsers);
    try {
      localStorage.setItem('fc_managed_users', JSON.stringify(managedUsers));
    } catch (e) {
      console.warn('Failed to persist managed users to localStorage');
    }
  }, [managedUsers]);

  // 3. Save videos to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('fc_videos', JSON.stringify(videos));
    } catch (e) {}
  }, [videos]);

  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideoItem | null>(null);

  const handleSelectVideo = (video: YouTubeVideoItem) => {
    setSelectedVideo(video);
    setActiveTab('youtube');
  };

  // Listen for Firebase Auth state changes and match role from managedUsers or ADMIN_EMAILS
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const emailLower = (user.email || '').toLowerCase();
        
        // Find registered user in managedUsers
        const matched = managedUsers.find(u => u.email.toLowerCase() === emailLower);
        const isAdmin = checkIsAdmin(user.email);

        const assignedRole = matched ? matched.role : (isAdmin ? 'Administrador' : 'Ventas');
        const assignedDept = matched ? matched.department : (isAdmin ? 'Dirección' : 'Ventas y Mostrador');
        const assignedName = matched ? matched.displayName : (user.displayName || 'Colaborador Ferretería Cruz');

        setCurrentUser({
          uid: user.uid,
          email: user.email || 'colaborador@ferreteriacruz.com',
          displayName: assignedName,
          photoURL: user.photoURL || undefined,
          role: assignedRole,
          department: assignedDept,
          isDemo: false
        });
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, [managedUsers]);

  // User Management Actions
  const handleAddUser = async (newUserData: Omit<ManagedUser, 'id' | 'createdAt'>) => {
    const now = Date.now();
    const newUser: ManagedUser = {
      ...newUserData,
      id: `usr_${now}`,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: now
    };

    setManagedUsers((prev) => {
      const updated = [newUser, ...prev];
      try {
        localStorage.setItem('fc_managed_users', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleUpdateUser = async (id: string, updated: Partial<ManagedUser>) => {
    const now = Date.now();
    setManagedUsers((prev) => {
      const updatedList = prev.map((u) => (u.id === id ? { ...u, ...updated, updatedAt: now } : u));
      try {
        localStorage.setItem('fc_managed_users', JSON.stringify(updatedList));
      } catch (e) {}
      return updatedList;
    });
  };

  const handleDeleteUser = async (id: string) => {
    setManagedUsers((prev) => {
      const updated = prev.filter((u) => u.id !== id);
      try {
        localStorage.setItem('fc_managed_users', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Document Actions (Upload to Cloudinary + Metadata in Supabase)
  const handleAddDocument = async (
    newDocData: Omit<DocumentItem, 'id' | 'createdAt'> & { fileObj?: File | null },
    onProgress?: (percent: number, statusText: string) => void
  ) => {
    const fileSource = newDocData.fileObj || newDocData.fileUrl;

    if (!fileSource) {
      throw new Error('Por favor selecciona un archivo válido para subir.');
    }

    onProgress?.(15, 'Enviando archivo a Cloudinary...');

    // Upload to Cloudinary and insert metadata directly into Supabase
    await uploadDocumentToCloudinary({
      file: fileSource,
      title: newDocData.title,
      description: newDocData.description,
      category: newDocData.category,
      tags: newDocData.tags || [],
      uploadedBy: newDocData.uploadedBy || currentUser?.email || 'deliriumtremens365@gmail.com',
      uploaderName: newDocData.uploaderName || currentUser?.displayName || 'Ing. Carlos Mauricio López',
      fileName: newDocData.fileName || newDocData.fileObj?.name || newDocData.title,
      onProgress
    });

    // Refresh files directly from Supabase
    await loadSharedFiles(false);
  };

  const handleDeleteDocument = async (docId: string) => {
    // Delete from Supabase
    await deleteDocumentFromSharedCatalog(docId);
    // Reload documents directly from Supabase
    await loadSharedFiles(false);
  };

  const handleTogglePin = async (docId: string) => {
    const targetDoc = documents.find((d) => d.id === docId);
    if (!targetDoc) return;
    const newPinned = !targetDoc.pinned;
    await updateDocumentInSharedCatalog(docId, { pinned: newPinned });
    setDocuments((prev) => prev.map((d) => (d.id === docId ? { ...d, pinned: newPinned } : d)));
  };

  const handleUpdateDocument = async (docId: string, updatedFields: Partial<DocumentItem>) => {
    await updateDocumentInSharedCatalog(docId, updatedFields);
    setDocuments((prev) => prev.map((d) => (d.id === docId ? { ...d, ...updatedFields } : d)));
  };

  const handleAddVideo = async (newVideoData: Omit<YouTubeVideoItem, 'id'>) => {
    const now = Date.now();
    const videoItem: YouTubeVideoItem = {
      ...newVideoData,
      id: `yt_${now}`,
      updatedAt: now
    };

    setVideos((prev) => {
      const updated = [videoItem, ...prev];
      try {
        localStorage.setItem('fc_videos', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleUpdateVideo = async (videoId: string, updatedFields: Partial<YouTubeVideoItem>) => {
    const now = Date.now();
    setVideos((prev) => {
      const updated = prev.map((v) => (v.id === videoId ? { ...v, ...updatedFields, updatedAt: now } : v));
      try {
        localStorage.setItem('fc_videos', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleDeleteVideo = async (videoId: string) => {
    setVideos((prev) => {
      const updated = prev.filter((v) => v.id !== videoId);
      try {
        localStorage.setItem('fc_videos', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleLogout = async () => {
    try {
      await logOutUser();
    } catch (e) {
      console.warn('Logout notice');
    }
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans antialiased selection:bg-[#0022D6] selection:text-white">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenLogin={() => setLoginModalOpen(true)}
        onLogout={handleLogout}
        managedUsers={managedUsers}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'inicio' && (
          <HomeSection
            documents={documents}
            videos={videos}
            suppliers={suppliers}
            announcements={announcements}
            currentUser={currentUser}
            onSelectVideo={handleSelectVideo}
            setActiveTab={setActiveTab}
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenLogin={() => setLoginModalOpen(true)}
          />
        )}

        {activeTab === 'documentos' && (
          <DocumentsSection
            documents={documents}
            currentUser={currentUser}
            onAddDocument={handleAddDocument}
            onUpdateDocument={handleUpdateDocument}
            onDeleteDocument={handleDeleteDocument}
            onTogglePin={handleTogglePin}
            onOpenLogin={() => setLoginModalOpen(true)}
            onRefresh={() => loadSharedFiles(true)}
            isLoading={isDocsLoading}
          />
        )}

        {activeTab === 'youtube' && (
          <YouTubeSection
            videos={videos}
            selectedVideo={selectedVideo}
            onSelectVideo={setSelectedVideo}
            currentUser={currentUser}
            onAddVideo={handleAddVideo}
            onUpdateVideo={handleUpdateVideo}
            onDeleteVideo={handleDeleteVideo}
            onOpenLogin={() => setLoginModalOpen(true)}
          />
        )}

        {activeTab === 'proveedores' && (
          <SuppliersSection
            suppliers={suppliers}
          />
        )}

        {activeTab === 'buscador' && (
          <GlobalSearchSection
            documents={documents}
            videos={videos}
            suppliers={suppliers}
            announcements={announcements}
            currentUser={currentUser}
            onOpenLogin={() => setLoginModalOpen(true)}
            onSelectVideo={handleSelectVideo}
            setActiveTab={setActiveTab}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'usuarios' && (
          <UserManagementSection
            currentUser={currentUser}
            users={managedUsers}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
          />
        )}
      </main>

      {/* Login / Access Modal */}
      {loginModalOpen && (
        <LoginModal
          isOpen={loginModalOpen}
          onClose={() => setLoginModalOpen(false)}
          managedUsers={managedUsers}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setLoginModalOpen(false);
          }}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Logo className="w-8 h-8 rounded-lg" />
              <div>
                <p className="text-xs font-bold text-slate-900">
                  Portal Interno Ferretería Cruz &copy; {new Date().getFullYear()}
                </p>
                <p className="text-[11px] text-slate-500">
                  Herramienta de uso exclusivo para colaboradores y personal autorizado.
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Diseñado por: Carlos Mauricio López
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Almacenamiento Cloudinary Activo
              </span>
              <span>•</span>
              <button 
                onClick={() => setActiveTab('inicio')}
                className="hover:text-[#0022D6] transition-colors"
              >
                Inicio
              </button>
              <span>•</span>
              <button 
                onClick={() => setActiveTab('documentos')}
                className="hover:text-[#0022D6] transition-colors"
              >
                Archivos
              </button>
              <span>•</span>
              <button 
                onClick={() => setActiveTab('youtube')}
                className="hover:text-[#0022D6] transition-colors"
              >
                Capacitaciones
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
