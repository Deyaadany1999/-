import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { HardHat, Lock, User, Globe, AlertCircle, ShieldCheck } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const { language, toggleLanguage, t, isRtl } = useLanguage();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError(isRtl ? 'يرجى إدخال اسم المستخدم وكلمة المرور' : 'Please enter username and password');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await login(username.trim(), password);
      if (!res.success) {
        setError(res.error || 'Authentication failed');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Background industrial pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      {/* Top right language switcher */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm"
        >
          <Globe className="w-4 h-4 text-red-400" />
          <span>{language === 'ar' ? 'English' : 'العربية'}</span>
        </button>
      </div>

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 backdrop-blur-md rounded-2xl shadow-2xl p-6 sm:p-8 z-10">
        {/* Company Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-600 text-white shadow-xl shadow-red-950/60 mb-4 border border-red-500/30">
            <HardHat className="w-9 h-9" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {t('appName', 'Heavy Equipment HSE Management System')}
          </h1>
          <p className="text-xs text-slate-400 mt-2">
            {t('loginSubtitle', 'Sign in to access equipment safety compliance and defect tracking')}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-red-950/50 border border-red-800/80 rounded-xl flex items-start gap-3 text-red-300 text-xs animate-shake">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {t('usernameOrEmail', 'Username or Email')}
            </label>
            <div className="relative">
              <User className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-3 w-4 h-4 text-slate-400`} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className={`w-full py-2.5 ${isRtl ? 'pr-10 pl-3' : 'pl-10 pr-3'} bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-hidden focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors`}
                placeholder="admin"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {t('password', 'Password')}
            </label>
            <div className="relative">
              <Lock className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-3 w-4 h-4 text-slate-400`} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`w-full py-2.5 ${isRtl ? 'pr-10 pl-3' : 'pl-10 pr-3'} bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-hidden focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors`}
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-300">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-red-600 focus:ring-red-500"
              />
              <span>{t('rememberMe', 'Remember me')}</span>
            </label>

            <button
              type="button"
              onClick={() => alert(isRtl ? 'يرجى التواصل مع مسؤول النظام لإعادة تعيين كلمة المرور' : 'Please contact the HSE Administrator to reset password.')}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              {t('forgotPassword', 'Forgot password?')}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-red-950 cursor-pointer"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>{t('login', 'Sign In')}</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Switcher Buttons */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <p className="text-[11px] font-semibold text-slate-400 mb-2.5 text-center uppercase tracking-wider">
            {isRtl ? 'حسابات تجريبية للاختبار السريع' : 'Quick Demo Logins'}
          </p>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => handleQuickFill('admin', 'admin123')}
              className="p-2 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-center transition-colors font-medium"
            >
              👑 {isRtl ? 'مدير النظام' : 'Administrator'}
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('hse_manager', 'manager123')}
              className="p-2 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-center transition-colors font-medium"
            >
              🛡️ {isRtl ? 'مدير السلامة' : 'HSE Manager'}
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('hse_officer', 'officer123')}
              className="p-2 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-center transition-colors font-medium"
            >
              👷 {isRtl ? 'مسؤول السلامة' : 'HSE Officer'}
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('viewer', 'viewer123')}
              className="p-2 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-center transition-colors font-medium"
            >
              👁️ {isRtl ? 'مستعرض / مراقب' : 'Auditor / Viewer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
