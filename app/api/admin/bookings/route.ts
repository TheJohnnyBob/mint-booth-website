import { type NextRequest, NextResponse } from "next/server"
import { getAllBookings } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const bookings = await getAllBookings()

    return NextResponse.json({
      bookings,
      total: bookings.length,
    })
  } catch (error) {
    console.error("Error fetching bookings:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch bookings",
      },
      { status: 500 },
    )
  }
}
