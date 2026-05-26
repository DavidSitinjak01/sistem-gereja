import { NextRequest, NextResponse } from 'next/server';
import { db, ensureDbSetup } from '@/lib/db';

// GET /api/events?upcoming=true
export async function GET(request: NextRequest) {
  try {
    await ensureDbSetup();

    const { searchParams } = new URL(request.url);
    const upcoming = searchParams.get('upcoming') === 'true';

    const events = await db.churchEvent.findMany({
      where: upcoming
        ? {
            date: {
              gte: new Date(),
            },
          }
        : undefined,
      orderBy: {
        date: 'asc',
      },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Gagal memuat data acara' },
      { status: 500 }
    );
  }
}

// POST /api/events
export async function POST(request: NextRequest) {
  try {
    await ensureDbSetup();

    const body = await request.json();
    const { title, date, location, description } = body;

    if (!title || !date) {
      return NextResponse.json(
        { error: 'Judul dan tanggal wajib diisi' },
        { status: 400 }
      );
    }

    const event = await db.churchEvent.create({
      data: {
        title,
        date: new Date(date),
        location: location || null,
        description: description || null,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Gagal menambah acara' },
      { status: 500 }
    );
  }
}
