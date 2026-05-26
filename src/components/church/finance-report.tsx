'use client';

import { useState, useMemo, useEffect } from 'react';
import { Printer, Calendar, TrendingUp, TrendingDown, DollarSign, Church, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Finance {
  id: string;
  type: string;
  category: string;
  amount: number;
  description: string | null;
  date: string;
}

interface ChurchSettings {
  churchName: string;
  logo: string | null;
  hasLogo: boolean;
  province: string | null;
  regency: string | null;
  district: string | null;
  village: string | null;
  pastor: string | null;
  treasurer: string | null;
  secretary: string | null;
}

const INCOME_CATS = ['PERSEPULUHAN', 'PERSEMBAHAN', 'DONASI', 'LAIN-LAIN'];
const EXPENSE_CATS = ['OPERASIONAL', 'RENOVASI', 'GAJI', 'KEGIATAN', 'LAIN-LAIN'];
const CAT_LABELS: Record<string, string> = {
  PERSEPULUHAN: 'Persepuluhan', PERSEMBAHAN: 'Persembahan', DONASI: 'Donasi', 'LAIN-LAIN': 'Lain-lain',
  OPERASIONAL: 'Operasional', RENOVASI: 'Renovasi', GAJI: 'Gaji', KEGIATAN: 'Kegiatan',
};
const MONTH_LABELS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const formatRupiah = (n: number) => 'Rp ' + n.toLocaleString('id-ID');

type ReportPeriod = 'weekly' | 'monthly' | 'yearly';

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getWeekRange(year: number, week: number): { start: Date; end: Date } {
  const jan1 = new Date(year, 0, 1);
  const dayOfWeek = jan1.getDay();
  const firstMonday = jan1.getDate() + (dayOfWeek <= 4 ? 1 - dayOfWeek : 8 - dayOfWeek);
  const start = new Date(year, 0, firstMonday + (week - 1) * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { start, end };
}

function formatPeriodLabel(period: ReportPeriod, year: number, month: number, week: number): string {
  if (period === 'weekly') {
    const { start, end } = getWeekRange(year, week);
    return `Minggu ke-${week}, ${start.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })} - ${end.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  }
  if (period === 'monthly') {
    return `${MONTH_LABELS[month]} ${year}`;
  }
  return `Tahun ${year}`;
}

interface FinanceReportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  finances: Finance[];
}

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth();
const currentWeek = getWeekNumber(new Date());

export default function FinanceReport({ open, onOpenChange, finances }: FinanceReportProps) {
  const [period, setPeriod] = useState<ReportPeriod>('monthly');
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedWeek, setSelectedWeek] = useState(currentWeek);
  const [settings, setSettings] = useState<ChurchSettings | null>(null);

  // Fetch settings when dialog opens
  useEffect(() => {
    if (open) {
      fetch('/api/settings?includeLogo=true')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            setSettings({
              churchName: data.churchName || 'Gereja',
              logo: data.logo || null,
              hasLogo: data.hasLogo || false,
              province: data.province || null,
              regency: data.regency || null,
              district: data.district || null,
              village: data.village || null,
              pastor: data.pastor || null,
              treasurer: data.treasurer || null,
              secretary: data.secretary || null,
            });
          }
        })
        .catch(() => { /* use defaults */ });
    }
  }, [open]);

  const churchName = settings?.churchName || 'Gereja';
  const churchLogo = settings?.logo || null;
  const churchAddress = [settings?.village, settings?.district, settings?.regency, settings?.province].filter(Boolean).join(', ');
  const districtName = settings?.district || '';
  const treasurerName = settings?.treasurer || '';

  // Filter finances based on selected period
  const filteredFinances = useMemo(() => {
    return finances.filter(f => {
      const d = new Date(f.date);
      if (period === 'yearly') {
        return d.getFullYear() === selectedYear;
      }
      if (period === 'monthly') {
        return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
      }
      // Weekly
      const { start, end } = getWeekRange(selectedYear, selectedWeek);
      const fDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      return fDate >= startDate && fDate <= endDate;
    });
  }, [finances, period, selectedYear, selectedMonth, selectedWeek]);

  // Calculate summaries
  const incomeItems = filteredFinances.filter(f => f.type === 'PEMASUKAN');
  const expenseItems = filteredFinances.filter(f => f.type === 'PENGELUARAN');
  const totalIncome = incomeItems.reduce((s, f) => s + f.amount, 0);
  const totalExpense = expenseItems.reduce((s, f) => s + f.amount, 0);
  const balance = totalIncome - totalExpense;

  // Group by category
  const incomeByCategory = INCOME_CATS.map(cat => ({
    category: cat,
    label: CAT_LABELS[cat],
    total: incomeItems.filter(f => f.category === cat).reduce((s, f) => s + f.amount, 0),
    count: incomeItems.filter(f => f.category === cat).length,
  })).filter(c => c.count > 0);

  const expenseByCategory = EXPENSE_CATS.map(cat => ({
    category: cat,
    label: CAT_LABELS[cat],
    total: expenseItems.filter(f => f.category === cat).reduce((s, f) => s + f.amount, 0),
    count: expenseItems.filter(f => f.category === cat).length,
  })).filter(c => c.count > 0);

  // Sort finances by date for the detail table
  const sortedFinances = [...filteredFinances].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const periodLabel = formatPeriodLabel(period, selectedYear, selectedMonth, selectedWeek);
  const printDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  const handlePrint = () => {
    const printContent = document.getElementById('finance-report-content');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Keuangan ${churchName} - ${periodLabel}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            color: #1a1a1a;
            padding: 40px;
            font-size: 11pt;
            line-height: 1.5;
          }
          .header-kop {
            border-bottom: 3px double #6b21a8;
            padding-bottom: 16px;
            margin-bottom: 0;
          }
          .header-layout {
            display: flex;
            align-items: center;
            gap: 16px;
          }
          .header-logo {
            flex-shrink: 0;
          }
          .header-logo img {
            width: 75px;
            height: 75px;
            object-fit: contain;
          }
          .header-text {
            flex: 1;
            text-align: center;
          }
          .church-name {
            font-size: 16pt;
            font-weight: 700;
            color: #581c87;
            letter-spacing: 1px;
          }
          .church-address {
            font-size: 9pt;
            color: #6b21a8;
            margin-top: 2px;
          }
          .report-title-block {
            text-align: center;
            margin-top: 16px;
            margin-bottom: 24px;
          }
          .report-title {
            font-size: 13pt;
            font-weight: 600;
            color: #1a1a1a;
          }
          .report-period {
            font-size: 10pt;
            color: #57534e;
            margin-top: 4px;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 16px;
            margin-bottom: 24px;
          }
          .summary-card {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 14px 16px;
          }
          .summary-card.income { border-left: 4px solid #059669; }
          .summary-card.expense { border-left: 4px solid #e11d48; }
          .summary-card.balance { border-left: 4px solid #ca8a04; }
          .summary-label { font-size: 9pt; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
          .summary-value { font-size: 14pt; font-weight: 700; margin-top: 4px; }
          .summary-value.income { color: #059669; }
          .summary-value.expense { color: #e11d48; }
          .summary-value.balance { color: #ca8a04; }
          .section-title {
            font-size: 12pt;
            font-weight: 600;
            color: #581c87;
            margin: 20px 0 10px;
            padding-bottom: 4px;
            border-bottom: 1px solid #f5f5f4;
          }
          .category-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
          }
          .category-table th {
            background: #faf5ff;
            padding: 8px 12px;
            text-align: left;
            font-weight: 600;
            font-size: 9pt;
            color: #6b21a8;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #a855f7;
          }
          .category-table td {
            padding: 7px 12px;
            border-bottom: 1px solid #f5f5f4;
            font-size: 10pt;
          }
          .category-table tr:last-child td { border-bottom: none; }
          .category-table .total-row td {
            font-weight: 700;
            border-top: 2px solid #a855f7;
            background: #faf5ff;
          }
          .detail-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
            font-size: 9pt;
          }
          .detail-table th {
            background: #f9fafb;
            padding: 6px 8px;
            text-align: left;
            font-weight: 600;
            color: #374151;
            border-bottom: 2px solid #e5e7eb;
          }
          .detail-table td {
            padding: 5px 8px;
            border-bottom: 1px solid #f3f4f6;
          }
          .detail-table .income-amount { color: #059669; font-weight: 500; }
          .detail-table .expense-amount { color: #e11d48; font-weight: 500; }
          .badge {
            display: inline-block;
            padding: 1px 6px;
            border-radius: 4px;
            font-size: 8pt;
            font-weight: 500;
          }
          .badge-income { background: #d1fae5; color: #065f46; }
          .badge-expense { background: #ffe4e6; color: #9f1239; }
          .footer {
            margin-top: 32px;
            padding-top: 16px;
            border-top: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            font-size: 8pt;
            color: #9ca3af;
          }
          .signature-area {
            margin-top: 40px;
            display: flex;
            justify-content: flex-end;
          }
          .signature-box {
            text-align: center;
            width: 220px;
          }
          @media print {
            body { padding: 20px; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const maxWeeks = 52;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-purple-900">
            <Printer className="h-5 w-5 text-purple-600" />
            Cetak Laporan Keuangan
          </DialogTitle>
        </DialogHeader>

        {/* Period Selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pb-3 border-b">
          <Select value={period} onValueChange={(v) => setPeriod(v as ReportPeriod)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Mingguan</SelectItem>
              <SelectItem value="monthly">Bulanan</SelectItem>
              <SelectItem value="yearly">Tahunan</SelectItem>
            </SelectContent>
          </Select>

          {period === 'yearly' && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setSelectedYear(y => y - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-semibold text-gray-900 min-w-[60px] text-center">{selectedYear}</span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setSelectedYear(y => y + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {period === 'monthly' && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => {
                if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1); }
                else setSelectedMonth(m => m - 1);
              }}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-semibold text-gray-900 min-w-[140px] text-center">
                {MONTH_LABELS[selectedMonth]} {selectedYear}
              </span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => {
                if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1); }
                else setSelectedMonth(m => m + 1);
              }}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {period === 'weekly' && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setSelectedWeek(w => Math.max(1, w - 1))} disabled={selectedWeek <= 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-semibold text-gray-900 text-sm min-w-[200px] text-center">
                Minggu ke-{selectedWeek}, {(() => {
                  const { start, end } = getWeekRange(selectedYear, selectedWeek);
                  return `${start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`;
                })()}
              </span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setSelectedWeek(w => Math.min(maxWeeks, w + 1))} disabled={selectedWeek >= maxWeeks}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          <Button onClick={handlePrint} className="bg-purple-600 hover:bg-purple-700 text-white ml-auto shrink-0">
            <Printer className="h-4 w-4 mr-2" /> Cetak Laporan
          </Button>
        </div>

        {/* Report Preview */}
        <div className="flex-1 overflow-y-auto" id="finance-report-content">
          {/* Header */}
          {/* Kop Surat - di atas garis */}
          <div className="header-kop border-b-4 border-double border-purple-800 pb-4">
            <div className="header-layout flex items-center gap-4">
              <div className="header-logo shrink-0">
                {churchLogo ? (
                  <img src={churchLogo} alt={churchName} className="w-[75px] h-[75px] object-contain" />
                ) : (
                  <div className="w-[75px] h-[75px] rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                    <Church className="h-8 w-8 text-white" />
                  </div>
                )}
              </div>
              <div className="header-text flex-1 text-center">
                <span className="church-name text-lg font-bold text-purple-900 tracking-wide">{churchName}</span>
                {churchAddress && (
                  <p className="church-address text-[10px] text-purple-700 mt-0.5">{churchAddress}</p>
                )}
                {!churchAddress && (
                  <p className="church-address text-[10px] text-purple-400 italic">Alamat gereja belum diatur</p>
                )}
              </div>
              {/* Spacer to balance the logo on the left */}
              <div className="w-[75px] shrink-0" />
            </div>
          </div>

          {/* Judul Laporan - di bawah garis */}
          <div className="report-title-block text-center mt-4 mb-6">
            <p className="report-title text-sm font-semibold text-gray-900">Laporan Keuangan {period === 'weekly' ? 'Mingguan' : period === 'monthly' ? 'Bulanan' : 'Tahunan'}</p>
            <p className="report-period text-xs text-stone-500 mt-1">Periode: {periodLabel}</p>
          </div>

          {filteredFinances.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Tidak ada data transaksi untuk periode ini</p>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="summary-grid grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <div className="summary-card income border border-gray-200 rounded-lg p-3 border-l-4 border-l-emerald-600">
                  <p className="summary-label text-[9px] text-gray-500 uppercase tracking-wide">Total Pemasukan</p>
                  <p className="summary-value income text-emerald-700 text-lg font-bold mt-1">{formatRupiah(totalIncome)}</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">{incomeItems.length} transaksi</p>
                </div>
                <div className="summary-card expense border border-gray-200 rounded-lg p-3 border-l-4 border-l-rose-600">
                  <p className="summary-label text-[9px] text-gray-500 uppercase tracking-wide">Total Pengeluaran</p>
                  <p className="summary-value expense text-rose-700 text-lg font-bold mt-1">{formatRupiah(totalExpense)}</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">{expenseItems.length} transaksi</p>
                </div>
                <div className="summary-card balance border border-gray-200 rounded-lg p-3 border-l-4 border-l-yellow-600">
                  <p className="summary-label text-[9px] text-gray-500 uppercase tracking-wide">Saldo</p>
                  <p className={`summary-value balance text-lg font-bold mt-1 ${balance >= 0 ? 'text-yellow-700' : 'text-red-700'}`}>{formatRupiah(balance)}</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">{balance >= 0 ? 'Surplus' : 'Defisit'}</p>
                </div>
              </div>

              {/* Income by Category */}
              {incomeByCategory.length > 0 && (
                <div className="mb-6">
                  <h3 className="section-title text-sm font-semibold text-purple-900 mb-2 pb-1 border-b border-purple-100 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    Rincian Pemasukan per Kategori
                  </h3>
                  <div className="overflow-x-auto -mx-2 px-2">
                  <table className="category-table w-full border-collapse min-w-[400px]">
                    <thead>
                      <tr>
                        <th className="bg-purple-50 px-3 py-2 text-left text-[9px] font-semibold text-purple-900 uppercase tracking-wide border-b-2 border-purple-300">Kategori</th>
                        <th className="bg-purple-50 px-3 py-2 text-center text-[9px] font-semibold text-purple-900 uppercase tracking-wide border-b-2 border-purple-300">Jumlah Transaksi</th>
                        <th className="bg-purple-50 px-3 py-2 text-right text-[9px] font-semibold text-purple-900 uppercase tracking-wide border-b-2 border-purple-300">Total</th>
                        <th className="bg-purple-50 px-3 py-2 text-right text-[9px] font-semibold text-purple-900 uppercase tracking-wide border-b-2 border-purple-300">% dari Pemasukan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {incomeByCategory.map((c, i) => (
                        <tr key={c.category} className={i % 2 === 0 ? '' : 'bg-gray-50/50'}>
                          <td className="px-3 py-1.5 border-b border-gray-100 text-sm">{c.label}</td>
                          <td className="px-3 py-1.5 border-b border-gray-100 text-sm text-center">{c.count}</td>
                          <td className="px-3 py-1.5 border-b border-gray-100 text-sm text-right font-medium text-emerald-700">{formatRupiah(c.total)}</td>
                          <td className="px-3 py-1.5 border-b border-gray-100 text-sm text-right text-gray-500">{totalIncome > 0 ? ((c.total / totalIncome) * 100).toFixed(1) : '0'}%</td>
                        </tr>
                      ))}
                      <tr className="total-row">
                        <td className="px-3 py-2 border-t-2 border-purple-300 bg-purple-50 font-bold text-sm">Total Pemasukan</td>
                        <td className="px-3 py-2 border-t-2 border-purple-300 bg-purple-50 font-bold text-sm text-center">{incomeItems.length}</td>
                        <td className="px-3 py-2 border-t-2 border-purple-300 bg-purple-50 font-bold text-sm text-right text-emerald-700">{formatRupiah(totalIncome)}</td>
                        <td className="px-3 py-2 border-t-2 border-purple-300 bg-purple-50 font-bold text-sm text-right">100%</td>
                      </tr>
                    </tbody>
                  </table>
                  </div>
                </div>
              )}

              {/* Expense by Category */}
              {expenseByCategory.length > 0 && (
                <div className="mb-6">
                  <h3 className="section-title text-sm font-semibold text-purple-900 mb-2 pb-1 border-b border-purple-100 flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-rose-600" />
                    Rincian Pengeluaran per Kategori
                  </h3>
                  <div className="overflow-x-auto -mx-2 px-2">
                  <table className="category-table w-full border-collapse min-w-[400px]">
                    <thead>
                      <tr>
                        <th className="bg-purple-50 px-3 py-2 text-left text-[9px] font-semibold text-purple-900 uppercase tracking-wide border-b-2 border-purple-300">Kategori</th>
                        <th className="bg-purple-50 px-3 py-2 text-center text-[9px] font-semibold text-purple-900 uppercase tracking-wide border-b-2 border-purple-300">Jumlah Transaksi</th>
                        <th className="bg-purple-50 px-3 py-2 text-right text-[9px] font-semibold text-purple-900 uppercase tracking-wide border-b-2 border-purple-300">Total</th>
                        <th className="bg-purple-50 px-3 py-2 text-right text-[9px] font-semibold text-purple-900 uppercase tracking-wide border-b-2 border-purple-300">% dari Pengeluaran</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenseByCategory.map((c, i) => (
                        <tr key={c.category} className={i % 2 === 0 ? '' : 'bg-gray-50/50'}>
                          <td className="px-3 py-1.5 border-b border-gray-100 text-sm">{c.label}</td>
                          <td className="px-3 py-1.5 border-b border-gray-100 text-sm text-center">{c.count}</td>
                          <td className="px-3 py-1.5 border-b border-gray-100 text-sm text-right font-medium text-rose-700">{formatRupiah(c.total)}</td>
                          <td className="px-3 py-1.5 border-b border-gray-100 text-sm text-right text-gray-500">{totalExpense > 0 ? ((c.total / totalExpense) * 100).toFixed(1) : '0'}%</td>
                        </tr>
                      ))}
                      <tr className="total-row">
                        <td className="px-3 py-2 border-t-2 border-purple-300 bg-purple-50 font-bold text-sm">Total Pengeluaran</td>
                        <td className="px-3 py-2 border-t-2 border-purple-300 bg-purple-50 font-bold text-sm text-center">{expenseItems.length}</td>
                        <td className="px-3 py-2 border-t-2 border-purple-300 bg-purple-50 font-bold text-sm text-right text-rose-700">{formatRupiah(totalExpense)}</td>
                        <td className="px-3 py-2 border-t-2 border-purple-300 bg-purple-50 font-bold text-sm text-right">100%</td>
                      </tr>
                    </tbody>
                  </table>
                  </div>
                </div>
              )}

              {/* Detail Transactions */}
              <div className="mb-6">
                <h3 className="section-title text-sm font-semibold text-purple-900 mb-2 pb-1 border-b border-purple-100 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  Detail Transaksi
                </h3>
                <div className="overflow-x-auto -mx-2 px-2">
                <table className="detail-table w-full border-collapse min-w-[500px]">
                  <thead>
                    <tr>
                      <th className="bg-gray-50 px-2 py-1.5 text-left text-[8px] font-semibold text-gray-600 uppercase tracking-wide border-b-2 border-gray-200">No</th>
                      <th className="bg-gray-50 px-2 py-1.5 text-left text-[8px] font-semibold text-gray-600 uppercase tracking-wide border-b-2 border-gray-200">Tanggal</th>
                      <th className="bg-gray-50 px-2 py-1.5 text-left text-[8px] font-semibold text-gray-600 uppercase tracking-wide border-b-2 border-gray-200">Tipe</th>
                      <th className="bg-gray-50 px-2 py-1.5 text-left text-[8px] font-semibold text-gray-600 uppercase tracking-wide border-b-2 border-gray-200">Kategori</th>
                      <th className="bg-gray-50 px-2 py-1.5 text-left text-[8px] font-semibold text-gray-600 uppercase tracking-wide border-b-2 border-gray-200">Deskripsi</th>
                      <th className="bg-gray-50 px-2 py-1.5 text-right text-[8px] font-semibold text-gray-600 uppercase tracking-wide border-b-2 border-gray-200">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedFinances.map((f, i) => (
                      <tr key={f.id} className={i % 2 === 0 ? '' : 'bg-gray-50/30'}>
                        <td className="px-2 py-1 border-b border-gray-50 text-[10px] text-gray-400">{i + 1}</td>
                        <td className="px-2 py-1 border-b border-gray-50 text-[10px] text-gray-600 whitespace-nowrap">{new Date(f.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td className="px-2 py-1 border-b border-gray-50">
                          <span className={`inline-block px-1.5 py-0 rounded text-[8px] font-medium ${f.type === 'PEMASUKAN' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            {f.type === 'PEMASUKAN' ? 'Masuk' : 'Keluar'}
                          </span>
                        </td>
                        <td className="px-2 py-1 border-b border-gray-50 text-[10px]">{CAT_LABELS[f.category] || f.category}</td>
                        <td className="px-2 py-1 border-b border-gray-50 text-[10px] text-gray-500 max-w-[150px] truncate">{f.description || '-'}</td>
                        <td className={`px-2 py-1 border-b border-gray-50 text-[10px] text-right font-medium ${f.type === 'PEMASUKAN' ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {f.type === 'PEMASUKAN' ? '+' : '-'}{formatRupiah(f.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>

              {/* Signature Area */}
              <div className="signature-area flex justify-end mt-8">
                <div className="signature-box text-center w-52">
                  <p className="text-[9px] text-gray-500">{districtName || 'Kecamatan ............'}, {printDate}</p>
                  <p className="text-[10px] font-medium text-gray-600 mt-1">Bendahara {churchName}</p>
                  <div className="mt-14 mb-0.5">
                    <p className="text-[10px] font-semibold text-gray-800">
                      {treasurerName || 'Bendahara Gereja'}
                    </p>
                  </div>
                  <div className="border-t border-gray-800" />
                </div>
              </div>

              <div className="footer flex justify-between mt-6 pt-3 border-t border-gray-200 text-[8px] text-gray-400">
                <span>{churchName} - Laporan Keuangan</span>
                <span>Halaman 1 dari 1</span>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
