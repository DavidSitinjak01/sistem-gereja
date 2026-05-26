import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, hashPassword } from '@/lib/auth-utils';

// POST /api/auth/login
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username dan password wajib diisi' }, { status: 400 });
    }

    // Ensure at least one admin exists (auto-seed)
    const adminCount = await db.user.count({ where: { role: 'ADMIN' } });
    if (adminCount === 0) {
      await db.user.create({
        data: {
          name: 'Administrator',
          username: 'admin',
          password: hashPassword('admin123'),
          role: 'ADMIN',
        },
      });
    }

    const user = await db.user.findUnique({
      where: { username: username.trim().toLowerCase() },
    });

    if (!user || !user.active) {
      return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 });
    }

    if (!verifyPassword(password, user.password)) {
      return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 });
    }

    // Return user data (without password)
    return NextResponse.json({
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      servantNo: user.servantNo,
    });
  } catch (error) {
    console.error('[AUTH_LOGIN]', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
