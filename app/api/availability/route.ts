import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")

    if (!date) {
      return NextResponse.json(
        {
          success: false,
          error: "Date parameter is required",
        },
        { status: 400 },
      )
    }

    // Get existing bookings for the date
    const existingBookings = await sql`
      SELECT event_time FROM bookings 
      WHERE event_date = ${date} 
      AND status != 'cancelled'
    `

    // Define available time slots (9 AM to 9 PM)
    const allTimeSlots = [
      "09:00",
      "10:00",
      "11:00",
      "12:00",
      "13:00",
      "14:00",
      "15:00",
      "16:00",
      "17:00",
      "18:00",
      "19:00",
      "20:00",
      "21:00",
    ]

    // Filter out booked slots
    const bookedTimes = existingBookings.map((booking) => booking.event_time)
    const availableSlots = allTimeSlots.filter((slot) => !bookedTimes.includes(slot))

    return NextResponse.json({
      success: true,
      availableSlots,
      bookedSlots: bookedTimes,
    })
  } catch (error) {
    console.error("Failed to fetch availability:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch availability",
      },
      { status: 500 },
    )
  }
}
