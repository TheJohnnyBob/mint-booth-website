import { type NextRequest, NextResponse } from "next/server"
import { checkAvailability } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    const time = searchParams.get("time")

    if (!date || !time) {
      return NextResponse.json(
        {
          success: false,
          message: "Date and time are required",
        },
        { status: 400 },
      )
    }

    // Convert 12-hour time to 24-hour format
    const convertTo24Hour = (time12: string): string => {
      if (!time12) return ""
      const [time, ampm] = time12.split(" ")
      const [hours, minutes] = time.split(":")
      let hour24 = Number.parseInt(hours)
      if (ampm === "PM" && hour24 !== 12) hour24 += 12
      if (ampm === "AM" && hour24 === 12) hour24 = 0
      return `${hour24.toString().padStart(2, "0")}:${minutes}:00`
    }

    const time24 = convertTo24Hour(time)
    const isAvailable = await checkAvailability(date, time24)

    return NextResponse.json({
      success: true,
      available: isAvailable,
    })
  } catch (error) {
    console.error("Error checking availability:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to check availability",
      },
      { status: 500 },
    )
  }
}
