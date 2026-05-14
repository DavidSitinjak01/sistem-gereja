import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchQuery = request.nextUrl.searchParams.get('search');

    const members = await db.member.findMany({
      where: searchQuery
        ? {
            OR: [
              { name: { contains: searchQuery } },
              { email: { contains: searchQuery } },
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
    const body = await request.json();

    const { name, email, phone, address, birthDate, gender, membershipStatus, joinDate } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    if (gender && !['LAKI-LAKI', 'PEREMPUAN'].includes(gender)) {
      return NextResponse.json(
        { error: 'Gender must be LAKI-LAKI or PEREMPUAN' },
        { status: 400 }
      );
    }

    if (membershipStatus && !['AKTIF', 'NON-AKTIF'].includes(membershipStatus)) {
      return NextResponse.json(
        { error: 'Membership status must be AKTIF or NON-AKTIF' },
        { status: 400 }
      );
    }

    const member = await db.member.create({
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        gender: gender || null,
        membershipStatus: membershipStatus || 'AKTIF',
        joinDate: joinDate ? new Date(joinDate) : undefined,
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error('Failed to create member:', error);
    return NextResponse.json(
      { error: 'Failed to create member' },
      { status: 500 }
    );
  }
}
