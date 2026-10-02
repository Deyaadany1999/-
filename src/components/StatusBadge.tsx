import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { AlertTriangle, Clock, CheckCircle2, ShieldAlert, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  condition: 'OVERDUE' | 'DUE_TODAY' | 'DUE_SOON' | 'OPEN' | 'CLOSED' | 'SAFE' | 'DEFECT_ACTIVE';
  diffDays?: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ condition, diffDays, label, size = 'md' }) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  };

  switch (condition) {
    case 'OVERDUE': {
      const days = diffDays !== undefined ? Math.abs(diffDays) : '';
      const text = label || (isAr ? `متأخر (${days} يوم)` : `Overdue (${days}d)`);
      return (
        <span
          className={`inline-flex items-center rounded-md bg-red-950/40 text-red-400 border border-red-800/60 shadow-xs ${sizeClasses[size]}`}
          title={isAr ? 'تجاوز الموعد النهائي للمعالجة' : 'Deadline passed - Overdue'}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-red-500 shrink-0 animate-pulse" />
          <span>{text}</span>
        </span>
      );
    }
    case 'DUE_TODAY': {
      const text = label || (isAr ? 'يستحق اليوم' : 'Due Today');
      return (
        <span
          className={`inline-flex items-center rounded-md bg-amber-950/50 text-amber-300 border border-amber-700/60 shadow-xs ${sizeClasses[size]}`}
        >
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{text}</span>
        </span>
      );
    }
    case 'DUE_SOON': {
      const days = diffDays !== undefined ? diffDays : '';
      const text = label || (isAr ? `يستحق قريباً (${days} يوم)` : `Due Soon (${days}d)`);
      return (
        <span
          className={`inline-flex items-center rounded-md bg-yellow-950/40 text-yellow-300 border border-yellow-700/60 shadow-xs ${sizeClasses[size]}`}
        >
          <Clock className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
          <span>{text}</span>
        </span>
      );
    }
    case 'CLOSED':
    case 'SAFE': {
      const text = label || (isAr ? (condition === 'SAFE' ? 'مطابق للسلامة' : 'مغلقة ومعالجة') : (condition === 'SAFE' ? 'Safe / Compliant' : 'Closed'));
      return (
        <span
          className={`inline-flex items-center rounded-md bg-emerald-950/40 text-emerald-300 border border-emerald-800/60 shadow-xs ${sizeClasses[size]}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{text}</span>
        </span>
      );
    }
    case 'DEFECT_ACTIVE': {
      const text = label || (isAr ? 'يوجد ملاحظات' : 'Defect Active');
      return (
        <span
          className={`inline-flex items-center rounded-md bg-rose-950/40 text-rose-300 border border-rose-800/60 shadow-xs ${sizeClasses[size]}`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span>{text}</span>
        </span>
      );
    }
    case 'OPEN':
    default: {
      const days = diffDays !== undefined ? diffDays : '';
      const text = label || (isAr ? `مفتوحة (متبقي ${days} يوم)` : `Open (${days}d remaining)`);
      return (
        <span
          className={`inline-flex items-center rounded-md bg-blue-950/40 text-blue-300 border border-blue-800/60 shadow-xs ${sizeClasses[size]}`}
        >
          <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span>{text}</span>
        </span>
      );
    }
  }
};
