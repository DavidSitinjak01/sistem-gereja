'use client';

import { useState, useEffect } from 'react';
import { Church, Users, CalendarDays, CalendarClock, DollarSign, ClipboardList, Menu, X, Cross, Music, ListMusic, Settings, LogOut, Shield, ChevronDown, Heart, Baby, Droplets, HeartHandshake, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/sonner';
import { useAuthStore } from '@/store/auth';
import { canAccessTab, ROLE_LABELS, type TabId, type UserRole } from '@/lib/permissions';
import DashboardView from '@/components/church/dashboard';
import MembersView from '@/components/church/members';
import ServicesView from '@/components/church/services';
import EventsView from '@/components/church/events';
import FinancesView from '@/components/church/finances';
import AttendanceView from '@/components/church/attendance';
import SongsView from '@/components/church/songs';
import WeeklySongsView from '@/components/church/weekly-songs';
import SettingsView from '@/components/church/settings';

// Logo component — shows uploaded logo or default cross icon
function AppLogo({ size = 'md', logo, name }: { size?: 'sm' | 'md' | 'lg'; logo?: string | null; name?: string }) {
  const sizeClasses = { sm: 'w-6 h-6', md: 'w-9 h-9', lg: 'w-16 h-16' };

  if (logo) {
    return (
      <img
        src={logo}
        alt={name || 'Logo'}
        className={cn('rounded-lg object-contain', sizeClasses[size])}
      />
    );
  }

  return (
    <div className={cn('rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-sm', sizeClasses[size])}>
      <Cross className={cn(size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-8 w-8' : 'h-5 w-5', 'text-white')} />
    </div>
  );
}

// Under development placeholder component
function ComingSoonView({ title, icon: Icon }: { title: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4">
      <div className="w-20 h-20 rounded-2xl bg-purple-50 flex items-center justify-center mb-6">
        <Icon className="h-10 w-10 text-purple-400" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-500 text-center max-w-sm">Fitur ini sedang dalam pengembangan dan akan segera tersedia.</p>
      <div className="mt-6 flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 border border-purple-200">
        <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
        <span className="text-sm text-purple-700 font-medium">Segera Hadir</span>
      </div>
    </div>
  );
}

const allNavSections = [
  {
    label: 'Umum',
    items: [
      { id: 'dashboard' as TabId, label: 'Dashboard', icon: Church },
      { id: 'members' as TabId, label: 'Jemaat', icon: Users },
    ],
  },
  {
    label: 'Ibadah',
    items: [
      { id: 'services' as TabId, label: 'Jadwal Ibadah', icon: CalendarClock },
      { id: 'songs' as TabId, label: 'Database Lagu', icon: Music },
      { id: 'weekly-songs' as TabId, label: 'Lagu Minggu Ini', icon: ListMusic },
      { id: 'attendance' as TabId, label: 'Kehadiran', icon: ClipboardList },
    ],
  },
  {
    label: 'Perjalanan Iman',
    items: [
      { id: 'penyerahan-anak' as TabId, label: 'Penyerahan Anak', icon: Baby },
      { id: 'baptisan-air' as TabId, label: 'Baptisan Air', icon: Droplets },
      { id: 'pernikahan' as TabId, label: 'Pernikahan', icon: HeartHandshake },
    ],
  },
  {
    label: 'Administrasi',
    items: [
      { id: 'events' as TabId, label: 'Acara', icon: CalendarDays },
      { id: 'finances' as TabId, label: 'Keuangan', icon: DollarSign },
    ],
  },
  {
    label: 'Sistem',
    items: [
      { id: 'settings' as TabId, label: 'Pengaturan', icon: Settings },
    ],
  },
];

export default function ChurchApp() {
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [churchName, setChurchName] = useState('Sistem Gereja');
  const [churchLogo, setChurchLogo] = useState<string | null>(null);

  const userRole = (user?.role || null) as UserRole | null;

  // Load church branding
  useEffect(() => {
    const loadBranding = async () => {
      try {
        const res = await fetch('/api/settings?includeLogo=true');
        if (!res.ok) return;
        const data = await res.json();
        if (data.churchName) {
          setChurchName(data.churchName);
        }
        if (data.logo) {
          setChurchLogo(data.logo);
        }
      } catch {
        // Ignore
      }
    };
    loadBranding();
  }, []);

  // Filter nav sections based on role
  const navSections = allNavSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => canAccessTab(userRole, item.id)),
    }))
    .filter((section) => section.items.length > 0);

  // Compute the safe active tab
  const safeActiveTab = canAccessTab(userRole, activeTab) ? activeTab : 'dashboard';

  // Check if a section has an active item
  const isSectionActive = (sectionLabel: string) => {
    const section = navSections.find(s => s.label === sectionLabel);
    if (!section) return false;
    return section.items.some(item => safeActiveTab === item.id);
  };

  // Compute expanded state: auto-expand if a sub-item is active or manually expanded
  const isSectionExpanded = (sectionLabel: string) => {
    if (isSectionActive(sectionLabel)) return true;
    return expandedSections[sectionLabel] ?? false;
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch { /* ignore */ }
    logout();
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-700';
      case 'BENDAHARA': return 'bg-emerald-100 text-emerald-700';
      case 'PELAYAN': return 'bg-blue-100 text-blue-700';
      case 'SEKRETARIS': return 'bg-purple-100 text-purple-700';
      case 'PENDETA': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const renderContent = () => {
    switch (safeActiveTab) {
      case 'dashboard': return <DashboardView />;
      case 'members': return <MembersView />;
      case 'services': return <ServicesView />;
      case 'songs': return <SongsView />;
      case 'weekly-songs': return <WeeklySongsView />;
      case 'events': return <EventsView />;
      case 'finances': return <FinancesView />;
      case 'attendance': return <AttendanceView />;
      case 'penyerahan-anak': return <ComingSoonView title="Penyerahan Anak" icon={Baby} />;
      case 'baptisan-air': return <ComingSoonView title="Baptisan Air" icon={Droplets} />;
      case 'pernikahan': return <ComingSoonView title="Pernikahan" icon={HeartHandshake} />;
      case 'settings': return <SettingsView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="flex items-center h-14 px-3 sm:px-4 gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden shrink-0"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Tutup menu' : 'Buka menu'}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="flex items-center gap-2.5">
            <AppLogo size="md" logo={churchLogo} name={churchName} />
            <div>
              <h1 className="text-base sm:text-lg font-bold text-purple-900 leading-tight">{churchName}</h1>
              <p className="text-[10px] sm:text-xs text-purple-600 leading-tight hidden sm:block">Manajemen Gereja Digital</p>
            </div>
          </div>

          {/* User Menu */}
          <div className="ml-auto relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-xs font-bold text-purple-700">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-medium text-gray-700 leading-tight">{user?.name || 'User'}</p>
                <p className="text-[10px] text-gray-400 leading-tight">{ROLE_LABELS[user?.role as UserRole] || 'Unknown'}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-gray-400 hidden sm:block" />
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-xl border z-50 py-1.5">
                  <div className="px-3 py-2 border-b">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium', getRoleBadgeColor(user?.role as UserRole))}>
                        <Shield className="h-3 w-3" />
                        {ROLE_LABELS[user?.role as UserRole]}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Keluar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar Overlay for Mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            'fixed lg:static inset-y-0 left-0 z-40 w-60 sm:w-64 bg-white border-r transition-transform duration-200 lg:translate-x-0 pt-14 lg:pt-0 shadow-lg lg:shadow-none overflow-y-auto',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="p-3 sm:p-4 space-y-4 pb-20">
            {navSections.map((section) => {
              const isExpandable = section.label === 'Perjalanan Iman';
              const isExpanded = isSectionExpanded(section.label);
              const hasActiveItem = isSectionActive(section.label);

              if (isExpandable) {
                return (
                  <div key={section.label}>
                    <button
                      onClick={() => setExpandedSections(prev => ({ ...prev, [section.label]: !prev[section.label] }))}
                      className={cn(
                        'w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                        hasActiveItem
                          ? 'bg-purple-100 text-purple-900 shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Heart className={cn('h-4.5 w-4.5', hasActiveItem ? 'text-purple-700' : 'text-gray-400')} />
                        {section.label}
                      </div>
                      <ChevronRight className={cn(
                        'h-4 w-4 transition-transform duration-200',
                        isExpanded ? 'rotate-90 text-purple-600' : 'text-gray-400'
                      )} />
                    </button>
                    {isExpanded && (
                      <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-purple-100 pl-3">
                        {section.items.map((item) => {
                          const Icon = item.icon;
                          const isActive = safeActiveTab === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => {
                                setActiveTab(item.id);
                                setSidebarOpen(false);
                              }}
                              className={cn(
                                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                                isActive
                                  ? 'bg-purple-100 text-purple-900 shadow-sm'
                                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                              )}
                            >
                              <Icon className={cn('h-4 w-4', isActive ? 'text-purple-700' : 'text-gray-400')} />
                              {item.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div key={section.label}>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1.5">{section.label}</p>
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = safeActiveTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id);
                            setSidebarOpen(false);
                          }}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                            isActive
                              ? 'bg-purple-100 text-purple-900 shadow-sm'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          )}
                        >
                          <Icon className={cn('h-4.5 w-4.5', isActive ? 'text-purple-700' : 'text-gray-400')} />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sidebar Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-3 border-t bg-white">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <AppLogo size="sm" logo={churchLogo} name={churchName} />
              <span>{churchName}</span>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 overflow-x-hidden">
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white mt-auto">
        <div className="px-4 py-3 text-center text-xs text-gray-400">
          &copy; 2026 {churchName} &mdash; Dibuat dengan &#10084; untuk pelayanan
        </div>
      </footer>

      <Toaster richColors position="top-right" />
    </div>
  );
}
