'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Music, Calendar, ChevronLeft, ChevronRight, MonitorUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import SongSlidePresenter, { type SlideSong } from '@/components/church/song-slide-presenter';

interface Song {
  id: string;
  title: string;
  artist: string | null;
  category: string | null;
  chord: string | null;
  songNumber: string | null;
  lyrics: string | null;
}

interface Service {
  id: string;
  name: string;
  dayOfWeek: string | null;
  time: string | null;
}

interface WeeklySong {
  id: string;
  songId: string;
  serviceId: string;
  weekDate: string;
  order: number;
  note: string | null;
  song: Song;
  service: Service;
}

const CAT_LABELS: Record<string, string> = {
  PUJIAN: 'Pujian', PENYEMBAHAN: 'Penyembahan', NATAL: 'Natal', PASKAH: 'Paskah', 'LAIN-LAIN': 'Lain-lain',
};
const CAT_COLORS: Record<string, string> = {
  PUJIAN: 'bg-amber-100 text-amber-800', PENYEMBAHAN: 'bg-purple-100 text-purple-800',
  NATAL: 'bg-red-100 text-red-800', PASKAH: 'bg-emerald-100 text-emerald-800', 'LAIN-LAIN': 'bg-gray-100 text-gray-700',
};
const NOTE_LABELS: Record<string, string> = {
  PEMBUKA: 'Pembuka', PERSEMBAHAN: 'Persembahan', PENYEMBAHAN: 'Penyembahan', PENGUTUSAN: 'Pengutusan', PENUTUP: 'Penutup',
};
const NOTE_COLORS: Record<string, string> = {
  PEMBUKA: 'bg-sky-100 text-sky-800', PERSEMBAHAN: 'bg-amber-100 text-amber-800',
  PENYEMBAHAN: 'bg-purple-100 text-purple-800', PENGUTUSAN: 'bg-emerald-100 text-emerald-800', PENUTUP: 'bg-rose-100 text-rose-800',
};

const NOTE_OPTIONS = ['PEMBUKA', 'PERSEMBAHAN', 'PENYEMBAHAN', 'PENGUTUSAN', 'PENUTUP'];

function getWeekSunday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

