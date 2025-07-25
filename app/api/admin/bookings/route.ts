import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET() {
  try {
    const bookings = await sql`
      SELECT 
        id, name, email, phone, event_date, event_time, 
        duration, package_type, location, special_requests, 
        total_price, status, created_at, updated_at
      FROM bookings 
      ORDER BY event_date DESC, event_time DESC
    `

    return NextResponse.json({
      success: true,
      bookings,
    })
  } catch (error) {
    console.error("Failed to fetch admin bookings:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch bookings",
      },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json(
        {
          success: false,
          error: "Booking ID and status are required",
        },
        { status: 400 },
      )
    }

    const validStatuses = ["pending", "confirmed", "cancelled", "completed"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid status",
        },
        { status: 400 },
      )
    }

    const result = await sql`
      UPDATE bookings 
      SET status = ${status}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id, status, updated_at
    `

    if (result.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Booking not found",
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Booking status updated successfully",
      booking: result[0],
    })
  } catch (error) {
    console.error("Failed to update booking status:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update booking",
      },
      { status: 500 },
    )
  }
}
