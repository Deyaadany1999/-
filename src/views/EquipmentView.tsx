import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import {
  Truck,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X,
  FileSpreadsheet,
} from 'lucide-react';

interface EquipmentViewProps {
  initialType?: string;
  onNavigate: (view: string, params?: Record<string, any>) => void;
}

export const EquipmentView: React.FC<EquipmentViewProps> = ({ initialType, onNavigate }) => {
  const { t, isRtl } = useLanguage();
  const { hasPermission, isAdmin } = useAuth();

  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [contractors, setContractors] = useState<any[]>([]);
  const [equipmentTypes, setEquipmentTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>(initialType || 'all');
  const [selectedContractor, setSelectedContractor] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modals
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<any | null>(null);
  const [modalForm, setModalForm] = useState({
    equipmentCode: '',
    equipmentType: 'Trailers',
    contractor: '',
    driverName: '',
    driverMobile: '',
    licenseGrade: '',
    nationalId: '',
  });
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, any> = {
        page,
        limit: 10,
        type: selectedType,
        contractor: selectedContractor,
      };
      if (search.trim()) params.search = search.trim();

      const res = await api.getEquipment(params);
      setEquipmentList(res.data);
      setTotalPages(res.totalPages || 1);
      setTotalRecords(res.total || 0);
    } catch (err: any) {
      setError(err.message || 'Failed loading equipment');
    } finally {
      setLoading(false);
    }
  };

  const loadMasterData = async () => {
    try {
      const [conts, types] = await Promise.all([api.getContractors(), api.getEquipmentTypes()]);
      setContractors(conts);
      setEquipmentTypes(types);
      if (conts.length > 0 && !modalForm.contractor) {
        setModalForm((prev) => ({ ...prev, contractor: conts[0].name }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadMasterData();
  }, []);

  useEffect(() => {
    if (initialType) {
      setSelectedType(initialType);
    }
  }, [initialType]);

  useEffect(() => {
    fetchEquipment();
  }, [page, selectedType, selectedContractor, search]);

  const handleOpenAdd = () => {
    setEditingEquipment(null);
    setModalForm({
      equipmentCode: '',
      equipmentType: selectedType !== 'all' ? selectedType : equipmentTypes[0]?.name || 'Trailers',
      contractor: contractors[0]?.name || '',
      driverName: '',
      driverMobile: '',
      licenseGrade: '',
      nationalId: '',
    });
    setModalError(null);
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (eq: any) => {
    setEditingEquipment(eq);
    setModalForm({
      equipmentCode: eq.equipmentCode,
      equipmentType: eq.equipmentType,
      contractor: eq.contractor,
      driverName: eq.driverName,
      driverMobile: eq.driverMobile,
      licenseGrade: eq.licenseGrade,
      nationalId: eq.nationalId,
    });
    setModalError(null);
    setIsAddEditModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalForm.equipmentCode.trim() || !modalForm.equipmentType || !modalForm.contractor || !modalForm.driverName.trim()) {
      setModalError(isRtl ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      setModalError(null);

      if (editingEquipment) {
        await api.updateEquipment(editingEquipment.id, modalForm);
      } else {
        await api.addEquipment(modalForm);
      }

      setIsAddEditModalOpen(false);
      fetchEquipment();
    } catch (err: any) {
      setModalError(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePrompt = (eq: any) => {
    setDeleteTarget(eq);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async (force: boolean) => {
    if (!deleteTarget) return;
    await api.deleteEquipment(deleteTarget.id, force);
    setIsDeleteModalOpen(false);
    setDeleteTarget(null);
    fetchEquipment();
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-500" />
            <span>{t('equipment', 'Equipment Management')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isRtl
              ? `إجمالي المعدات المسجلة: ${totalRecords} معدة عبر كافة التصنيفات`
              : `Total Registered Equipment: ${totalRecords} units across all categories`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasPermission('EQUIPMENT_ADD') && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t('addEquipment', 'Add Equipment')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl shadow-md space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-2.5 w-4 h-4 text-slate-400`} />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={t('searchPlaceholder', 'Search code, driver, mobile, national ID...')}
              className={`w-full py-2 ${isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'} text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-red-500`}
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-3 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-hidden focus:border-red-500"
            >
              <option value="all">{t('all', 'All Equipment Types')}</option>
              {equipmentTypes.map((type) => (
                <option key={type.id} value={type.name}>
                  {isRtl ? type.nameAr || type.name : type.name}
                </option>
              ))}
            </select>
          </div>

          {/* Contractor Filter */}
          <div>
            <select
              value={selectedContractor}
              onChange={(e) => {
                setSelectedContractor(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-3 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-hidden focus:border-red-500"
            >
              <option value="all">{t('all', 'All Contractors')}</option>
              {contractors.map((c) => (
                <option key={c.id} value={c.name}>
                  {isRtl ? c.nameAr || c.name : c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Equipment Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <span className="inline-block w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin mb-2" />
            <p>{isRtl ? 'جاري تحميل قائمة المعدات...' : 'Loading equipment records...'}</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-400 text-xs">{error}</div>
        ) : equipmentList.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <Truck className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="font-semibold text-slate-300">{t('noEquipmentFound', 'No equipment records found')}</p>
            <p className="text-slate-400 mt-1">{isRtl ? 'جرب تغيير خيارات التصفية أو البحث' : 'Try adjusting search or filter options'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 text-start">{t('equipmentCode', 'Equipment Code')}</th>
                  <th className="py-3 px-4 text-start">{t('equipmentType', 'Type')}</th>
                  <th className="py-3 px-4 text-start">{t('contractor', 'Contractor')}</th>
                  <th className="py-3 px-4 text-start">{t('driverName', 'Driver / Operator')}</th>
                  <th className="py-3 px-4 text-start">{t('driverMobile', 'Mobile')}</th>
                  <th className="py-3 px-4 text-start">{t('licenseGrade', 'License Grade')}</th>
                  <th className="py-3 px-4 text-start">{t('openProblemsCount', 'Open Defect')}</th>
                  <th className="py-3 px-4 text-start">{t('complianceStatus', 'Status')}</th>
                  <th className="py-3 px-4 text-end">{t('actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {equipmentList.map((eq) => {
                  const hasDefects = eq.openProblems > 0;
                  return (
                    <tr
                      key={eq.id}
                      onClick={() => onNavigate('equipment-details', { code: eq.equipmentCode })}
                      className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-red-400 text-sm">
                        {eq.equipmentCode}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-200">
                        {isRtl ? t(eq.equipmentType, eq.equipmentType) : eq.equipmentType}
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-medium">
                        {eq.contractor}
                      </td>
                      <td className="py-3 px-4 text-slate-200">
                        <div>{eq.driverName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">ID: {eq.nationalId}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300" dir="ltr">
                        {eq.driverMobile || '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {eq.licenseGrade || '-'}
                      </td>
                      <td className="py-3 px-4">
                        {hasDefects ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-950 text-red-400 border border-red-800">
                            <AlertTriangle className="w-3 h-3" />
                            <span>{eq.openProblems}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            hasDefects
                              ? 'bg-rose-950/50 text-rose-300 border-rose-800/60'
                              : 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60'
                          }`}
                        >
                          {isRtl ? eq.statusAr : eq.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-end" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onNavigate('equipment-details', { code: eq.equipmentCode })}
                            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                            title={t('view', 'View Details')}
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {hasPermission('EQUIPMENT_EDIT') && (
                            <button
                              onClick={() => handleOpenEdit(eq)}
                              className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors"
                              title={t('edit', 'Edit')}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {isAdmin && (
                            <button
                              onClick={() => handleDeletePrompt(eq)}
                              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                              title={t('delete', 'Delete (Admin Only)')}
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

        {/* Pagination bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950/60 border-t border-slate-800 text-xs text-slate-400">
          <div>
            {t('showing', 'Showing')} {equipmentList.length} {t('of', 'of')} {totalRecords} {t('records', 'records')}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-300"
            >
              <ChevronLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
            </button>
            <span className="font-semibold text-slate-200">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-300"
            >
              <ChevronRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Equipment Modal */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Truck className="w-5 h-5 text-red-500" />
                <span>
                  {editingEquipment
                    ? t('editEquipment', 'Edit Equipment')
                    : t('addEquipment', 'Add New Equipment')}
                </span>
              </h3>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 bg-red-950/60 border border-red-800 rounded-lg text-red-300 text-xs">
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Equipment Code */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t('equipmentCode', 'Equipment Code')} *
                  </label>
                  <input
                    type="text"
                    value={modalForm.equipmentCode}
                    onChange={(e) => setModalForm({ ...modalForm, equipmentCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. TR-003, C-15"
                    required
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs uppercase font-mono font-bold focus:outline-hidden focus:border-red-500"
                  />
                </div>

                {/* Equipment Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t('equipmentType', 'Equipment Type')} *
                  </label>
                  <select
                    value={modalForm.equipmentType}
                    onChange={(e) => setModalForm({ ...modalForm, equipmentType: e.target.value })}
                    required
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-hidden focus:border-red-500"
                  >
                    {equipmentTypes.map((type) => (
                      <option key={type.id} value={type.name}>
                        {isRtl ? type.nameAr || type.name : type.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Contractor */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t('contractor', 'Contractor')} *
                </label>
                <select
                  value={modalForm.contractor}
                  onChange={(e) => setModalForm({ ...modalForm, contractor: e.target.value })}
                  required
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-hidden focus:border-red-500"
                >
                  <option value="">{isRtl ? 'اختر المقاول' : 'Select Contractor'}</option>
                  {contractors.map((c) => (
                    <option key={c.id} value={c.name}>
                      {isRtl ? c.nameAr || c.name : c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <h4 className="text-xs font-bold text-amber-400 mb-3">
                  {t('driverInformation', 'Driver / Operator Information')}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Driver Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {t('driverName', 'Driver Name')} *
                    </label>
                    <input
                      type="text"
                      value={modalForm.driverName}
                      onChange={(e) => setModalForm({ ...modalForm, driverName: e.target.value })}
                      placeholder="Mohammed Al-Shehri"
                      required
                      className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-hidden focus:border-red-500"
                    />
                  </div>

                  {/* Driver Mobile */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {t('driverMobile', 'Driver Mobile')}
                    </label>
                    <input
                      type="text"
                      value={modalForm.driverMobile}
                      onChange={(e) => setModalForm({ ...modalForm, driverMobile: e.target.value })}
                      placeholder="+966 50 123 4567"
                      dir="ltr"
                      className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-hidden focus:border-red-500 text-start"
                    />
                  </div>

                  {/* National ID */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {t('nationalId', 'National ID / Iqama')}
                    </label>
                    <input
                      type="text"
                      value={modalForm.nationalId}
                      onChange={(e) => setModalForm({ ...modalForm, nationalId: e.target.value })}
                      placeholder="1088492011"
                      className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs font-mono focus:outline-hidden focus:border-red-500"
                    />
                  </div>

                  {/* License Grade */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {t('licenseGrade', 'License Grade')}
                    </label>
                    <input
                      type="text"
                      value={modalForm.licenseGrade}
                      onChange={(e) => setModalForm({ ...modalForm, licenseGrade: e.target.value })}
                      placeholder="Grade 1 - Heavy Mobile Cranes"
                      className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-hidden focus:border-red-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  {t('cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg transition-colors"
                >
                  {isSubmitting ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                  ) : (
                    t('save', 'Save Equipment')
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        itemDescription={deleteTarget ? `${deleteTarget.equipmentCode} (${deleteTarget.equipmentType})` : ''}
        hasRelatedData={deleteTarget && deleteTarget.openProblems > 0}
        relatedCount={deleteTarget ? deleteTarget.openProblems : 0}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
};
