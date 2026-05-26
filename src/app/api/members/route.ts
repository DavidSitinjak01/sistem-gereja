import { db, ensureDbSetup } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

const VALID_GENDERS = ['LAKI-LAKI', 'PEREMPUAN'];
const VALID_MARITAL = ['MENIKAH', 'BELUM MENIKAH', 'MUDA-MUDI', 'REMAJA', 'SEKOLAH MINGGU'];
const VALID_STATUS = ['AKTIF', 'NON-AKTIF'];

export async function GET(request: NextRequest) {
  try {
    await ensureDbSetup();

    const searchQuery = request.nextUrl.searchParams.get('search');

    const members = await db.member.findMany({
      where: searchQuery
        ? {
            OR: [
              { name: { contains: searchQuery } },
              { occupation: { contains: searchQuery } },
              { phone: { contains: searchQuery } },
              { address: { contains: searchQuery } },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error('Failed to fetch members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDbSetup();

    const body = await request.json();

    const { name, gender, occupation, phone, address, maritalStatus, membershipStatus } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Nama wajib diisi' },
        { status: 400 }
      );
    }

    if (gender && !VALID_GENDERS.includes(gender)) {
      return NextResponse.json(
        { error: 'Jenis kelamin tidak valid' },
        { status: 400 }
      );
    }

    if (maritalStatus && !VALID_MARITAL.includes(maritalStatus)) {
      return NextResponse.json(
        { error: 'Status pernikahan tidak valid' },
        { status: 400 }
      );
    }

    if (membershipStatus && !VALID_STATUS.includes(membershipStatus)) {
      return NextResponse.json(
        { error: 'Status keanggotaan tidak valid' },
        { status: 400 }
      );
    }

    const member = await db.member.create({
      data: {
        name: name.trim(),
        gender: gender || null,
        occupation: occupation?.trim() || null,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        maritalStatus: maritalStatus || null,
        membershipStatus: membershipStatus || 'AKTIF',
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error('Failed to create member:', error);
    return NextResponse.json(
      { error: 'Gagal menambahkan jemaat' },
      { status: 500 }
    );
  }
}
