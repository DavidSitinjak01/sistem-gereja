// Role definitions and access control for Sistem Gereja

export type UserRole = 'ADMIN' | 'BENDAHARA' | 'PELAYAN' | 'SEKRETARIS' | 'PENDETA';

export type TabId = 'dashboard' | 'members' | 'services' | 'songs' | 'weekly-songs' | 'events' | 'finances' | 'attendance' | 'settings' | 'penyerahan-anak' | 'baptisan-air' | 'pernikahan';

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Admin',
  BENDAHARA: 'Bendahara',
  PELAYAN: 'Pelayan',
  SEKRETARIS: 'Sekretaris',
  PENDETA: 'Pendeta',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  ADMIN: 'Akses penuh ke semua menu dan pengaturan',
  BENDAHARA: 'Akses semua menu kecuali Pengaturan',
  PELAYAN: 'Akses menu ibadah & jemaat, tanpa Keuangan & Pengaturan',
  SEKRETARIS: 'Akses semua menu kecuali Pengaturan',
  PENDETA: 'Akses semua menu kecuali Pengaturan',
};

// Which tabs each role can ACCESS (see in sidebar)
const ROLE_TAB_ACCESS: Record<UserRole, TabId[]> = {
  ADMIN: ['dashboard', 'members', 'services', 'songs', 'weekly-songs', 'events', 'finances', 'attendance', 'settings', 'penyerahan-anak', 'baptisan-air', 'pernikahan'],
  BENDAHARA: ['dashboard', 'members', 'services', 'songs', 'weekly-songs', 'events', 'finances', 'attendance', 'penyerahan-anak', 'baptisan-air', 'pernikahan'],
  PELAYAN: ['dashboard', 'members', 'services', 'songs', 'weekly-songs', 'events', 'attendance', 'penyerahan-anak', 'baptisan-air', 'pernikahan'],
  SEKRETARIS: ['dashboard', 'members', 'services', 'songs', 'weekly-songs', 'events', 'finances', 'attendance', 'penyerahan-anak', 'baptisan-air', 'pernikahan'],
  PENDETA: ['dashboard', 'members', 'services', 'songs', 'weekly-songs', 'events', 'finances', 'attendance', 'penyerahan-anak', 'baptisan-air', 'pernikahan'],
};

// Which tabs each role can EDIT
const ROLE_TAB_EDIT: Record<UserRole, TabId[]> = {
  ADMIN: ['dashboard', 'members', 'services', 'songs', 'weekly-songs', 'events', 'finances', 'attendance', 'settings', 'penyerahan-anak', 'baptisan-air', 'pernikahan'],
  BENDAHARA: ['dashboard', 'members', 'services', 'songs', 'weekly-songs', 'events', 'finances', 'attendance', 'penyerahan-anak', 'baptisan-air', 'pernikahan'],
  PELAYAN: ['dashboard', 'members', 'services', 'songs', 'weekly-songs', 'events', 'attendance', 'penyerahan-anak', 'baptisan-air', 'pernikahan'],
  SEKRETARIS: ['dashboard', 'members', 'services', 'songs', 'weekly-songs', 'events', 'finances', 'attendance', 'penyerahan-anak', 'baptisan-air', 'pernikahan'],
  PENDETA: ['dashboard', 'members', 'services', 'songs', 'weekly-songs', 'events', 'finances', 'attendance', 'penyerahan-anak', 'baptisan-air', 'pernikahan'],
};

export function canAccessTab(role: UserRole | null, tabId: TabId): boolean {
  if (!role) return false;
  return ROLE_TAB_ACCESS[role]?.includes(tabId) ?? false;
}

export function canEditTab(role: UserRole | null, tabId: TabId): boolean {
  if (!role) return false;
  return ROLE_TAB_EDIT[role]?.includes(tabId) ?? false;
}

export function getAccessibleTabs(role: UserRole | null): TabId[] {
  if (!role) return [];
  return ROLE_TAB_ACCESS[role] ?? [];
}

export function canManageUsers(role: UserRole | null): boolean {
  return role === 'ADMIN';
}

export function canAccessSettings(role: UserRole | null): boolean {
  return role === 'ADMIN';
}

export function isReadOnly(role: UserRole | null, tabId: TabId): boolean {
  return !canEditTab(role, tabId);
}
