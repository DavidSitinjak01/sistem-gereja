'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, ClipboardList, Users } from 'lucide-react';
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

interface Service {
  id: string;
  name: string;
  dayOfWeek: string | null;
  time: string | null;
}

interface Attendance {
  id: string;
  serviceId: string;
  date: string;
  memberCount: number;
  notes: string | null;
  service: Service;
}

const DAY_LABELS: Record<string, string> = { MINGGU: 'Minggu', SENIN: 'Senin', SELASA: 'Selasa', RABU: 'Rabu', KAMIS: 'Kamis', JUMAT: 'Jumat', SABTU: 'Sabtu' };

const emptyForm = { serviceId: '', date: '', memberCount: '', notes: '' };

export default function AttendanceView() {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceFilter, setServiceFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchServices = useCallback(async () => {
    try {
      const res = await fetch('/api/services');
      if (res.ok) setServices(await res.json());
    } catch { /* silent */ }
  }, []);

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (serviceFilter) params.set('serviceId', serviceFilter);
      if (dateFilter) params.set('date', dateFilter);
      const q = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`/api/attendance${q}`);
      if (!res.ok) throw new Error('Gagal memuat data');
      setAttendance(await res.json());
    } catch {
      toast.error('Gagal memuat data kehadiran');
    } finally {
      setLoading(false);
    }
  }, [serviceFilter, dateFilter]);

  useEffect(() => { fetchServices(); }, [fetchServices]);
  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, date: new Date().toISOString().split('T')[0] });
    setDialogOpen(true);
  };

  const openEdit = (a: Attendance) => {
    setEditingId(a.id);
    setForm({
      serviceId: a.serviceId,
      date: a.date ? a.date.split('T')[0] : '',
      memberCount: String(a.memberCount),
      notes: a.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.serviceId) { toast.error('Pilih ibadah terlebih dahulu'); return; }
    if (!form.date) { toast.error('Tanggal wajib diisi'); return; }
    if (!form.memberCount || Number(form.memberCount) < 0) { toast.error('Jumlah jemaat harus 0 atau lebih'); return; }
    try {
      setSaving(true);
      const body = {
        serviceId: form.serviceId,
        date: new Date(form.date).toISOString(),
        memberCount: Number(form.memberCount),
        notes: form.notes.trim() || null,
      };
      const res = editingId
        ? await fetch(`/api/attendance/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        : await fetch('/api/attendance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Gagal menyimpan'); }
      toast.success(editingId ? 'Kehadiran berhasil diperbarui' : 'Kehadiran berhasil dicatat');
      setDialogOpen(false);
      fetchAttendance();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus catatan kehadiran ini?')) return;
    try {
      const res = await fetch(`/api/attendance/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus');
      toast.success('Kehadiran berhasil dihapus');
      fetchAttendance();
    } catch {
      toast.error('Gagal menghapus kehadiran');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Kehadiran Ibadah</h2>
          <p className="text-sm text-gray-500">Catat kehadiran jemaat di setiap ibadah</p>
        </div>
        <Button onClick={openCreate} className="bg-purple-600 hover:bg-purple-700 text-white">
          <Plus className="h-4 w-4 mr-1" /> Catat Kehadiran
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select value={serviceFilter} onValueChange={(v) => setServiceFilter(v === 'SEMUA' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Semua Layanan" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="SEMUA">Semua Layanan</SelectItem>
                {services.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}{s.dayOfWeek ? ` (${DAY_LABELS[s.dayOfWeek] || s.dayOfWeek})` : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
            <Button variant="outline" onClick={() => { setServiceFilter(''); setDateFilter(''); }} className="text-sm">Reset Filter</Button>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <Card key={i}><CardContent className="p-4"><div className="animate-pulse h-14 bg-gray-200 rounded" /></CardContent></Card>)}</div>
      ) : attendance.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center">
            <ClipboardList className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 mb-1">Belum ada catatan kehadiran</p>
            <p className="text-sm text-gray-400">Klik &quot;Catat Kehadiran&quot; untuk memulai</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Card>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Layanan</TableHead>
                    <TableHead>Jumlah Jemaat</TableHead>
                    <TableHead>Catatan</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="text-gray-500">{new Date(a.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-purple-200 text-purple-800 bg-purple-50">
                          {a.service.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-purple-600" />
                          <span className="font-semibold">{a.memberCount}</span>
                          <span className="text-xs text-gray-400">jemaat</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-500 max-w-48 truncate">{a.notes || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </Card>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {attendance.map((a) => (
              <Card key={a.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="border-purple-200 text-purple-800 bg-purple-50">{a.service.name}</Badge>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="h-4 w-4 text-purple-600" />
                        <span className="font-bold text-lg">{a.memberCount}</span>
                        <span className="text-xs text-gray-400">jemaat</span>
                      </div>
                      <p className="text-xs text-gray-500">{new Date(a.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      {a.notes && <p className="text-xs text-gray-400 mt-1">{a.notes}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1 mt-3 pt-2 border-t">
                    <Button variant="ghost" size="sm" className="h-9" onClick={() => openEdit(a)}><Pencil className="h-3.5 w-3.5 mr-1" /> Edit</Button>
                    <Button variant="ghost" size="sm" className="h-9 text-red-600" onClick={() => handleDelete(a.id)}><Trash2 className="h-3.5 w-3.5 mr-1" /> Hapus</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Kehadiran' : 'Catat Kehadiran'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 flex-1 overflow-y-auto">
            <div>
              <Label>Layanan Ibadah <span className="text-red-500">*</span></Label>
              <Select value={form.serviceId} onValueChange={(v) => setForm({ ...form, serviceId: v })}>
                <SelectTrigger><SelectValue placeholder="Pilih ibadah" /></SelectTrigger>
                <SelectContent>
                  {services.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}{s.dayOfWeek ? ` (${DAY_LABELS[s.dayOfWeek]})` : ''}{s.time ? ` - ${s.time}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="adate">Tanggal <span className="text-red-500">*</span></Label>
              <Input id="adate" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="acount">Jumlah Jemaat <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input id="acount" type="number" min="0" value={form.memberCount} onChange={(e) => setForm({ ...form, memberCount: e.target.value })} className="pl-9" placeholder="0" />
              </div>
            </div>
            <div>
              <Label htmlFor="anotes">Catatan</Label>
              <Textarea id="anotes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Catatan tambahan..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-purple-600 hover:bg-purple-700 text-white">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
