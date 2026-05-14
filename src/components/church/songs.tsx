'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Music, Search, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface Song {
  id: string;
  title: string;
  artist: string | null;
  category: string | null;
  lyrics: string | null;
  chord: string | null;
  songNumber: string | null;
  createdAt: string;
}

const CATEGORIES = ['PUJIAN', 'PENYEMBAHAN', 'NATAL', 'PASKAH', 'LAIN-LAIN'];
const CAT_LABELS: Record<string, string> = {
  PUJIAN: 'Pujian', PENYEMBAHAN: 'Penyembahan', NATAL: 'Natal', PASKAH: 'Paskah', 'LAIN-LAIN': 'Lain-lain',
};
const CAT_COLORS: Record<string, string> = {
  PUJIAN: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  PENYEMBAHAN: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
  NATAL: 'bg-red-100 text-red-800 hover:bg-red-100',
  PASKAH: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
  'LAIN-LAIN': 'bg-gray-100 text-gray-700 hover:bg-gray-100',
};

const emptyForm = { title: '', artist: '', category: '', lyrics: '', chord: '', songNumber: '' };

export default function SongsView() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [lyricsDialogOpen, setLyricsDialogOpen] = useState(false);
  const [viewingSong, setViewingSong] = useState<Song | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchSongs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (catFilter) params.set('category', catFilter);
      const q = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`/api/songs${q}`);
      if (!res.ok) throw new Error('Gagal memuat data');
      setSongs(await res.json());
    } catch {
      toast.error('Gagal memuat database lagu');
    } finally {
      setLoading(false);
    }
  }, [search, catFilter]);

  useEffect(() => {
    const t = setTimeout(fetchSongs, 300);
    return () => clearTimeout(t);
  }, [fetchSongs]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (s: Song) => {
    setEditingId(s.id);
    setForm({
      title: s.title,
      artist: s.artist || '',
      category: s.category || '',
      lyrics: s.lyrics || '',
      chord: s.chord || '',
      songNumber: s.songNumber || '',
    });
    setDialogOpen(true);
  };

  const viewLyrics = (s: Song) => {
    setViewingSong(s);
    setLyricsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Judul lagu wajib diisi'); return; }
    try {
      setSaving(true);
      const body = {
        title: form.title.trim(),
        artist: form.artist.trim() || null,
        category: form.category || null,
        lyrics: form.lyrics.trim() || null,
        chord: form.chord.trim() || null,
        songNumber: form.songNumber.trim() || null,
      };
      const res = editingId
        ? await fetch(`/api/songs/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        : await fetch('/api/songs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Gagal menyimpan'); }
      toast.success(editingId ? 'Lagu berhasil diperbarui' : 'Lagu berhasil ditambahkan');
      setDialogOpen(false);
      fetchSongs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus lagu "${title}"?`)) return;
    try {
      const res = await fetch(`/api/songs/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus');
      toast.success('Lagu berhasil dihapus');
      fetchSongs();
    } catch {
      toast.error('Gagal menghapus lagu');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Database Lagu</h2>
          <p className="text-sm text-gray-500">Kelola koleksi lagu gereja</p>
        </div>
        <Button onClick={openCreate} className="bg-amber-600 hover:bg-amber-700 text-white shrink-0">
          <Plus className="h-4 w-4 mr-1" /> Tambah Lagu
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Cari judul, artis, nomor lagu..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={catFilter || 'SEMUA'} onValueChange={(v) => setCatFilter(v === 'SEMUA' ? '' : v)}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Semua Kategori" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="SEMUA">Semua Kategori</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{CAT_LABELS[c]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i}><CardContent className="p-5"><div className="animate-pulse space-y-3"><div className="h-5 bg-gray-200 rounded w-3/4" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-4 bg-gray-200 rounded w-1/3" /></div></CardContent></Card>
          ))}
        </div>
      ) : songs.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center">
            <Music className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 mb-1">Belum ada lagu dalam database</p>
            <Button onClick={openCreate} variant="outline" className="mt-3 border-amber-300 text-amber-700">
              <Plus className="h-4 w-4 mr-1" /> Tambah Lagu Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-sm text-gray-400">{songs.length} lagu ditemukan</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {songs.map((song) => (
              <Card key={song.id} className="hover:shadow-md transition-shadow group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 truncate">{song.title}</h3>
                      {song.artist && <p className="text-sm text-gray-500 truncate">{song.artist}</p>}
                    </div>
                    {song.category && (
                      <Badge className={`${CAT_COLORS[song.category] || 'bg-gray-100 text-gray-700'} text-xs shrink-0`}>
                        {CAT_LABELS[song.category]}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                    {song.songNumber && (
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" /> No. {song.songNumber}
                      </span>
                    )}
                    {song.chord && (
                      <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-mono font-bold">
                        {song.chord}
                      </span>
                    )}
                  </div>

                  {song.lyrics && (
                    <p className="text-xs text-gray-400 line-clamp-2 mb-3 whitespace-pre-line">{song.lyrics}</p>
                  )}

                  <div className="flex gap-1 pt-3 border-t">
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => viewLyrics(song)}>
                      <BookOpen className="h-3.5 w-3.5 mr-1" /> Lirik
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7" onClick={() => openEdit(song)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-red-600" onClick={() => handleDelete(song.id, song.title)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Lagu' : 'Tambah Lagu'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="stitle">Judul Lagu <span className="text-red-500">*</span></Label>
              <Input id="stitle" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Judul lagu..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="sartist">Artis/Pencipta</Label>
                <Input id="sartist" value={form.artist} onChange={(e) => setForm({ ...form, artist: e.target.value })} placeholder="Nama pencipta" />
              </div>
              <div>
                <Label htmlFor="snum">Nomor Lagu</Label>
                <Input id="snum" value={form.songNumber} onChange={(e) => setForm({ ...form, songNumber: e.target.value })} placeholder="No. Buku Nyanyian" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Kategori</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{CAT_LABELS[c]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="schord">Kunci/Chord</Label>
                <Input id="schord" value={form.chord} onChange={(e) => setForm({ ...form, chord: e.target.value })} placeholder="C, D, G..." />
              </div>
            </div>
            <div>
              <Label htmlFor="slyrics">Lirik Lagu</Label>
              <Textarea id="slyrics" value={form.lyrics} onChange={(e) => setForm({ ...form, lyrics: e.target.value })} placeholder="Tulis lirik lagu di sini..." rows={8} className="font-mono text-sm" />
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

      {/* Lyrics Viewer Dialog */}
      <Dialog open={lyricsDialogOpen} onOpenChange={setLyricsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Music className="h-5 w-5 text-amber-600" />
              {viewingSong?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              {viewingSong?.category && (
                <Badge className={CAT_COLORS[viewingSong.category] || 'bg-gray-100 text-gray-700'}>
                  {CAT_LABELS[viewingSong.category]}
                </Badge>
              )}
              {viewingSong?.chord && (
                <Badge variant="outline" className="font-mono font-bold border-amber-300 text-amber-700">
                  Key: {viewingSong.chord}
                </Badge>
              )}
              {viewingSong?.songNumber && (
                <span className="text-xs text-gray-400">No. {viewingSong.songNumber}</span>
              )}
            </div>
            {viewingSong?.artist && <p className="text-sm text-gray-500">Pencipta: {viewingSong.artist}</p>}
            <div className="bg-gray-50 rounded-lg p-4 border">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                {viewingSong?.lyrics || 'Belum ada lirik'}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
