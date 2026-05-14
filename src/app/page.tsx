'use client';

import { useState } from 'react';
import { Church, Users, CalendarDays, CalendarClock, DollarSign, ClipboardList, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import DashboardView from '@/components/church/dashboard';
import MembersView from '@/components/church/members';
import ServicesView from '@/components/church/services';
import EventsView from '@/components/church/events';
import FinancesView from '@/components/church/finances';
import AttendanceView from '@/components/church/attendance';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Church },
  { id: 'members', label: 'Jemaat', icon: Users },
  { id: 'services', label: 'Ibadah', icon: CalendarClock },
  { id: 'events', label: 'Acara', icon: CalendarDays },
  { id: 'finances', label: 'Keuangan', icon: DollarSign },
  { id: 'attendance', label: 'Kehadiran', icon: ClipboardList },
] as const;

type NavId = (typeof navItems)[number]['id'];

export default function ChurchApp() {
  const [activeTab, setActiveTab] = useState<NavId>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'members':
        return <MembersView />;
      case 'services':
        return <ServicesView />;
      case 'events':
        return <EventsView />;
      case 'finances':
        return <FinancesView />;
      case 'attendance':
        return <AttendanceView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
        <div className="flex items-center h-14 px-4 gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center">
              <Church className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-amber-900">Sistem Gereja</h1>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar Overlay for Mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            'fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r transition-transform duration-200 lg:translate-x-0 pt-14 lg:pt-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
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
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-amber-100 text-amber-900'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white mt-auto">
        <div className="px-4 py-3 text-center text-xs text-gray-500">
          © 2026 Sistem Gereja — Dibuat dengan ❤️ untuk pelayanan
        </div>
      </footer>
    </div>
  );
}
