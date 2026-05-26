'use client';

import { useEffect, useState, useRef } from 'react';
import { Settings, Church, MapPin, User, BookOpen, Save, Loader2, Upload, Trash2, ImagePlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

const UserManagement = dynamic(() => import('@/components/church/user-management'), { ssr: false });

interface ChurchSettings {
  id: string;
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

const emptyForm = {
  churchName: 'Gereja',
  province: '',
  regency: '',
  district: '',
  village: '',
  pastor: '',
  treasurer: '',
  secretary: '',
};

export default function SettingsView() {
  const [settings, setSettings] = useState<ChurchSettings | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoData, setLogoData] = useState<string | null>(null);
  const [logoRemoved, setLogoRemoved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings?includeLogo=true');
      if (!res.ok) throw new Error('Gagal memuat pengaturan');
      const data = await res.json();
      setSettings(data);
      setForm({
        churchName: data.churchName || 'Gereja',
        province: data.province || '',
        regency: data.regency || '',
        district: data.district || '',
        village: data.village || '',
        pastor: data.pastor || '',
        treasurer: data.treasurer || '',
        secretary: data.secretary || '',
      });
      if (data.logo) {
        setLogoPreview(data.logo);
        setLogoData(data.logo);
      }
    } catch {
      toast.error('Gagal memuat pengaturan');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar (PNG, JPG, SVG)');
      return;
    }

    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      toast.error('Ukuran logo maksimal 1MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setLogoPreview(result);
      setLogoData(result);
      setLogoRemoved(false);
    };
    reader.readAsDataURL(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setLogoData(null);
    setLogoRemoved(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!form.churchName.trim()) {
      toast.error('Nama gereja wajib diisi');
      return;
    }
    try {
      setSaving(true);
      const body: Record<string, unknown> = {
        churchName: form.churchName.trim(),
        province: form.province.trim() || null,
        regency: form.regency.trim() || null,
        district: form.district.trim() || null,
        village: form.village.trim() || null,
        pastor: form.pastor.trim() || null,
        treasurer: form.treasurer.trim() || null,
        secretary: form.secretary.trim() || null,
      };

      // Include logo data if changed
      if (logoData) {
        body.logo = logoData;
      } else if (logoRemoved) {
        body.logo = null;
      }

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Gagal menyimpan');
        return;
      }
      const data = await res.json();
      setSettings(data);
      setLogoRemoved(false);

      // Update favicon dynamically
      if (logoData || logoRemoved) {
        updateFavicon(logoData);
      }

      // Update page title dynamically
      updatePageTitle(form.churchName.trim());

      toast.success('Pengaturan berhasil disimpan');
    } catch {
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  // Dynamic favicon update
  const updateFavicon = (logoBase64: string | null) => {
    // Use cache-busting URL to force browser to re-fetch favicon
    const cacheBuster = `?t=${Date.now()}`;
    const faviconUrl = '/api/favicon' + cacheBuster;

    const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    if (link) {
      link.href = logoBase64 ? faviconUrl : faviconUrl;
    }
    // Also update apple-touch-icon
    const appleLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
    if (appleLink) {
      appleLink.href = logoBase64 ? faviconUrl : faviconUrl;
    }
  };

  // Dynamic page title update
  const updatePageTitle = (churchName: string) => {
    document.title = churchName || 'Sistem Gereja';
  };

  // Build full address from parts
  const fullAddress = [form.village, form.district, form.regency, form.province].filter(Boolean).join(', ');

  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-64 bg-gray-100 rounded animate-pulse mt-2" />
        </div>
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-10 bg-gray-100 rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Pengaturan Gereja</h2>
        <p className="text-sm text-gray-500">Kelola informasi dasar gereja</p>
      </div>

      {/* Info Banner */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
              <BookOpen className="h-4 w-4 text-amber-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-900">Data Pengaturan Digunakan di Seluruh Aplikasi</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Nama gereja menjadi nama aplikasi. Logo gereja menjadi ikon aplikasi, favicon, dan ikon saat diinstal di perangkat.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Church Identity */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <Church className="h-4 w-4 text-amber-700" />
            </div>
            Identitas Gereja
          </CardTitle>
          <CardDescription>Nama gereja menjadi nama aplikasi dan logo menjadi ikon</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Logo Upload */}
          <div>
            <Label className="text-sm font-medium">Logo Gereja</Label>
            <p className="text-[11px] text-gray-400 mt-0.5 mb-3">Logo akan menjadi ikon aplikasi, favicon, dan ikon saat diinstal di PC/HP</p>
            <div className="flex items-start gap-4">
              {/* Logo Preview */}
              <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 shrink-0">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo Gereja" className="w-full h-full object-contain p-1" />
                ) : (
                  <ImagePlus className="h-8 w-8 text-gray-300" />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={handleLogoSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" /> Upload Logo
                </Button>
                {logoPreview && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleRemoveLogo}
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Hapus Logo
                  </Button>
                )}
                <p className="text-[10px] text-gray-400">PNG, JPG, SVG • Maks. 1MB • Disarankan 512x512px</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Church Name */}
          <div>
            <Label htmlFor="churchName" className="text-sm font-medium">
              Nama Gereja <span className="text-red-500">*</span>
            </Label>
            <Input
              id="churchName"
              value={form.churchName}
              onChange={(e) => setForm({ ...form, churchName: e.target.value })}
              placeholder="Masukkan nama gereja"
              className="mt-1.5"
            />
            <p className="text-[11px] text-gray-400 mt-1">Nama ini akan menjadi nama aplikasi dan judul tab browser</p>
          </div>
        </CardContent>
      </Card>

      {/* Church Address */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
              <MapPin className="h-4 w-4 text-teal-700" />
            </div>
            Alamat Gereja
          </CardTitle>
          <CardDescription>Alamat lengkap gereja yang akan tampil di dokumen dan laporan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="province" className="text-sm font-medium flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-teal-100 flex items-center justify-center text-[10px] font-bold text-teal-700">P</span>
                Provinsi
              </Label>
              <Input
                id="province"
                value={form.province}
                onChange={(e) => setForm({ ...form, province: e.target.value })}
                placeholder="Contoh: Nusa Tenggara Timur"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="regency" className="text-sm font-medium flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-teal-100 flex items-center justify-center text-[10px] font-bold text-teal-700">K</span>
                Kabupaten
              </Label>
              <Input
                id="regency"
                value={form.regency}
                onChange={(e) => setForm({ ...form, regency: e.target.value })}
                placeholder="Contoh: Kabupaten Kupang"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="district" className="text-sm font-medium flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-teal-100 flex items-center justify-center text-[10px] font-bold text-teal-700">Kc</span>
                Kecamatan
              </Label>
              <Input
                id="district"
                value={form.district}
                onChange={(e) => setForm({ ...form, district: e.target.value })}
                placeholder="Contoh: Kecamatan Amarasi"
                className="mt-1.5"
              />
              <p className="text-[11px] text-amber-600 mt-1">Kecamatan akan menjadi lokasi penandatangan laporan keuangan</p>
            </div>
            <div>
              <Label htmlFor="village" className="text-sm font-medium flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-teal-100 flex items-center justify-center text-[10px] font-bold text-teal-700">D</span>
                Desa/Kelurahan
              </Label>
              <Input
                id="village"
                value={form.village}
                onChange={(e) => setForm({ ...form, village: e.target.value })}
                placeholder="Contoh: Desa Tamariska"
                className="mt-1.5"
              />
            </div>
          </div>
          {fullAddress && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <p className="text-[11px] text-gray-400 mb-1">Alamat Lengkap:</p>
              <p className="text-sm text-gray-700">{fullAddress}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Church Officials */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <User className="h-4 w-4 text-emerald-700" />
            </div>
            Pengurus Gereja
          </CardTitle>
          <CardDescription>Data pengurus yang akan tampil di dokumen resmi dan laporan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pastor" className="text-sm font-medium flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-amber-100 flex items-center justify-center text-[10px] font-bold text-amber-700">P</span>
                Pendeta
              </Label>
              <Input
                id="pastor"
                value={form.pastor}
                onChange={(e) => setForm({ ...form, pastor: e.target.value })}
                placeholder="Nama pendeta"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="treasurer" className="text-sm font-medium flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-700">B</span>
                Bendahara
              </Label>
              <Input
                id="treasurer"
                value={form.treasurer}
                onChange={(e) => setForm({ ...form, treasurer: e.target.value })}
                placeholder="Nama bendahara"
                className="mt-1.5"
              />
              <p className="text-[11px] text-amber-600 mt-1">Nama ini akan otomatis tampil di tanda tangan laporan keuangan</p>
            </div>
            <div>
              <Label htmlFor="secretary" className="text-sm font-medium flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700">S</span>
                Sekretaris
              </Label>
              <Input
                id="secretary"
                value={form.secretary}
                onChange={(e) => setForm({ ...form, secretary: e.target.value })}
                placeholder="Nama sekretaris"
                className="mt-1.5"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Card */}
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-500">Pratinjau Header Laporan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-white border rounded-lg p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="h-6 w-6 object-contain" />
              ) : (
                <Church className="h-5 w-5 text-amber-700" />
              )}
              <span className="text-lg font-bold text-amber-900 tracking-wide">
                {form.churchName || 'Gereja'}
              </span>
            </div>
            {fullAddress && (
              <p className="text-xs text-gray-500 mt-1">{fullAddress}</p>
            )}
            <Separator className="my-3" />
            <p className="text-sm font-medium text-gray-800">Laporan Keuangan</p>
            <div className="mt-4 flex justify-end">
              <div className="text-center">
                <p className="text-[10px] text-gray-500">{form.district || 'Kecamatan ............'}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Bendahara {form.churchName || 'Gereja'}</p>
                <div className="w-40 border-t border-gray-400 mt-8 pt-1">
                  <p className="text-xs font-medium text-gray-700">{form.treasurer || '____________________'}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Management - Admin Only */}
      <UserManagement />

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-amber-600 hover:bg-amber-700 text-white min-w-[160px]"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Menyimpan...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" /> Simpan Pengaturan
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
