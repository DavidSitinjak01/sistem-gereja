'use client';

import { useEffect, useState } from 'react';
import { UserPlus, Pencil, Trash2, Loader2, Shield, Users, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ROLE_LABELS, ROLE_DESCRIPTIONS, type UserRole } from '@/lib/permissions';
import { useAuthStore } from '@/store/auth';

interface UserRow {
  id: string;
  name: string;
  username: string;
  role: string;
  servantNo: number | null;
  active: boolean;
  createdAt: string;
}

const ROLE_OPTIONS: UserRole[] = ['ADMIN', 'BENDAHARA', 'PELAYAN', 'SEKRETARIS', 'PENDETA'];

const emptyForm = {
  name: '',
  username: '',
  password: '',
  role: 'PELAYAN' as UserRole,
  servantNo: '' as string,
};

export default function UserManagement() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users', {
        headers: { 'x-user-role': currentUser?.role || '' },
      });
      if (!res.ok) throw new Error('Gagal memuat data');
      const data = await res.json();
      setUsers(data);
    } catch {
      toast.error('Gagal memuat data pengguna');
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setShowPassword(false);
    setDialogOpen(true);
  };

  const openEditDialog = (user: UserRow) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      username: user.username,
      password: '',
      role: user.role as UserRole,
      servantNo: user.servantNo?.toString() || '',
    });
    setShowPassword(false);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.username.trim()) {
      toast.error('Nama dan username wajib diisi');
      return;
    }

    if (!editingUser && !form.password.trim()) {
      toast.error('Password wajib diisi untuk pengguna baru');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch('/api/users', {
        method: editingUser ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role || '',
        },
        body: JSON.stringify(
          editingUser
            ? {
                id: editingUser.id,
                name: form.name.trim(),
                username: form.username.trim().toLowerCase(),
                password: form.password || undefined,
                role: form.role,
                servantNo: form.role === 'PELAYAN' ? (form.servantNo ? parseInt(form.servantNo) : null) : null,
              }
            : {
                name: form.name.trim(),
                username: form.username.trim().toLowerCase(),
                password: form.password,
                role: form.role,
                servantNo: form.role === 'PELAYAN' ? (form.servantNo ? parseInt(form.servantNo) : null) : null,
              }
        ),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Gagal menyimpan');
        return;
      }

      toast.success(editingUser ? 'Pengguna berhasil diperbarui' : 'Pengguna berhasil dibuat');
      setDialogOpen(false);
      fetchUsers();
    } catch {
      toast.error('Gagal menyimpan pengguna');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (user: UserRow) => {
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role || '',
        },
        body: JSON.stringify({
          id: user.id,
          active: !user.active,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Gagal mengubah status');
        return;
      }
      toast.success(user.active ? 'Pengguna dinonaktifkan' : 'Pengguna diaktifkan');
      fetchUsers();
    } catch {
      toast.error('Gagal mengubah status pengguna');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/users?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-user-role': currentUser?.role || '' },
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Gagal menghapus');
        return;
      }
      toast.success('Pengguna berhasil dihapus');
      setDeleteConfirm(null);
      fetchUsers();
    } catch {
      toast.error('Gagal menghapus pengguna');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-700 border-red-200';
      case 'BENDAHARA': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'PELAYAN': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'SEKRETARIS': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'PENDETA': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manajemen Pengguna</h2>
          <p className="text-sm text-gray-500">Kelola pengguna dan hak akses</p>
        </div>
        <Button onClick={openCreateDialog} className="bg-amber-600 hover:bg-amber-700 text-white">
          <UserPlus className="h-4 w-4 mr-2" /> Tambah Pengguna
        </Button>
      </div>

      {/* Role Info */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
              <Shield className="h-4 w-4 text-amber-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-900">Tingkat Akses Pengguna</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {ROLE_OPTIONS.map((role) => (
                  <div key={role} className="flex items-start gap-2">
                    <Badge variant="outline" className={cn('text-[10px] shrink-0', getRoleBadgeColor(role))}>
                      {ROLE_LABELS[role]}
                    </Badge>
                    <p className="text-[11px] text-amber-700">{ROLE_DESCRIPTIONS[role]}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-600" />
            Daftar Pengguna ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Belum ada pengguna</p>
          ) : (
            <div className="space-y-2">
              {users.map((u) => (
                <div
                  key={u.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${u.active ? 'bg-white' : 'bg-gray-50 opacity-60'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-amber-700">{u.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">{u.name}</p>
                        {!u.active && (
                          <Badge variant="outline" className="text-[9px] bg-gray-100 text-gray-500 border-gray-200">Nonaktif</Badge>
                        )}
                        {u.id === currentUser?.id && (
                          <Badge variant="outline" className="text-[9px] bg-blue-50 text-blue-600 border-blue-200">Anda</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">@{u.username}</span>
                        <Badge variant="outline" className={cn('text-[9px]', getRoleBadgeColor(u.role))}>
                          {u.role === 'PELAYAN' && u.servantNo ? `Pelayan ${u.servantNo}` : ROLE_LABELS[u.role as UserRole]}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleToggleActive(u)}
                      title={u.active ? 'Nonaktifkan' : 'Aktifkan'}
                    >
                      {u.active ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(u)}
                    >
                      <Pencil className="h-4 w-4 text-gray-500" />
                    </Button>
                    {u.id !== currentUser?.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700"
                        onClick={() => setDeleteConfirm(u.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Nama <span className="text-red-500">*</span></Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nama lengkap"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Username <span className="text-red-500">*</span></Label>
              <Input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="Username untuk login"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-sm font-medium">
                Password {editingUser ? '(kosongkan jika tidak diubah)' : <span className="text-red-500">*</span>}
              </Label>
              <div className="relative mt-1.5">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={editingUser ? 'Kosongkan jika tidak diubah' : 'Minimal 6 karakter'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Role <span className="text-red-500">*</span></Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as UserRole, servantNo: v !== 'PELAYAN' ? '' : form.servantNo })}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((role) => (
                    <SelectItem key={role} value={role}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn('text-[9px]', getRoleBadgeColor(role))}>
                          {ROLE_LABELS[role]}
                        </Badge>
                        <span className="text-xs text-gray-500">— {ROLE_DESCRIPTIONS[role]}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {form.role === 'PELAYAN' && (
              <div>
                <Label className="text-sm font-medium">Nomor Pelayan</Label>
                <Input
                  type="number"
                  value={form.servantNo}
                  onChange={(e) => setForm({ ...form, servantNo: e.target.value })}
                  placeholder="Contoh: 1, 2, 3"
                  className="mt-1.5"
                  min={1}
                />
                <p className="text-[11px] text-gray-400 mt-1">Opsional — untuk menandai Pelayan 1, Pelayan 2, dst.</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-amber-600 hover:bg-amber-700 text-white">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {editingUser ? 'Simpan Perubahan' : 'Buat Pengguna'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Pengguna</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">Apakah Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Batal</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}
