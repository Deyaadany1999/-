import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface NotificationsViewProps {
  onNavigate: (view: string, params?: Record<string, any>) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ onNavigate }) => {
  const { t, isRtl, formatDate } = useLanguage();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await api.getNotifications();
      setNotifications(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-yellow-500" />
            <span>{t('notifications', 'Safety Notifications & Deadline Alerts')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isRtl
              ? 'تنبيهات تلقائية مستمرة بالمهل النهائية، العيوب المتأخرة، وعمليات السلامة'
              : 'Automated proactive alerts for approaching deadlines, overdue defects, and safety milestones'}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
          >
            <CheckCheck className="w-4 h-4 text-emerald-400" />
            <span>{isRtl ? 'تحديد كافة التنبيهات كمقروءة' : 'Mark all as read'}</span>
          </button>
        )}
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden divide-y divide-slate-800/80">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <span className="inline-block w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mb-2" />
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <Bell className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p>{t('noNotifications', 'No notifications found')}</p>
          </div>
        ) : (
          notifications.map((n) => {
            const isUnread = !n.read;
            return (
              <div
                key={n.id}
                onClick={() => {
                  if (n.problemId) {
                    onNavigate('problems', { problemId: n.problemId });
                  } else if (n.equipmentCode) {
                    onNavigate('equipment-details', { code: n.equipmentCode });
                  }
                  if (isUnread) handleMarkAsRead(n.id);
                }}
                className={`p-4 transition-colors cursor-pointer flex items-start justify-between gap-4 ${
                  isUnread ? 'bg-slate-800/40 hover:bg-slate-800/70' : 'hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {n.type === 'overdue' && (
                      <div className="p-2 rounded-lg bg-red-950/80 text-red-400 border border-red-800">
                        <ShieldAlert className="w-4 h-4 animate-pulse" />
                      </div>
                    )}
                    {n.type === 'due_today' && (
                      <div className="p-2 rounded-lg bg-amber-950/80 text-amber-400 border border-amber-800">
                        <Clock className="w-4 h-4" />
                      </div>
                    )}
                    {n.type === 'due_soon' && (
                      <div className="p-2 rounded-lg bg-yellow-950/80 text-yellow-400 border border-yellow-800">
                        <Clock className="w-4 h-4" />
                      </div>
                    )}
                    {n.type === 'system' && (
                      <div className="p-2 rounded-lg bg-blue-950/80 text-blue-400 border border-blue-800">
                        <Bell className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100">
                        {isRtl ? n.titleAr : n.title}
                      </span>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                      )}
                    </div>
                    <p className="text-slate-300">
                      {isRtl ? n.messageAr : n.message}
                    </p>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {formatDate(n.createdAt)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                    <span>{t('view', 'View')}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
