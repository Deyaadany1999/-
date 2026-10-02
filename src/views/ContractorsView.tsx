import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import {
  Building2,
  Plus,
  Search,
  Truck,
  Edit2,
  Trash2,
  Phone,
  Mail,
  User,
  X,
} from 'lucide-react';

interface ContractorsViewProps {
  initialSearch?: string;
  onNavigate: (view: string, params?: Record<string, any>) => void;
}

export const ContractorsView: React.FC<ContractorsViewProps> = ({ initialSearch, onNavigate }) => {
  const { t, isRtl } = useLanguage();
  const { hasPermission, isAdmin } = useAuth();

  const [contractors, setContractors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(initialSearch || '');

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContractor, setEditingContractor] = useState<any | null>(null);
  const [modalForm, setModalForm] = useState({
    name: '',
    nameAr: '',
    contactPerson: '',
    mobile: '',
    email: '',
  });
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchContractors = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getContractors();
      setContractors(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed loading contractors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContractors();
  }, []);

  const handleOpenAdd = () => {
    setEditingContractor(null);
    setModalForm({
      name: '',
      nameAr: '',
      contactPerson: '',
      mobile: '+966 ',
      email: '',
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: any) => {
    setEditingContractor(c);
    setModalForm({
      name: c.name,
      nameAr: c.nameAr || '',
      contactPerson: c.contactPerson || '',
      mobile: c.mobile || '',
      email: c.email || '',
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalForm.name.trim()) {
      setModalError(isRtl ? 'اسم المقاول مطلوب' : 'Contractor name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setModalError(null);

      if (editingContractor) {
        await api.updateContractor(editingContractor.id, modalForm);
      } else {
        await api.addContractor(modalForm);
      }

      setIsModalOpen(false);
      fetchContractors();
    } catch (err: any) {
      setModalError(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await api.deleteContractor(deleteTarget.id);
    setIsDeleteModalOpen(false);
    setDeleteTarget(null);
    fetchContractors();
  };

  const filtered = contractors.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.nameAr && c.nameAr.toLowerCase().includes(search.toLowerCase())) ||
      (c.contactPerson && c.contactPerson.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-400" />
            <span>{t('contractors', 'Contractors Management')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isRtl
              ? `إدارة شركات المقاولات وتوريد المعدات الثقيلة (${contractors.length} مقاول)`
              : `Centralized contractor registry & equipment fleet allocation (${contractors.length} companies)`}
          </p>
        </div>

        {hasPermission('CONTRACTORS_MANAGE') && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isRtl ? 'إضافة مقاول جديد' : 'Add Contractor'}</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl shadow-md">
        <div className="relative max-w-md">
          <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-2.5 w-4 h-4 text-slate-400`} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder', 'Search contractor name, person...')}
            className={`w-full py-2 ${isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'} text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-red-500`}
          />
        </div>
      </div>

      {/* Grid of Contractor Cards */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          <span className="inline-block w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-2" />
          <p>{isRtl ? 'جاري تحميل المقاولين...' : 'Loading contractors...'}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-xs bg-slate-900/60 rounded-xl border border-slate-800">
          <Building2 className="w-10 h-10 mx-auto text-slate-600 mb-2" />
          <p className="font-semibold text-slate-300">{t('noContractorsFound', 'No contractors found')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="p-5 bg-slate-900/90 border border-slate-800 rounded-xl shadow-md flex flex-col justify-between hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-950/70 border border-purple-800/60 flex items-center justify-center text-purple-400 font-bold">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-100">{c.name}</h3>
                      {c.nameAr && <p className="text-xs text-slate-400" dir="rtl">{c.nameAr}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {hasPermission('CONTRACTORS_MANAGE') && (
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="p-1.5 text-slate-400 hover:text-blue-400 rounded hover:bg-slate-800"
                        title={t('edit', 'Edit')}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setDeleteTarget(c);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-400 rounded hover:bg-slate-800"
                        title={t('delete', 'Delete (Admin Only)')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{c.contactPerson || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono" dir="ltr">{c.mobile || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{c.email || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Bottom equipment count */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  {t('equipment', 'Equipment Fleet')}:
                </span>
                <button
                  onClick={() => onNavigate('equipment', { contractor: c.name })}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold transition-colors"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>{c.equipmentCount || 0} {t('units', 'Units')}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-400" />
                <span>
                  {editingContractor
                    ? (isRtl ? 'تعديل بيانات المقاول' : 'Edit Contractor')
                    : (isRtl ? 'إضافة مقاول جديد' : 'Add Contractor')}
                </span>
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

              <div>
                <label className="block font-semibold text-slate-300 mb-1">{t('contractor', 'Contractor Name')} (English) *</label>
                <input
                  type="text"
                  value={modalForm.name}
                  onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })}
                  required
                  placeholder="Al-Bawardi Heavy Transport"
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">{t('contractor', 'Contractor Name')} (العربية)</label>
                <input
                  type="text"
                  value={modalForm.nameAr}
                  onChange={(e) => setModalForm({ ...modalForm, nameAr: e.target.value })}
                  dir="rtl"
                  placeholder="شركة البواردي للنقل الثقيل"
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">{isRtl ? 'مسؤول الاتصال' : 'Contact Person'}</label>
                <input
                  type="text"
                  value={modalForm.contactPerson}
                  onChange={(e) => setModalForm({ ...modalForm, contactPerson: e.target.value })}
                  placeholder="Saleh Al-Bawardi"
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">{t('driverMobile', 'Mobile')}</label>
                  <input
                    type="text"
                    value={modalForm.mobile}
                    onChange={(e) => setModalForm({ ...modalForm, mobile: e.target.value })}
                    dir="ltr"
                    placeholder="+966 50 123 4567"
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono text-start"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={modalForm.email}
                    onChange={(e) => setModalForm({ ...modalForm, email: e.target.value })}
                    placeholder="ops@company.com"
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
              </div>

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
                  {isSubmitting ? '...' : t('save', 'Save Contractor')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        itemDescription={deleteTarget ? `${deleteTarget.name}` : ''}
        hasRelatedData={deleteTarget && deleteTarget.equipmentCount > 0}
        relatedCount={deleteTarget ? deleteTarget.equipmentCount : 0}
        warningMessage={
          deleteTarget && deleteTarget.equipmentCount > 0
            ? isRtl
              ? `لا يمكن حذف المقاول لارتباطه بـ (${deleteTarget.equipmentCount}) معدة!`
              : `Cannot delete contractor with (${deleteTarget.equipmentCount}) linked equipment!`
            : undefined
        }
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
};
