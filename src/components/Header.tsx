import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Search,
  Bell,
  Globe,
  LogOut,
  User,
  Shield,
  CheckCheck,
  AlertTriangle,
  Clock,
  ExternalLink,
  X,
  Menu,
} from 'lucide-react';

interface HeaderProps {
  onToggleSidebar?: () => void;
  onNavigate: (view: string, params?: Record<string, any>) => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onNavigate }) => {
  const { language, toggleLanguage, t, isRtl } = useLanguage();
  const { user, role, logout, isAuthenticated, token } = useAuth();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    equipment: any[];
    problems: any[];
    employees: any[];
    contractors: any[];
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Notifications state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // User menu state
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!isAuthenticated || !token) {
      setNotifications([]);
      return;
    }
    try {
      const data = await api.getNotifications();
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch (e: any) {
      // Quietly ignore transient errors or 401 on polling
      if (e?.status === 401) {
        setNotifications([]);
      }
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, token]);

  // Global search debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await api.globalSearch(searchQuery.trim());
        setSearchResults(res);
        setIsSearchOpen(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-md">
      {/* Left: Mobile hamburger & Global Search */}
      <div className="flex items-center gap-3 md:gap-4 flex-1 max-w-xl">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          title="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <div ref={searchRef} className="relative flex-1">
          <div className="relative flex items-center">
            <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} w-4 h-4 text-slate-400 pointer-events-none`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchResults) setIsSearchOpen(true);
              }}
              placeholder={t('searchPlaceholder', 'Search equipment code, driver, contractor...')}
              className={`w-full py-1.5 ${isRtl ? 'pr-9 pl-8' : 'pl-9 pr-8'} text-sm bg-slate-950/80 border border-slate-700/80 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all`}
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults(null);
                  setIsSearchOpen(false);
                }}
                className={`absolute ${isRtl ? 'left-2.5' : 'right-2.5'} p-0.5 text-slate-400 hover:text-slate-200`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Dropdown Results */}
          {isSearchOpen && searchResults && (
            <div className="absolute top-full mt-2 w-full max-h-96 overflow-y-auto bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 divide-y divide-slate-800 text-xs">
              {/* Equipment results */}
              {searchResults.equipment.length > 0 && (
                <div className="py-2">
                  <div className="px-2 pb-1 font-semibold text-slate-400 uppercase tracking-wider">
                    {t('equipment', 'Equipment')} ({searchResults.equipment.length})
                  </div>
                  {searchResults.equipment.map((eq) => (
                    <button
                      key={eq.id}
                      onClick={() => {
                        onNavigate('equipment-details', { code: eq.equipmentCode });
                        setIsSearchOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/80 text-start transition-colors"
                    >
                      <div>
                        <span className="font-mono font-bold text-red-400">{eq.equipmentCode}</span>
                        <span className="text-slate-400 mx-2">•</span>
                        <span className="text-slate-300">{eq.equipmentType}</span>
                        <div className="text-slate-400 text-[11px]">{eq.contractor} - {eq.driverName}</div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  ))}
                </div>
              )}

              {/* Problems results */}
              {searchResults.problems.length > 0 && (
                <div className="py-2">
                  <div className="px-2 pb-1 font-semibold text-slate-400 uppercase tracking-wider">
                    {t('problems', 'Problems')} ({searchResults.problems.length})
                  </div>
                  {searchResults.problems.map((prob) => (
                    <button
                      key={prob.id}
                      onClick={() => {
                        onNavigate('problems', { problemId: prob.id });
                        setIsSearchOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/80 text-start transition-colors"
                    >
                      <div className="truncate pr-2">
                        <span className="font-mono text-xs font-semibold text-amber-400">{prob.equipmentCode}</span>
                        <span className="text-slate-300 ml-2">{isRtl && prob.problemDescriptionAr ? prob.problemDescriptionAr : prob.problemDescription}</span>
                      </div>
                      <span className="shrink-0 text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {prob.deadline}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Employees results */}
              {searchResults.employees.length > 0 && (
                <div className="py-2">
                  <div className="px-2 pb-1 font-semibold text-slate-400 uppercase tracking-wider">
                    {t('employees', 'Employees / Drivers')} ({searchResults.employees.length})
                  </div>
                  {searchResults.employees.map((emp) => (
                    <button
                      key={emp.id}
                      onClick={() => {
                        onNavigate('employees', { search: emp.employeeId });
                        setIsSearchOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/80 text-start transition-colors"
                    >
                      <div>
                        <span className="font-semibold text-slate-200">{isRtl && emp.fullNameAr ? emp.fullNameAr : emp.fullName}</span>
                        <span className="font-mono text-slate-400 text-[11px] ml-2">({emp.employeeId})</span>
                        <div className="text-slate-400 text-[11px]">{emp.position}</div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  ))}
                </div>
              )}

              {/* Contractors results */}
              {searchResults.contractors.length > 0 && (
                <div className="py-2">
                  <div className="px-2 pb-1 font-semibold text-slate-400 uppercase tracking-wider">
                    {t('contractors', 'Contractors')} ({searchResults.contractors.length})
                  </div>
                  {searchResults.contractors.map((cont) => (
                    <button
                      key={cont.id}
                      onClick={() => {
                        onNavigate('contractors', { search: cont.name });
                        setIsSearchOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/80 text-start transition-colors"
                    >
                      <div>
                        <span className="font-semibold text-slate-200">{isRtl && cont.nameAr ? cont.nameAr : cont.name}</span>
                        <div className="text-slate-400 text-[11px]">{cont.contactPerson} - {cont.mobile}</div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  ))}
                </div>
              )}

              {searchResults.equipment.length === 0 &&
                searchResults.problems.length === 0 &&
                searchResults.employees.length === 0 &&
                searchResults.contractors.length === 0 && (
                  <div className="p-4 text-center text-slate-400">
                    {t('noDataFound', 'No results matching your query')}
                  </div>
                )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Notifications, Language Switcher, User Profile */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Prominent Language Switcher */}
        <button
          type="button"
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-xs transition-colors"
          title={isRtl ? 'Switch to English' : 'التحويل للغة العربية'}
        >
          <Globe className="w-3.5 h-3.5 text-red-400" />
          <span>{language === 'ar' ? 'English' : 'العربية'}</span>
        </button>

        {/* Notifications Icon & Drawer */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title={t('notifications', 'Notifications')}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-600 rounded-full animate-bounce">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div
              className={`absolute top-full mt-2 ${
                isRtl ? 'left-0' : 'right-0'
              } w-80 md:w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50`}
            >
              <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-semibold text-slate-100">
                    {t('notifications', 'Notifications')}
                  </span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-red-950 text-red-400 border border-red-800 text-[10px] font-bold rounded">
                      {unreadCount} {isRtl ? 'جديد' : 'new'}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'تحديد الكل كمقروء' : 'Mark all read'}</span>
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/80">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    {t('noNotifications', 'No notifications')}
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (n.problemId) {
                          onNavigate('problems', { problemId: n.problemId });
                        } else if (n.equipmentCode) {
                          onNavigate('equipment-details', { code: n.equipmentCode });
                        }
                        setIsNotifOpen(false);
                      }}
                      className={`p-3 text-xs hover:bg-slate-800/50 cursor-pointer transition-colors ${
                        !n.read ? 'bg-slate-800/30 font-medium' : 'text-slate-400'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          {n.type === 'overdue' && (
                            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                          )}
                          {n.type === 'due_today' && (
                            <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          )}
                          {n.type === 'due_soon' && (
                            <Clock className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <p className="text-slate-200 font-semibold">{isRtl ? n.titleAr : n.title}</p>
                            <p className="mt-0.5 text-slate-400 text-[11px]">
                              {isRtl ? n.messageAr : n.message}
                            </p>
                          </div>
                        </div>
                        {!n.read && (
                          <button
                            onClick={(e) => handleMarkAsRead(n.id, e)}
                            className="p-1 text-slate-400 hover:text-white rounded"
                            title="Mark as read"
                          >
                            <span className="w-2 h-2 rounded-full bg-red-500 block" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile dropdown */}
        <div ref={userMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2.5 p-1.5 text-start hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700"
          >
            <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 font-bold text-sm">
              {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U'}
            </div>
            <div className="hidden md:block text-xs leading-tight">
              <div className="font-semibold text-slate-200">{user?.fullName || user?.username}</div>
              <div className="text-red-400 text-[11px] font-medium flex items-center gap-1">
                <Shield className="w-3 h-3 text-red-400" />
                <span>{isRtl ? role?.nameAr || role?.name : role?.name || 'User'}</span>
              </div>
            </div>
          </button>

          {isUserMenuOpen && (
            <div
              className={`absolute top-full mt-2 ${
                isRtl ? 'left-0' : 'right-0'
              } w-60 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 z-50 text-xs`}
            >
              <div className="px-4 py-2 border-b border-slate-800">
                <p className="font-semibold text-slate-100">{user?.fullName}</p>
                <p className="text-slate-400 text-[11px]">{user?.email}</p>
                <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-red-950 text-red-400 border border-red-800/80">
                  {isRtl ? role?.nameAr : role?.name}
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    onNavigate('settings');
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-800 text-start"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>{t('systemSettings', 'System Settings')}</span>
                </button>

                <button
                  onClick={() => {
                    logout();
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-950/40 text-start font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('logout', 'Log Out')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
