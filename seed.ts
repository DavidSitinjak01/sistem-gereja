import { db } from './src/lib/db';

async function seed() {
  console.log('🌱 Seeding database...');

  // Seed Members
  const members = await db.member.createMany({
    data: [
      { name: 'Budi Santoso', email: 'budi@email.com', phone: '081234567890', gender: 'LAKI-LAKI', membershipStatus: 'AKTIF', address: 'Jl. Merdeka No. 10' },
      { name: 'Siti Rahayu', email: 'siti@email.com', phone: '081234567891', gender: 'PEREMPUAN', membershipStatus: 'AKTIF', address: 'Jl. Pahlawan No. 5' },
      { name: 'Agus Prasetyo', email: 'agus@email.com', phone: '081234567892', gender: 'LAKI-LAKI', membershipStatus: 'AKTIF', address: 'Jl. Sudirman No. 15' },
      { name: 'Dewi Lestari', email: 'dewi@email.com', phone: '081234567893', gender: 'PEREMPUAN', membershipStatus: 'AKTIF', address: 'Jl. Kartini No. 20' },
      { name: 'Eko Wijaya', email: 'eko@email.com', phone: '081234567894', gender: 'LAKI-LAKI', membershipStatus: 'AKTIF', address: 'Jl. Ahmad Yani No. 8' },
      { name: 'Rina Wati', email: 'rina@email.com', phone: '081234567895', gender: 'PEREMPUAN', membershipStatus: 'AKTIF', address: 'Jl. Diponegoro No. 12' },
      { name: 'Hendra Gunawan', email: 'hendra@email.com', phone: '081234567896', gender: 'LAKI-LAKI', membershipStatus: 'NON-AKTIF', address: 'Jl. Gatot Subroto No. 3' },
      { name: 'Maya Sari', email: 'maya@email.com', phone: '081234567897', gender: 'PEREMPUAN', membershipStatus: 'AKTIF', address: 'Jl. Imam Bonjol No. 7' },
      { name: 'Purnomo Adi', email: 'purnomo@email.com', phone: '081234567898', gender: 'LAKI-LAKI', membershipStatus: 'AKTIF', address: 'Jl. Veteran No. 9' },
      { name: 'Ani Susanti', email: 'ani@email.com', phone: '081234567899', gender: 'PEREMPUAN', membershipStatus: 'AKTIF', address: 'Jl. Cendana No. 11' },
    ],
    
  });
  console.log(`✅ Created ${members.count} members`);

  // Seed Services
  const service1 = await db.service.create({
    data: { name: 'Ibadah Raya Minggu Pagi', dayOfWeek: 'MINGGU', time: '08:00', description: 'Ibadah utama Minggu pagi untuk seluruh jemaat' },
  });
  const service2 = await db.service.create({
    data: { name: 'Ibadah Raya Minggu Sore', dayOfWeek: 'MINGGU', time: '17:00', description: 'Ibadah Minggu sore' },
  });
  const service3 = await db.service.create({
    data: { name: 'Ibadah Doa Rabu', dayOfWeek: 'RABU', time: '19:00', description: 'Persekutuan doa rabu malam' },
  });
  const service4 = await db.service.create({
    data: { name: 'Ibadah Pemuda Jumat', dayOfWeek: 'JUMAT', time: '19:30', description: 'Ibadah khusus pemuda' },
  });
  console.log('✅ Created 4 services');

  // Seed Finances
  const now = new Date();
  const finances = await db.finance.createMany({
    data: [
      // Current month
      { type: 'PEMASUKAN', category: 'PERSEPULUHAN', amount: 5000000, date: new Date(now.getFullYear(), now.getMonth(), 2), description: 'Persepuluhan Minggu pertama' },
      { type: 'PEMASUKAN', category: 'PERSEMBAHAN', amount: 3500000, date: new Date(now.getFullYear(), now.getMonth(), 5), description: 'Persembahan Minggu kedua' },
      { type: 'PEMASUKAN', category: 'DONASI', amount: 2000000, date: new Date(now.getFullYear(), now.getMonth(), 8), description: 'Donasi pembangunan gereja' },
      { type: 'PENGELUARAN', category: 'OPERASIONAL', amount: 1500000, date: new Date(now.getFullYear(), now.getMonth(), 3), description: 'Listrik dan air' },
      { type: 'PENGELUARAN', category: 'GAJI', amount: 8000000, date: new Date(now.getFullYear(), now.getMonth(), 1), description: 'Gaji pendeta dan staff' },
      // Previous months
      { type: 'PEMASUKAN', category: 'PERSEPULUHAN', amount: 4800000, date: new Date(now.getFullYear(), now.getMonth() - 1, 5) },
      { type: 'PEMASUKAN', category: 'PERSEMBAHAN', amount: 3200000, date: new Date(now.getFullYear(), now.getMonth() - 1, 12) },
      { type: 'PENGELUARAN', category: 'OPERASIONAL', amount: 1400000, date: new Date(now.getFullYear(), now.getMonth() - 1, 4) },
      { type: 'PENGELUARAN', category: 'GAJI', amount: 8000000, date: new Date(now.getFullYear(), now.getMonth() - 1, 1) },
      { type: 'PEMASUKAN', category: 'PERSEPULUHAN', amount: 4500000, date: new Date(now.getFullYear(), now.getMonth() - 2, 7) },
      { type: 'PEMASUKAN', category: 'PERSEMBAHAN', amount: 3000000, date: new Date(now.getFullYear(), now.getMonth() - 2, 14) },
      { type: 'PENGELUARAN', category: 'OPERASIONAL', amount: 1600000, date: new Date(now.getFullYear(), now.getMonth() - 2, 3) },
      { type: 'PENGELUARAN', category: 'RENOVASI', amount: 5000000, date: new Date(now.getFullYear(), now.getMonth() - 2, 10), description: 'Renovasi ruang ibadah' },
      { type: 'PEMASUKAN', category: 'PERSEPULUHAN', amount: 4200000, date: new Date(now.getFullYear(), now.getMonth() - 3, 4) },
      { type: 'PEMASUKAN', category: 'DONASI', amount: 1500000, date: new Date(now.getFullYear(), now.getMonth() - 3, 11) },
      { type: 'PENGELUARAN', category: 'KEGIATAN', amount: 2000000, date: new Date(now.getFullYear(), now.getMonth() - 3, 8), description: 'Retreat jemaat' },
      { type: 'PEMASUKAN', category: 'PERSEPULUHAN', amount: 4600000, date: new Date(now.getFullYear(), now.getMonth() - 4, 6) },
      { type: 'PEMASUKAN', category: 'PERSEMBAHAN', amount: 2800000, date: new Date(now.getFullYear(), now.getMonth() - 4, 13) },
      { type: 'PENGELUARAN', category: 'GAJI', amount: 7500000, date: new Date(now.getFullYear(), now.getMonth() - 4, 1) },
      { type: 'PEMASUKAN', category: 'PERSEPULUHAN', amount: 4100000, date: new Date(now.getFullYear(), now.getMonth() - 5, 5) },
      { type: 'PEMASUKAN', category: 'PERSEMBAHAN', amount: 2600000, date: new Date(now.getFullYear(), now.getMonth() - 5, 12) },
      { type: 'PENGELUARAN', category: 'OPERASIONAL', amount: 1300000, date: new Date(now.getFullYear(), now.getMonth() - 5, 3) },
    ],
    
  });
  console.log(`✅ Created ${finances.count} finance records`);

  // Seed Events
  const events = await db.churchEvent.createMany({
    data: [
      { title: 'Retreat Jemaat 2026', date: new Date(now.getFullYear(), now.getMonth() + 1, 15), location: 'Villa Bukit Indah', description: 'Retreat tahunan seluruh jemaat' },
      { title: 'Paskah Bersama', date: new Date(now.getFullYear(), now.getMonth() + 0, 20), location: 'Gereja Utama', description: 'Perayaan Paskah bersama jemaat' },
      { title: 'Peringatan HUT Gereja', date: new Date(now.getFullYear(), now.getMonth() + 2, 10), location: 'Gereja Utama', description: 'Peringatan HUT Gereja ke-25' },
      { title: 'Seminar Keluarga Kristen', date: new Date(now.getFullYear(), now.getMonth() + 1, 25), location: 'Aula Gereja', description: 'Seminar membangun keluarga Kristen' },
      { title: 'Konser Musik Rohani', date: new Date(now.getFullYear(), now.getMonth() + 3, 5), location: 'Auditorium', description: 'Konser musik rohani dengan guest singer' },
      { title: 'Bakti Sosial', date: new Date(now.getFullYear(), now.getMonth() - 1, 10), location: 'Desa Harapan', description: 'Kegiatan bakti sosial ke desa terpencil' },
    ],
    
  });
  console.log(`✅ Created ${events.count} events`);

  // Seed Attendance
  const attendance = await db.attendance.createMany({
    data: [
      { serviceId: service1.id, date: new Date(now.getFullYear(), now.getMonth(), 2), memberCount: 120, notes: 'Minggu pertama bulan ini' },
      { serviceId: service1.id, date: new Date(now.getFullYear(), now.getMonth(), 9), memberCount: 95, notes: '' },
      { serviceId: service2.id, date: new Date(now.getFullYear(), now.getMonth(), 2), memberCount: 65, notes: '' },
      { serviceId: service3.id, date: new Date(now.getFullYear(), now.getMonth(), 5), memberCount: 45, notes: 'Doa malam Rabu' },
      { serviceId: service4.id, date: new Date(now.getFullYear(), now.getMonth(), 7), memberCount: 35, notes: 'Ibadah pemuda' },
      { serviceId: service1.id, date: new Date(now.getFullYear(), now.getMonth() - 1, 5), memberCount: 110 },
      { serviceId: service2.id, date: new Date(now.getFullYear(), now.getMonth() - 1, 5), memberCount: 55 },
      { serviceId: service3.id, date: new Date(now.getFullYear(), now.getMonth() - 1, 8), memberCount: 40 },
    ],
    
  });
  console.log(`✅ Created ${attendance.count} attendance records`);

  console.log('🎉 Seeding complete!');
}

seed()
  .catch(console.error)
  .finally(() => db.$disconnect());
