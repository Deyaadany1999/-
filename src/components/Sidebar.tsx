import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Truck,
  AlertTriangle,
  Users,
  CreditCard,
  Building2,
  FileBarChart,
  Bell,
  UserCheck,
  ShieldCheck,
  History,
  Settings,
  ChevronDown,
  ChevronRight,
  HardHat,
  X,
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string, params?: Record<string, any>) => void;
  isOpen: boolean;
  onClose: () => void;
  activeEquipmentType?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  isOpen,
  onClose,
  activeEquipmentType,
}) => {
  const { t, isRtl } = useLanguage();
  const { hasPermission, isAdmin } = useAuth();
  const [equipmentExpanded, setEquipmentExpanded] = useState(false);

  const equipmentCategories = [
    { key: 'Cranes', name: t('Cranes', 'Cranes') },
    { key: 'Trailers', name: t('Trailers', 'Trailers') },
    { key: 'Truck Cranes', name: t('Truck Cranes', 'Truck Cranes') },
    { key: 'Loaders', name: t('Loaders', 'Loaders') },
    { key: 'Dump Trucks', name: t('Dump Trucks', 'Dump Trucks') },
    { key: 'Fork Lifts', name: t('Fork Lifts', 'Fork Lifts') },
    { key: 'Water Tanks', name: t('Water Tanks', 'Water Tanks') },
    { key: 'Man Lifts', name: t('Man Lifts', 'Man Lifts') },
    { key: 'Jumbo Trucks', name: t('Jumbo Trucks', 'Jumbo Trucks') },
    { key: 'Fuel Tanks', name: t('Fuel Tanks', 'Fuel Tanks') },
  ];

  const handleNav = (view: string, params?: Record<string, any>) => {
    onNavigate(view, params);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const hasAdminAccess =
    isAdmin ||
    hasPermission('USERS_VIEW') ||
    hasPermission('ROLES_VIEW') ||
    hasPermission('AUDIT_VIEW') ||
    hasPermission('SYSTEM_SETTINGS');

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 ${
          isRtl ? 'right-0' : 'left-0'
        } z-50 w-72 bg-slate-950 border-e border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen
            ? 'translate-x-0'
            : isRtl
            ? 'translate-x-full'
            : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 bg-slate-900/80 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center text-white shadow-md shadow-red-950">
              <HardHat className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white leading-tight">
                {t('appName', 'Heavy Equipment HSE System')}
              </h1>
              <p className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                <span>{t('safetyFirst', 'SAFETY FIRST')}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white lg:hidden rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar text-xs">
          {/* Dashboard */}
          {hasPermission('DASHBOARD_VIEW') && (
            <button
              onClick={() => handleNav('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                currentView === 'dashboard'
                  ? 'bg-red-600 text-white shadow-xs shadow-red-900/50'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-start">{t('dashboard', 'Dashboard')}</span>
            </button>
          )}

          {/* Equipment & Categories Tree */}
          {hasPermission('EQUIPMENT_VIEW') && (
            <div className="space-y-0.5">
              <div
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium cursor-pointer transition-colors ${
                  currentView === 'equipment' && !activeEquipmentType
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
                onClick={() => {
                  handleNav('equipment');
                  setEquipmentExpanded(!equipmentExpanded);
                }}
              >
                <div className="flex items-center gap-3">
                  <Truck className="w-4 h-4 shrink-0 text-amber-500" />
                  <span>{t('equipment', 'Equipment')}</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEquipmentExpanded(!equipmentExpanded);
                  }}
                  className="p-0.5 text-slate-400 hover:text-white"
                >
                  {equipmentExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
                  )}
                </button>
              </div>

              {/* Sub-categories */}
              {equipmentExpanded && (
                <div className={`space-y-0.5 ${isRtl ? 'pr-6 border-r' : 'pl-6 border-l'} border-slate-800 my-1`}>
                  <button
                    onClick={() => handleNav('equipment', { type: 'all' })}
                    className={`w-full flex items-center px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                      currentView === 'equipment' && (!activeEquipmentType || activeEquipmentType === 'all')
                        ? 'text-red-400 font-bold bg-slate-900/60'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                    }`}
                  >
                    • {t('allEquipment', 'All Equipment')}
                  </button>
                  {equipmentCategories.map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => handleNav('equipment', { type: cat.key })}
                      className={`w-full flex items-center px-2.5 py-1.5 rounded-md text-[11px] transition-colors truncate ${
                        currentView === 'equipment' && activeEquipmentType === cat.key
                          ? 'text-red-400 font-bold bg-slate-900/60'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                      }`}
                    >
                      • {cat.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Problems */}
          {hasPermission('PROBLEMS_VIEW') && (
            <button
              onClick={() => handleNav('problems')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                currentView === 'problems'
                  ? 'bg-red-600 text-white shadow-xs shadow-red-900/50'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
              <span className="flex-1 text-start">{t('problems', 'Problems & Incidents')}</span>
            </button>
          )}

          {/* Employees / Drivers */}
          {hasPermission('EMPLOYEES_VIEW') && (
            <button
              onClick={() => handleNav('employees')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                currentView === 'employees'
                  ? 'bg-red-600 text-white shadow-xs shadow-red-900/50'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 shrink-0 text-blue-400" />
              <span className="flex-1 text-start">{t('employees', 'Employees / Drivers')}</span>
            </button>
          )}

          {/* Safety ID Cards */}
          {hasPermission('IDCARDS_VIEW') && (
            <button
              onClick={() => handleNav('id-cards')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                currentView === 'id-cards'
                  ? 'bg-red-600 text-white shadow-xs shadow-red-900/50'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4 shrink-0 text-emerald-400" />
              <span className="flex-1 text-start">{t('idCards', 'Safety ID Cards')}</span>
            </button>
          )}

          {/* Contractors */}
          {hasPermission('CONTRACTORS_VIEW') && (
            <button
              onClick={() => handleNav('contractors')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                currentView === 'contractors'
                  ? 'bg-red-600 text-white shadow-xs shadow-red-900/50'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4 shrink-0 text-purple-400" />
              <span className="flex-1 text-start">{t('contractors', 'Contractors')}</span>
            </button>
          )}

          {/* Reports */}
          {hasPermission('REPORTS_VIEW') && (
            <button
              onClick={() => handleNav('reports')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                currentView === 'reports'
                  ? 'bg-red-600 text-white shadow-xs shadow-red-900/50'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <FileBarChart className="w-4 h-4 shrink-0 text-cyan-400" />
              <span className="flex-1 text-start">{t('reports', 'Reports')}</span>
            </button>
          )}

          {/* Notifications */}
          {hasPermission('NOTIFICATIONS_VIEW') && (
            <button
              onClick={() => handleNav('notifications')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                currentView === 'notifications'
                  ? 'bg-red-600 text-white shadow-xs shadow-red-900/50'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Bell className="w-4 h-4 shrink-0 text-yellow-500" />
              <span className="flex-1 text-start">{t('notifications', 'Notifications')}</span>
            </button>
          )}

          {/* Administration Section */}
          {hasAdminAccess && (
            <div className="pt-4 mt-4 border-t border-slate-800 space-y-1">
              <div className="px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {t('administration', 'Administration')}
              </div>

              {(isAdmin || hasPermission('USERS_VIEW')) && (
                <button
                  onClick={() => handleNav('users')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                    currentView === 'users'
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <UserCheck className="w-4 h-4 shrink-0 text-slate-400" />
                  <span className="flex-1 text-start">{t('usersManagement', 'Users Management')}</span>
                </button>
              )}

              {(isAdmin || hasPermission('ROLES_VIEW')) && (
                <button
                  onClick={() => handleNav('roles')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                    currentView === 'roles'
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 shrink-0 text-slate-400" />
                  <span className="flex-1 text-start">{t('rolesPermissions', 'Roles & Permissions')}</span>
                </button>
              )}

              {(isAdmin || hasPermission('AUDIT_VIEW')) && (
                <button
                  onClick={() => handleNav('audit-log')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                    currentView === 'audit-log'
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <History className="w-4 h-4 shrink-0 text-slate-400" />
                  <span className="flex-1 text-start">{t('activityLog', 'Activity / Audit Log')}</span>
                </button>
              )}

              {(isAdmin || hasPermission('SYSTEM_SETTINGS')) && (
                <button
                  onClick={() => handleNav('settings')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                    currentView === 'settings'
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <Settings className="w-4 h-4 shrink-0 text-slate-400" />
                  <span className="flex-1 text-start">{t('systemSettings', 'System Settings')}</span>
                </button>
              )}
            </div>
          )}
        </nav>

        {/* Footer info */}
        <div className="p-3 bg-slate-950 border-t border-slate-900 text-center">
          <div className="text-[10px] text-slate-400">
            HSE Management v3.8 • ISO 45001 / OSHA Aligned
          </div>
        </div>
      </aside>
    </>
  );
};
