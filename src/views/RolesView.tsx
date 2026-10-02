import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import {
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Lock,
  Layers,
} from 'lucide-react';

export const RolesView: React.FC = () => {
  const { t, isRtl } = useLanguage();
  const { role: currentRole, isAdmin } = useAuth();

  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal for new/edit role
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any | null>(null);
  const [roleForm, setRoleForm] = useState({
    name: '',
    nameAr: '',
    description: '',
  });

  // Selected permissions for the currently edited/viewed role
  const [rolePerms, setRolePerms] = useState<string[]>([]);
  const [isSavingPerms, setIsSavingPerms] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [rList, pList] = await Promise.all([api.getRoles(), api.getPermissions()]);
      setRoles(rList || []);
      setPermissions(pList || []);

      if (rList?.length > 0 && !selectedRole) {
        setSelectedRole(rList[0]);
        setRolePerms(rList[0].permissions || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed loading roles and permissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectRole = (r: any) => {
    setSelectedRole(r);
    setRolePerms(r.permissions || []);
  };

  const togglePermission = (code: string) => {
    if (selectedRole?.id === 'role-admin') return; // Admin has all permissions
    setRolePerms((prev) =>
      prev.includes(code) ? prev.filter((p) => p !== code) : [...prev, code]
    );
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    try {
      setIsSavingPerms(true);
      await api.updateRole(selectedRole.id, {
        name: selectedRole.name,
        nameAr: selectedRole.nameAr,
        description: selectedRole.description,
        permissions: rolePerms,
      });
      alert(isRtl ? 'تم تحديث صلاحيات الدور بنجاح' : 'Role permissions updated successfully');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed saving permissions');
    } finally {
      setIsSavingPerms(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingRole(null);
    setRoleForm({ name: '', nameAr: '', description: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditRole = (r: any) => {
    setEditingRole(r);
    setRoleForm({
      name: r.name,
      nameAr: r.nameAr || '',
      description: r.description || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleForm.name.trim()) return;

    try {
      if (editingRole) {
        await api.updateRole(editingRole.id, {
          ...roleForm,
          permissions: editingRole.permissions,
        });
      } else {
        await api.addRole({
          ...roleForm,
          permissions: ['DASHBOARD_VIEW'],
        });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to save role');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await api.deleteRole(deleteTarget.id);
    setIsDeleteModalOpen(false);
    setDeleteTarget(null);
    fetchData();
  };

  // Group permissions by category
  const categories = Array.from(new Set(permissions.map((p) => p.category)));

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-red-500" />
            <span>{t('rolesPermissions', 'Roles & Granular Permissions')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isRtl
              ? 'إنشاء وتعديل الأدوار الوظيفية وضبط مصفوفة الصلاحيات لكل دور'
              : 'Dynamic role definitions & fine-grained module access control matrix'}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isRtl ? 'إنشاء دور مخصص جديد' : 'Create Custom Role'}</span>
          </button>
        )}
      </div>

      {/* Main Container: Roles List on left, Permissions Matrix on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles List */}
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl shadow-md space-y-3">
          <div className="text-xs font-bold text-slate-300 pb-2 border-b border-slate-800 uppercase tracking-wider">
            {isRtl ? 'قائمة الأدوار المعتمدة' : 'Defined System Roles'} ({roles.length})
          </div>

          <div className="space-y-2">
            {roles.map((r) => {
              const isSelected = selectedRole?.id === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => handleSelectRole(r)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-red-600/20 border-red-500/60 text-white'
                      : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 font-bold text-slate-100">
                      <span>{isRtl ? r.nameAr || r.name : r.name}</span>
                      {r.isSystem && (
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-400 border border-slate-700">
                          System
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {!r.isSystem && isAdmin && (
                        <>
                          <button
                            onClick={() => handleOpenEditRole(r)}
                            className="p-1 text-slate-400 hover:text-blue-400 rounded"
                            title="Edit Role Name"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteTarget(r);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1 text-slate-400 hover:text-red-400 rounded"
                            title="Delete Role"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2">{r.description}</p>
                  <div className="mt-2 text-[10px] font-semibold text-red-400">
                    {r.permissions?.length || 0} {isRtl ? 'صلاحيات مفعلة' : 'Permissions Granted'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Permissions Checkbox Matrix */}
        <div className="lg:col-span-2 p-6 bg-slate-900/90 border border-slate-800 rounded-xl shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-white">
                  {selectedRole ? (isRtl ? selectedRole.nameAr || selectedRole.name : selectedRole.name) : 'Select a Role'}
                </span>
                {selectedRole?.id === 'role-admin' && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                    <Lock className="w-3 h-3" /> All Access Locked
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{selectedRole?.description}</p>
            </div>

            {selectedRole?.id !== 'role-admin' && isAdmin && (
              <button
                onClick={handleSavePermissions}
                disabled={isSavingPerms}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                {isSavingPerms ? 'Saving...' : t('save', 'Save Permissions')}
              </button>
            )}
          </div>

          {/* Grouped Checkboxes */}
          <div className="space-y-6 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
            {categories.map((cat) => {
              const catPerms = permissions.filter((p) => p.category === cat);
              return (
                <div key={cat} className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                    <Layers className="w-3.5 h-3.5" />
                    <span>{cat}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {catPerms.map((p) => {
                      const isChecked = rolePerms.includes(p.code) || selectedRole?.id === 'role-admin';
                      const isDisabled = selectedRole?.id === 'role-admin' || !isAdmin;

                      return (
                        <label
                          key={p.code}
                          className={`flex items-start gap-3 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-slate-950/80 border-slate-700 text-slate-100'
                              : 'bg-slate-950/30 border-slate-800/80 text-slate-400 hover:bg-slate-950/60'
                          } ${isDisabled ? 'opacity-80 cursor-not-allowed' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isDisabled}
                            onChange={() => togglePermission(p.code)}
                            className="mt-0.5 rounded border-slate-700 bg-slate-900 text-red-600 focus:ring-red-500"
                          />
                          <div>
                            <div className="font-semibold">{isRtl ? p.nameAr || p.name : p.name}</div>
                            <div className="font-mono text-[10px] text-slate-400">{p.code}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add / Edit Role Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-white text-base">
                {editingRole ? 'Edit Role Details' : 'Create Custom Role'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Role Name (English) *</label>
                <input
                  type="text"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                  required
                  placeholder="Safety Auditor"
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Role Name (العربية)</label>
                <input
                  type="text"
                  value={roleForm.nameAr}
                  onChange={(e) => setRoleForm({ ...roleForm, nameAr: e.target.value })}
                  dir="rtl"
                  placeholder="مدقق سلامة ميداني"
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  rows={3}
                  placeholder="Describe the responsibilities and scope of this role..."
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg"
                >
                  {t('cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg"
                >
                  Save Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Role Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        itemDescription={deleteTarget ? `${deleteTarget.name}` : ''}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
};
