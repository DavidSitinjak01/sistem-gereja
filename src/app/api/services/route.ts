import { db, ensureDbSetup } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

const VALID_DAYS = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'] as const

type DayOfWeek = (typeof VALID_DAYS)[number]

interface CreateServiceBody {
  name: string
  dayOfWeek?: DayOfWeek
  time?: string
  description?: string
}

export async function GET() {
  try {
    await ensureDbSetup()
    const services = await db.service.findMany({
      orderBy: [{ dayOfWeek: 'asc' }, { time: 'asc' }],
    })
    return NextResponse.json(services)
  } catch (error) {
    console.error('Failed to fetch services:', error)
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDbSetup()
    const body: CreateServiceBody = await request.json()

    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    if (body.dayOfWeek && !VALID_DAYS.includes(body.dayOfWeek)) {
      return NextResponse.json(
        { error: `dayOfWeek must be one of: ${VALID_DAYS.join(', ')}` },
        { status: 400 }
      )
    }

    if (body.time && typeof body.time !== 'string') {
      return NextResponse.json(
        { error: 'Time must be a string' },
        { status: 400 }
      )
    }

    if (body.time && !/^\d{2}:\d{2}$/.test(body.time)) {
      return NextResponse.json(
        { error: 'Time must be in HH:MM format (e.g. "08:00")' },
        { status: 400 }
      )
    }

    if (body.description !== undefined && typeof body.description !== 'string') {
      return NextResponse.json(
        { error: 'Description must be a string' },
        { status: 400 }
      )
    }

    const service = await db.service.create({
      data: {
        name: body.name.trim(),
        dayOfWeek: body.dayOfWeek ?? null,
        time: body.time ?? null,
        description: body.description ?? null,
      },
    })

    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    console.error('Failed to create service:', error)
    return NextResponse.json(
      { error: 'Failed to create service' },
      { status: 500 }
    )
  }
}
