import { db } from './src/lib/db';

async function seedSongs() {
  console.log('🎵 Seeding songs...');

  // Seed Songs
  const song1 = await db.song.create({ data: { title: 'Pujilah Tuhan', artist: 'Nikita', category: 'PUJIAN', chord: 'C', songNumber: '1', lyrics: 'Pujilah Tuhan, hai jiwaku\nDan jangan lupakan segala kebaikan-Nya\nDia yang mengampuni segala dosamu\nDan menyembuhkan segala penyakitmu' } });
  const song2 = await db.song.create({ data: { title: 'Bersukacitalah', artist: 'Franky Sihombing', category: 'PUJIAN', chord: 'G', songNumber: '3', lyrics: 'Bersukacitalah dalam Tuhan\nBersukacitalah dalam Tuhan\nSebab Dia sumber sukacita\nBersukacitalah dalam Tuhan' } });
  const song3 = await db.song.create({ data: { title: 'Hosanna', artist: 'Hillsong United', category: 'PENYEMBAHAN', chord: 'D', songNumber: '12', lyrics: 'Hosanna, hosanna\nHosanna di tempat yang maha tinggi\nHosanna, hosanna\nHosanna di tempat yang maha tinggi' } });
  const song4 = await db.song.create({ data: { title: 'Tuhan Sumber Kekuatan', artist: 'True Worshippers', category: 'PENYEMBAHAN', chord: 'E', songNumber: '15', lyrics: 'Tuhan sumber kekuatan\nDan perisaiku\nEngkaulah tempat perlindunganku\nPada-Mu aku bersandar' } });
  const song5 = await db.song.create({ data: { title: 'Satu Satunya', artist: 'Giving My Best', category: 'PENYEMBAHAN', chord: 'A', songNumber: '22', lyrics: 'Satu-satunya yang kuinginkan\nHanyalah Engkau Tuhan\nSatu-satunya yang kunantikan\nHanyalah Engkau Tuhan' } });
  const song6 = await db.song.create({ data: { title: 'Malam Kudus', artist: 'Tradisional', category: 'NATAL', chord: 'F', songNumber: '45', lyrics: 'Malam kudus, sunyi senyap\nDunia terlelap\nHanya dua jaga terus\nGembala di padang gurun\nMendengar suara malaikat\nAlleluya' } });
  const song7 = await db.song.create({ data: { title: 'Dia Bangkit', artist: 'JPCC Worship', category: 'PASKAH', chord: 'C', songNumber: '50', lyrics: 'Dia bangkit, Dia bangkit\nKematian tak mampu menahan-Nya\nDia bangkit, Dia bangkit\nYesus Tuhan hidup selama-lamanya' } });
  const song8 = await db.song.create({ data: { title: 'Great Is Thy Faithfulness', artist: 'Thomas Chisholm', category: 'PUJIAN', chord: 'Bb', songNumber: '7', lyrics: 'Great is Thy faithfulness\nO God my Father\nThere is no shadow\nOf turning with Thee\nThou changest not\nThy compassions they fail not\nAs Thou hast been\nThou forever wilt be' } });
  const song9 = await db.song.create({ data: { title: 'Kemuliaan-Mu', artist: 'Nikita', category: 'PENYEMBAHAN', chord: 'G', songNumber: '18', lyrics: 'Kemuliaan-Mu memenuhi bumi\nKemuliaan-Mu memenuhi tempat ini\nKami berdiri di hadapan-Mu\nMenyembah-Mu Tuhan' } });
  const song10 = await db.song.create({ data: { title: 'Kaulah Harapanku', artist: 'True Worshippers', category: 'PENYEMBAHAN', chord: 'D', songNumber: '25', lyrics: 'Kaulah harapanku\nKaulah kekuatanku\nDi dalam badai pun\nEngkau sertaku' } });
  const song11 = await db.song.create({ data: { title: 'Sempurna', artist: 'Giving My Best', category: 'PENYEMBAHAN', chord: 'E', songNumber: '30', lyrics: 'Sempurna kasih-Mu Tuhan\nSempurna rencana-Mu\nSempurna jalan-Mu\nBagiku, bagiku' } });
  const song12 = await db.song.create({ data: { title: 'Terima Kasih Tuhan', artist: 'Kidung Jemaat', category: 'PUJIAN', chord: 'C', songNumber: '10', lyrics: 'Terima kasih Tuhan\nAtas segala anugerah-Mu\nYang Engkau berikan kepadaku\nSetiap hari hidupku' } });

  console.log(`✅ Created 12 songs`);

  // Get existing services
  const services = await db.service.findMany();
  if (services.length === 0) {
    console.log('⚠️ No services found, skipping weekly songs');
    return;
  }

  // Seed Weekly Songs for this week
  const today = new Date();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - today.getDay()); // Get this week's Sunday

  const weeklySongs = await db.weeklySong.createMany({
    data: [
      // Ibadah Raya Minggu Pagi
      { songId: song1.id, serviceId: services[0].id, weekDate: sunday, order: 1, note: 'PEMBUKA' },
      { songId: song3.id, serviceId: services[0].id, weekDate: sunday, order: 2, note: 'PENYEMBAHAN' },
      { songId: song5.id, serviceId: services[0].id, weekDate: sunday, order: 3, note: 'PENYEMBAHAN' },
      { songId: song9.id, serviceId: services[0].id, weekDate: sunday, order: 4, note: 'PERSEMBAHAN' },
      { songId: song12.id, serviceId: services[0].id, weekDate: sunday, order: 5, note: 'PENGUTUSAN' },
      // Ibadah Raya Minggu Sore
      { songId: song2.id, serviceId: services[1].id, weekDate: sunday, order: 1, note: 'PEMBUKA' },
      { songId: song4.id, serviceId: services[1].id, weekDate: sunday, order: 2, note: 'PENYEMBAHAN' },
      { songId: song10.id, serviceId: services[1].id, weekDate: sunday, order: 3, note: 'PERSEMBAHAN' },
      { songId: song11.id, serviceId: services[1].id, weekDate: sunday, order: 4, note: 'PENGUTUSAN' },
    ],
  });
  console.log(`✅ Created ${weeklySongs.count} weekly song assignments`);

  console.log('🎉 Song seeding complete!');
}

seedSongs()
  .catch(console.error)
  .finally(() => db.$disconnect());
