import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

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

    if (body.gender && !['LAKI-LAKI', 'PEREMPUAN'].includes(body.gender)) {
      return NextResponse.json(
        { error: 'Gender must be LAKI-LAKI or PEREMPUAN' },
        { status: 400 }
      );
    }

    if (body.membershipStatus && !['AKTIF', 'NON-AKTIF'].includes(body.membershipStatus)) {
      return NextResponse.json(
        { error: 'Membership status must be AKTIF or NON-AKTIF' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.email !== undefined) updateData.email = body.email?.trim() || null;
    if (body.phone !== undefined) updateData.phone = body.phone?.trim() || null;
    if (body.address !== undefined) updateData.address = body.address?.trim() || null;
    if (body.birthDate !== undefined) updateData.birthDate = body.birthDate ? new Date(body.birthDate) : null;
    if (body.gender !== undefined) updateData.gender = body.gender || null;
    if (body.membershipStatus !== undefined) updateData.membershipStatus = body.membershipStatus;
    if (body.joinDate !== undefined) updateData.joinDate = body.joinDate ? new Date(body.joinDate) : undefined;

    const member = await db.member.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error('Failed to update member:', error);
    return NextResponse.json(
      { error: 'Failed to update member' },
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
      { error: 'Failed to delete member' },
      { status: 500 }
    );
  }
}
