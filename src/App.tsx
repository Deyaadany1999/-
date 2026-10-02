import React, { useState } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { EquipmentView } from './views/EquipmentView';
import { EquipmentDetailsView } from './views/EquipmentDetailsView';
import { ProblemsView } from './views/ProblemsView';
import { EmployeesView } from './views/EmployeesView';
import { IdCardsView } from './views/IdCardsView';
import { ContractorsView } from './views/ContractorsView';
import { ReportsView } from './views/ReportsView';
import { NotificationsView } from './views/NotificationsView';
import { UsersView } from './views/UsersView';
import { RolesView } from './views/RolesView';
import { AuditLogView } from './views/AuditLogView';
import { SettingsView } from './views/SettingsView';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isRtl } = useLanguage();

  const [currentView, setCurrentView] = useState('dashboard');
  const [viewParams, setViewParams] = useState<Record<string, any>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleNavigate = (view: string, params: Record<string, any> = {}) => {
    setCurrentView(view);
    setViewParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wider uppercase text-slate-300">
          Heavy Equipment HSE Management System
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <div
      className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-red-500 selection:text-white ${
        isRtl ? 'font-arabic' : 'font-sans'
      }`}
    >
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeEquipmentType={viewParams?.type}
      />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isRtl ? 'lg:mr-72' : 'lg:ml-72'}`}>
        {/* Sticky Header with Search & Notifications */}
        <Header
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onNavigate={handleNavigate}
        />

        {/* Page View Body */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentView === 'dashboard' && (
            <DashboardView onNavigate={handleNavigate} />
          )}

          {currentView === 'equipment' && (
            <EquipmentView
              key={viewParams?.type || 'all'}
              initialType={viewParams?.type}
              onNavigate={handleNavigate}
            />
          )}

          {currentView === 'equipment-details' && (
            <EquipmentDetailsView
              key={viewParams?.code}
              equipmentCode={viewParams?.code}
              onNavigate={handleNavigate}
            />
          )}

          {currentView === 'problems' && (
            <ProblemsView
              key={viewParams?.problemId || viewParams?.quickFilter || 'default'}
              initialStatus={viewParams?.status}
              initialQuickFilter={viewParams?.quickFilter}
              initialProblemId={viewParams?.problemId}
              defaultCode={viewParams?.defaultCode}
              openNewModal={viewParams?.openNewModal}
              onNavigate={handleNavigate}
            />
          )}

          {currentView === 'employees' && (
            <EmployeesView
              initialSearch={viewParams?.search}
              onNavigate={handleNavigate}
            />
          )}

          {currentView === 'id-cards' && (
            <IdCardsView
              initialEmployeeId={viewParams?.employeeId}
            />
          )}

          {currentView === 'contractors' && (
            <ContractorsView
              initialSearch={viewParams?.search}
              onNavigate={handleNavigate}
            />
          )}

          {currentView === 'reports' && (
            <ReportsView />
          )}

          {currentView === 'notifications' && (
            <NotificationsView onNavigate={handleNavigate} />
          )}

          {currentView === 'users' && (
            <UsersView />
          )}

          {currentView === 'roles' && (
            <RolesView />
          )}

          {currentView === 'audit-log' && (
            <AuditLogView />
          )}

          {currentView === 'settings' && (
            <SettingsView />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}
