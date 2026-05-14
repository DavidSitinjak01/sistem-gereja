'use client';

import { useEffect, useState } from 'react';
import { Users, UserCheck, TrendingUp, TrendingDown, CalendarDays, Church } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MonthlyFinance {
  month: string;
  income: number;
  expense: number;
}

interface UpcomingEvent {
  id: string;
  title: string;
  description: string | null;
  date: string;
  location: string | null;
}

interface RecentAttendance {
  id: string;
  date: string;
  memberCount: number;
  notes: string | null;
  service: { id: string; name: string; dayOfWeek: string | null; time: string | null };
}

interface DashboardData {
  totalMembers: number;
  activeMembers: number;
  totalIncome: number;
  totalExpense: number;
  upcomingEvents: UpcomingEvent[];
  recentAttendance: RecentAttendance[];
  monthlyFinanceSummary: MonthlyFinance[];
}

const formatRupiah = (n: number) => 'Rp ' + n.toLocaleString('id-ID');

export default function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Gagal memuat data');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <DashboardSkeleton />;
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Church className="h-12 w-12 text-amber-300 mb-4" />
        <p className="text-gray-500 mb-4">{error}</p>
        <button onClick={fetchDashboard} className="text-amber-600 hover:underline font-medium">Coba Lagi</button>
      </div>
    );
  }
  if (!data) return null;

  const balance = data.totalIncome - data.totalExpense;

  const stats = [
    { label: 'Total Jemaat', value: data.totalMembers.toLocaleString('id-ID'), icon: Users, color: 'bg-amber-100 text-amber-700' },
    { label: 'Jemaat Aktif', value: data.activeMembers.toLocaleString('id-ID'), icon: UserCheck, color: 'bg-emerald-100 text-emerald-700', sub: data.totalMembers > 0 ? `${Math.round((data.activeMembers / data.totalMembers) * 100)}%` : '' },
    { label: 'Pemasukan Bulan Ini', value: formatRupiah(data.totalIncome), icon: TrendingUp, color: 'bg-green-100 text-green-700' },
    { label: 'Pengeluaran Bulan Ini', value: formatRupiah(data.totalExpense), icon: TrendingDown, color: 'bg-rose-100 text-rose-700', sub: balance >= 0 ? `Surplus ${formatRupiah(balance)}` : `Defisit ${formatRupiah(Math.abs(balance))}` },
  ];

  const chartData = data.monthlyFinanceSummary.map((m) => ({
    ...m,
    month: `${m.month}`,
  }));

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">{s.label}</p>
                    <p className="text-xl font-bold text-gray-900">{s.value}</p>
                    {s.sub && <p className="text-xs text-gray-400">{s.sub}</p>}
                  </div>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Monthly Finance Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Ringkasan Keuangan 6 Bulan</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 && chartData.some(d => d.income > 0 || d.expense > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}jt` : v >= 1000 ? `${(v / 1000).toFixed(0)}rb` : String(v)} />
                <Tooltip formatter={(value: number, name: string) => [formatRupiah(value), name === 'income' ? 'Pemasukan' : 'Pengeluaran']} />
                <Legend formatter={(value: string) => value === 'income' ? 'Pemasukan' : 'Pengeluaran'} />
                <Bar dataKey="income" fill="#d97706" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <TrendingUp className="h-10 w-10 mb-2" />
              <p className="text-sm">Belum ada data keuangan</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming Events */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-amber-600" />
              Acara Akan Datang
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.upcomingEvents.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">Belum ada acara yang dijadwalkan</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {data.upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 hover:bg-amber-100 transition-colors">
                    <div className="bg-amber-600 text-white rounded-lg px-2 py-1 text-center min-w-[48px]">
                      <div className="text-xs font-medium">{new Date(event.date).toLocaleDateString('id-ID', { month: 'short' })}</div>
                      <div className="text-lg font-bold leading-tight">{new Date(event.date).getDate()}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{event.title}</p>
                      <p className="text-xs text-gray-500">{new Date(event.date).toLocaleDateString('id-ID', { weekday: 'long' })}</p>
                      {event.location && (
                        <p className="text-xs text-amber-700 mt-0.5">📍 {event.location}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Attendance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-amber-600" />
              Kehadiran Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentAttendance.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">Belum ada data kehadiran</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {data.recentAttendance.map((att) => (
                  <div key={att.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div>
                      <p className="font-medium text-gray-900">{att.service.name}</p>
                      <p className="text-xs text-gray-500">{new Date(att.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-amber-700">{att.memberCount}</p>
                      <p className="text-xs text-gray-400">jemaat</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="p-5">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-7 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-40 mb-4" />
              {[1, 2, 3].map(j => <Skeleton key={j} className="h-14 w-full mb-2" />)}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
