'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Pencil, Trash2, Users } from 'lucide-react';
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

interface Member {
  id: string;
  name: string;
  gender: string | null;
  occupation: string | null;
  address: string | null;
  maritalStatus: string | null;
  membershipStatus: string;
  createdAt: string;
}

const MARITAL_OPTIONS = [
  { value: 'MENIKAH', label: 'Menikah' },
  { value: 'BELUM MENIKAH', label: 'Belum Menikah' },
  { value: 'MUDA-MUDI', label: 'Muda-mudi' },
  { value: 'REMAJA', label: 'Remaja' },
  { value: 'SEKOLAH MINGGU', label: 'Sekolah Minggu' },
];

const MARITAL_LABEL: Record<string, string> = {
  'MENIKAH': 'Menikah',
  'BELUM MENIKAH': 'Belum Menikah',
  'MUDA-MUDI': 'Muda-mudi',
  'REMAJA': 'Remaja',
  'SEKOLAH MINGGU': 'Sekolah Minggu',
};

const emptyForm = {
  name: '',
  gender: '',
  occupation: '',
  address: '',
  maritalStatus: '',
  membershipStatus: 'AKTIF',
};

export default function MembersView() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const q = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await fetch(`/api/members${q}`);
      if (!res.ok) throw new Error('Gagal memuat data');
      setMembers(await res.json());
    } catch {
      toast.error('Gagal memuat data jemaat');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchMembers, 300);
    return () => clearTimeout(t);
  }, [fetchMembers]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setDialogOpen(true);
  };

  const openEdit = (m: Member) => {
    setEditingId(m.id);
    setForm({
      name: m.name,
      gender: m.gender || '',
      occupation: m.occupation || '',
      address: m.address || '',
      maritalStatus: m.maritalStatus || '',
      membershipStatus: m.membershipStatus,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Nama wajib diisi');
      return;
    }
    try {
      setSaving(true);
      const body = {
        ...form,
      };
      const res = editingId
        ? await fetch(`/api/members/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        : await fetch('/api/members', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menyimpan');
      }
      toast.success(editingId ? 'Jemaat berhasil diperbarui' : 'Jemaat berhasil ditambahkan');
      setDialogOpen(false);
      fetchMembers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus jemaat "${name}"?`)) return;
    try {
      const res = await fetch(`/api/members/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus');
      toast.success('Jemaat berhasil dihapus');
      fetchMembers();
    } catch {
      toast.error('Gagal menghapus jemaat');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manajemen Jemaat</h2>
          <p className="text-sm text-gray-500">Kelola data jemaat gereja</p>
        </div>
        <Button onClick={openCreate} className="bg-amber-600 hover:bg-amber-700 text-white">
          <Plus className="h-4 w-4 mr-1" /> Tambah Jemaat
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Cari jemaat..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}><CardContent className="p-5"><div className="animate-pulse space-y-3"><div className="h-5 bg-gray-200 rounded w-3/4" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-4 bg-gray-200 rounded w-2/3" /></div></CardContent></Card>
          ))}
        </div>
      ) : members.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center">
            <Users className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 mb-1">Belum ada data jemaat</p>
            <p className="text-sm text-gray-400">Klik &quot;Tambah Jemaat&quot; untuk memulai</p>
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
                    <TableHead>Nama</TableHead>
                    <TableHead>Jenis Kelamin</TableHead>
                    <TableHead>Pekerjaan</TableHead>
                    <TableHead>Alamat</TableHead>
                    <TableHead>Status Pernikahan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell>
                        {m.gender ? (
                          <Badge variant="outline" className={m.gender === 'LAKI-LAKI' ? 'border-sky-200 text-sky-700 bg-sky-50' : 'border-pink-200 text-pink-700 bg-pink-50'}>
                            {m.gender === 'LAKI-LAKI' ? 'L' : 'P'}
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-gray-600">{m.occupation || '-'}</TableCell>
                      <TableCell className="text-gray-600 max-w-[200px] truncate">{m.address || '-'}</TableCell>
                      <TableCell>
                        {m.maritalStatus ? (
                          <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50">
                            {MARITAL_LABEL[m.maritalStatus] || m.maritalStatus}
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={m.membershipStatus === 'AKTIF' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-red-100 text-red-700 hover:bg-red-100'}>
                          {m.membershipStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(m)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id, m.name)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {members.map((m) => (
              <Card key={m.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-semibold text-gray-900">{m.name}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {m.gender && (
                          <Badge variant="outline" className={m.gender === 'LAKI-LAKI' ? 'border-sky-200 text-sky-700 bg-sky-50 text-xs' : 'border-pink-200 text-pink-700 bg-pink-50 text-xs'}>
                            {m.gender === 'LAKI-LAKI' ? 'Laki-laki' : 'Perempuan'}
                          </Badge>
                        )}
                        {m.maritalStatus && (
                          <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50 text-xs">
                            {MARITAL_LABEL[m.maritalStatus] || m.maritalStatus}
                          </Badge>
                        )}
                      </div>
                      {m.occupation && <p className="text-sm text-gray-500">{m.occupation}</p>}
                      {m.address && <p className="text-sm text-gray-500">{m.address}</p>}
                    </div>
                    <Badge className={m.membershipStatus === 'AKTIF' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-red-100 text-red-700 hover:bg-red-100'}>
                      {m.membershipStatus}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-end mt-3 pt-3 border-t gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(m)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(m.id, m.name)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Jemaat' : 'Tambah Jemaat'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="name">Nama <span className="text-red-500">*</span></Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama lengkap" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="gender">Jenis Kelamin</Label>
                <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LAKI-LAKI">Laki-laki</SelectItem>
                    <SelectItem value="PEREMPUAN">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="occupation">Pekerjaan</Label>
                <Input id="occupation" value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} placeholder="Pekerjaan" />
              </div>
            </div>
            <div>
              <Label htmlFor="address">Alamat</Label>
              <Textarea id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Alamat lengkap" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="maritalStatus">Status Pernikahan</Label>
                <Select value={form.maritalStatus} onValueChange={(v) => setForm({ ...form, maritalStatus: v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                  <SelectContent>
                    {MARITAL_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="membershipStatus">Status</Label>
                <Select value={form.membershipStatus} onValueChange={(v) => setForm({ ...form, membershipStatus: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AKTIF">Aktif</SelectItem>
                    <SelectItem value="NON-AKTIF">Non-Aktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
