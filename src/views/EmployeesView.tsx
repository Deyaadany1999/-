import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import {
  Users,
  Plus,
  Search,
  CreditCard,
  Edit2,
  Trash2,
  Truck,
  Phone,
  Calendar,
  X,
  UserCheck,
} from 'lucide-react';

interface EmployeesViewProps {
  initialSearch?: string;
  onNavigate: (view: string, params?: Record<string, any>) => void;
}

export const EmployeesView: React.FC<EmployeesViewProps> = ({ initialSearch, onNavigate }) => {
  const { t, isRtl, formatDate } = useLanguage();
  const { hasPermission, isAdmin } = useAuth();

  const [employees, setEmployees] = useState<any[]>([]);
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState(initialSearch || '');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Add / Edit modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
  const [modalForm, setModalForm] = useState({
    employeeId: '',
    fullName: '',
    fullNameAr: '',
    position: '',
    positionAr: '',
    mobile: '',
    nationalId: '',
    inductionDate: new Date().toISOString().split('T')[0],
    licenseGrade: '',
    linkedEquipmentCode: '',
  });
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getEmployees({ search, page, limit: 10 });
      setEmployees(res.data);
      setTotalPages(res.totalPages || 1);
      setTotalRecords(res.total || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const loadEquipment = async () => {
    try {
      const res = await api.getEquipment({ limit: 200 });
      setEquipmentList(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadEquipment();
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [page, search]);

  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setModalForm({
      employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      fullName: '',
      fullNameAr: '',
      position: 'Heavy Equipment Operator',
      positionAr: 'مشغل معدات ثقيلة',
      mobile: '+966 ',
      nationalId: '',
      inductionDate: new Date().toISOString().split('T')[0],
      licenseGrade: 'Grade 1 - Heavy Equipment',
      linkedEquipmentCode: '',
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: any) => {
    setEditingEmployee(emp);
    setModalForm({
      employeeId: emp.employeeId,
      fullName: emp.fullName,
      fullNameAr: emp.fullNameAr || '',
      position: emp.position,
      positionAr: emp.positionAr || '',
      mobile: emp.mobile,
      nationalId: emp.nationalId,
      inductionDate: emp.inductionDate,
      licenseGrade: emp.licenseGrade,
      linkedEquipmentCode: emp.linkedEquipmentCode || '',
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalForm.employeeId || !modalForm.fullName.trim() || !modalForm.nationalId || !modalForm.mobile) {
      setModalError(isRtl ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      setModalError(null);

      if (editingEmployee) {
        await api.updateEmployee(editingEmployee.id, modalForm);
      } else {
        await api.addEmployee(modalForm);
      }

      setIsModalOpen(false);
      fetchEmployees();
    } catch (err: any) {
      setModalError(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await api.deleteEmployee(deleteTarget.id);
    setIsDeleteModalOpen(false);
    setDeleteTarget(null);
    fetchEmployees();
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <span>{t('employees', 'Employees & Certified Drivers')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isRtl
              ? `سجل المشغلين والسائقين المعتمدين ودورات السلامة والتراخيص (${totalRecords})`
              : `Authorized operators, induction records, license grades & safety credentials (${totalRecords})`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasPermission('EMPLOYEES_ADD') && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t('addEmployee', 'Add Employee / Driver')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl shadow-md">
        <div className="relative max-w-md">
          <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-2.5 w-4 h-4 text-slate-400`} />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t('searchPlaceholder', 'Search employee ID, name, mobile, national ID...')}
            className={`w-full py-2 ${isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'} text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-red-500`}
          />
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <span className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
            <p>{isRtl ? 'جاري تحميل قائمة الموظفين...' : 'Loading employee records...'}</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-400 text-xs">{error}</div>
        ) : employees.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <Users className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="font-semibold text-slate-300">{t('noEmployeesFound', 'No employees found')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 text-start">{t('employeeId', 'Employee ID')}</th>
                  <th className="py-3 px-4 text-start">{t('fullName', 'Full Name')}</th>
                  <th className="py-3 px-4 text-start">{t('position', 'Position')}</th>
                  <th className="py-3 px-4 text-start">{t('driverMobile', 'Mobile')}</th>
                  <th className="py-3 px-4 text-start">{t('nationalId', 'National ID')}</th>
                  <th className="py-3 px-4 text-start">{t('inductionDate', 'Induction Date')}</th>
                  <th className="py-3 px-4 text-start">{t('linkedEquipment', 'Linked Equipment')}</th>
                  <th className="py-3 px-4 text-end">{t('actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-400">
                      {emp.employeeId}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-100">
                      <div>{emp.fullName}</div>
                      {emp.fullNameAr && <div className="text-[10px] text-slate-400" dir="rtl">{emp.fullNameAr}</div>}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {isRtl && emp.positionAr ? emp.positionAr : emp.position}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300" dir="ltr">
                      {emp.mobile}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {emp.nationalId}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {emp.inductionDate}
                    </td>
                    <td className="py-3 px-4">
                      {emp.linkedEquipmentCode ? (
                        <button
                          onClick={() => onNavigate('equipment-details', { code: emp.linkedEquipmentCode })}
                          className="font-mono font-bold text-red-400 hover:text-red-300 underline"
                        >
                          {emp.linkedEquipmentCode}
                        </button>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-end">
                      <div className="flex items-center justify-end gap-1.5">
                        {hasPermission('IDCARDS_VIEW') && (
                          <button
                            onClick={() => onNavigate('id-cards', { employeeId: emp.employeeId })}
                            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[11px] font-bold rounded transition-colors"
                            title={t('idCards', 'View / Print Safety ID Card')}
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>{t('idCards', 'ID Card')}</span>
                          </button>
                        )}

                        {hasPermission('EMPLOYEES_EDIT') && (
                          <button
                            onClick={() => handleOpenEdit(emp)}
                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors"
                            title={t('edit', 'Edit')}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {isAdmin && (
                          <button
                            onClick={() => {
                              setDeleteTarget(emp);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                            title={t('delete', 'Delete (Admin Only)')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                <span>
                  {editingEmployee
                    ? t('editEmployee', 'Edit Employee / Driver')
                    : t('addEmployee', 'Add Employee / Operator')}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">{t('employeeId', 'Employee ID')} *</label>
                  <input
                    type="text"
                    value={modalForm.employeeId}
                    onChange={(e) => setModalForm({ ...modalForm, employeeId: e.target.value.toUpperCase() })}
                    required
                    disabled={!!editingEmployee}
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">{t('linkedEquipment', 'Linked Equipment')}</label>
                  <select
                    value={modalForm.linkedEquipmentCode}
                    onChange={(e) => setModalForm({ ...modalForm, linkedEquipmentCode: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
                  >
                    <option value="">{isRtl ? 'بدون ربط حالياً' : 'None / Not Assigned'}</option>
                    {equipmentList.map((eq) => (
                      <option key={eq.id} value={eq.equipmentCode}>
                        {eq.equipmentCode} ({eq.equipmentType})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">{t('fullName', 'Full Name')} (English) *</label>
                <input
                  type="text"
                  value={modalForm.fullName}
                  onChange={(e) => setModalForm({ ...modalForm, fullName: e.target.value })}
                  required
                  placeholder="Mohammed Abdullah Al-Shehri"
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">{t('fullName', 'Full Name')} (العربية)</label>
                <input
                  type="text"
                  value={modalForm.fullNameAr}
                  onChange={(e) => setModalForm({ ...modalForm, fullNameAr: e.target.value })}
                  dir="rtl"
                  placeholder="محمد عبدالله الشهري"
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">{t('driverMobile', 'Mobile')} *</label>
                  <input
                    type="text"
                    value={modalForm.mobile}
                    onChange={(e) => setModalForm({ ...modalForm, mobile: e.target.value })}
                    required
                    dir="ltr"
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono text-start"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">{t('nationalId', 'National ID')} *</label>
                  <input
                    type="text"
                    value={modalForm.nationalId}
                    onChange={(e) => setModalForm({ ...modalForm, nationalId: e.target.value })}
                    required
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">{t('position', 'Position')}</label>
                  <input
                    type="text"
                    value={modalForm.position}
                    onChange={(e) => setModalForm({ ...modalForm, position: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">{t('inductionDate', 'Induction Date')}</label>
                  <input
                    type="date"
                    value={modalForm.inductionDate}
                    onChange={(e) => setModalForm({ ...modalForm, inductionDate: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono"
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
                  {isSubmitting ? '...' : t('save', 'Save Employee')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        itemDescription={deleteTarget ? `${deleteTarget.fullName} (${deleteTarget.employeeId})` : ''}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
};
