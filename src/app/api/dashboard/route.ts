import { db, ensureDbSetup } from '@/lib/db';
import { NextResponse } from 'next/server';

interface MonthlyFinanceEntry {
  month: string;
  income: number;
  expense: number;
}

interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  totalIncome: number;
  totalExpense: number;
  upcomingEvents: Awaited<ReturnType<typeof db.churchEvent.findMany>>;
  recentAttendance: Awaited<ReturnType<typeof db.attendance.findMany>>;
  monthlyFinanceSummary: MonthlyFinanceEntry[];
}

export async function GET() {
  try {
    const setupOk = await ensureDbSetup();
    if (!setupOk) {
      return NextResponse.json(
        { error: 'Database belum siap, silakan coba beberapa saat lagi' },
        { status: 503 }
      );
    }
    const now = new Date();

    // Current month range
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // 6 months ago start
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // Run independent queries in parallel
    const [
      totalMembers,
      activeMembers,
      currentMonthIncome,
      currentMonthExpense,
      upcomingEvents,
      recentAttendance,
      financesForSummary,
    ] = await Promise.all([
      // Total members
      db.member.count(),

      // Active members
      db.member.count({
        where: { membershipStatus: 'AKTIF' },
      }),

      // Current month income
      db.finance.aggregate({
        _sum: { amount: true },
        where: {
          type: 'PEMASUKAN',
          date: { gte: currentMonthStart, lte: currentMonthEnd },
        },
      }),

      // Current month expense
      db.finance.aggregate({
        _sum: { amount: true },
        where: {
          type: 'PENGELUARAN',
          date: { gte: currentMonthStart, lte: currentMonthEnd },
        },
      }),

      // Upcoming events
      db.churchEvent.findMany({
        where: {
          date: { gte: now },
        },
        orderBy: { date: 'asc' },
        take: 5,
      }),

      // Recent attendance with service relation
      db.attendance.findMany({
        include: {
          service: true,
        },
        orderBy: { date: 'desc' },
        take: 5,
      }),

      // All finances from last 6 months for summary
      db.finance.findMany({
        where: {
          date: { gte: sixMonthsAgo },
        },
        select: {
          type: true,
          amount: true,
          date: true,
        },
        orderBy: { date: 'asc' },
      }),
    ]);

    // Compute monthly finance summary by grouping in JS
    const monthlyMap = new Map<string, MonthlyFinanceEntry>();

    // Initialize all 6 months with zero values to ensure no gaps
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap.set(monthKey, {
        month: monthKey,
        income: 0,
        expense: 0,
      });
    }

    // Aggregate finance records into months
    for (const finance of financesForSummary) {
      const financeDate = new Date(finance.date);
      const monthKey = `${financeDate.getFullYear()}-${String(financeDate.getMonth() + 1).padStart(2, '0')}`;

      const entry = monthlyMap.get(monthKey);
      if (entry) {
        if (finance.type === 'PEMASUKAN') {
          entry.income += finance.amount;
        } else if (finance.type === 'PENGELUARAN') {
          entry.expense += finance.amount;
        }
      }
    }

    const monthlyFinanceSummary = Array.from(monthlyMap.values());

    const dashboardStats: DashboardStats = {
      totalMembers,
      activeMembers,
      totalIncome: currentMonthIncome._sum.amount ?? 0,
      totalExpense: currentMonthExpense._sum.amount ?? 0,
      upcomingEvents,
      recentAttendance,
      monthlyFinanceSummary,
    };

    return NextResponse.json(dashboardStats);
  } catch (error) {
    console.error('Failed to fetch dashboard statistics:', error);
    const errMsg = error instanceof Error ? error.message : '';
    if (errMsg.includes('does not exist') || errMsg.includes('P2021') || errMsg.includes('relation')) {
      return NextResponse.json(
        { error: 'Database belum siap, silakan coba beberapa saat lagi' },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
