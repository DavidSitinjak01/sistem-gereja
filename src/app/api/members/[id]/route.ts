import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

const VALID_GENDERS = ['LAKI-LAKI', 'PEREMPUAN'];
const VALID_MARITAL = ['MENIKAH', 'BELUM MENIKAH', 'MUDA-MUDI', 'REMAJA', 'SEKOLAH MINGGU'];
const VALID_STATUS = ['AKTIF', 'NON-AKTIF'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const member = await db.member.findUnique({ where: { id } });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    return NextResponse.json(member);
  } catch (error) {
    console.error('Failed to fetch member:', error);
    return NextResponse.json(
      { error: 'Failed to fetch member' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.member.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    if (body.gender && !VALID_GENDERS.includes(body.gender)) {
      return NextResponse.json(
        { error: 'Jenis kelamin tidak valid' },
        { status: 400 }
      );
    }

    if (body.maritalStatus && !VALID_MARITAL.includes(body.maritalStatus)) {
      return NextResponse.json(
        { error: 'Status pernikahan tidak valid' },
        { status: 400 }
      );
    }

    if (body.membershipStatus && !VALID_STATUS.includes(body.membershipStatus)) {
      return NextResponse.json(
        { error: 'Status keanggotaan tidak valid' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.gender !== undefined) updateData.gender = body.gender || null;
    if (body.occupation !== undefined) updateData.occupation = body.occupation?.trim() || null;
    if (body.address !== undefined) updateData.address = body.address?.trim() || null;
    if (body.maritalStatus !== undefined) updateData.maritalStatus = body.maritalStatus || null;
    if (body.membershipStatus !== undefined) updateData.membershipStatus = body.membershipStatus;

    const member = await db.member.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error('Failed to update member:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui jemaat' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.member.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    await db.member.delete({ where: { id } });

    return NextResponse.json({ message: 'Member deleted successfully' });
  } catch (error) {
    console.error('Failed to delete member:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus jemaat' },
      { status: 500 }
    );
  }
}