function formatWeekRange(sunday: Date): string {
  const saturday = new Date(sunday);
  saturday.setDate(saturday.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
  return `${sunday.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })} - ${saturday.toLocaleDateString('id-ID', opts)}`;
}

export default function WeeklySongsView() {
  const [weeklySongs, setWeeklySongs] = useState<WeeklySong[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSunday, setSelectedSunday] = useState<Date>(getWeekSunday(new Date()));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ songId: '', serviceId: '', order: '1', note: '' });
  const [saving, setSaving] = useState(false);

  // Slide mode state
  const [slideMode, setSlideMode] = useState(false);
  const [slideSongs, setSlideSongs] = useState<SlideSong[]>([]);
  const [slideInitialIndex, setSlideInitialIndex] = useState(0);

  const sundayStr = selectedSunday.toISOString().split('T')[0];

  const fetchWeeklySongs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/weekly-songs?weekDate=${sundayStr}`);
      if (!res.ok) throw new Error('Gagal memuat data');
      setWeeklySongs(await res.json());
    } catch {
      toast.error('Gagal memuat lagu mingguan');
    } finally {
      setLoading(false);
    }
  }, [sundayStr]);

  const fetchSongs = useCallback(async () => {
    try {
      const res = await fetch('/api/songs');
      if (res.ok) setSongs(await res.json());
    } catch { /* silent */ }
  }, []);

  const fetchServices = useCallback(async () => {
    try {
      const res = await fetch('/api/services');
      if (res.ok) setServices(await res.json());
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchSongs(); fetchServices(); }, [fetchSongs, fetchServices]);
  useEffect(() => { fetchWeeklySongs(); }, [fetchWeeklySongs]);

  const prevWeek = () => {
    const prev = new Date(selectedSunday);
    prev.setDate(prev.getDate() - 7);
    setSelectedSunday(prev);
  };

  const nextWeek = () => {
    const next = new Date(selectedSunday);
    next.setDate(next.getDate() + 7);
    setSelectedSunday(next);
  };

  const thisWeek = () => setSelectedSunday(getWeekSunday(new Date()));

  const openCreate = () => {
    setForm({ songId: '', serviceId: services[0]?.id || '', order: '1', note: '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.songId) { toast.error('Pilih lagu terlebih dahulu'); return; }
    if (!form.serviceId) { toast.error('Pilih ibadah terlebih dahulu'); return; }
    try {
      setSaving(true);
      const body = {
        songId: form.songId,
        serviceId: form.serviceId,
        weekDate: new Date(selectedSunday).toISOString(),
        order: Number(form.order) || 1,
        note: form.note || null,
      };
      const res = await fetch('/api/weekly-songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Gagal menyimpan'); }
      toast.success('Lagu berhasil ditambahkan ke jadwal mingguan');
      setDialogOpen(false);
      fetchWeeklySongs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus lagu dari jadwal minggu ini?')) return;
    try {
      const res = await fetch(`/api/weekly-songs/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus');
      toast.success('Lagu dihapus dari jadwal');
      fetchWeeklySongs();
    } catch {
      toast.error('Gagal menghapus lagu');
    }
  };

  // Start slide presentation for a specific service
  const openSlideForService = (serviceItems: WeeklySong[]) => {
    const slideList: SlideSong[] = serviceItems
      .sort((a, b) => a.order - b.order)
      .map(ws => ({
        id: ws.song.id,
        title: ws.song.title,
        artist: ws.song.artist,
        category: ws.song.category,
        chord: ws.song.chord,
        songNumber: ws.song.songNumber,
        lyrics: ws.song.lyrics,
        note: ws.note,
      }));

    if (slideList.length === 0) {
      toast.error('Tidak ada lagu untuk ditampilkan');
      return;
    }

    const withLyrics = slideList.filter(s => s.lyrics && s.lyrics.trim());
    if (withLyrics.length === 0) {
      toast.error('Tidak ada lagu yang memiliki lirik');
      return;
    }

    setSlideSongs(withLyrics);
    setSlideInitialIndex(0);
    setSlideMode(true);
  };

  // Start slide presentation for a specific song within the service
  const openSlideForSong = (ws: WeeklySong, allServiceItems: WeeklySong[]) => {
    const slideList: SlideSong[] = allServiceItems
      .sort((a, b) => a.order - b.order)
      .map(item => ({
        id: item.song.id,
        title: item.song.title,
        artist: item.song.artist,
        category: item.song.category,
        chord: item.song.chord,
        songNumber: item.song.songNumber,
        lyrics: item.song.lyrics,
        note: item.note,
      }));

    const withLyrics = slideList.filter(s => s.lyrics && s.lyrics.trim());
    if (withLyrics.length === 0) {
      toast.error('Lagu ini belum memiliki lirik');
      return;
    }

    const idx = withLyrics.findIndex(s => s.id === ws.song.id);
    setSlideSongs(withLyrics);
    setSlideInitialIndex(idx >= 0 ? idx : 0);
    setSlideMode(true);
  };

  // Start slide for ALL songs across all services this week
  const openSlideForAll = () => {
    const slideList: SlideSong[] = weeklySongs
      .sort((a, b) => a.order - b.order)
      .map(ws => ({
        id: ws.song.id,
        title: ws.song.title,
        artist: ws.song.artist,
        category: ws.song.category,
        chord: ws.song.chord,
        songNumber: ws.song.songNumber,
        lyrics: ws.song.lyrics,
        note: ws.note,
      }));

    const withLyrics = slideList.filter(s => s.lyrics && s.lyrics.trim());
    if (withLyrics.length === 0) {
      toast.error('Tidak ada lagu yang memiliki lirik');
      return;
    }

    setSlideSongs(withLyrics);
    setSlideInitialIndex(0);
    setSlideMode(true);
  };

  // Group by service
  const grouped = weeklySongs.reduce<Record<string, WeeklySong[]>>((acc, ws) => {
    const key = ws.serviceId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(ws);
    return acc;
  }, {});

  const isCurrentWeek = sundayStr === getWeekSunday(new Date()).toISOString().split('T')[0];

  // Slide mode rendering
  if (slideMode) {
    return (
      <SongSlidePresenter
        songs={slideSongs}
        initialSongIndex={slideInitialIndex}
        onClose={() => setSlideMode(false)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Lagu Minggu Ini</h2>
          <p className="text-sm text-gray-500">Atur lagu untuk setiap ibadah mingguan</p>
        </div>
        <div className="flex items-center gap-2">
          {weeklySongs.length > 0 && (
            <Button onClick={openSlideForAll} variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50 shrink-0">
              <MonitorUp className="h-4 w-4 mr-1" /> Presentasi Semua
            </Button>
          )}
          <Button onClick={openCreate} className="bg-amber-600 hover:bg-amber-700 text-white shrink-0">
            <Plus className="h-4 w-4 mr-1" /> Tambah Lagu
          </Button>
        </div>
      </div>

      {/* Week Navigator */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" size="icon" onClick={prevWeek} className="h-9 w-9 shrink-0">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center flex-1">
              <div className="flex items-center justify-center gap-2">
                <Calendar className="h-5 w-5 text-amber-600" />
                <span className="font-semibold text-gray-900">{formatWeekRange(selectedSunday)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Minggu, {selectedSunday.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {!isCurrentWeek && (
                <Button variant="outline" size="sm" onClick={thisWeek} className="text-xs h-9 mr-1">
                  Minggu Ini
                </Button>
              )}
              <Button variant="outline" size="icon" onClick={nextWeek} className="h-9 w-9">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <Card key={i}><CardContent className="p-5"><div className="animate-pulse space-y-3"><div className="h-5 bg-gray-200 rounded w-1/3" /><div className="h-10 bg-gray-200 rounded" /><div className="h-10 bg-gray-200 rounded" /></div></CardContent></Card>
          ))}
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center">
            <Music className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 mb-1">Belum ada lagu untuk minggu ini</p>
            <p className="text-sm text-gray-400 mb-4">Tambahkan lagu ke jadwal ibadah mingguan</p>
            <Button onClick={openCreate} variant="outline" className="border-amber-300 text-amber-700">
              <Plus className="h-4 w-4 mr-1" /> Tambah Lagu
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([serviceId, items]) => {
            const service = items[0]?.service;
            const sortedItems = [...items].sort((a, b) => a.order - b.order);
            return (
              <Card key={serviceId} className="overflow-hidden">
                <CardHeader className="pb-2 bg-gradient-to-r from-amber-50 to-amber-100/50 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-amber-600" />
                      {service?.name || 'Ibadah'}
                      {service?.dayOfWeek && <span className="text-xs text-gray-500 font-normal">({service.dayOfWeek})</span>}
                      {service?.time && <span className="text-xs text-gray-500 font-normal">• {service.time} WIB</span>}
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-100 shrink-0"
                      onClick={() => openSlideForService(sortedItems)}
                    >
                      <MonitorUp className="h-3.5 w-3.5 mr-1" /> Presentasi
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {sortedItems.map((ws, idx) => (
                      <div key={ws.id} className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors group">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-amber-700">{ws.order || idx + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-gray-900">{ws.song.title}</span>
                            {ws.song.chord && (
                              <span className="text-xs bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-mono font-bold">{ws.song.chord}</span>
                            )}
                            {ws.song.songNumber && (
                              <span className="text-xs text-gray-400">No. {ws.song.songNumber}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {ws.note && (
                              <Badge className={`${NOTE_COLORS[ws.note] || 'bg-gray-100 text-gray-700'} text-[10px] px-1.5 py-0`}>
                                {NOTE_LABELS[ws.note] || ws.note}
                              </Badge>
                            )}
                            {ws.song.artist && <span className="text-xs text-gray-400">{ws.song.artist}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                            onClick={() => openSlideForSong(ws, sortedItems)}
                            title="Tampilkan slide lagu ini"
                          >
                            <MonitorUp className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600" onClick={() => handleDelete(ws.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Song Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Lagu Minggu Ini</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Pilih Lagu <span className="text-red-500">*</span></Label>
              <Select value={form.songId} onValueChange={(v) => setForm({ ...form, songId: v })}>
                <SelectTrigger><SelectValue placeholder="Cari dan pilih lagu..." /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {songs.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.title}{s.songNumber ? ` (No. ${s.songNumber})` : ''}{s.chord ? ` [${s.chord}]` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {songs.length === 0 && <p className="text-xs text-gray-400 mt-1">Belum ada lagu di database. Tambahkan lagu terlebih dahulu.</p>}
            </div>
            <div>
              <Label>Ibadah <span className="text-red-500">*</span></Label>
              <Select value={form.serviceId} onValueChange={(v) => setForm({ ...form, serviceId: v })}>
                <SelectTrigger><SelectValue placeholder="Pilih ibadah" /></SelectTrigger>
                <SelectContent>
                  {services.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}{s.dayOfWeek ? ` (${s.dayOfWeek})` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="wsorder">Urutan</Label>
                <Input id="wsorder" type="number" min="1" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
              </div>
              <div>
                <Label>Keterangan</Label>
                <Select value={form.note} onValueChange={(v) => setForm({ ...form, note: v })}>
                  <SelectTrigger><SelectValue placeholder="Opsional" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none_">Tanpa keterangan</SelectItem>
                    {NOTE_OPTIONS.map(n => <SelectItem key={n} value={n}>{NOTE_LABELS[n]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-amber-600 hover:bg-amber-700 text-white">
              {saving ? 'Menyimpan...' : 'Tambah Lagu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
