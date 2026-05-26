import { db } from '@/lib/db';
import { ensureDbSetup } from '@/lib/db-setup';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    await ensureDbSetup();

    const serviceId = request.nextUrl.searchParams.get('serviceId');
    const weekDate = request.nextUrl.searchParams.get('weekDate');

    const where: Record<string, unknown> = {};
    if (serviceId) where.serviceId = serviceId;
    if (weekDate) {
      const date = new Date(weekDate);
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
      where.weekDate = { gte: startOfDay, lte: endOfDay };
    }

    const weeklySongs = await db.weeklySong.findMany({
      where,
      include: { song: true, service: true },
      orderBy: [{ weekDate: 'desc' }, { order: 'asc' }],
    });

    return NextResponse.json(weeklySongs);
  } catch (error) {
    console.error('Failed to fetch weekly songs:', error);
    return NextResponse.json({ error: 'Failed to fetch weekly songs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDbSetup();

    const body = await request.json();
    const { songId, serviceId, weekDate, order, note } = body;

    if (!songId) return NextResponse.json({ error: 'Lagu wajib dipilih' }, { status: 400 });
    if (!serviceId) return NextResponse.json({ error: 'Ibadah wajib dipilih' }, { status: 400 });
    if (!weekDate) return NextResponse.json({ error: 'Tanggal wajib diisi' }, { status: 400 });

    const songExists = await db.song.findUnique({ where: { id: songId } });
    if (!songExists) return NextResponse.json({ error: 'Lagu tidak ditemukan' }, { status: 400 });

    const serviceExists = await db.service.findUnique({ where: { id: serviceId } });
    if (!serviceExists) return NextResponse.json({ error: 'Ibadah tidak ditemukan' }, { status: 400 });

    const weeklySong = await db.weeklySong.create({
      data: {
        songId,
        serviceId,
        weekDate: new Date(weekDate),
        order: order || 1,
        note: note?.trim() || null,
      },
      include: { song: true, service: true },
    });

    return NextResponse.json(weeklySong, { status: 201 });
  } catch (error) {
    console.error('Failed to create weekly song:', error);
    return NextResponse.json({ error: 'Failed to create weekly song' }, { status: 500 });
  }
}
