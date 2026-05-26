import { NextRequest, NextResponse } from 'next/server';
import { db, ensureDbSetup } from '@/lib/db';

// POST /api/auth/me — validate user session
export async function POST(request: NextRequest) {
  try {
    const setupOk = await ensureDbSetup();
    if (!setupOk) {
      return NextResponse.json(
        { error: 'Database belum siap, silakan coba beberapa saat lagi' },
        { status: 503 }
      );
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.active) {
      return NextResponse.json({ error: 'User tidak ditemukan atau tidak aktif' }, { status: 401 });
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      servantNo: user.servantNo,
    });
  } catch (error) {
    console.error('[AUTH_ME]', error);
    const errMsg = error instanceof Error ? error.message : '';
    if (errMsg.includes('does not exist') || errMsg.includes('P2021') || errMsg.includes('relation')) {
      return NextResponse.json(
        { error: 'Database belum siap, silakan coba beberapa saat lagi' },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
