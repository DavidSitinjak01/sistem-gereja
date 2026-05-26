import { NextRequest, NextResponse } from 'next/server';
import { db, ensureDbSetup } from '@/lib/db';
import { hashPassword } from '@/lib/auth-utils';

// GET /api/users — List all users (admin only)
export async function GET(request: NextRequest) {
  try {
    await ensureDbSetup();

    const role = request.headers.get('x-user-role');
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const users = await db.user.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        servantNo: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('[USERS_GET]', error);
    return NextResponse.json({ error: 'Gagal memuat data pengguna' }, { status: 500 });
  }
}

// POST /api/users — Create a new user (admin only)
export async function POST(request: NextRequest) {
  try {
    await ensureDbSetup();

    const role = request.headers.get('x-user-role');
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const body = await request.json();
    const { name, username, password, role: userRole, servantNo } = body as {
      name?: string;
      username?: string;
      password?: string;
      role?: string;
      servantNo?: number;
    };

    if (!name?.trim() || !username?.trim() || !password?.trim() || !userRole) {
      return NextResponse.json({ error: 'Nama, username, password, dan role wajib diisi' }, { status: 400 });
    }

    const validRoles = ['ADMIN', 'BENDAHARA', 'PELAYAN', 'SEKRETARIS', 'PENDETA'];
    if (!validRoles.includes(userRole)) {
      return NextResponse.json({ error: 'Role tidak valid' }, { status: 400 });
    }

    // Check username uniqueness
    const existing = await db.user.findUnique({
      where: { username: username.trim().toLowerCase() },
    });
    if (existing) {
      return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 400 });
    }

    const user = await db.user.create({
      data: {
        name: name.trim(),
        username: username.trim().toLowerCase(),
        password: hashPassword(password),
        role: userRole,
        servantNo: userRole === 'PELAYAN' ? (servantNo || null) : null,
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        servantNo: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('[USERS_POST]', error);
    return NextResponse.json({ error: 'Gagal membuat pengguna' }, { status: 500 });
  }
}

// PUT /api/users — Update a user (admin only)
export async function PUT(request: NextRequest) {
  try {
    await ensureDbSetup();

    const role = request.headers.get('x-user-role');
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, username, password, role: userRole, servantNo, active } = body as {
      id?: string;
      name?: string;
      username?: string;
      password?: string;
      role?: string;
      servantNo?: number | null;
      active?: boolean;
    };

    if (!id) {
      return NextResponse.json({ error: 'ID pengguna wajib diisi' }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    // If username is changing, check uniqueness
    if (username && username.trim().toLowerCase() !== existing.username) {
      const dup = await db.user.findUnique({
        where: { username: username.trim().toLowerCase() },
      });
      if (dup) {
        return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 400 });
      }
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (username !== undefined) updateData.username = username.trim().toLowerCase();
    if (password) updateData.password = hashPassword(password);
    if (userRole) {
      const validRoles = ['ADMIN', 'BENDAHARA', 'PELAYAN', 'SEKRETARIS', 'PENDETA'];
      if (!validRoles.includes(userRole)) {
        return NextResponse.json({ error: 'Role tidak valid' }, { status: 400 });
      }
      updateData.role = userRole;
      updateData.servantNo = userRole === 'PELAYAN' ? (servantNo ?? null) : null;
    }
    if (servantNo !== undefined && userRole !== 'PELAYAN' && existing.role === 'PELAYAN') {
      updateData.servantNo = servantNo;
    }
    if (active !== undefined) updateData.active = active;

    const user = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        servantNo: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('[USERS_PUT]', error);
    return NextResponse.json({ error: 'Gagal memperbarui pengguna' }, { status: 500 });
  }
}

// DELETE /api/users — Delete a user (admin only)
export async function DELETE(request: NextRequest) {
  try {
    await ensureDbSetup();

    const role = request.headers.get('x-user-role');
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID pengguna wajib diisi' }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    // Prevent deleting the last admin
    if (existing.role === 'ADMIN') {
      const adminCount = await db.user.count({ where: { role: 'ADMIN' } });
      if (adminCount <= 1) {
        return NextResponse.json({ error: 'Tidak dapat menghapus admin terakhir' }, { status: 400 });
      }
    }

    await db.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[USERS_DELETE]', error);
    return NextResponse.json({ error: 'Gagal menghapus pengguna' }, { status: 500 });
  }
}
