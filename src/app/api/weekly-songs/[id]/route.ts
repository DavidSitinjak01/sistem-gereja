import { db } from '@/lib/db';
import { ensureDbSetup } from '@/lib/db-setup';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbSetup();
    const body = await request.json();

    const existing = await db.weeklySong.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Weekly song not found' }, { status: 404 });

    const updateData: Record<string, unknown> = {};
    if (body.songId !== undefined) updateData.songId = body.songId;
    if (body.serviceId !== undefined) updateData.serviceId = body.serviceId;
    if (body.weekDate !== undefined) updateData.weekDate = new Date(body.weekDate);
    if (body.order !== undefined) updateData.order = body.order;
    if (body.note !== undefined) updateData.note = body.note?.trim() || null;

    const weeklySong = await db.weeklySong.update({
      where: { id },
      data: updateData,
      include: { song: true, service: true },
    });

    return NextResponse.json(weeklySong);
  } catch (error) {
    console.error('Failed to update weekly song:', error);
    return NextResponse.json({ error: 'Failed to update weekly song' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbSetup();
    const existing = await db.weeklySong.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Weekly song not found' }, { status: 404 });

    await db.weeklySong.delete({ where: { id } });
    return NextResponse.json({ message: 'Weekly song removed successfully' });
  } catch (error) {
    console.error('Failed to delete weekly song:', error);
    return NextResponse.json({ error: 'Failed to delete weekly song' }, { status: 500 });
  }
}
