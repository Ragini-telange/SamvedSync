import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { loadNotifications, markNotificationRead } from '../lib/dashboardData';
import { supabase } from '../supabaseClient';
import { 
  Droplet, LogOut, Menu, X, Bell, User, LayoutDashboard, Users, UserRound, 
  Shield, AlertTriangle, Settings, Activity, Sun, Moon, CheckCircle2, Info, Clock, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const getNavIcon = (label) => {
  const l = label.toLowerCase();
  if (l.includes('dashboard') || l.includes('overview')) return <LayoutDashboard className="w-5 h-5" />;
  if (l.includes('patient')) return <Users className="w-5 h-5" />;
  if (l.includes('verification') || l.includes('nurse')) return <UserRound className="w-5 h-5" />;
  if (l.includes('admin')) return <Shield className="w-5 h-5" />;
  if (l.includes('alert')) return <AlertTriangle className="w-5 h-5" />;
  if (l.includes('setting')) return <Settings className="w-5 h-5" />;
  return <Activity className="w-5 h-5" />;
};

export default function DashboardShell({ title, subtitle, navItems = [], activeItem, children }) {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);

  const fetchNotifs = useCallback(async () => {
    if (!profile) return;
    const notifs = await loadNotifications(profile.id);
    setNotifications(notifs);
  }, [profile]);

  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs]);

  // Realtime notification updates
  useEffect(() => {
    const channel = supabase
      .channel('header-notifs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        fetchNotifs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifs]);

  async function handleNotificationClick(n) {
    if (!n.is_read) {
      await markNotificationRead(n.id);
      fetchNotifs();
    }
    if (n.link) {
      const targetItem = navItems.find(item => item.key === n.link.replace('/', ''));
      if (targetItem) targetItem.onClick?.();
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  async function handleSignOut() {
    await signOut();
    navigate('/login', { replace: true });
  }

  const SidebarContent = () => (
    <>
      <div className="font-display text-2xl font-bold flex items-center gap-2 px-6 py-6 text-white mb-2">
        <div className="bg-saline p-1.5 rounded-lg">
          <Droplet className="w-5 h-5 text-white" />
        </div>
        SamvedSync
      </div>

      <div className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = activeItem === item.key;
          return (
            <button
              key={item.key}
              onClick={() => { item.onClick?.(); setMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-saline text-white shadow-md shadow-saline/20' 
                  : 'text-slate-300 hover:bg-ink-surface hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon ? item.icon : getNavIcon(item.label)}
                {item.label}
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="bg-amber-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="p-4 mt-auto">
        <div className="bg-ink-surface rounded-2xl p-4 flex items-center gap-3 border border-white/5 text-white">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden border border-slate-700 font-bold text-saline-bright">
            {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate">{profile?.name || '—'}</div>
            <div className="text-xs text-saline-bright capitalize truncate">{profile?.role}</div>
          </div>
          <button 
            onClick={handleSignOut} 
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-body text-ink dark:text-slate-100 selection:bg-saline selection:text-white transition-colors duration-300">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col bg-ink dark:bg-slate-900 border-r border-slate-200/50 dark:border-slate-800 fixed h-screen z-20">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-ink/60 backdrop-blur-sm z-40"
            />
            <motion.aside 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed top-0 left-0 bottom-0 w-72 flex-col bg-ink dark:bg-slate-900 z-50 flex shadow-2xl"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-72 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-20 px-6 sm:px-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 z-30 transition-colors">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-bold text-ink dark:text-white">{title}</h1>
              {subtitle && <p className="hidden sm:block text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
            </div>
          </div>
          
          <div className="flex items-center gap-3 relative">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all border border-slate-200 dark:border-slate-700 flex items-center justify-center"
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            >
              {theme === 'light' ? <Moon className="w-4 h-4 text-slate-700" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>

            {/* Notification Bell with Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors border border-slate-200 dark:border-slate-700"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-pulse text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-white dark:border-slate-900 animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50"
                  >
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div className="font-bold text-sm text-ink dark:text-white flex items-center gap-2">
                        <Bell className="w-4 h-4 text-saline" /> Notifications
                      </div>
                      <span className="text-xs text-slate-500 font-medium">{unreadCount} unread</span>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400">No notifications</div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors flex items-start gap-3 ${
                              !n.is_read ? 'bg-saline/5' : ''
                            }`}
                          >
                            <div className="mt-0.5">
                              {n.type === 'registration' ? (
                                <Clock className="w-4 h-4 text-amber-500" />
                              ) : n.type === 'approval' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <Info className="w-4 h-4 text-saline" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-xs text-ink dark:text-white flex items-center justify-between">
                                <span className="truncate">{n.title}</span>
                                {!n.is_read && <span className="w-2 h-2 rounded-full bg-saline shrink-0" />}
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-snug">{n.message}</p>
                              <span className="text-[10px] text-slate-400 mt-1 block">
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-slate-200 dark:border-slate-800">
              <div className="text-right">
                <div className="text-sm font-semibold text-ink dark:text-white">{profile?.name || 'User'}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">{profile?.role}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 sm:p-10 max-w-[1600px] w-full mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
