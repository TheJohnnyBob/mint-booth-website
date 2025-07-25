import { type NextRequest, NextResponse } from "next/server"
import { checkAvailability } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    const time = searchParams.get("time")

    if (!date || !time) {
      return NextResponse.json({ success: false, message: "Date and time parameters are required" }, { status: 400 })
    }

    const isAvailable = await checkAvailability(date, time)

    return NextResponse.json({
      success: true,
      available: isAvailable,
      date: date,
      time: time,
    })
  } catch (error) {
    console.error("Availability check error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to check availability",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
