import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Settings, Save, Check } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { t, isRtl } = useLanguage();
  const { isAdmin } = useAuth();

  const [settings, setSettings] = useState<any>({
    companyName: '',
    companyNameAr: '',
    safetyContactMobile: '',
    warningDaysThreshold: 2,
    hsePolicyNumber: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await api.getSettings();
        if (data) setSettings(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    try {
      setSaving(true);
      await api.updateSettings(settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed saving settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-red-500" />
          <span>{t('systemSettings', 'System & HSE Safety Parameters')}</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          {isRtl
            ? 'تكوين اسم المنشأة، مهلة التحذير التلقائي للبلاغات، وأرقام طوارئ السلامة'
            : 'Configure company branding, automatic deadline alert thresholds, and safety emergency contacts'}
        </p>
      </div>

      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
        {success && (
          <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-800 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{isRtl ? 'تم حفظ التعديلات بنجاح' : 'Settings saved successfully'}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Company Name (English)</label>
            <input
              type="text"
              value={settings.companyName}
              onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
              disabled={!isAdmin}
              className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">اسم المنشأة (العربية)</label>
            <input
              type="text"
              value={settings.companyNameAr}
              onChange={(e) => setSettings({ ...settings, companyNameAr: e.target.value })}
              disabled={!isAdmin}
              dir="rtl"
              className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Warning Days Threshold (Days)</label>
              <input
                type="number"
                min={1}
                max={30}
                value={settings.warningDaysThreshold}
                onChange={(e) => setSettings({ ...settings, warningDaysThreshold: parseInt(e.target.value, 10) || 2 })}
                disabled={!isAdmin}
                className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                {isRtl ? 'عدد الأيام لاعتبار البلاغ "يستحق قريباً"' : 'Threshold in days to flag "Due Soon"'}
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">HSE Policy Standard Ref</label>
              <input
                type="text"
                value={settings.hsePolicyNumber}
                onChange={(e) => setSettings({ ...settings, hsePolicyNumber: e.target.value })}
                disabled={!isAdmin}
                className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Safety Emergency Hotline Mobile</label>
            <input
              type="text"
              value={settings.safetyContactMobile}
              onChange={(e) => setSettings({ ...settings, safetyContactMobile: e.target.value })}
              disabled={!isAdmin}
              dir="ltr"
              className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono text-start"
            />
          </div>

          {isAdmin && (
            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : t('save', 'Save Changes')}</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
