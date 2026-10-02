import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  CreditCard,
  Printer,
  HardHat,
  ShieldCheck,
  CheckCircle,
  User,
  QrCode,
  Calendar,
  Building2,
  Award,
} from 'lucide-react';

interface IdCardsViewProps {
  initialEmployeeId?: string;
}

export const IdCardsView: React.FC<IdCardsViewProps> = ({ initialEmployeeId }) => {
  const { t, isRtl, formatDate } = useLanguage();
  const { hasPermission } = useAuth();

  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmps = async () => {
      try {
        setLoading(true);
        const res = await api.getEmployees({ limit: 100 });
        setEmployees(res.data || []);

        if (initialEmployeeId) {
          const match = res.data?.find((e: any) => e.employeeId === initialEmployeeId);
          if (match) setSelectedEmp(match);
          else if (res.data?.length > 0) setSelectedEmp(res.data[0]);
        } else if (res.data?.length > 0) {
          setSelectedEmp(res.data[0]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchEmps();
  }, [initialEmployeeId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <span>{t('idCards', 'Equipment Safety & Operator ID Card System')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isRtl
              ? 'إصدار ومعاينة وطباعة بطاقات الهوية والسلامة الميدانية للمشغلين والسائقين المعتمدين'
              : 'Generate, preview and print authorized HSE equipment operator identification badges'}
          </p>
        </div>

        {hasPermission('IDCARDS_PRINT') && (
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-md transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{t('printIdCard', 'Print Safety ID Badge')}</span>
          </button>
        )}
      </div>

      {/* Main Grid: Selector on left, Badges Preview on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Employee Selector */}
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl shadow-md space-y-3 no-print">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 pb-2 border-b border-slate-800">
            <span>{isRtl ? 'اختر المشغل / السائق' : 'Select Operator / Driver'}</span>
            <span className="text-slate-400">({employees.length})</span>
          </div>

          <div className="space-y-1.5 max-h-[500px] overflow-y-auto custom-scrollbar">
            {employees.map((emp) => {
              const isSelected = selectedEmp?.id === emp.id;
              return (
                <button
                  key={emp.id}
                  onClick={() => setSelectedEmp(emp)}
                  className={`w-full p-2.5 rounded-lg text-start text-xs transition-colors flex items-center justify-between ${
                    isSelected
                      ? 'bg-red-600/20 border border-red-500/50 text-white font-semibold'
                      : 'bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-slate-100">{emp.fullName}</div>
                    <div className="text-[11px] text-slate-400">{emp.position}</div>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                    {emp.employeeId}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: ID Card Preview (Front & Back) */}
        <div className="lg:col-span-2 space-y-6">
          {selectedEmp ? (
            <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl space-y-6">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider no-print">
                {isRtl ? 'معاينة بطاقة الأمان (الوجه الأمامي والخلفي)' : 'Badge Preview (Front & Back Layout)'}
              </div>

              {/* Badges Container */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4 justify-center items-center">
                {/* FRONT OF CARD */}
                <div className="w-full max-w-[340px] mx-auto bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-red-600/80 rounded-2xl shadow-2xl p-5 text-white relative overflow-hidden flex flex-col justify-between min-h-[460px]">
                  {/* Top Security Stripe */}
                  <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-red-600 via-amber-500 to-red-600" />

                  {/* Header */}
                  <div className="pt-2 text-center border-b border-slate-800 pb-3">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white">
                        <HardHat className="w-5 h-5" />
                      </div>
                      <span className="font-black text-xs tracking-wider uppercase text-slate-100">
                        HEAVY EQUIPMENT HSE
                      </span>
                    </div>
                    <div className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">
                      SAFETY INDUCTION & OPERATOR BADGE
                    </div>
                  </div>

                  {/* Operator Photo & Core Info */}
                  <div className="my-auto py-3 text-center space-y-3">
                    {/* Photo placeholder */}
                    <div className="relative w-24 h-24 mx-auto rounded-xl bg-slate-800 border-2 border-amber-500/80 flex items-center justify-center text-slate-400 overflow-hidden shadow-md">
                      <User className="w-14 h-14 text-slate-500" />
                      <div className="absolute bottom-0 inset-x-0 bg-red-600 text-[8px] font-bold py-0.5 text-white uppercase tracking-wider">
                        CERTIFIED
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-white">
                        {selectedEmp.fullName}
                      </h3>
                      {selectedEmp.fullNameAr && (
                        <p className="text-xs text-amber-300 font-medium" dir="rtl">
                          {selectedEmp.fullNameAr}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-300 mt-1 font-semibold">
                        {selectedEmp.position}
                      </p>
                    </div>

                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-xs font-mono font-bold text-red-400">
                      ID: {selectedEmp.employeeId}
                    </div>
                  </div>

                  {/* Footer details */}
                  <div className="border-t border-slate-800 pt-2.5 space-y-1.5 text-[10px]">
                    <div className="flex justify-between text-slate-400">
                      <span>{t('nationalId', 'National ID')}:</span>
                      <span className="font-mono text-slate-200">{selectedEmp.nationalId}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>{t('inductionDate', 'Induction Date')}:</span>
                      <span className="font-mono text-slate-200">{selectedEmp.inductionDate}</span>
                    </div>
                    {selectedEmp.linkedEquipmentCode && (
                      <div className="flex justify-between text-slate-400">
                        <span>{t('linkedEquipment', 'Assigned Unit')}:</span>
                        <span className="font-mono font-bold text-amber-400">{selectedEmp.linkedEquipmentCode}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* BACK OF CARD */}
                <div className="w-full max-w-[340px] mx-auto bg-slate-950 border-2 border-slate-800 rounded-2xl shadow-2xl p-5 text-white relative flex flex-col justify-between min-h-[460px]">
                  {/* Magnetic / Barcode Strip representation */}
                  <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg text-center mb-3">
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                      HEAVY SAFETY VERIFICATION CODE
                    </span>
                    <div className="h-8 bg-black/90 rounded mt-1 flex items-center justify-around px-2 text-[10px] font-mono tracking-widest text-slate-400">
                      ||| | |||| | ||| || |||||| | ||||
                    </div>
                  </div>

                  {/* Safety Terms & Policies */}
                  <div className="space-y-2 text-[9.5px] text-slate-300 leading-relaxed">
                    <div className="flex items-start gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>
                        {isRtl
                          ? 'هذه البطاقة تثبت اجتياز حاملها دورة السلامة المعتمدة وتصريح تشغيل المعدات الثقيلة.'
                          : 'This card certifies that the bearer has completed HSE induction and is authorized to operate.'}
                      </span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <span>
                        {isRtl
                          ? 'يجب إبراز هذه البطاقة لمسؤولي السلامة الميدانيين عند الطلب في موقع العمل.'
                          : 'Must be visibly displayed or produced upon request by site HSE safety officers.'}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-red-950/40 border border-red-800/50 text-red-300 text-[9px]">
                      <strong>{isRtl ? 'طوارئ السلامة:' : 'HSE Emergency Line:'}</strong> +966 50 000 9999
                    </div>
                  </div>

                  {/* QR Code and Validity Stamp */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div className="w-14 h-14 bg-white p-1 rounded-lg flex items-center justify-center">
                      <QrCode className="w-12 h-12 text-slate-900" />
                    </div>
                    <div className="text-end text-[9px] text-slate-400">
                      <div>Authorized HSE Dept.</div>
                      <div className="text-slate-200 font-bold">Kingdom of Saudi Arabia</div>
                      <div className="font-mono text-emerald-400 font-bold mt-1">STATUS: ACTIVE</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-slate-400 text-xs">
              <CreditCard className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p>{isRtl ? 'اختر موظفاً لعرض بطاقة هويته' : 'Select an employee to view badge'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
