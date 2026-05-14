'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, CalendarDays, MapPin, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface ChurchEvent {
  id: string;
  title: string;
  description: string | null;
  date: string;
  location: string | null;
}

const emptyForm = { title: '', description: '', date: '', location: '' };

export default function EventsView() {
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming'>('upcoming');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const q = filter === 'upcoming' ? '?upcoming=true' : '';
      const res = await fetch(`/api/events${q}`);
      if (!res.ok) throw new Error('Gagal memuat data');
      setEvents(await res.json());
    } catch {
      toast.error('Gagal memuat acara');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (e: ChurchEvent) => {
    setEditingId(e.id);
    setForm({
      title: e.title,
      description: e.description || '',
      date: e.date ? new Date(e.date).toISOString().slice(0, 16) : '',
      location: e.location || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('Judul acara wajib diisi');
      return;
    }
    if (!form.date) {
      toast.error('Tanggal acara wajib diisi');
      return;
    }
    try {
      setSaving(true);
      const body = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        date: new Date(form.date).toISOString(),
        location: form.location.trim() || null,
      };
      const res = editingId
        ? await fetch(`/api/events/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        : await fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menyimpan');
      }
      toast.success(editingId ? 'Acara berhasil diperbarui' : 'Acara berhasil ditambahkan');
      setDialogOpen(false);
      fetchEvents();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus acara "${title}"?`)) return;
    try {
      const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus');
      toast.success('Acara berhasil dihapus');
      fetchEvents();
    } catch {
      toast.error('Gagal menghapus acara');
    }
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const isPast = (date: string) => mounted && new Date(date) < new Date();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Acara Gereja</h2>
          <p className="text-sm text-gray-500">Kelola acara dan kegiatan gereja</p>
        </div>
        <Button onClick={openCreate} className="bg-amber-600 hover:bg-amber-700 text-white">
          <Plus className="h-4 w-4 mr-1" /> Tambah Acara
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'upcoming' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('upcoming')}
          className={filter === 'upcoming' ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}
        >
          Akan Datang
        </Button>
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
          className={filter === 'all' ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}
        >
          Semua Acara
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}><CardContent className="p-5"><div className="animate-pulse space-y-3"><div className="h-5 bg-gray-200 rounded w-3/4" /><div className="h-4 bg-gray-200 rounded w-1/2" /></div></CardContent></Card>
          ))}
        </div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center">
            <CalendarDays className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 mb-1">Belum ada acara</p>
            <Button onClick={openCreate} variant="outline" className="mt-3 border-amber-300 text-amber-700">
              <Plus className="h-4 w-4 mr-1" /> Tambah Acara Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((ev) => {
            const past = isPast(ev.date);
            return (
              <Card key={ev.id} className={`hover:shadow-md transition-shadow ${past ? 'opacity-70' : ''}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="bg-amber-600 text-white rounded-lg px-2.5 py-1.5 text-center min-w-[52px]">
                      <div className="text-xs font-medium">{new Date(ev.date).toLocaleDateString('id-ID', { month: 'short' })}</div>
                      <div className="text-xl font-bold leading-tight">{new Date(ev.date).getDate()}</div>
                    </div>
                    <Badge className={past ? 'bg-gray-100 text-gray-600 hover:bg-gray-100' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'}>
                      {past ? 'Selesai' : 'Akan Datang'}
                    </Badge>
                  </div>

                  <h3 className={`font-semibold text-gray-900 mb-2 ${past ? 'line-through' : ''}`}>{ev.title}</h3>

                  <div className="space-y-1.5 text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-amber-600" />
                      {new Date(ev.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    {ev.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-amber-600" />
                        {ev.location}
                      </div>
                    )}
                    {ev.description && (
                      <p className="text-gray-400 line-clamp-2 mt-1">{ev.description}</p>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4 pt-3 border-t">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(ev)}><Pencil className="h-3.5 w-3.5 mr-1" /> Edit</Button>
                    <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(ev.id, ev.title)}><Trash2 className="h-3.5 w-3.5 mr-1" /> Hapus</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Acara' : 'Tambah Acara'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="etitle">Judul Acara <span className="text-red-500">*</span></Label>
              <Input id="etitle" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Nama acara..." />
            </div>
            <div>
              <Label htmlFor="edate">Tanggal & Waktu <span className="text-red-500">*</span></Label>
              <Input id="edate" type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="eloc">Lokasi</Label>
              <Input id="eloc" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Lokasi acara..." />
            </div>
            <div>
              <Label htmlFor="edesc">Deskripsi</Label>
              <Textarea id="edesc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Keterangan tambahan..." rows={3} />
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
