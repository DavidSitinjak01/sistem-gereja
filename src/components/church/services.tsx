'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, CalendarClock, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface Service {
  id: string;
  name: string;
  dayOfWeek: string | null;
  time: string | null;
  description: string | null;
}

const DAYS = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
const DAY_ORDER: Record<string, number> = { MINGGU: 0, SENIN: 1, SELASA: 2, RABU: 3, KAMIS: 4, JUMAT: 5, SABTU: 6 };
const DAY_LABELS: Record<string, string> = { MINGGU: 'Minggu', SENIN: 'Senin', SELASA: 'Selasa', RABU: 'Rabu', KAMIS: 'Kamis', JUMAT: 'Jumat', SABTU: 'Sabtu' };

const emptyForm = { name: '', dayOfWeek: '', time: '', description: '' };

export default function ServicesView() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingName, setDeletingName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/services');
      if (!res.ok) throw new Error('Gagal memuat data');
      const data = await res.json();
      data.sort((a: Service, b: Service) => {
        const da = a.dayOfWeek ? (DAY_ORDER[a.dayOfWeek] ?? 7) : 8;
        const db = b.dayOfWeek ? (DAY_ORDER[b.dayOfWeek] ?? 7) : 8;
        if (da !== db) return da - db;
        return (a.time || '').localeCompare(b.time || '');
      });
      setServices(data);
    } catch {
      toast.error('Gagal memuat jadwal ibadah');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (s: Service) => {
    setEditingId(s.id);
    setForm({
      name: s.name,
      dayOfWeek: s.dayOfWeek || '',
      time: s.time || '',
      description: s.description || '',
    });
    setDialogOpen(true);
  };

  const confirmDelete = (s: Service) => {
    setDeletingId(s.id);
    setDeletingName(s.name);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Nama ibadah wajib diisi');
      return;
    }
    try {
      setSaving(true);
      const body = {
        name: form.name.trim(),
        dayOfWeek: form.dayOfWeek || null,
        time: form.time || null,
        description: form.description.trim() || null,
      };
      const res = editingId
        ? await fetch(`/api/services/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        : await fetch('/api/services', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menyimpan');
      }
      toast.success(editingId ? 'Ibadah berhasil diperbarui' : 'Ibadah berhasil ditambahkan');
      setDialogOpen(false);
      fetchServices();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      const res = await fetch(`/api/services/${deletingId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus');
      toast.success('Ibadah berhasil dihapus');
      setDeleteDialogOpen(false);
      fetchServices();
    } catch {
      toast.error('Gagal menghapus ibadah');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Jadwal Ibadah</h2>
          <p className="text-sm text-gray-500">Kelola jadwal ibadah gereja</p>
        </div>
        <Button onClick={openCreate} className="bg-purple-600 hover:bg-purple-700 text-white">
          <Plus className="h-4 w-4 mr-1" /> Tambah Ibadah
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}><CardContent className="p-5"><div className="animate-pulse space-y-3"><div className="h-5 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /></div></CardContent></Card>
          ))}
        </div>
      ) : services.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center">
            <CalendarClock className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 mb-1">Belum ada jadwal ibadah</p>
            <Button onClick={openCreate} variant="outline" className="mt-3 border-purple-300 text-purple-700">
              <Plus className="h-4 w-4 mr-1" /> Tambah Ibadah Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s) => (
            <Card key={s.id} className="hover:shadow-md transition-shadow group">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{s.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {s.dayOfWeek && (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                        <CalendarClock className="h-3 w-3 mr-1" />
                        {DAY_LABELS[s.dayOfWeek] || s.dayOfWeek}
                      </Badge>
                    </div>
                  )}
                  {s.time && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4 text-purple-600" />
                      {s.time} WIB
                    </div>
                  )}
                  {s.description && (
                    <p className="text-sm text-gray-500 line-clamp-2">{s.description}</p>
                  )}
                </div>
                <div className="flex gap-2 mt-4 pt-3 border-t sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(s)}><Pencil className="h-4 w-4 mr-1" /> Edit</Button>
                  <Button variant="ghost" size="sm" className="text-red-600" onClick={() => confirmDelete(s)}><Trash2 className="h-4 w-4 mr-1" /> Hapus</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Ibadah' : 'Tambah Ibadah'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 flex-1 overflow-y-auto">
            <div>
              <Label htmlFor="sname">Nama Ibadah <span className="text-red-500">*</span></Label>
              <Input id="sname" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ibadah Raya, Ibadah Pemuda..." />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Hari</Label>
                <Select value={form.dayOfWeek} onValueChange={(v) => setForm({ ...form, dayOfWeek: v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih hari" /></SelectTrigger>
                  <SelectContent>
                    {DAYS.map(d => <SelectItem key={d} value={d}>{DAY_LABELS[d]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="stime">Waktu</Label>
                <Input id="stime" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
              </div>
            </div>
            <div>
              <Label htmlFor="sdesc">Deskripsi</Label>
              <Textarea id="sdesc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Keterangan tambahan..." rows={2} />
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">Apakah Anda yakin ingin menghapus ibadah &quot;{deletingName}&quot;?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
