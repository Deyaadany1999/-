import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { AlertTriangle, Trash2, X, ShieldAlert } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  title?: string;
  itemDescription: string;
  warningMessage?: string;
  hasRelatedData?: boolean;
  relatedCount?: number;
  onConfirm: (force: boolean) => Promise<void>;
  onCancel: () => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  title,
  itemDescription,
  warningMessage,
  hasRelatedData = false,
  relatedCount = 0,
  onConfirm,
  onCancel,
}) => {
  const { t, language } = useLanguage();
  const isAr = language === 'ar';
  const [force, setForce] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setLoading(true);
      setError(null);
      await onConfirm(force);
    } catch (err: any) {
      setError(err.message || 'Failed to delete record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5 text-red-400 font-semibold text-base">
            <Trash2 className="w-5 h-5 text-red-500" />
            <span>{title || t('deleteConfirmTitle', 'Confirm Deletion')}</span>
          </div>
          <button
            onClick={onCancel}
            disabled={loading}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 p-3.5 bg-red-950/30 border border-red-800/50 rounded-lg text-slate-300 text-sm">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-slate-200">{t('deleteConfirmMessage', 'Are you sure you want to delete this record?')}</p>
              <p className="mt-1 text-red-300 font-mono font-semibold">{itemDescription}</p>
            </div>
          </div>

          {(hasRelatedData || relatedCount > 0 || warningMessage) && (
            <div className="p-3.5 bg-amber-950/40 border border-amber-800/60 rounded-lg text-amber-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-medium text-amber-300">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>
                  {warningMessage ||
                    (isAr
                      ? `تحذير: هذا السجل مرتبط بـ (${relatedCount}) بلاغات وملاحظات سلامة!`
                      : `Warning: This record has (${relatedCount}) associated safety problems!`)}
                </span>
              </div>
              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={force}
                  onChange={(e) => setForce(e.target.checked)}
                  className="rounded border-amber-600 bg-slate-800 text-red-600 focus:ring-red-500"
                />
                <span className="font-semibold text-red-300">
                  {t('forceDelete', 'Force delete record and all associated records')}
                </span>
              </label>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-950/80 border border-red-700 rounded-md text-red-300 text-xs">
              {error}
            </div>
          )}

          <div className="text-xs text-slate-400">
            {t('adminOnlyDelete', 'Deletion is strictly restricted to Administrators.')}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-950/80 border-t border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            {t('cancel', 'Cancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg transition-colors shadow-sm"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            <span>{t('confirm', 'Confirm Delete')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
