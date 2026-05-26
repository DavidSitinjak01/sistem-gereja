import { PrismaClient } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256').update(salt + password).digest('hex');
  return `${salt}:${hash}`;
}

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create default ChurchSetting (singleton pattern — id = "default")
  const churchSetting = await prisma.churchSetting.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      churchName: 'Gereja',
    },
  });
  console.log(`✅ ChurchSetting ensured: ${churchSetting.churchName}`);

  // 2. Create default Admin user (skip if username already exists)
  const existingAdmin = await prisma.user.findUnique({
    where: { username: 'admin' },
  });

  if (!existingAdmin) {
    const admin = await prisma.user.create({
      data: {
        name: 'Administrator',
        username: 'admin',
        password: hashPassword('admin123'),
        role: 'ADMIN',
        active: true,
      },
    });
    console.log(`✅ Admin user created: ${admin.username} (please change the default password after first login)`);
  } else {
    console.log('⚠️ Admin user already exists, skipping...');
  }

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
