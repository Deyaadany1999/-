import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import {
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  Image as ImageIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  Upload,
  X,
  FileCheck,
  Maximize2,
  RefreshCw,
  Building2,
  Calendar,
  RotateCcw,
} from 'lucide-react';

interface ProblemsViewProps {
  initialStatus?: string;
  initialQuickFilter?: string;
  initialProblemId?: string;
  defaultCode?: string;
  openNewModal?: boolean;
  onNavigate: (view: string, params?: Record<string, any>) => void;
}

export const ProblemsView: React.FC<ProblemsViewProps> = ({
  initialStatus,
  initialQuickFilter,
  initialProblemId,
  defaultCode,
  openNewModal = false,
  onNavigate,
}) => {
  const { t, isRtl, formatDate } = useLanguage();
  const { hasPermission, isAdmin } = useAuth();

  const [problems, setProblems] = useState<any[]>([]);
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [equipmentTypes, setEquipmentTypes] = useState<any[]>([]);
  const [contractors, setContractors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatus || 'ALL');
  const [selectedQuickFilter, setSelectedQuickFilter] = useState<string>(initialQuickFilter || 'ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedContractor, setSelectedContractor] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState('deadline');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Details Modal
  const [activeProblem, setActiveProblem] = useState<any | null>(null);
  const [activeProblemDetails, setActiveProblemDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Add / Edit Modal
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState<any | null>(null);
  const [addForm, setAddForm] = useState({
    equipmentCode: defaultCode || '',
    problemDescription: '',
    problemDescriptionAr: '',
    problemDate: new Date().toISOString().split('T')[0],
    deadline: '',
    initialImages: [] as { dataUrl: string; fileName: string; fileSize: number }[],
  });
  const [addModalError, setAddModalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Close modal
  const [closingProblem, setClosingProblem] = useState<any | null>(null);
  const [closeNotes, setCloseNotes] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  // Delete modal
  const [deletingProblem, setDeletingProblem] = useState<any | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Fetch problems list
  const fetchProblems = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, any> = {
        page,
        limit: 10,
        status: selectedStatus,
        quickFilter: selectedQuickFilter,
        equipmentType: selectedType,
        contractor: selectedContractor,
        sortBy,
        sortDir,
      };
      if (search.trim()) params.search = search.trim();

      const res = await api.getProblems(params);
      setProblems(res.data);
      setTotalPages(res.totalPages || 1);
      setTotalRecords(res.total || 0);
    } catch (err: any) {
      setError(err.message || 'Failed loading problems');
    } finally {
      setLoading(false);
    }
  };

  const loadMasterData = async () => {
    try {
      const [eqRes, types, conts] = await Promise.all([
        api.getEquipment({ limit: 200 }),
        api.getEquipmentTypes(),
        api.getContractors(),
      ]);
      setEquipmentList(eqRes.data || []);
      setEquipmentTypes(types || []);
      setContractors(conts || []);

      if (defaultCode && !addForm.equipmentCode) {
        setAddForm((prev) => ({ ...prev, equipmentCode: defaultCode }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadMasterData();
  }, []);

  useEffect(() => {
    if (initialQuickFilter) setSelectedQuickFilter(initialQuickFilter);
    if (initialStatus) setSelectedStatus(initialStatus);
  }, [initialQuickFilter, initialStatus]);

  useEffect(() => {
    fetchProblems();
  }, [page, selectedStatus, selectedQuickFilter, selectedType, selectedContractor, sortBy, sortDir, search]);

  // Open problem details by ID if passed in route
  useEffect(() => {
    if (initialProblemId) {
      openProblemDetails(initialProblemId);
    }
    if (openNewModal) {
      handleOpenAdd();
    }
  }, [initialProblemId, openNewModal]);

  const openProblemDetails = async (id: string) => {
    try {
      setLoadingDetails(true);
      const details = await api.getProblemById(id);
      setActiveProblemDetails(details);
      setActiveProblem(details.problem);
    } catch (e: any) {
      alert(e.message || 'Failed to load problem details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingProblem(null);
    setAddForm({
      equipmentCode: defaultCode || (equipmentList[0]?.equipmentCode || ''),
      problemDescription: '',
      problemDescriptionAr: '',
      problemDate: new Date().toISOString().split('T')[0],
      deadline: '',
      initialImages: [],
    });
    setAddModalError(null);
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (prob: any) => {
    setEditingProblem(prob);
    setAddForm({
      equipmentCode: prob.equipmentCode,
      problemDescription: prob.problemDescription,
      problemDescriptionAr: prob.problemDescriptionAr || '',
      problemDate: prob.problemDate,
      deadline: prob.deadline,
      initialImages: [],
    });
    setAddModalError(null);
    setIsAddEditModalOpen(true);
  };

  // Handle image upload from file picker
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // File validation: jpg, jpeg, png, webp and max size 10MB
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!allowed.includes(file.type)) {
        alert(isRtl ? 'الملف غير مدعوم. يسمح بصور JPG و PNG و WEBP فقط.' : 'Unsupported format. Only JPG, PNG, and WEBP are allowed.');
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert(isRtl ? 'حجم الملف يتجاوز الحد المسموح (10 ميجابايت).' : 'File size exceeds 10MB limit.');
        continue;
      }

      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const dataUrl = loadEvent.target?.result as string;
        setAddForm((prev) => ({
          ...prev,
          initialImages: [...prev.initialImages, { dataUrl, fileName: file.name, fileSize: file.size }],
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload image to existing active problem
  const handleUploadToActiveProblem = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeProblem) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!allowed.includes(file.type)) {
        alert(isRtl ? 'الملف غير مدعوم. يسمح بصور JPG و PNG و WEBP فقط.' : 'Unsupported format.');
        continue;
      }

      const reader = new FileReader();
      reader.onload = async (loadEvent) => {
        const dataUrl = loadEvent.target?.result as string;
        try {
          await api.uploadProblemImage(activeProblem.id, {
            dataUrl,
            fileName: file.name,
            fileSize: file.size,
          });
          openProblemDetails(activeProblem.id);
          fetchProblems();
        } catch (err: any) {
          alert(err.message || 'Failed to upload photo');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!activeProblem) return;
    if (!confirm(isRtl ? 'هل أنت متأكد من حذف هذه الصورة؟' : 'Are you sure you want to delete this photo?')) return;
    try {
      await api.deleteProblemImage(activeProblem.id, imageId);
      openProblemDetails(activeProblem.id);
      fetchProblems();
    } catch (err: any) {
      alert(err.message || 'Failed deleting image');
    }
  };

  const handleSaveProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.equipmentCode || !addForm.problemDescription.trim() || !addForm.deadline) {
      setAddModalError(isRtl ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      setAddModalError(null);

      if (editingProblem) {
        await api.updateProblem(editingProblem.id, addForm);
      } else {
        await api.addProblem(addForm);
      }

      setIsAddEditModalOpen(false);
      fetchProblems();
      if (activeProblem && editingProblem && activeProblem.id === editingProblem.id) {
        openProblemDetails(activeProblem.id);
      }
    } catch (err: any) {
      setAddModalError(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseConfirm = async () => {
    if (!closingProblem) return;
    try {
      setIsClosing(true);
      await api.closeProblem(closingProblem.id, {
        closedDate: new Date().toISOString().split('T')[0],
        closeNotes,
      });
      setClosingProblem(null);
      setCloseNotes('');
      fetchProblems();
      if (activeProblem && activeProblem.id === closingProblem.id) {
        openProblemDetails(activeProblem.id);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to close problem');
    } finally {
      setIsClosing(false);
    }
  };

  const handleReopen = async (probId: string) => {
    if (!confirm(isRtl ? 'هل تريد إعادة فتح هذا البلاغ؟' : 'Reopen this safety defect?')) return;
    try {
      await api.reopenProblem(probId);
      fetchProblems();
      if (activeProblem && activeProblem.id === probId) {
        openProblemDetails(probId);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to reopen');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProblem) return;
    await api.deleteProblem(deletingProblem.id);
    setIsDeleteModalOpen(false);
    setDeletingProblem(null);
    if (activeProblem && activeProblem.id === deletingProblem.id) {
      setActiveProblem(null);
      setActiveProblemDetails(null);
    }
    fetchProblems();
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span>{t('problems', 'Safety Problems & Defect Management')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isRtl
              ? `سجل البلاغات والعيوب الفنية للمعدات (${totalRecords} بلاغ)`
              : `Fleet safety defect inspections, corrective deadlines & history (${totalRecords} records)`}
          </p>
        </div>

        {hasPermission('PROBLEMS_ADD') && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addProblem', 'Log Safety Defect')}</span>
          </button>
        )}
      </div>

      {/* Quick Filter Badges */}
      <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          {t('quickFilters', 'Quick Filters')}:
        </span>

        {[
          { key: 'ALL', label: t('all', 'ALL') },
          { key: 'OPEN', label: t('STATUS_OPEN', 'OPEN') },
          { key: 'DUE_SOON', label: t('DUE_SOON', 'DUE IN 2 DAYS') },
          { key: 'OVERDUE', label: t('OVERDUE', 'OVERDUE') },
          { key: 'CLOSED', label: t('STATUS_CLOSED', 'CLOSED') },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => {
              setSelectedQuickFilter(f.key);
              setPage(1);
            }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              selectedQuickFilter === f.key
                ? f.key === 'OVERDUE'
                  ? 'bg-red-600 text-white shadow-xs'
                  : f.key === 'DUE_SOON'
                  ? 'bg-yellow-600 text-white shadow-xs'
                  : f.key === 'CLOSED'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-200 text-slate-900 shadow-xs'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Filters Bar */}
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
              placeholder={t('searchPlaceholder', 'Search code, description, contractor...')}
              className={`w-full py-2 ${isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'} text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-red-500`}
            />
          </div>

          {/* Equipment Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-3 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-hidden focus:border-red-500"
            >
              <option value="ALL">{t('all', 'All Equipment Types')}</option>
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
              <option value="ALL">{t('all', 'All Contractors')}</option>
              {contractors.map((c) => (
                <option key={c.id} value={c.name}>
                  {isRtl ? c.nameAr || c.name : c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sort Options */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>{isRtl ? 'ترتيب حسب:' : 'Sort By:'}</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="py-1 px-2.5 bg-slate-950 border border-slate-700 rounded text-slate-200 text-xs"
            >
              <option value="deadline">{t('deadline', 'Deadline')}</option>
              <option value="problemDate">{t('problemDate', 'Problem Date')}</option>
              <option value="equipmentCode">{t('equipmentCode', 'Equipment Code')}</option>
              <option value="status">{t('status', 'Status')}</option>
            </select>

            <button
              onClick={() => setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-mono text-[11px]"
            >
              {sortDir === 'asc' ? '↑ ASC' : '↓ DESC'}
            </button>
          </div>

          <div className="text-slate-400">
            {t('showing', 'Showing')} {problems.length} {t('of', 'of')} {totalRecords}
          </div>
        </div>
      </div>

      {/* Problems Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin text-red-500 mx-auto mb-2" />
            <p>{isRtl ? 'جاري تحميل البلاغات والملاحظات...' : 'Loading safety defects...'}</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-400 text-xs">{error}</div>
        ) : problems.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <CheckCircle2 className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="font-semibold text-slate-300">{t('noProblemsFound', 'No problems found matching criteria')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 text-start">{t('equipmentCode', 'Code')}</th>
                  <th className="py-3 px-3 text-start">{t('equipmentType', 'Type')}</th>
                  <th className="py-3 px-3 text-start">{t('problemDescription', 'Description')}</th>
                  <th className="py-3 px-3 text-start">{t('contractor', 'Contractor')}</th>
                  <th className="py-3 px-3 text-start">{t('problemDate', 'Date')}</th>
                  <th className="py-3 px-3 text-start">{t('deadline', 'Deadline')}</th>
                  <th className="py-3 px-3 text-start">{t('status', 'Status')}</th>
                  <th className="py-3 px-3 text-start">{t('problemImages', 'Photos')}</th>
                  <th className="py-3 px-3 text-end">{t('actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {problems.map((prob) => {
                  const isClosed = prob.status === 'CLOSED';
                  return (
                    <tr
                      key={prob.id}
                      onClick={() => openProblemDetails(prob.id)}
                      className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-3 font-mono font-bold text-red-400">
                        {prob.equipmentCode}
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {isRtl ? t(prob.equipmentType, prob.equipmentType) : prob.equipmentType}
                      </td>
                      <td className="py-3 px-3 max-w-xs">
                        <div className="font-medium text-slate-100 truncate">
                          {isRtl && prob.problemDescriptionAr ? prob.problemDescriptionAr : prob.problemDescription}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-300 truncate max-w-[140px]">
                        {prob.contractor}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400">
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
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-300">
                          <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>{prob.imagesCount || 0}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-end" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openProblemDetails(prob.id)}
                            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                            title={t('view', 'View Details')}
                          >
                            <Eye className="w-4 h-4" />
                          </button>

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

                          {isClosed && hasPermission('PROBLEMS_EDIT') && (
                            <button
                              onClick={() => handleReopen(prob.id)}
                              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
                              title={t('reopenProblem', 'Reopen')}
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {hasPermission('PROBLEMS_EDIT') && (
                            <button
                              onClick={() => handleOpenEdit(prob)}
                              className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors"
                              title={t('edit', 'Edit')}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {isAdmin && (
                            <button
                              onClick={() => {
                                setDeletingProblem(prob);
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950/60 border-t border-slate-800 text-xs text-slate-400">
          <div>
            {t('showing', 'Showing')} {problems.length} {t('of', 'of')} {totalRecords} {t('records', 'records')}
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

      {/* Problem Details Modal / Drawer */}
      {activeProblem && activeProblemDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xl font-black text-red-400">
                  {activeProblem.equipmentCode}
                </span>
                <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-slate-800 text-slate-200">
                  {isRtl ? t(activeProblem.equipmentType, activeProblem.equipmentType) : activeProblem.equipmentType}
                </span>
                <StatusBadge
                  condition={activeProblemDetails.deadlineInfo.condition}
                  diffDays={activeProblemDetails.deadlineInfo.diffDays}
                  label={isRtl ? activeProblemDetails.deadlineInfo.labelAr : activeProblemDetails.deadlineInfo.labelEn}
                  size="md"
                />
              </div>
              <button
                onClick={() => {
                  setActiveProblem(null);
                  setActiveProblemDetails(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1 text-xs">
              {/* Problem Description Box */}
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {t('problemDescription', 'Problem Description')}
                </div>
                <p className="text-sm font-medium text-slate-100 leading-relaxed">
                  {activeProblem.problemDescription}
                </p>
                {activeProblem.problemDescriptionAr && (
                  <p className="text-xs text-slate-300 font-sans pt-1 border-t border-slate-800/80" dir="rtl">
                    {activeProblem.problemDescriptionAr}
                  </p>
                )}
              </div>

              {/* Grid: Dates & Status */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">{t('problemDate', 'Reported Date')}</span>
                  <span className="font-mono font-bold text-slate-200">{activeProblem.problemDate}</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">{t('deadline', 'Deadline')}</span>
                  <span className="font-mono font-bold text-red-300">{activeProblem.deadline}</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">{t('daysRemaining', 'Status')}</span>
                  <span className="font-bold text-amber-300">
                    {isRtl ? activeProblemDetails.deadlineInfo.labelAr : activeProblemDetails.deadlineInfo.labelEn}
                  </span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">{t('closedDate', 'Closed Date')}</span>
                  <span className="font-mono font-semibold text-emerald-300">
                    {activeProblem.closedDate || (isRtl ? 'لا زالت مفتوحة' : 'Still Open')}
                  </span>
                </div>
              </div>

              {/* Close Notes if any */}
              {activeProblem.closeNotes && (
                <div className="p-3.5 bg-emerald-950/30 border border-emerald-800/60 rounded-xl">
                  <span className="text-[11px] font-bold text-emerald-400 block mb-1">
                    ✓ {t('closeNotes', 'Resolution & Verification Notes')}:
                  </span>
                  <p className="text-emerald-200">{activeProblem.closeNotes}</p>
                  <p className="text-[10px] text-emerald-400/80 mt-1">
                    {t('closedBy', 'Closed By')}: {activeProblem.closedBy}
                  </p>
                </div>
              )}

              {/* Equipment info snippet */}
              {activeProblemDetails.equipment && (
                <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400">{t('contractor', 'Contractor')}: </span>
                    <span className="font-bold text-purple-300">{activeProblemDetails.equipment.contractor}</span>
                    <span className="mx-2 text-slate-600">•</span>
                    <span className="text-slate-400">{t('driverName', 'Driver')}: </span>
                    <span className="font-semibold text-slate-200">{activeProblemDetails.equipment.driverName} ({activeProblemDetails.equipment.driverMobile})</span>
                  </div>
                  <button
                    onClick={() => {
                      onNavigate('equipment-details', { code: activeProblem.equipmentCode });
                      setActiveProblem(null);
                    }}
                    className="text-xs text-red-400 hover:text-red-300 font-bold"
                  >
                    {t('equipmentDetails', 'View Equipment')} →
                  </button>
                </div>
              )}

              {/* Problem Images Gallery */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-red-400" />
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                      {t('problemImages', 'Inspection Evidence Photos')} ({activeProblemDetails.images?.length || 0})
                    </h4>
                  </div>

                  {hasPermission('PROBLEMS_IMAGE_UPLOAD') && (
                    <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg cursor-pointer transition-colors text-xs font-semibold">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{t('uploadImages', 'Add Photos')}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        className="hidden"
                        onChange={handleUploadToActiveProblem}
                      />
                    </label>
                  )}
                </div>

                {activeProblemDetails.images?.length === 0 ? (
                  <div className="p-6 text-center bg-slate-950/40 border border-dashed border-slate-800 rounded-xl text-slate-400">
                    <ImageIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="font-medium text-slate-300">{t('noImagesYet', 'No photos uploaded yet')}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{t('supportedFormats', 'JPG, PNG, WEBP (Max 10MB)')}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {activeProblemDetails.images.map((img: any) => (
                      <div
                        key={img.id}
                        className="group relative rounded-xl border border-slate-800 overflow-hidden bg-slate-950 aspect-video flex items-center justify-center shadow-md"
                      >
                        <img
                          src={img.dataUrl}
                          alt={img.fileName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            onClick={() => setPreviewImage(img.dataUrl)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg shadow-sm"
                            title="Maximize Photo"
                          >
                            <Maximize2 className="w-4 h-4" />
                          </button>
                          {hasPermission('PROBLEMS_IMAGE_DELETE') && (
                            <button
                              onClick={() => handleDeleteImage(img.id)}
                              className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm"
                              title="Delete Photo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] text-slate-300 font-mono">
                          {img.fileName}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-950/90 border-t border-slate-800">
              <div className="flex items-center gap-2">
                {activeProblem.status === 'OPEN' && hasPermission('PROBLEMS_CLOSE') && (
                  <button
                    onClick={() => {
                      setClosingProblem(activeProblem);
                      setCloseNotes('');
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t('closeProblem', 'Close Problem')}</span>
                  </button>
                )}

                {activeProblem.status === 'CLOSED' && hasPermission('PROBLEMS_EDIT') && (
                  <button
                    onClick={() => handleReopen(activeProblem.id)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>{t('reopenProblem', 'Reopen Problem')}</span>
                  </button>
                )}

                {hasPermission('PROBLEMS_EDIT') && (
                  <button
                    onClick={() => handleOpenEdit(activeProblem)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>{t('edit', 'Edit')}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button
                    onClick={() => {
                      setDeletingProblem(activeProblem);
                      setIsDeleteModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-400 hover:text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{t('delete', 'Delete')}</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setActiveProblem(null);
                    setActiveProblemDetails(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
                >
                  {t('cancel', 'Close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full-screen Image Preview Lightbox */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={previewImage} alt="Full preview" className="max-w-full max-h-[85vh] rounded-lg shadow-2xl" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-red-400 p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Problem Modal */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span>
                  {editingProblem
                    ? t('editProblem', 'Edit Safety Problem')
                    : t('addProblem', 'Log Safety Defect / Problem')}
                </span>
              </h3>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProblem} className="p-6 space-y-4 text-xs">
              {addModalError && (
                <div className="p-3 bg-red-950/60 border border-red-800 rounded-lg text-red-300">
                  {addModalError}
                </div>
              )}

              {/* Equipment Code */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  {t('equipmentCode', 'Equipment')} *
                </label>
                <select
                  value={addForm.equipmentCode}
                  onChange={(e) => setAddForm({ ...addForm, equipmentCode: e.target.value })}
                  required
                  disabled={!!editingProblem}
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono font-bold focus:outline-hidden focus:border-red-500"
                >
                  <option value="">{isRtl ? 'اختر المعدة' : 'Select Equipment'}</option>
                  {equipmentList.map((eq) => (
                    <option key={eq.id} value={eq.equipmentCode}>
                      {eq.equipmentCode} - {eq.equipmentType} ({eq.contractor})
                    </option>
                  ))}
                </select>
              </div>

              {/* Problem Description (EN) */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  {t('problemDescription', 'Problem Description')} (English) *
                </label>
                <textarea
                  value={addForm.problemDescription}
                  onChange={(e) => setAddForm({ ...addForm, problemDescription: e.target.value })}
                  placeholder="e.g. Hydraulic oil leakage on main cylinder..."
                  rows={2}
                  required
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-hidden focus:border-red-500"
                />
              </div>

              {/* Problem Description (AR) */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  {t('problemDescription', 'Problem Description')} (العربية)
                </label>
                <textarea
                  value={addForm.problemDescriptionAr}
                  onChange={(e) => setAddForm({ ...addForm, problemDescriptionAr: e.target.value })}
                  placeholder="مثال: تسريب زيت هيدروليك في الأسطوانة الرئيسية..."
                  rows={2}
                  dir="rtl"
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-hidden focus:border-red-500"
                />
              </div>

              {/* Dates: Problem Date & Deadline */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    {t('problemDate', 'Problem Date')} *
                  </label>
                  <input
                    type="date"
                    value={addForm.problemDate}
                    onChange={(e) => setAddForm({ ...addForm, problemDate: e.target.value })}
                    required
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono focus:outline-hidden focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    {t('deadline', 'Resolution Deadline')} *
                  </label>
                  <input
                    type="date"
                    value={addForm.deadline}
                    onChange={(e) => setAddForm({ ...addForm, deadline: e.target.value })}
                    required
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono focus:outline-hidden focus:border-red-500 text-red-300"
                  />
                </div>
              </div>

              {/* Multiple Image Uploads */}
              {!editingProblem && (
                <div className="pt-2 border-t border-slate-800">
                  <label className="block font-semibold text-slate-300 mb-2">
                    {t('uploadImages', 'Attach Inspection Photos (Multiple)')}
                  </label>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg cursor-pointer border border-slate-700 transition-colors">
                      <Upload className="w-4 h-4 text-red-400" />
                      <span>{t('dragDropImages', 'Browse Photos...')}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        className="hidden"
                        onChange={handleImageFileChange}
                      />
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {addForm.initialImages.length} {isRtl ? 'صور محددة' : 'photo(s) attached'}
                    </span>
                  </div>

                  {addForm.initialImages.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {addForm.initialImages.map((img, idx) => (
                        <div key={idx} className="relative rounded-lg overflow-hidden border border-slate-700 aspect-video">
                          <img src={img.dataUrl} alt="preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() =>
                              setAddForm((prev) => ({
                                ...prev,
                                initialImages: prev.initialImages.filter((_, i) => i !== idx),
                              }))
                            }
                            className="absolute top-1 right-1 p-0.5 bg-red-600 rounded text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  {t('cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg transition-colors"
                >
                  {isSubmitting ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                  ) : (
                    t('save', 'Save Safety Defect')
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  onClick={handleCloseConfirm}
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
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setDeletingProblem(null);
        }}
      />
    </div>
  );
};
