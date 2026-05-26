import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureDbSetup } from '@/lib/db-setup';
import { verifyPassword, hashPassword } from '@/lib/auth-utils';

// POST /api/auth/login
export async function POST(request: NextRequest) {
  try {
    // Ensure database tables exist before attempting any queries
    const setupOk = await ensureDbSetup();
    if (!setupOk) {
      return NextResponse.json(
        { error: 'Database belum siap. Kunjungi /api/health untuk diagnosa.' },
        { status: 503 }
      );
    }

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
    // Check if the error is related to missing database tables or connection
    const errMsg = error instanceof Error ? error.message : '';
    if (
      errMsg.includes('does not exist') ||
      errMsg.includes('P2021') ||
      errMsg.includes('relation') ||
      errMsg.includes('ECONNREFUSED') ||
      errMsg.includes('ENOTFOUND') ||
      errMsg.includes('connect') ||
      errMsg.includes('timeout') ||
      errMsg.includes('P1001') ||
      errMsg.includes('P1002')
    ) {
      return NextResponse.json(
        { error: 'Koneksi database gagal. Kunjungi /api/health untuk diagnosa.' },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: 'Terjadi kesalahan server', detail: errMsg.substring(0, 200) },
      { status: 500 }
    );
  }
}
