import React, { useState } from 'react';
import { Logo } from './Logo';
import { UserProfile, ActiveTab } from '../types';
import { 
  Home, 
  FileText, 
  Youtube, 
  Truck, 
  Search, 
  LogIn, 
  LogOut, 
  Menu, 
  X, 
  ShieldCheck, 
  Lock, 
  User, 
  ChevronDown,
  Building,
  PhoneCall,
  Sparkles,
  Users
} from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentUser: UserProfile | null;
  onOpenLogin: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenLogin,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const isAdmin = currentUser?.role === 'Administrador';

  interface NavItem {
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    isPrivate: boolean;
  }

  const navItems: NavItem[] = [
    { id: 'inicio', label: 'Escritorio', icon: Home, isPrivate: false },
    { id: 'documentos', label: 'Archivos & Fotos', icon: FileText, isPrivate: true },
    { id: 'youtube', label: 'Videos', icon: Youtube, isPrivate: true },
    { id: 'proveedores', label: 'Directorio', icon: Truck, isPrivate: false },
    { id: 'buscador', label: 'Buscador Portal', icon: Search, isPrivate: false },
    ...(isAdmin ? [{ id: 'usuarios' as ActiveTab, label: 'Usuarios', icon: Users, isPrivate: true }] : [])
  ];

  const handleTabClick = (tabId: ActiveTab, isPrivate: boolean) => {
    if (isPrivate && !currentUser) {
      onOpenLogin();
      return;
    }
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      {/* Top Corporate Status Bar */}
      <div className="bg-[#1E293B] text-slate-300 text-[11px] py-1.5 px-4 sm:px-8 flex flex-wrap items-center justify-between gap-2 border-b border-slate-700">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-medium text-slate-300">
            <PhoneCall className="w-3.5 h-3.5 text-[#0f03f9]" />
            <span>Sugerencias o Consultas marcar al (503) 7853-0346</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#0f03f9]/20 text-blue-300 border border-[#0f03f9]/40">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0f03f9] animate-pulse" />
            Portal Privado En Línea
          </span>
          {currentUser && (
            <span className="text-slate-400 hidden sm:inline">
              Rol: <strong className="text-white font-semibold">{currentUser.role}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <button 
            onClick={() => setActiveTab('inicio')} 
            className="flex items-center gap-3 text-left focus:outline-hidden group"
          >
            <Logo size="md" />
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1 text-sm font-medium text-slate-600">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isLocked = item.isPrivate && !currentUser;

              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id, item.isPrivate)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${
                    isActive
                      ? 'bg-blue-50 text-[#0f03f9] font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-[#0f03f9] hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#0f03f9]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {isLocked && (
                    <Lock className="w-3 h-3 text-[#0f03f9] ml-0.5" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Profile / Auth Action */}
          <div className="flex items-center space-x-4">
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center pl-4 border-l border-slate-200 group focus:outline-hidden"
                >
                  <div className="text-right mr-3 hidden sm:block">
                    <p className="text-xs font-bold text-slate-800 leading-tight group-hover:text-[#0f03f9] transition-colors">
                      {currentUser.displayName}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium">{currentUser.department}</p>
                  </div>
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName}
                      className="w-9 h-9 rounded-full border-2 border-white ring-1 ring-slate-200 shadow-xs object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#0f03f9] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
                </button>

                {/* Profile Dropdown */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-fadeIn">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900">{currentUser.displayName}</p>
                      <p className="text-[11px] text-slate-500">{currentUser.email}</p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-[#0f03f9]">
                          {currentUser.role}
                        </span>
                        {currentUser.isDemo && (
                          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-slate-100 text-slate-600">
                            Demo
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setActiveTab('documentos');
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                    >
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span>Mis Documentos & Fotos</span>
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setActiveTab('usuarios');
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-[#0f03f9] hover:bg-blue-50 flex items-center gap-2 font-bold"
                      >
                        <Users className="w-4 h-4 text-[#0f03f9]" />
                        <span>Gestión de Usuarios</span>
                      </button>
                    )}

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      onClick={() => {
                        onLogout();
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4 text-rose-600" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#0f03f9] hover:bg-[#0c02cb] shadow-xs transition-all duration-200 flex items-center gap-2 active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                <span>Acceso Colaborador</span>
              </button>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2 animate-fadeIn">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isLocked = item.isPrivate && !currentUser;

            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id, item.isPrivate)}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-[#0f03f9]'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-[#0f03f9]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {isLocked && (
                  <span className="flex items-center gap-1 text-xs text-[#0f03f9] font-normal bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    <Lock className="w-3 h-3" /> Privado
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
