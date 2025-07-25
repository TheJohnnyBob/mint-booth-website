import { NextResponse } from "next/server"
import { getAllBookings } from "@/lib/database"

export async function GET() {
  try {
    const bookings = await getAllBookings()

    return NextResponse.json({
      success: true,
      bookings: bookings,
      count: bookings.length,
    })
  } catch (error) {
    console.error("Error fetching bookings:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch bookings",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
