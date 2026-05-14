'use client';

import { useState } from 'react';
import { Church, Users, CalendarDays, CalendarClock, DollarSign, ClipboardList, Menu, X, Cross, Music, ListMusic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import DashboardView from '@/components/church/dashboard';
import MembersView from '@/components/church/members';
import ServicesView from '@/components/church/services';
import EventsView from '@/components/church/events';
import FinancesView from '@/components/church/finances';
import AttendanceView from '@/components/church/attendance';
import SongsView from '@/components/church/songs';
import WeeklySongsView from '@/components/church/weekly-songs';

const navSections = [
  {
    label: 'Umum',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: Church },
      { id: 'members', label: 'Jemaat', icon: Users },
    ],
  },
  {
    label: 'Ibadah',
    items: [
      { id: 'services', label: 'Jadwal Ibadah', icon: CalendarClock },
      { id: 'songs', label: 'Database Lagu', icon: Music },
      { id: 'weekly-songs', label: 'Lagu Minggu Ini', icon: ListMusic },
      { id: 'attendance', label: 'Kehadiran', icon: ClipboardList },
    ],
  },
  {
    label: 'Administrasi',
    items: [
      { id: 'events', label: 'Acara', icon: CalendarDays },
      { id: 'finances', label: 'Keuangan', icon: DollarSign },
    ],
  },
] as const;

type NavId = typeof navSections[number]['items'][number]['id'];

export default function ChurchApp() {
  const [activeTab, setActiveTab] = useState<NavId>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView />;
      case 'members': return <MembersView />;
      case 'services': return <ServicesView />;
      case 'songs': return <SongsView />;
      case 'weekly-songs': return <WeeklySongsView />;
      case 'events': return <EventsView />;
      case 'finances': return <FinancesView />;
      case 'attendance': return <AttendanceView />;
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
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-sm">
              <Cross className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-amber-900 leading-tight">Sistem Gereja</h1>
              <p className="text-[10px] sm:text-xs text-amber-600 leading-tight hidden sm:block">Manajemen Gereja Digital</p>
            </div>
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
            {navSections.map((section) => (
              <div key={section.label}>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1.5">{section.label}</p>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
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
                            ? 'bg-amber-100 text-amber-900 shadow-sm'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        )}
                      >
                        <Icon className={cn('h-4.5 w-4.5', isActive ? 'text-amber-700' : 'text-gray-400')} />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-3 border-t bg-white">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Cross className="h-3.5 w-3.5" />
              <span>Solusi Gereja Modern</span>
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
          © 2026 Sistem Gereja — Dibuat dengan ❤️ untuk pelayanan
        </div>
      </footer>
    </div>
  );
}
