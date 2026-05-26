import { db, ensureDbSetup } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbSetup();

    const existing = await db.attendance.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Attendance record not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { serviceId, date, memberCount, notes } = body;

    // If serviceId is being updated, verify the new service exists
    if (serviceId !== undefined && serviceId !== null) {
      if (typeof serviceId !== 'string' || serviceId.trim() === '') {
        return NextResponse.json(
          { error: 'serviceId must be a non-empty string' },
          { status: 400 }
        );
      }

      const service = await db.service.findUnique({
        where: { id: serviceId },
      });

      if (!service) {
        return NextResponse.json(
          { error: 'Service not found' },
          { status: 404 }
        );
      }
    }

    // If date is being updated, validate it
    let parsedDate: Date | undefined;
    if (date !== undefined && date !== null) {
      if (typeof date !== 'string') {
        return NextResponse.json(
          { error: 'date must be a valid ISO string' },
          { status: 400 }
        );
      }
      parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          { error: 'date must be a valid ISO string' },
          { status: 400 }
        );
      }
    }

    // If memberCount is being updated, validate it
    if (memberCount !== undefined && memberCount !== null) {
      if (typeof memberCount !== 'number' || memberCount < 0) {
        return NextResponse.json(
          { error: 'memberCount must be a non-negative number' },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (serviceId !== undefined) updateData.serviceId = serviceId.trim();
    if (parsedDate !== undefined) updateData.date = parsedDate;
    if (memberCount !== undefined) updateData.memberCount = Math.floor(memberCount);
    if (notes !== undefined) updateData.notes = notes?.trim() || null;

    const updated = await db.attendance.update({
      where: { id },
      data: updateData,
      include: {
        service: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update attendance record:', error);
    return NextResponse.json(
      { error: 'Failed to update attendance record' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbSetup();

    const existing = await db.attendance.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Attendance record not found' },
        { status: 404 }
      );
    }

    await db.attendance.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Attendance record deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete attendance record:', error);
    return NextResponse.json(
      { error: 'Failed to delete attendance record' },
      { status: 500 }
    );
  }
}
