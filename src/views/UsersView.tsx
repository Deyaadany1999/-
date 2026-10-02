import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import {
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  Key,
  Shield,
  CheckCircle,
  XCircle,
  X,
  Mail,
  Phone,
  Clock,
} from 'lucide-react';

export const UsersView: React.FC = () => {
  const { t, isRtl, formatDate } = useLanguage();
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [modalForm, setModalForm] = useState({
    username: '',
    email: '',
    fullName: '',
    mobile: '',
    password: '',
    roleId: '',
    status: 'Active' as 'Active' | 'Inactive',
  });
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset Password Modal
  const [passwordModalUser, setPasswordModalUser] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Delete Modal
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchUsersAndRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const [uList, rList] = await Promise.all([api.getUsers(), api.getRoles()]);
      setUsers(uList || []);
      setRoles(rList || []);
      if (rList?.length > 0 && !modalForm.roleId) {
        setModalForm((prev) => ({ ...prev, roleId: rList[0].id }));
      }
    } catch (err: any) {
      setError(err.message || 'Failed loading users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndRoles();
  }, []);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setModalForm({
      username: '',
      email: '',
      fullName: '',
      mobile: '+966 ',
      password: '',
      roleId: roles[0]?.id || '',
      status: 'Active',
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: any) => {
    setEditingUser(u);
    setModalForm({
      username: u.username,
      email: u.email,
      fullName: u.fullName,
      mobile: u.mobile || '',
      password: '',
      roleId: u.roleId,
      status: u.status,
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalForm.username.trim() || !modalForm.email.trim() || !modalForm.roleId) {
      setModalError(isRtl ? 'يرجى إكمال الحقول الإلزامية' : 'Please fill all required fields');
      return;
    }
    if (!editingUser && !modalForm.password) {
      setModalError(isRtl ? 'كلمة المرور مطلوبة للمستخدم الجديد' : 'Password is required for new user');
      return;
    }

    try {
      setIsSubmitting(true);
      setModalError(null);

      if (editingUser) {
        await api.updateUser(editingUser.id, modalForm);
      } else {
        await api.addUser(modalForm);
      }

      setIsModalOpen(false);
      fetchUsersAndRoles();
    } catch (err: any) {
      setModalError(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalUser || !newPassword || newPassword.length < 4) {
      setPasswordError(isRtl ? 'يجب أن لا تقل كلمة المرور عن 4 خانات' : 'Password must be at least 4 characters');
      return;
    }

    try {
      await api.resetUserPassword(passwordModalUser.id, newPassword);
      setPasswordModalUser(null);
      setNewPassword('');
      alert(isRtl ? 'تم تغيير كلمة المرور بنجاح' : 'Password reset successfully');
    } catch (err: any) {
      setPasswordError(err.message || 'Failed resetting password');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await api.deleteUser(deleteTarget.id);
    setIsDeleteModalOpen(false);
    setDeleteTarget(null);
    fetchUsersAndRoles();
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-red-500" />
            <span>{t('usersManagement', 'Users Management')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isRtl
              ? 'إدارة حسابات مستخدمي النظام والصلاحيات وحالة الحساب وتعيين الأدوار'
              : 'Administer system users, role allocations, credentials, and active statuses'}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isRtl ? 'إضافة مستخدم جديد' : 'Add New User'}</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <span className="inline-block w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin mb-2" />
            <p>{isRtl ? 'جاري تحميل المستخدمين...' : 'Loading users...'}</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-400 text-xs">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 text-start">{t('fullName', 'Full Name')}</th>
                  <th className="py-3 px-4 text-start">Username</th>
                  <th className="py-3 px-4 text-start">Email</th>
                  <th className="py-3 px-4 text-start">Role</th>
                  <th className="py-3 px-4 text-start">{t('status', 'Status')}</th>
                  <th className="py-3 px-4 text-start">Last Login</th>
                  <th className="py-3 px-4 text-end">{t('actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  const isActive = u.status === 'Active';

                  return (
                    <tr key={u.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-100">
                        {u.fullName}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {u.username}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {u.email}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-red-950/80 text-red-400 border border-red-800/60">
                          <Shield className="w-3 h-3" />
                          <span>{isRtl ? u.roleNameAr : u.roleName}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            isActive
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {isActive ? (
                            <>
                              <CheckCircle className="w-3 h-3 text-emerald-400" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-slate-400" />
                              <span>Inactive</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-400 font-mono">
                        {u.lastLogin ? formatDate(u.lastLogin) : '-'}
                      </td>
                      <td className="py-3 px-4 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setPasswordModalUser(u);
                              setNewPassword('');
                              setPasswordError(null);
                            }}
                            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
                            title="Reset Password"
                          >
                            <Key className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors"
                            title={t('edit', 'Edit')}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {!isCurrent && (
                            <button
                              onClick={() => {
                                setDeleteTarget(u);
                                setIsDeleteModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                              title={t('delete', 'Delete')}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-red-500" />
                <span>{editingUser ? 'Edit User Account' : 'Create User Account'}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              {modalError && (
                <div className="p-3 bg-red-950/60 border border-red-800 rounded-lg text-red-300">
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Username *</label>
                  <input
                    type="text"
                    value={modalForm.username}
                    onChange={(e) => setModalForm({ ...modalForm, username: e.target.value })}
                    required
                    disabled={!!editingUser}
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={modalForm.fullName}
                    onChange={(e) => setModalForm({ ...modalForm, fullName: e.target.value })}
                    required
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Email *</label>
                <input
                  type="email"
                  value={modalForm.email}
                  onChange={(e) => setModalForm({ ...modalForm, email: e.target.value })}
                  required
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Role *</label>
                  <select
                    value={modalForm.roleId}
                    onChange={(e) => setModalForm({ ...modalForm, roleId: e.target.value })}
                    required
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-semibold"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {isRtl ? r.nameAr || r.name : r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Status *</label>
                  <select
                    value={modalForm.status}
                    onChange={(e) => setModalForm({ ...modalForm, status: e.target.value as any })}
                    required
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {!editingUser && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Password *</label>
                  <input
                    type="password"
                    value={modalForm.password}
                    onChange={(e) => setModalForm({ ...modalForm, password: e.target.value })}
                    required
                    placeholder="••••••••"
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg"
                >
                  {t('cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg"
                >
                  {isSubmitting ? '...' : t('save', 'Save User')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6">
            <h3 className="font-bold text-white text-sm flex items-center gap-2 mb-3">
              <Key className="w-4 h-4 text-amber-400" />
              <span>Reset Password: {passwordModalUser.username}</span>
            </h3>

            {passwordError && (
              <div className="p-2 bg-red-950 border border-red-800 rounded text-red-300 text-xs mb-3">
                {passwordError}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPasswordModalUser(null)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded font-medium"
                >
                  {t('cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold"
                >
                  Set Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        itemDescription={deleteTarget ? `${deleteTarget.fullName} (${deleteTarget.username})` : ''}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
};
