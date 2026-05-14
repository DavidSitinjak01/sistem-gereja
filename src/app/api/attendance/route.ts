import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const serviceId = request.nextUrl.searchParams.get('serviceId');
    const dateFilter = request.nextUrl.searchParams.get('date');

    const where: Record<string, unknown> = {};

    if (serviceId) {
      where.serviceId = serviceId;
    }

    if (dateFilter) {
      const targetDate = new Date(dateFilter);
      if (!isNaN(targetDate.getTime())) {
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        where.date = {
          gte: startOfDay,
          lte: endOfDay,
        };
      }
    }

    const attendance = await db.attendance.findMany({
      where,
      include: {
        service: true,
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(attendance);
  } catch (error) {
    console.error('Failed to fetch attendance records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance records' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serviceId, date, memberCount, notes } = body;

    if (!serviceId || typeof serviceId !== 'string' || serviceId.trim() === '') {
      return NextResponse.json(
        { error: 'serviceId is required' },
        { status: 400 }
      );
    }

    if (!date || typeof date !== 'string') {
      return NextResponse.json(
        { error: 'date is required and must be a valid ISO string' },
        { status: 400 }
      );
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: 'date must be a valid ISO string' },
        { status: 400 }
      );
    }

    if (memberCount === undefined || memberCount === null || typeof memberCount !== 'number' || memberCount < 0) {
      return NextResponse.json(
        { error: 'memberCount is required and must be a non-negative number' },
        { status: 400 }
      );
    }

    // Verify the service exists
    const service = await db.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    const attendance = await db.attendance.create({
      data: {
        serviceId: serviceId.trim(),
        date: parsedDate,
        memberCount: Math.floor(memberCount),
        notes: notes?.trim() || null,
      },
      include: {
        service: true,
      },
    });

    return NextResponse.json(attendance, { status: 201 });
  } catch (error) {
    console.error('Failed to create attendance record:', error);
    return NextResponse.json(
      { error: 'Failed to create attendance record' },
      { status: 500 }
    );
  }
}
