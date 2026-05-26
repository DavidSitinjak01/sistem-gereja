import { db } from '@/lib/db';
import { ensureDbSetup } from '@/lib/db-setup';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbSetup();
    const song = await db.song.findUnique({ where: { id } });
    if (!song) return NextResponse.json({ error: 'Song not found' }, { status: 404 });
    return NextResponse.json(song);
  } catch (error) {
    console.error('Failed to fetch song:', error);
    return NextResponse.json({ error: 'Failed to fetch song' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbSetup();
    const body = await request.json();

    const existing = await db.song.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Song not found' }, { status: 404 });

    const validCategories = ['PUJIAN', 'PENYEMBAHAN', 'NATAL', 'PASKAH', 'LAIN-LAIN'];
    if (body.category && !validCategories.includes(body.category)) {
      return NextResponse.json({ error: 'Kategori tidak valid' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.artist !== undefined) updateData.artist = body.artist?.trim() || null;
    if (body.category !== undefined) updateData.category = body.category || null;
    if (body.lyrics !== undefined) updateData.lyrics = body.lyrics?.trim() || null;
    if (body.chord !== undefined) updateData.chord = body.chord?.trim() || null;
    if (body.songNumber !== undefined) updateData.songNumber = body.songNumber?.trim() || null;

    const song = await db.song.update({ where: { id }, data: updateData });
    return NextResponse.json(song);
  } catch (error) {
    console.error('Failed to update song:', error);
    return NextResponse.json({ error: 'Failed to update song' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbSetup();
    const existing = await db.song.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Song not found' }, { status: 404 });

    await db.weeklySong.deleteMany({ where: { songId: id } });
    await db.song.delete({ where: { id } });
    return NextResponse.json({ message: 'Song deleted successfully' });
  } catch (error) {
    console.error('Failed to delete song:', error);
    return NextResponse.json({ error: 'Failed to delete song' }, { status: 500 });
  }
}
