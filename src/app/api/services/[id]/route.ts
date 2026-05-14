import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

const VALID_DAYS = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'] as const

type DayOfWeek = (typeof VALID_DAYS)[number]

interface UpdateServiceBody {
  name?: string
  dayOfWeek?: DayOfWeek
  time?: string
  description?: string
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const service = await db.service.findUnique({
      where: { id },
      include: { attendance: true },
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(service)
  } catch (error) {
    console.error('Failed to fetch service:', error)
    return NextResponse.json(
      { error: 'Failed to fetch service' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existingService = await db.service.findUnique({ where: { id } })
    if (!existingService) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    const body: UpdateServiceBody = await request.json()

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim() === '') {
        return NextResponse.json(
          { error: 'Name must be a non-empty string' },
          { status: 400 }
        )
      }
    }

    if (body.dayOfWeek !== undefined && body.dayOfWeek !== null) {
      if (!VALID_DAYS.includes(body.dayOfWeek)) {
        return NextResponse.json(
          { error: `dayOfWeek must be one of: ${VALID_DAYS.join(', ')}` },
          { status: 400 }
        )
      }
    }

    if (body.time !== undefined && body.time !== null) {
      if (typeof body.time !== 'string') {
        return NextResponse.json(
          { error: 'Time must be a string' },
          { status: 400 }
        )
      }
      if (!/^\d{2}:\d{2}$/.test(body.time)) {
        return NextResponse.json(
          { error: 'Time must be in HH:MM format (e.g. "08:00")' },
          { status: 400 }
        )
      }
    }

    if (body.description !== undefined && body.description !== null && typeof body.description !== 'string') {
      return NextResponse.json(
        { error: 'Description must be a string' },
        { status: 400 }
      )
    }

    const updatedService = await db.service.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.dayOfWeek !== undefined && { dayOfWeek: body.dayOfWeek }),
        ...(body.time !== undefined && { time: body.time }),
        ...(body.description !== undefined && { description: body.description }),
      },
    })

    return NextResponse.json(updatedService)
  } catch (error) {
    console.error('Failed to update service:', error)
    return NextResponse.json(
      { error: 'Failed to update service' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existingService = await db.service.findUnique({ where: { id } })
    if (!existingService) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    await db.service.delete({ where: { id } })

    return NextResponse.json({ message: 'Service deleted successfully' })
  } catch (error) {
    console.error('Failed to delete service:', error)
    return NextResponse.json(
      { error: 'Failed to delete service' },
      { status: 500 }
    )
  }
}
