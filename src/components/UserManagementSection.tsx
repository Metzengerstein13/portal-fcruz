import React, { useState } from 'react';
import { ManagedUser, UserProfile, UserRole } from '../types';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  UserCheck, 
  Building2, 
  Search, 
  Trash2, 
  Edit3, 
  X, 
  Plus, 
  CheckCircle2, 
  Lock, 
  AlertCircle,
  Mail,
  Briefcase,
  User,
  Shield,
  FileText
} from 'lucide-react';

interface UserManagementSectionProps {
  currentUser: UserProfile | null;
  users: ManagedUser[];
  onAddUser: (user: Omit<ManagedUser, 'id' | 'createdAt'>) => Promise<void> | void;
  onUpdateUser: (id: string, updated: Partial<ManagedUser>) => Promise<void> | void;
  onDeleteUser: (id: string) => Promise<void> | void;
}

export const UserManagementSection: React.FC<UserManagementSectionProps> = ({
  currentUser,
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState<{
    email: string;
    displayName: string;
    role: UserRole;
    department: string;
    notes: string;
  }>({
    email: '',
    displayName: '',
    role: 'Ventas',
    department: 'Ventas y Mostrador',
    notes: ''
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if current user is Admin
  if (!currentUser || currentUser.role !== 'Administrador') {
    return (
      <div className="bg-white rounded-xl p-8 sm:p-12 text-center border border-slate-200 shadow-sm max-w-2xl mx-auto my-12">
        <div className="w-16 h-16 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-200">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900">
          Acceso Restringido
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
          El módulo de Gestión de Usuarios y Permisos es exclusivo para personal con rol de <strong>Administrador</strong> de Ferretería Cruz.
        </p>
      </div>
    );
  }

  const handleRoleSelectChange = (newRole: UserRole) => {
    let defaultDept = formData.department;
    if (newRole === 'Administrador') defaultDept = 'Dirección General';
    else if (newRole === 'Ventas') defaultDept = 'Ventas y Mostrador';
    else if (newRole === 'Almacén') defaultDept = 'Logística y Almacén';
    else if (newRole === 'Colaborador') defaultDept = 'Atención al Cliente';

    setFormData({
      ...formData,
      role: newRole,
      department: defaultDept
    });
  };

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormData({
      email: '',
      displayName: '',
      role: 'Ventas',
      department: 'Ventas y Mostrador',
      notes: ''
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: ManagedUser) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      department: user.department,
      notes: user.notes || ''
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.displayName.trim()) {
      setFormError('Por favor completa todos los campos requeridos (Correo y Nombre).');
      return;
    }

    if (!formData.email.includes('@')) {
      setFormError('Introduce un correo electrónico válido.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (editingUser) {
        await onUpdateUser(editingUser.id, {
          email: formData.email.trim(),
          displayName: formData.displayName.trim(),
          role: formData.role,
          department: formData.department.trim(),
          notes: formData.notes.trim()
        });
      } else {
        // Check if email already exists
        const exists = users.some(u => u.email.toLowerCase() === formData.email.trim().toLowerCase());
        if (exists) {
          setFormError('Ya existe un usuario registrado con este correo electrónico.');
          setIsSubmitting(false);
          return;
        }

        await onAddUser({
          email: formData.email.trim(),
          displayName: formData.displayName.trim(),
          role: formData.role,
          department: formData.department.trim(),
          status: 'Activo',
          notes: formData.notes.trim(),
          createdBy: currentUser.email
        });
      }

      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error in user management:', err);
      setFormError('Ocurrió un error al guardar el usuario. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await onDeleteUser(id);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  // Filtering
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.department.toLowerCase().includes(searchTerm.toLowerCase());

    if (roleFilter === 'todos') return matchesSearch;
    if (roleFilter === 'admin') return matchesSearch && u.role === 'Administrador';
    if (roleFilter === 'ventas') return matchesSearch && u.role === 'Ventas';
    if (roleFilter === 'almacen') return matchesSearch && u.role === 'Almacén';
    if (roleFilter === 'colaborador') return matchesSearch && u.role === 'Colaborador';
    return matchesSearch;
  });

  const totalAdmins = users.filter(u => u.role === 'Administrador').length;
  const totalVentas = users.filter(u => u.role === 'Ventas').length;
  const totalAlmacen = users.filter(u => u.role === 'Almacén').length;

  return (
    <div className="space-y-6 pb-16 animate-fadeIn">
      {/* Top Banner & Title Section */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -z-10 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-[#0f03f9] border border-blue-200 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Módulo de Administración
              </span>
              <span className="text-xs font-medium text-slate-500">
                Ferretería Cruz
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Gestión de Usuarios y Permisos
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Administra las cuentas autorizadas para acceder al Portal Privado. Configura roles para <strong>Ventas / Mostrador</strong> y <strong>Logística / Almacén</strong> para controlar el acceso a los módulos privados.
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="px-5 py-3 rounded-xl font-bold text-xs bg-[#0f03f9] hover:bg-[#0c02cb] text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Agregar Nuevo Usuario</span>
          </button>
        </div>

        {/* Quick Stat Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <p className="text-[11px] font-medium text-slate-500">Total Cuentas</p>
            <p className="text-xl font-black text-slate-800 mt-0.5">{users.length}</p>
          </div>
          <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-100">
            <p className="text-[11px] font-medium text-[#0f03f9]">Administradores</p>
            <p className="text-xl font-black text-[#0f03f9] mt-0.5">{totalAdmins}</p>
          </div>
          <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100">
            <p className="text-[11px] font-medium text-emerald-700">Ventas & Mostrador</p>
            <p className="text-xl font-black text-emerald-800 mt-0.5">{totalVentas}</p>
          </div>
          <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-100">
            <p className="text-[11px] font-medium text-amber-800">Logística & Almacén</p>
            <p className="text-xl font-black text-amber-900 mt-0.5">{totalAlmacen}</p>
          </div>
        </div>
      </div>

      {/* Controls Bar: Search & Role Filters */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por correo, nombre o departamento..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f03f9] focus:bg-white transition-all"
          />
        </div>

        {/* Role Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setRoleFilter('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              roleFilter === 'todos'
                ? 'bg-[#0f03f9] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({users.length})
          </button>
          <button
            onClick={() => setRoleFilter('admin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              roleFilter === 'admin'
                ? 'bg-[#0f03f9] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Admins ({totalAdmins})
          </button>
          <button
            onClick={() => setRoleFilter('ventas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              roleFilter === 'ventas'
                ? 'bg-[#0f03f9] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Ventas ({totalVentas})
          </button>
          <button
            onClick={() => setRoleFilter('almacen')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              roleFilter === 'almacen'
                ? 'bg-[#0f03f9] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Almacén ({totalAlmacen})
          </button>
        </div>
      </div>

      {/* Users Table / Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-800">No se encontraron usuarios</h4>
            <p className="text-xs text-slate-500 mt-1">Intenta ajustando el término de búsqueda o el filtro seleccionado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 sm:px-6">Usuario / Correo</th>
                  <th className="py-3.5 px-4">Rol Asignado</th>
                  <th className="py-3.5 px-4">Departamento</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            u.role === 'Administrador' 
                              ? 'bg-blue-100 text-[#0f03f9]' 
                              : u.role === 'Ventas'
                              ? 'bg-emerald-100 text-emerald-800'
                              : u.role === 'Almacén'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {u.displayName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">
                              {u.displayName}
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono truncate">
                              {u.email}
                            </p>
                            {u.notes && (
                              <p className="text-[10px] text-slate-400 mt-0.5 truncate italic">
                                "{u.notes}"
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold border ${
                          u.role === 'Administrador'
                            ? 'bg-blue-50 text-[#0f03f9] border-blue-200'
                            : u.role === 'Ventas'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : u.role === 'Almacén'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}>
                          {u.role === 'Administrador' && <ShieldCheck className="w-3.5 h-3.5 text-[#0f03f9]" />}
                          {u.role === 'Ventas' && <UserCheck className="w-3.5 h-3.5 text-emerald-600" />}
                          {u.role === 'Almacén' && <Building2 className="w-3.5 h-3.5 text-amber-700" />}
                          <span>{u.role}</span>
                        </span>
                      </td>

                      <td className="py-4 px-4 font-medium text-slate-700">
                        {u.department}
                      </td>

                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Activo
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(u)}
                            className="p-1.5 text-slate-400 hover:text-[#0f03f9] hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar usuario"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Avoid deleting primary admin or active logged in user easily */}
                          {u.email.toLowerCase() !== currentUser.email.toLowerCase() && (
                            <button
                              onClick={() => setDeleteConfirmId(u.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Eliminar usuario"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-[#0f03f9] via-slate-900 to-[#0f03f9]" />

            <div className="p-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0f03f9] flex items-center justify-center">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {editingUser ? 'Editar Usuario' : 'Agregar Nuevo Usuario'}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Configura la cuenta y el perfil corporativo
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Correo Electrónico Google / Corporativo *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="ejemplo@ferreteriacruz.com o correo@gmail.com"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f03f9] focus:bg-white"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Este correo se usará para otorgarle el rol al iniciar sesión con Google.
                  </p>
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombre Completo del Colaborador *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      placeholder="Ej. Lic. Martha Morales"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f03f9] focus:bg-white"
                    />
                  </div>
                </div>

                {/* Role selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Rol / Nivel de Acceso *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleRoleSelectChange(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f03f9] focus:bg-white font-medium"
                  >
                    <option value="Ventas">Ventas y Mostrador (Acceso a Archivos y Videos)</option>
                    <option value="Almacén">Logística y Almacén (Acceso a Archivos y Videos)</option>
                    <option value="Administrador">Administrador (Acceso Total y Carga de Archivos)</option>
                    <option value="Colaborador">Colaborador General</option>
                  </select>
                </div>

                {/* Department */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Departamento o Área *
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="Ej. Ventas y Mostrador"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f03f9] focus:bg-white"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Notas u Observaciones (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Ej. Encargado de caja de mostrador central"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f03f9] focus:bg-white"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 text-xs font-bold text-white bg-[#0f03f9] hover:bg-[#0c02cb] rounded-lg shadow-xs transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSubmitting ? 'Guardando...' : editingUser ? 'Actualizar Usuario' : 'Guardar Usuario'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-200 text-center shadow-xl">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">¿Eliminar este usuario?</h4>
            <p className="text-xs text-slate-600 mt-1">
              Esta acción revocará el permiso asignado a esta cuenta de correo.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteUser(deleteConfirmId)}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-2xs"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
