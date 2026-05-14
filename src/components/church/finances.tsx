'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, DollarSign, TrendingUp, TrendingDown, Filter, RotateCcw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface Finance {
  id: string;
  type: string;
  category: string;
  amount: number;
  description: string | null;
  date: string;
}

const INCOME_CATS = ['PERSEPULUHAN', 'PERSEMBAHAN', 'DONASI', 'LAIN-LAIN'];
const EXPENSE_CATS = ['OPERASIONAL', 'RENOVASI', 'GAJI', 'KEGIATAN', 'LAIN-LAIN'];
const CAT_LABELS: Record<string, string> = {
  PERSEPULUHAN: 'Persepuluhan', PERSEMBAHAN: 'Persembahan', DONASI: 'Donasi', 'LAIN-LAIN': 'Lain-lain',
  OPERASIONAL: 'Operasional', RENOVASI: 'Renovasi', GAJI: 'Gaji', KEGIATAN: 'Kegiatan',
};

const formatRupiah = (n: number) => 'Rp ' + n.toLocaleString('id-ID');

const emptyForm = { type: 'PEMASUKAN', category: '', amount: '', date: '', description: '' };

export default function FinancesView() {
  const [finances, setFinances] = useState<Finance[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchFinances = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter) params.set('type', typeFilter);
      if (catFilter) params.set('category', catFilter);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const q = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`/api/finances${q}`);
      if (!res.ok) throw new Error('Gagal memuat data');
      setFinances(await res.json());
    } catch {
      toast.error('Gagal memuat data keuangan');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, catFilter, startDate, endDate]);

  useEffect(() => { fetchFinances(); }, [fetchFinances]);

  const totalIncome = finances.filter(f => f.type === 'PEMASUKAN').reduce((s, f) => s + f.amount, 0);
  const totalExpense = finances.filter(f => f.type === 'PENGELUARAN').reduce((s, f) => s + f.amount, 0);
  const balance = totalIncome - totalExpense;
  const hasActiveFilters = typeFilter || catFilter || startDate || endDate;

  const resetFilters = () => {
    setTypeFilter('');
    setCatFilter('');
    setStartDate('');
    setEndDate('');
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, category: '', date: new Date().toISOString().split('T')[0] });
    setDialogOpen(true);
  };

  const openEdit = (f: Finance) => {
    setEditingId(f.id);
    setForm({
      type: f.type,
      category: f.category,
      amount: String(f.amount),
      date: f.date ? f.date.split('T')[0] : '',
      description: f.description || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.category) { toast.error('Kategori wajib dipilih'); return; }
    if (!form.amount || Number(form.amount) <= 0) { toast.error('Jumlah harus lebih dari 0'); return; }
    if (!form.date) { toast.error('Tanggal wajib diisi'); return; }
    try {
      setSaving(true);
      const body = {
        type: form.type,
        category: form.category,
        amount: Number(form.amount),
        date: new Date(form.date).toISOString(),
        description: form.description.trim() || null,
      };
      const res = editingId
        ? await fetch(`/api/finances/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        : await fetch('/api/finances', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Gagal menyimpan'); }
      toast.success(editingId ? 'Transaksi berhasil diperbarui' : 'Transaksi berhasil ditambahkan');
      setDialogOpen(false);
      fetchFinances();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus transaksi ini?')) return;
    try {
      const res = await fetch(`/api/finances/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus');
      toast.success('Transaksi berhasil dihapus');
      fetchFinances();
    } catch {
      toast.error('Gagal menghapus transaksi');
    }
  };

  const categories = form.type === 'PEMASUKAN' ? INCOME_CATS : EXPENSE_CATS;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Keuangan Gereja</h2>
          <p className="text-sm text-gray-500">Kelola pemasukan dan pengeluaran</p>
        </div>
        <Button onClick={openCreate} className="bg-amber-600 hover:bg-amber-700 text-white shrink-0">
          <Plus className="h-4 w-4 mr-1" /> Tambah Transaksi
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm text-gray-500">Total Pemasukan</p>
                <p className="text-lg sm:text-xl font-bold text-emerald-700 truncate">{formatRupiah(totalIncome)}</p>
              </div>
              <TrendingUp className="h-7 w-7 sm:h-8 sm:w-8 text-emerald-400 shrink-0" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-rose-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm text-gray-500">Total Pengeluaran</p>
                <p className="text-lg sm:text-xl font-bold text-rose-700 truncate">{formatRupiah(totalExpense)}</p>
              </div>
              <TrendingDown className="h-7 w-7 sm:h-8 sm:w-8 text-rose-400 shrink-0" />
            </div>
          </CardContent>
        </Card>
        <Card className={`border-l-4 ${balance >= 0 ? 'border-l-amber-500' : 'border-l-red-500'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm text-gray-500">Saldo</p>
                <p className={`text-lg sm:text-xl font-bold truncate ${balance >= 0 ? 'text-amber-700' : 'text-red-700'}`}>{formatRupiah(balance)}</p>
              </div>
              <DollarSign className={`h-7 w-7 sm:h-8 sm:w-8 shrink-0 ${balance >= 0 ? 'text-amber-400' : 'text-red-400'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-600">Filter</span>
              {hasActiveFilters && (
                <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 bg-amber-50">
                  Aktif
                </Badge>
              )}
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 text-xs text-gray-500 hover:text-gray-700">
                <RotateCcw className="h-3 w-3 mr-1" /> Reset
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select value={typeFilter || 'SEMUA'} onValueChange={(v) => { setTypeFilter(v === 'SEMUA' ? '' : v); setCatFilter(''); }}>
              <SelectTrigger><SelectValue placeholder="Semua Tipe" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="SEMUA">Semua Tipe</SelectItem>
                <SelectItem value="PEMASUKAN">Pemasukan</SelectItem>
                <SelectItem value="PENGELUARAN">Pengeluaran</SelectItem>
              </SelectContent>
            </Select>
            <Select value={catFilter || 'SEMUA'} onValueChange={(v) => setCatFilter(v === 'SEMUA' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Semua Kategori" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="SEMUA">Semua Kategori</SelectItem>
                {(typeFilter === 'PEMASUKAN' ? INCOME_CATS : typeFilter === 'PENGELUARAN' ? EXPENSE_CATS : [...INCOME_CATS, ...EXPENSE_CATS]).map(c => (
                  <SelectItem key={c} value={c}>{CAT_LABELS[c] || c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="flex-1" />
              <span className="text-gray-400 text-xs shrink-0">s/d</span>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="flex-1" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      {!loading && finances.length > 0 && (
        <p className="text-sm text-gray-400">{finances.length} transaksi ditemukan</p>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <Card key={i}><CardContent className="p-4"><div className="animate-pulse h-12 bg-gray-200 rounded" /></CardContent></Card>)}</div>
      ) : finances.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center">
            <DollarSign className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 mb-1">Belum ada transaksi</p>
            <p className="text-sm text-gray-400">Klik &quot;Tambah Transaksi&quot; untuk memulai</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {finances.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="text-gray-500 whitespace-nowrap">{new Date(f.date).toLocaleDateString('id-ID')}</TableCell>
                      <TableCell>
                        <Badge className={f.type === 'PEMASUKAN' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-rose-100 text-rose-700 hover:bg-rose-100'}>
                          {f.type === 'PEMASUKAN' ? '↑ Masuk' : '↓ Keluar'}
                        </Badge>
                      </TableCell>
                      <TableCell>{CAT_LABELS[f.category] || f.category}</TableCell>
                      <TableCell className="text-gray-500 max-w-48 truncate">{f.description || '-'}</TableCell>
                      <TableCell className={`text-right font-semibold whitespace-nowrap ${f.type === 'PEMASUKAN' ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {f.type === 'PEMASUKAN' ? '+' : '-'}{formatRupiah(f.amount)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(f)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(f.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {finances.map((f) => (
              <Card key={f.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge className={f.type === 'PEMASUKAN' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-rose-100 text-rose-700 hover:bg-rose-100'}>
                          {f.type === 'PEMASUKAN' ? '↑ Masuk' : '↓ Keluar'}
                        </Badge>
                        <span className="text-xs text-gray-400">{CAT_LABELS[f.category]}</span>
                      </div>
                      <p className={`font-bold ${f.type === 'PEMASUKAN' ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {f.type === 'PEMASUKAN' ? '+' : '-'}{formatRupiah(f.amount)}
                      </p>
                      {f.description && <p className="text-xs text-gray-500 mt-1 truncate">{f.description}</p>}
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(f.date).toLocaleDateString('id-ID')}</span>
                  </div>
                  <div className="flex gap-1 mt-3 pt-2 border-t">
                    <Button variant="ghost" size="sm" className="h-7" onClick={() => openEdit(f)}><Pencil className="h-3.5 w-3.5 mr-1" /> Edit</Button>
                    <Button variant="ghost" size="sm" className="h-7 text-red-600" onClick={() => handleDelete(f.id)}><Trash2 className="h-3.5 w-3.5 mr-1" /> Hapus</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Transaksi' : 'Tambah Transaksi'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Tipe Transaksi <span className="text-red-500">*</span></Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v, category: '' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PEMASUKAN">Pemasukan</SelectItem>
                  <SelectItem value="PENGELUARAN">Pengeluaran</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Kategori <span className="text-red-500">*</span></Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c}>{CAT_LABELS[c] || c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="famount">Jumlah (Rp) <span className="text-red-500">*</span></Label>
              <Input id="famount" type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" />
            </div>
            <div>
              <Label htmlFor="fdate">Tanggal <span className="text-red-500">*</span></Label>
              <Input id="fdate" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="fdesc">Deskripsi</Label>
              <Textarea id="fdesc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Keterangan..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-amber-600 hover:bg-amber-700 text-white">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
