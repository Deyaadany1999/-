import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import {
  FileBarChart,
  Printer,
  Download,
  Filter,
  Truck,
  AlertTriangle,
  Building2,
  Users,
  CheckCircle2,
  ShieldAlert,
  Calendar,
  Layers,
  HardHat,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { t, isRtl, formatDate } = useLanguage();
  const { user } = useAuth();

  const [reportType, setReportType] = useState('HSE_SUMMARY');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedContractor, setSelectedContractor] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [reportData, setReportData] = useState<any>(null);
  const [equipmentTypes, setEquipmentTypes] = useState<any[]>([]);
  const [contractors, setContractors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const reportOptions = [
    { key: 'HSE_SUMMARY', name: t('report9', '9. Executive HSE Summary Report') },
    { key: 'EQUIPMENT', name: t('report1', '1. Equipment Inventory & Status Report') },
    { key: 'OPEN_PROBLEMS', name: t('report2', '2. Open Safety Problems Report') },
    { key: 'CLOSED_PROBLEMS', name: t('report3', '3. Closed & Resolved Problems Report') },
    { key: 'OVERDUE_PROBLEMS', name: t('report4', '4. Overdue Safety Defect Report') },
    { key: 'DUE_SOON_PROBLEMS', name: t('report5', '5. Problems Due Within 2 Days') },
    { key: 'EQUIPMENT_TYPES', name: t('report6', '6. Equipment Distribution by Category') },
    { key: 'CONTRACTORS', name: t('report7', '7. Contractor Safety Performance Report') },
    { key: 'EMPLOYEES', name: t('report8', '8. Certified Drivers & Operators Report') },
  ];

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {
        reportType,
        equipmentType: selectedType,
        contractor: selectedContractor,
        status: selectedStatus,
      };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const data = await api.getReportsData(params);
      setReportData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [types, conts] = await Promise.all([api.getEquipmentTypes(), api.getContractors()]);
        setEquipmentTypes(types || []);
        setContractors(conts || []);
      } catch (e) {
        console.error(e);
      }
    };
    loadFilters();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [reportType, selectedType, selectedContractor, selectedStatus, startDate, endDate]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!reportData) return;

    let headers: string[] = [];
    let rows: string[][] = [];

    if (reportType === 'EQUIPMENT') {
      headers = ['Equipment Code', 'Equipment Type', 'Contractor', 'Driver Name', 'Driver Mobile', 'License Grade', 'National ID'];
      rows = reportData.equipment.map((e: any) => [
        e.equipmentCode,
        e.equipmentType,
        e.contractor,
        e.driverName,
        e.driverMobile,
        e.licenseGrade,
        e.nationalId,
      ]);
    } else if (reportType === 'EMPLOYEES') {
      headers = ['Employee ID', 'Full Name', 'Position', 'Mobile', 'National ID', 'Induction Date', 'Linked Equipment'];
      rows = reportData.employees.map((emp: any) => [
        emp.employeeId,
        emp.fullName,
        emp.position,
        emp.mobile,
        emp.nationalId,
        emp.inductionDate,
        emp.linkedEquipmentCode || '-',
      ]);
    } else {
      // Problem-based reports
      headers = ['Equipment Code', 'Equipment Type', 'Contractor', 'Problem Description', 'Problem Date', 'Deadline', 'Status', 'Closed Date'];
      let probs = reportData.problems;
      if (reportType === 'OPEN_PROBLEMS') probs = probs.filter((p: any) => p.status === 'OPEN');
      if (reportType === 'CLOSED_PROBLEMS') probs = probs.filter((p: any) => p.status === 'CLOSED');
      if (reportType === 'OVERDUE_PROBLEMS') probs = probs.filter((p: any) => p.status === 'OPEN' && p.deadlineInfo.condition === 'OVERDUE');
      if (reportType === 'DUE_SOON_PROBLEMS') probs = probs.filter((p: any) => p.status === 'OPEN' && p.deadlineInfo.diffDays <= 2 && p.deadlineInfo.diffDays >= 0);

      rows = probs.map((p: any) => [
        p.equipmentCode,
        p.equipmentType,
        p.contractor,
        `"${(p.problemDescription || '').replace(/"/g, '""')}"`,
        p.problemDate,
        p.deadline,
        p.status,
        p.closedDate || '-',
      ]);
    }

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HSE_Report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileBarChart className="w-5 h-5 text-cyan-400" />
            <span>{t('hseReportsHub', 'HSE Safety & Audit Reports Center')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isRtl
              ? 'إنشاء وتصدير وطباعة كافة التقارير التنفيذية وملاحظات السلامة والامتثال'
              : 'Generate, preview, export and print safety compliance and defect analytics'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>{t('exportCsv', 'Export CSV')}</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{t('print', 'Print Report')}</span>
          </button>
        </div>
      </div>

      {/* Report Selection & Filter Controls */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl shadow-md space-y-4 no-print">
        {/* Report Type Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            {t('selectReport', 'Select Report Type')}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {reportOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setReportType(opt.key)}
                className={`p-2.5 rounded-lg text-start text-xs font-medium transition-colors ${
                  reportType === opt.key
                    ? 'bg-cyan-600/20 border border-cyan-500/60 text-cyan-300 font-bold'
                    : 'bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 text-slate-300'
                }`}
              >
                {opt.name}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Equipment Type */}
          <div>
            <label className="block text-slate-400 mb-1">{t('equipmentType', 'Equipment Type')}</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full py-1.5 px-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-200"
            >
              <option value="ALL">{t('all', 'All Types')}</option>
              {equipmentTypes.map((t) => (
                <option key={t.id} value={t.name}>
                  {isRtl ? t.nameAr || t.name : t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Contractor */}
          <div>
            <label className="block text-slate-400 mb-1">{t('contractor', 'Contractor')}</label>
            <select
              value={selectedContractor}
              onChange={(e) => setSelectedContractor(e.target.value)}
              className="w-full py-1.5 px-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-200"
            >
              <option value="ALL">{t('all', 'All Contractors')}</option>
              {contractors.map((c) => (
                <option key={c.id} value={c.name}>
                  {isRtl ? c.nameAr || c.name : c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-slate-400 mb-1">{isRtl ? 'من تاريخ' : 'Start Date'}</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full py-1.5 px-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-slate-400 mb-1">{isRtl ? 'إلى تاريخ' : 'End Date'}</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full py-1.5 px-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Printable Report Preview Document */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 print:p-0 print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Document Header with Logo & Meta */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800 print:border-black">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-red-600 to-amber-600 text-white flex items-center justify-center font-bold print:bg-black print:text-white">
              <HardHat className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-white print:text-black">
                {isRtl ? reportData?.company?.companyNameAr : reportData?.company?.companyName}
              </h1>
              <p className="text-xs text-amber-400 font-semibold print:text-black">
                {reportOptions.find((r) => r.key === reportType)?.name}
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-400 text-start sm:text-end print:text-black space-y-0.5">
            <div>
              <strong>{t('generatedAt', 'Date Generated')}:</strong>{' '}
              <span className="font-mono">{new Date().toISOString().split('T')[0]}</span>
            </div>
            <div>
              <strong>{t('generatedBy', 'Generated By')}:</strong>{' '}
              <span>{user?.fullName || 'HSE Engineer'}</span>
            </div>
            <div>
              <strong>{isRtl ? 'رقم سياسة السلامة:' : 'Policy Standard:'}</strong>{' '}
              <span className="font-mono">{reportData?.company?.hsePolicyNumber}</span>
            </div>
          </div>
        </div>

        {/* KPI Summary Cards */}
        {reportData?.summary && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 print:grid-cols-6 print:gap-2">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center print:bg-gray-100 print:border-gray-300">
              <span className="text-[10px] text-slate-400 uppercase font-semibold print:text-black">{t('totalEquipment', 'Total Equip')}</span>
              <div className="text-xl font-black text-white mt-1 print:text-black">{reportData.summary.totalEquipment}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center print:bg-gray-100 print:border-gray-300">
              <span className="text-[10px] text-slate-400 uppercase font-semibold print:text-black">{t('totalProblems', 'Total Defects')}</span>
              <div className="text-xl font-black text-white mt-1 print:text-black">{reportData.summary.totalProblems}</div>
            </div>
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/50 text-center print:bg-yellow-50 print:border-yellow-200">
              <span className="text-[10px] text-amber-400 uppercase font-semibold print:text-black">{t('openProblems', 'Open')}</span>
              <div className="text-xl font-black text-amber-300 mt-1 print:text-black">{reportData.summary.openProblems}</div>
            </div>
            <div className="p-3 rounded-xl bg-yellow-950/40 border border-yellow-800/50 text-center print:bg-yellow-50 print:border-yellow-200">
              <span className="text-[10px] text-yellow-400 uppercase font-semibold print:text-black">{t('dueWithin2Days', 'Due in 2 Days')}</span>
              <div className="text-xl font-black text-yellow-300 mt-1 print:text-black">{reportData.summary.dueWithin2Days}</div>
            </div>
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-center print:bg-red-50 print:border-red-200">
              <span className="text-[10px] text-red-400 uppercase font-semibold print:text-black">{t('overdueOpenProblems', 'Overdue')}</span>
              <div className="text-xl font-black text-red-400 mt-1 print:text-black">{reportData.summary.overdueProblems}</div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-center print:bg-emerald-50 print:border-emerald-200">
              <span className="text-[10px] text-emerald-400 uppercase font-semibold print:text-black">{t('closedProblems', 'Closed')}</span>
              <div className="text-xl font-black text-emerald-400 mt-1 print:text-black">{reportData.summary.closedProblems}</div>
            </div>
          </div>
        )}

        {/* Report Content Table */}
        <div className="overflow-x-auto">
          {reportType === 'EQUIPMENT' && (
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase text-[11px] print:border-black print:text-black print:bg-gray-100">
                  <th className="py-2.5 px-3 text-start">Code</th>
                  <th className="py-2.5 px-3 text-start">Type</th>
                  <th className="py-2.5 px-3 text-start">Contractor</th>
                  <th className="py-2.5 px-3 text-start">Driver</th>
                  <th className="py-2.5 px-3 text-start">Mobile</th>
                  <th className="py-2.5 px-3 text-start">License</th>
                  <th className="py-2.5 px-3 text-start">National ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-gray-300">
                {reportData?.equipment.map((eq: any) => (
                  <tr key={eq.id}>
                    <td className="py-2 px-3 font-mono font-bold text-red-400 print:text-black">{eq.equipmentCode}</td>
                    <td className="py-2 px-3">{eq.equipmentType}</td>
                    <td className="py-2 px-3">{eq.contractor}</td>
                    <td className="py-2 px-3">{eq.driverName}</td>
                    <td className="py-2 px-3 font-mono">{eq.driverMobile}</td>
                    <td className="py-2 px-3">{eq.licenseGrade}</td>
                    <td className="py-2 px-3 font-mono">{eq.nationalId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'EMPLOYEES' && (
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase text-[11px] print:border-black print:text-black print:bg-gray-100">
                  <th className="py-2.5 px-3 text-start">Emp ID</th>
                  <th className="py-2.5 px-3 text-start">Name</th>
                  <th className="py-2.5 px-3 text-start">Position</th>
                  <th className="py-2.5 px-3 text-start">Mobile</th>
                  <th className="py-2.5 px-3 text-start">National ID</th>
                  <th className="py-2.5 px-3 text-start">Induction Date</th>
                  <th className="py-2.5 px-3 text-start">Assigned Equipment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-gray-300">
                {reportData?.employees.map((emp: any) => (
                  <tr key={emp.id}>
                    <td className="py-2 px-3 font-mono font-bold text-blue-400 print:text-black">{emp.employeeId}</td>
                    <td className="py-2 px-3 font-semibold">{emp.fullName}</td>
                    <td className="py-2 px-3">{emp.position}</td>
                    <td className="py-2 px-3 font-mono">{emp.mobile}</td>
                    <td className="py-2 px-3 font-mono">{emp.nationalId}</td>
                    <td className="py-2 px-3 font-mono">{emp.inductionDate}</td>
                    <td className="py-2 px-3 font-mono font-bold text-red-400 print:text-black">{emp.linkedEquipmentCode || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType !== 'EQUIPMENT' && reportType !== 'EMPLOYEES' && (
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase text-[11px] print:border-black print:text-black print:bg-gray-100">
                  <th className="py-2.5 px-3 text-start">Equipment Code</th>
                  <th className="py-2.5 px-3 text-start">Type</th>
                  <th className="py-2.5 px-3 text-start">Contractor</th>
                  <th className="py-2.5 px-3 text-start">Defect Description</th>
                  <th className="py-2.5 px-3 text-start">Date</th>
                  <th className="py-2.5 px-3 text-start">Deadline</th>
                  <th className="py-2.5 px-3 text-start">Status</th>
                  <th className="py-2.5 px-3 text-start">Closed Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-gray-300">
                {reportData?.problems
                  .filter((p: any) => {
                    if (reportType === 'OPEN_PROBLEMS') return p.status === 'OPEN';
                    if (reportType === 'CLOSED_PROBLEMS') return p.status === 'CLOSED';
                    if (reportType === 'OVERDUE_PROBLEMS') return p.status === 'OPEN' && p.deadlineInfo.condition === 'OVERDUE';
                    if (reportType === 'DUE_SOON_PROBLEMS') return p.status === 'OPEN' && p.deadlineInfo.diffDays <= 2 && p.deadlineInfo.diffDays >= 0;
                    return true;
                  })
                  .map((p: any) => (
                    <tr key={p.id}>
                      <td className="py-2.5 px-3 font-mono font-bold text-red-400 print:text-black">{p.equipmentCode}</td>
                      <td className="py-2.5 px-3">{p.equipmentType}</td>
                      <td className="py-2.5 px-3">{p.contractor}</td>
                      <td className="py-2.5 px-3 max-w-sm">{p.problemDescription}</td>
                      <td className="py-2.5 px-3 font-mono">{p.problemDate}</td>
                      <td className="py-2.5 px-3 font-mono text-red-300 print:text-black">{p.deadline}</td>
                      <td className="py-2.5 px-3">
                        <StatusBadge
                          condition={p.deadlineInfo.condition}
                          diffDays={p.deadlineInfo.diffDays}
                          label={isRtl ? p.deadlineInfo.labelAr : p.deadlineInfo.labelEn}
                          size="sm"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400 print:text-black">{p.closedDate || '-'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Report Footer / Signature Stamp */}
        <div className="pt-8 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 print:text-black print:border-black">
          <div>
            <p className="font-semibold text-slate-300 print:text-black">HSE Safety Department Verification</p>
            <p className="text-[10px]">Document generated from verified live database records.</p>
          </div>
          <div className="text-end">
            <p className="font-semibold text-slate-300 print:text-black">Authorized HSE Manager Signature</p>
            <div className="w-36 h-10 border-b border-dashed border-slate-700 print:border-black mt-2" />
          </div>
        </div>
      </div>
    </div>
  );
};
