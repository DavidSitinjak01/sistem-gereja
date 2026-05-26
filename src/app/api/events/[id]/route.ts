import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureDbSetup } from '@/lib/db-setup';

// GET /api/events/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbSetup();
    const event = await db.churchEvent.findUnique({ where: { id } });

    if (!event) {
      return NextResponse.json(
        { error: 'Acara tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Gagal memuat data acara' },
      { status: 500 }
    );
  }
}

// PUT /api/events/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbSetup();
    const body = await request.json();
    const { title, date, location, description } = body;

    const existing = await db.churchEvent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Acara tidak ditemukan' },
        { status: 404 }
      );
    }

    const updated = await db.churchEvent.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(location !== undefined && { location: location || null }),
        ...(description !== undefined && { description: description || null }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui acara' },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbSetup();

    const existing = await db.churchEvent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Acara tidak ditemukan' },
        { status: 404 }
      );
    }

    await db.churchEvent.delete({ where: { id } });

    return NextResponse.json({ message: 'Acara berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus acara' },
      { status: 500 }
    );
  }
}
