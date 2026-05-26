import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureDbSetup } from '@/lib/db-setup';

// GET /api/finances - List all finances with optional filtering
export async function GET(request: NextRequest) {
  try {
    await ensureDbSetup();

    const { searchParams } = new URL(request.url);

    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const category = searchParams.get('category');

    const where: Record<string, unknown> = {};

    if (type) {
      if (type !== 'PEMASUKAN' && type !== 'PENGELUARAN') {
        return NextResponse.json(
          { error: 'Invalid type. Must be PEMASUKAN or PENGELUARAN.' },
          { status: 400 }
        );
      }
      where.type = type;
    }

    if (category) {
      where.category = category;
    }

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
          return NextResponse.json(
            { error: 'Invalid startDate format. Use YYYY-MM-DD.' },
            { status: 400 }
          );
        }
        dateFilter.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
          return NextResponse.json(
            { error: 'Invalid endDate format. Use YYYY-MM-DD.' },
            { status: 400 }
          );
        }
        // Set to end of day for inclusive filtering
        end.setHours(23, 59, 59, 999);
        dateFilter.lte = end;
      }
      where.date = dateFilter;
    }

    const finances = await db.finance.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(finances);
  } catch (error) {
    console.error('[FINANCES_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch finances.' },
      { status: 500 }
    );
  }
}

// POST /api/finances - Create a new finance record
export async function POST(request: NextRequest) {
  try {
    await ensureDbSetup();

    const body = await request.json();
    const { type, category, amount, description, date } = body as {
      type?: string;
      category?: string;
      amount?: number;
      description?: string;
      date?: string;
    };

    // Validate required fields
    if (!type) {
      return NextResponse.json(
        { error: 'Type is required.' },
        { status: 400 }
      );
    }

    if (type !== 'PEMASUKAN' && type !== 'PENGELUARAN') {
      return NextResponse.json(
        { error: 'Invalid type. Must be PEMASUKAN or PENGELUARAN.' },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { error: 'Category is required.' },
        { status: 400 }
      );
    }

    if (amount === undefined || amount === null) {
      return NextResponse.json(
        { error: 'Amount is required.' },
        { status: 400 }
      );
    }

    if (typeof amount !== 'number' || amount < 0) {
      return NextResponse.json(
        { error: 'Amount must be a non-negative number.' },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { error: 'Date is required.' },
        { status: 400 }
      );
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use a valid ISO date string.' },
        { status: 400 }
      );
    }

    const finance = await db.finance.create({
      data: {
        type,
        category,
        amount,
        description: description || null,
        date: parsedDate,
      },
    });

    return NextResponse.json(finance, { status: 201 });
  } catch (error) {
    console.error('[FINANCES_POST]', error);
    return NextResponse.json(
      { error: 'Failed to create finance record.' },
      { status: 500 }
    );
  }
}
