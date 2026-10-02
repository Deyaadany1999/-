import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import {
  Truck,
  ArrowLeft,
  ArrowRight,
  Plus,
  AlertTriangle,
  User,
  Shield,
  Clock,
  CheckCircle2,
  Image as ImageIcon,
  Edit2,
  Trash2,
  Building2,
  Phone,
  CreditCard,
  X,
  FileCheck,
} from 'lucide-react';

interface EquipmentDetailsViewProps {
  equipmentCode: string;
  onNavigate: (view: string, params?: Record<string, any>) => void;
  onOpenProblemModal?: (problemId?: string, defaultEquipmentCode?: string) => void;
}

export const EquipmentDetailsView: React.FC<EquipmentDetailsViewProps> = ({
  equipmentCode,
  onNavigate,
  onOpenProblemModal,
}) => {
  const { t, isRtl, formatDate } = useLanguage();
  const { hasPermission, isAdmin } = useAuth();

  const [equipmentData, setEquipmentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Close problem modal state
  const [closingProblem, setClosingProblem] = useState<any | null>(null);
  const [closeNotes, setCloseNotes] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  // Delete problem state
  const [deletingProblem, setDeletingProblem] = useState<any | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getEquipmentByCode(equipmentCode);
      setEquipmentData(res);
    } catch (err: any) {
      setError(err.message || 'Failed loading equipment details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [equipmentCode]);

  const handleCloseProblemConfirm = async () => {
    if (!closingProblem) return;
    try {
      setIsClosing(true);
      await api.closeProblem(closingProblem.id, {
        closedDate: new Date().toISOString().split('T')[0],
        closeNotes,
      });
      setClosingProblem(null);
      setCloseNotes('');
      fetchDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to close problem');
    } finally {
      setIsClosing(false);
    }
  };

  const handleDeleteProblemConfirm = async () => {
    if (!deletingProblem) return;
    await api.deleteProblem(deletingProblem.id);
    setIsDeleteModalOpen(false);
    setDeletingProblem(null);
    fetchDetails();
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 text-xs">
        <span className="inline-block w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p>{isRtl ? 'جاري تحميل ملف المعدة...' : 'Loading equipment details...'}</p>
      </div>
    );
  }

  if (error || !equipmentData) {
    return (
      <div className="p-6 bg-red-950/40 border border-red-800 rounded-xl text-red-300">
        <p className="font-semibold">{error || 'Equipment not found'}</p>
        <button
          onClick={() => onNavigate('equipment')}
          className="mt-3 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg"
        >
          {t('equipment', 'Back to Equipment List')}
        </button>
      </div>
    );
  }

  const { equipment, problems = [], summary } = equipmentData;
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  return (
    <div className="space-y-6">
      {/* Top Navigation & Profile Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('equipment')}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Back to Equipment"
          >
            <BackIcon className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black font-mono tracking-tight text-red-400">
                {equipment.equipmentCode}
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700">
                {isRtl ? t(equipment.equipmentType, equipment.equipmentType) : equipment.equipmentType}
              </span>
              {summary.openProblems > 0 ? (
                <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-red-950 text-red-400 border border-red-800">
                  {isRtl ? `يوجد (${summary.openProblems}) ملاحظة مفتوحة` : `${summary.openProblems} Defect(s) Active`}
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  {isRtl ? 'مطابق للسلامة' : 'Safety Compliant'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-purple-400" />
              <span>{equipment.contractor}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasPermission('PROBLEMS_ADD') && (
            <button
              onClick={() => onNavigate('problems', { openNewModal: true, defaultCode: equipment.equipmentCode })}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold rounded-lg shadow-md transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t('addProblem', '+ Add Problem')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Cards: Equipment Information, Driver Information, Problem Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Equipment Information */}
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-xl shadow-md">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
            <Truck className="w-4 h-4 text-amber-500" />
            <span>{t('equipmentInformation', 'Equipment Information')}</span>
          </div>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">{t('equipmentCode', 'Equipment Code')}</span>
              <span className="font-mono font-bold text-slate-100 text-sm">{equipment.equipmentCode}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">{t('equipmentType', 'Equipment Type')}</span>
              <span className="font-semibold text-slate-200">{isRtl ? t(equipment.equipmentType, equipment.equipmentType) : equipment.equipmentType}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">{t('contractor', 'Contractor')}</span>
              <span className="font-semibold text-purple-300">{equipment.contractor}</span>
            </div>
          </div>
        </div>

        {/* Driver Information */}
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-xl shadow-md">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
            <User className="w-4 h-4 text-blue-400" />
            <span>{t('driverInformation', 'Driver / Operator Details')}</span>
          </div>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">{t('driverName', 'Driver Name')}</span>
              <span className="font-bold text-slate-100">{equipment.driverName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">{t('driverMobile', 'Mobile Number')}</span>
              <span className="font-mono text-slate-200" dir="ltr">{equipment.driverMobile || '-'}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400 block text-[11px]">{t('nationalId', 'National ID')}</span>
                <span className="font-mono text-slate-300">{equipment.nationalId || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">{t('licenseGrade', 'License Grade')}</span>
                <span className="text-slate-300 truncate block">{equipment.licenseGrade || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Problem Summary Card */}
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-xl shadow-md">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
            <Shield className="w-4 h-4 text-red-500" />
            <span>{isRtl ? 'ملخص السلامة والملاحظات' : 'Safety Defect Summary'}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">{t('totalProblems', 'Total')}</span>
              <div className="text-xl font-black text-white mt-0.5">{summary.totalProblems}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/50">
              <span className="text-[10px] text-amber-400 uppercase font-semibold">{t('openProblems', 'Open')}</span>
              <div className="text-xl font-black text-amber-300 mt-0.5">{summary.openProblems}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800/50">
              <span className="text-[10px] text-red-400 uppercase font-semibold">{t('overdueOpenProblems', 'Overdue')}</span>
              <div className="text-xl font-black text-red-400 mt-0.5">{summary.overdueProblems}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/50">
              <span className="text-[10px] text-emerald-400 uppercase font-semibold">{t('closedProblems', 'Closed')}</span>
              <div className="text-xl font-black text-emerald-400 mt-0.5">{summary.closedProblems}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Associated Problems Section */}
      <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {t('problemsSection', 'Safety Problems & Defect History')} ({problems.length})
            </h3>
          </div>

          {hasPermission('PROBLEMS_ADD') && (
            <button
              onClick={() => onNavigate('problems', { openNewModal: true, defaultCode: equipment.equipmentCode })}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('addProblem', '+ Add Problem')}</span>
            </button>
          )}
        </div>

        {problems.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="font-semibold text-slate-300">
              {isRtl ? 'لا توجد أي مشاكل مسجلة على هذه المعدة. المعدة مطابقة لمعايير السلامة!' : 'No safety defects recorded for this equipment. Equipment is compliant!'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 text-start">{t('problemDescription', 'Problem')}</th>
                  <th className="py-3 px-3 text-start">{t('problemDate', 'Date')}</th>
                  <th className="py-3 px-3 text-start">{t('deadline', 'Deadline')}</th>
                  <th className="py-3 px-3 text-start">{t('daysRemaining', 'Remaining')}</th>
                  <th className="py-3 px-3 text-start">{t('status', 'Status')}</th>
                  <th className="py-3 px-3 text-start">{t('closedDate', 'Closed Date')}</th>
                  <th className="py-3 px-3 text-start">{t('problemImages', 'Photos')}</th>
                  <th className="py-3 px-3 text-end">{t('actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {problems.map((prob: any) => {
                  const isClosed = prob.status === 'CLOSED';
                  return (
                    <tr
                      key={prob.id}
                      onClick={() => onNavigate('problems', { problemId: prob.id })}
                      className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-3 max-w-sm">
                        <div className="font-medium text-slate-100">
                          {isRtl && prob.problemDescriptionAr ? prob.problemDescriptionAr : prob.problemDescription}
                        </div>
                        {prob.closeNotes && (
                          <div className="text-[10px] text-emerald-400 mt-1">
                            ✓ {isRtl ? 'ملاحظة الإصلاح:' : 'Resolution:'} {prob.closeNotes}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300">
                        {prob.problemDate}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300">
                        {prob.deadline}
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge
                          condition={prob.deadlineInfo.condition}
                          diffDays={prob.deadlineInfo.diffDays}
                          label={isRtl ? prob.deadlineInfo.labelAr : prob.deadlineInfo.labelEn}
                          size="sm"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                            isClosed
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}
                        >
                          {isClosed ? t('STATUS_CLOSED', 'Closed') : t('STATUS_OPEN', 'Open')}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400">
                        {prob.closedDate || '-'}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-300">
                          <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>{prob.imagesCount || 0}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-end" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {!isClosed && hasPermission('PROBLEMS_CLOSE') && (
                            <button
                              onClick={() => {
                                setClosingProblem(prob);
                                setCloseNotes('');
                              }}
                              className="px-2 py-1 rounded bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 text-[10px] font-bold transition-colors"
                              title={t('closeProblem', 'Close Problem')}
                            >
                              {t('closeProblem', 'Close')}
                            </button>
                          )}

                          <button
                            onClick={() => onNavigate('problems', { problemId: prob.id })}
                            className="p-1 text-slate-400 hover:text-white"
                            title="View details"
                          >
                            <BackIcon className={`w-3.5 h-3.5 ${isRtl ? '' : 'rotate-180'}`} />
                          </button>

                          {isAdmin && (
                            <button
                              onClick={() => {
                                setDeletingProblem(prob);
                                setIsDeleteModalOpen(true);
                              }}
                              className="p-1 text-slate-400 hover:text-red-400"
                              title="Delete (Admin Only)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

      {/* Close Problem Confirmation Modal */}
      {closingProblem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>{t('closeProblem', 'Verify & Close Problem')}</span>
              </h3>
              <button
                onClick={() => setClosingProblem(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300">
                {isRtl ? 'المعدة:' : 'Equipment:'} <strong className="font-mono text-red-400">{closingProblem.equipmentCode}</strong>
              </p>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-200">
                {closingProblem.problemDescription}
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {t('closeNotes', 'Closing & Resolution Notes')} *
                </label>
                <textarea
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder={isRtl ? 'اكتب تفاصيل الإصلاح وقطع الغيار المعتمدة...' : 'Enter repair notes, parts replaced, and inspection verification...'}
                  rows={3}
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setClosingProblem(null)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg font-medium"
                >
                  {t('cancel', 'Cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleCloseProblemConfirm}
                  disabled={isClosing}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
                >
                  {isClosing ? '...' : t('closeProblem', 'Confirm & Close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Problem Confirmation */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        itemDescription={deletingProblem ? `${deletingProblem.equipmentCode}: ${deletingProblem.problemDescription}` : ''}
        onConfirm={handleDeleteProblemConfirm}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setDeletingProblem(null);
        }}
      />
    </div>
  );
};
