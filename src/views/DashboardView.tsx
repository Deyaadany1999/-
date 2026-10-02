import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import {
  Truck,
  AlertTriangle,
  Clock,
  ShieldAlert,
  CheckCircle2,
  Boxes,
  ArrowRight,
  TrendingUp,
  Building2,
  Calendar,
  Layers,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (view: string, params?: Record<string, any>) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { t, isRtl, formatDate } = useLanguage();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-red-500 mb-3" />
        <p className="text-sm font-medium">{isRtl ? 'جاري تحميل مؤشرات السلامة والمعدات...' : 'Loading HSE metrics...'}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-950/40 border border-red-800 rounded-xl text-red-300">
        <p className="font-semibold">{error}</p>
        <button
          onClick={fetchStats}
          className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg"
        >
          {t('reset', 'Retry')}
        </button>
      </div>
    );
  }

  const { kpis, categoryStats = [], problemsByType = {}, problemsByContractor = [], recentProblems = [] } = stats;

  return (
    <div className="space-y-6">
      {/* Top Banner / Headline */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 md:p-6 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-red-400 uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>{t('safetyFirst', 'Safety First - Live Fleet Overview')}</span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
            {t('appName', 'Heavy Equipment HSE Management System')}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isRtl
              ? 'متابعة الامتثال الميداني، فحص المعدات، تتبع المهل النهائية للبلاغات ومعالجة العيوب.'
              : 'Real-time equipment safety compliance, field defects tracking, and deadline monitoring.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchStats}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{isRtl ? 'تحديث البيانات' : 'Refresh'}</span>
          </button>
          <button
            onClick={() => onNavigate('problems', { openNewModal: true })}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold rounded-lg shadow-lg shadow-red-950 transition-colors cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>{t('addProblem', 'Log Safety Defect')}</span>
          </button>
        </div>
      </div>

      {/* 6 Top Clickable KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* 1. Total Equipment */}
        <div
          onClick={() => onNavigate('equipment')}
          className="group relative p-4 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-blue-500/50 rounded-xl transition-all duration-150 cursor-pointer shadow-md hover:shadow-blue-950/40"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">{t('totalEquipment', 'Total Equipment')}</span>
            <div className="p-2 rounded-lg bg-blue-950/60 text-blue-400 border border-blue-800/40 group-hover:scale-110 transition-transform">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{kpis.totalEquipment}</div>
          <div className="mt-2 flex items-center text-[10px] text-blue-400 font-medium">
            <span>{isRtl ? 'عرض أسطول المعدات' : 'View Fleet'}</span>
            <ChevronRight className={`w-3 h-3 ${isRtl ? 'rotate-180 mr-1' : 'ml-1'}`} />
          </div>
        </div>

        {/* 2. Total Problems */}
        <div
          onClick={() => onNavigate('problems', { status: 'ALL' })}
          className="group relative p-4 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-600 rounded-xl transition-all duration-150 cursor-pointer shadow-md"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">{t('totalProblems', 'Total Problems')}</span>
            <div className="p-2 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 group-hover:scale-110 transition-transform">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{kpis.totalProblems}</div>
          <div className="mt-2 flex items-center text-[10px] text-slate-400 font-medium">
            <span>{isRtl ? 'كافة البلاغات المسجلة' : 'All Defect History'}</span>
            <ChevronRight className={`w-3 h-3 ${isRtl ? 'rotate-180 mr-1' : 'ml-1'}`} />
          </div>
        </div>

        {/* 3. Open Problems */}
        <div
          onClick={() => onNavigate('problems', { quickFilter: 'OPEN' })}
          className="group relative p-4 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-500/50 rounded-xl transition-all duration-150 cursor-pointer shadow-md hover:shadow-amber-950/40"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">{t('openProblems', 'Open Problems')}</span>
            <div className="p-2 rounded-lg bg-amber-950/60 text-amber-400 border border-amber-800/40 group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-300">{kpis.openProblems}</div>
          <div className="mt-2 flex items-center text-[10px] text-amber-400 font-medium">
            <span>{isRtl ? 'قيد المتابعة والمعالجة' : 'Under Action'}</span>
            <ChevronRight className={`w-3 h-3 ${isRtl ? 'rotate-180 mr-1' : 'ml-1'}`} />
          </div>
        </div>

        {/* 4. Due Within 2 Days (Warning / Orange / Yellow) */}
        <div
          onClick={() => onNavigate('problems', { quickFilter: 'DUE_SOON' })}
          className="group relative p-4 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-yellow-500/50 rounded-xl transition-all duration-150 cursor-pointer shadow-md hover:shadow-yellow-950/40"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">{t('dueWithin2Days', 'Due in 2 Days')}</span>
            <div className="p-2 rounded-lg bg-yellow-950/60 text-yellow-400 border border-yellow-800/40 group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-yellow-300">{kpis.dueWithin2Days}</div>
          <div className="mt-2 flex items-center text-[10px] text-yellow-400 font-medium">
            <span>{isRtl ? 'اقتراب الموعد النهائي' : 'Deadline Approaching'}</span>
            <ChevronRight className={`w-3 h-3 ${isRtl ? 'rotate-180 mr-1' : 'ml-1'}`} />
          </div>
        </div>

        {/* 5. Overdue Open Problems (Critical / Red) */}
        <div
          onClick={() => onNavigate('problems', { quickFilter: 'OVERDUE' })}
          className="group relative p-4 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-red-500/60 rounded-xl transition-all duration-150 cursor-pointer shadow-md hover:shadow-red-950/50"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-red-400 font-bold">{t('overdueOpenProblems', 'Overdue')}</span>
            <div className="p-2 rounded-lg bg-red-950/80 text-red-400 border border-red-800/60 group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div className="text-2xl font-black text-red-400">{kpis.overdueOpenProblems}</div>
          <div className="mt-2 flex items-center text-[10px] text-red-400 font-bold">
            <span>{isRtl ? 'إجراء عاجل مطلوب' : 'Urgent Action'}</span>
            <ChevronRight className={`w-3 h-3 ${isRtl ? 'rotate-180 mr-1' : 'ml-1'}`} />
          </div>
        </div>

        {/* 6. Closed Problems (Safe / Green) */}
        <div
          onClick={() => onNavigate('problems', { quickFilter: 'CLOSED' })}
          className="group relative p-4 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/50 rounded-xl transition-all duration-150 cursor-pointer shadow-md hover:shadow-emerald-950/40"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">{t('closedProblems', 'Closed Problems')}</span>
            <div className="p-2 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400">{kpis.closedProblems}</div>
          <div className="mt-2 flex items-center text-[10px] text-emerald-400 font-medium">
            <span>{isRtl ? 'تم الإصلاح والاعتماد' : 'Resolved & Inspected'}</span>
            <ChevronRight className={`w-3 h-3 ${isRtl ? 'rotate-180 mr-1' : 'ml-1'}`} />
          </div>
        </div>
      </div>

      {/* Equipment Categories Grid */}
      <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {t('equipmentCategories', 'Equipment Categories & Fleet Safety Status')}
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            {isRtl ? 'اضغط على أي تصنيف لفتح قائمة المعدات المفلترة' : 'Click category to view filtered fleet'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {categoryStats.map((cat: any) => {
            const hasOpen = cat.openProblemsCount > 0;
            return (
              <button
                key={cat.id}
                onClick={() => onNavigate('equipment', { type: cat.name })}
                className={`flex flex-col justify-between p-3.5 rounded-xl border text-start transition-all duration-150 cursor-pointer ${
                  hasOpen
                    ? 'bg-slate-900 hover:bg-slate-800/90 border-slate-800 hover:border-amber-600/50'
                    : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800/70 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {cat.code}
                    </span>
                    {hasOpen ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-400 border border-red-800">
                        <AlertTriangle className="w-3 h-3" />
                        <span>{cat.openProblemsCount}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>0</span>
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-100 truncate">
                    {isRtl ? cat.nameAr || cat.name : cat.name}
                  </h4>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    <strong className="text-white font-bold">{cat.equipmentCount}</strong> {t('units', 'Units')}
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 text-slate-500 ${isRtl ? 'rotate-180' : ''}`} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Visual Charts & Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Problems by Equipment Type */}
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">
                  {t('problemsByCategory', 'Problems by Equipment Type')}
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">{isRtl ? 'مفتوحة مقابل مغلقة' : 'Open vs Closed'}</span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {Object.entries(problemsByType).map(([typeName, p]: [string, any]) => {
                if (p.total === 0) return null;
                const openPct = p.total > 0 ? (p.open / p.total) * 100 : 0;
                const closedPct = p.total > 0 ? (p.closed / p.total) * 100 : 0;

                return (
                  <div key={typeName} className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-slate-200">{isRtl ? t(typeName, typeName) : typeName}</span>
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="text-amber-400 font-bold">{p.open} {t('STATUS_OPEN', 'Open')}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-emerald-400 font-bold">{p.closed} {t('STATUS_CLOSED', 'Closed')}</span>
                      </div>
                    </div>

                    {/* Stacked bar */}
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                      <div
                        style={{ width: `${openPct}%` }}
                        className="h-full bg-amber-500 transition-all duration-300"
                        title={`Open: ${p.open}`}
                      />
                      <div
                        style={{ width: `${closedPct}%` }}
                        className="h-full bg-emerald-500 transition-all duration-300"
                        title={`Closed: ${p.closed}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Problems by Contractor */}
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">
                  {t('problemsByContractor', 'Safety Performance by Contractor')}
                </h3>
              </div>
              <button
                onClick={() => onNavigate('contractors')}
                className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold"
              >
                {t('viewAll', 'View All')}
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {problemsByContractor.map((cont: any) => {
                const total = cont.total || 0;
                const openCount = cont.open || 0;

                return (
                  <div
                    key={cont.contractor}
                    onClick={() => onNavigate('problems', { contractor: cont.contractor })}
                    className="p-2.5 bg-slate-950/60 hover:bg-slate-800/50 rounded-xl border border-slate-800/80 text-xs transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-200">{cont.contractor}</span>
                      <span className="text-[11px] font-bold text-slate-400">
                        {total} {t('totalProblems', 'Total')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/50 font-bold">
                          {openCount} {t('STATUS_OPEN', 'Open')}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 font-medium">
                          {cont.closed || 0} {t('STATUS_CLOSED', 'Closed')}
                        </span>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 text-slate-500 ${isRtl ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Safety Defects Section */}
      <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-500" />
            <h3 className="text-sm font-bold text-white">
              {t('recentAlerts', 'Recent Safety Defects & Inspection Items')}
            </h3>
          </div>
          <button
            onClick={() => onNavigate('problems')}
            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-semibold"
          >
            <span>{t('viewAll', 'View All Problems')}</span>
            <ChevronRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3 text-start">{t('equipmentCode', 'Equipment')}</th>
                <th className="py-2.5 px-3 text-start">{t('equipmentType', 'Type')}</th>
                <th className="py-2.5 px-3 text-start">{t('problemDescription', 'Description')}</th>
                <th className="py-2.5 px-3 text-start">{t('deadline', 'Deadline')}</th>
                <th className="py-2.5 px-3 text-start">{t('status', 'Status')}</th>
                <th className="py-2.5 px-3 text-end">{t('actions', 'Action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentProblems.map((prob: any) => (
                <tr
                  key={prob.id}
                  onClick={() => onNavigate('problems', { problemId: prob.id })}
                  className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-3 font-mono font-bold text-red-400">
                    {prob.equipmentCode}
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    {isRtl ? t(prob.equipmentType, prob.equipmentType) : prob.equipmentType}
                  </td>
                  <td className="py-3 px-3 max-w-xs truncate text-slate-200">
                    {isRtl && prob.problemDescriptionAr ? prob.problemDescriptionAr : prob.problemDescription}
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
                  <td className="py-3 px-3 text-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate('problems', { problemId: prob.id });
                      }}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition-colors"
                    >
                      {t('view', 'View')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
