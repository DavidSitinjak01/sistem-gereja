import { db } from '@/lib/db';
import { ensureDbSetup } from '@/lib/db-setup';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    await ensureDbSetup();

    const search = request.nextUrl.searchParams.get('search');
    const category = request.nextUrl.searchParams.get('category');

    const songs = await db.song.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { title: { contains: search } },
                  { artist: { contains: search } },
                  { songNumber: { contains: search } },
                ],
              }
            : {},
          category ? { category } : {},
        ],
      },
      orderBy: [{ category: 'asc' }, { title: 'asc' }],
    });

    return NextResponse.json(songs);
  } catch (error) {
    console.error('Failed to fetch songs:', error);
    return NextResponse.json({ error: 'Failed to fetch songs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDbSetup();

    const body = await request.json();
    const { title, artist, category, lyrics, chord, songNumber } = body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json({ error: 'Judul lagu wajib diisi' }, { status: 400 });
    }

    const validCategories = ['PUJIAN', 'PENYEMBAHAN', 'NATAL', 'PASKAH', 'LAIN-LAIN'];
    if (category && !validCategories.includes(category)) {
      return NextResponse.json({ error: 'Kategori tidak valid' }, { status: 400 });
    }

    const song = await db.song.create({
      data: {
        title: title.trim(),
        artist: artist?.trim() || null,
        category: category || null,
        lyrics: lyrics?.trim() || null,
        chord: chord?.trim() || null,
        songNumber: songNumber?.trim() || null,
      },
    });

    return NextResponse.json(song, { status: 201 });
  } catch (error) {
    console.error('Failed to create song:', error);
    return NextResponse.json({ error: 'Failed to create song' }, { status: 500 });
  }
}
