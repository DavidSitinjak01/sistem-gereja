import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureDbSetup } from '@/lib/db-setup';

// GET /api/finances/[id] - Get a single finance record by ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbSetup();

    const finance = await db.finance.findUnique({
      where: { id },
    });

    if (!finance) {
      return NextResponse.json(
        { error: 'Finance record not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json(finance);
  } catch (error) {
    console.error('[FINANCE_GET_BY_ID]', error);
    return NextResponse.json(
      { error: 'Failed to fetch finance record.' },
      { status: 500 }
    );
  }
}

// PUT /api/finances/[id] - Update a finance record
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbSetup();

    // Check if record exists
    const existing = await db.finance.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Finance record not found.' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { type, category, amount, description, date } = body as {
      type?: string;
      category?: string;
      amount?: number;
      description?: string;
      date?: string;
    };

    // Validate type if provided
    if (type !== undefined && type !== 'PEMASUKAN' && type !== 'PENGELUARAN') {
      return NextResponse.json(
        { error: 'Invalid type. Must be PEMASUKAN or PENGELUARAN.' },
        { status: 400 }
      );
    }

    // Validate amount if provided
    if (amount !== undefined && (typeof amount !== 'number' || amount < 0)) {
      return NextResponse.json(
        { error: 'Amount must be a non-negative number.' },
        { status: 400 }
      );
    }

    // Validate date if provided
    let parsedDate: Date | undefined;
    if (date !== undefined) {
      parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format. Use a valid ISO date string.' },
          { status: 400 }
        );
      }
    }

    const updatedFinance = await db.finance.update({
      where: { id },
      data: {
        ...(type !== undefined && { type }),
        ...(category !== undefined && { category }),
        ...(amount !== undefined && { amount }),
        ...(description !== undefined && { description: description || null }),
        ...(parsedDate !== undefined && { date: parsedDate }),
      },
    });

    return NextResponse.json(updatedFinance);
  } catch (error) {
    console.error('[FINANCE_PUT]', error);
    return NextResponse.json(
      { error: 'Failed to update finance record.' },
      { status: 500 }
    );
  }
}

// DELETE /api/finances/[id] - Delete a finance record
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDbSetup();

    // Check if record exists
    const existing = await db.finance.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Finance record not found.' },
        { status: 404 }
      );
    }

    await db.finance.delete({ where: { id } });

    return NextResponse.json({ message: 'Finance record deleted successfully.' });
  } catch (error) {
    console.error('[FINANCE_DELETE]', error);
    return NextResponse.json(
      { error: 'Failed to delete finance record.' },
      { status: 500 }
    );
  }
}
