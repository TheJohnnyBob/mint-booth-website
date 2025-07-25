import { type NextRequest, NextResponse } from "next/server"
import { checkAvailability } from "@/lib/database"

export async function GET(request: NextRequest, { env }: { env: any }) {
  try {
    const url = new URL(request.url)
    const date = url.searchParams.get("date")
    const time = url.searchParams.get("time")

    if (!date || !time) {
      return NextResponse.json({ success: false, message: "Date and time are required" }, { status: 400 })
    }

    const db = env?.DB || null

    if (!db) {
      // Mock availability check for development
      return NextResponse.json({
        available: true,
        message: "Mock availability check (development mode)",
      })
    }

    // Convert 12-hour to 24-hour format for database query
    const time24 = convertTo24Hour(time)
    const isAvailable = await checkAvailability(db, date, time24)

    return NextResponse.json({
      available: isAvailable,
      date,
      time,
    })
  } catch (error) {
    console.error("Availability check error:", error)
    return NextResponse.json({ success: false, message: "Failed to check availability" }, { status: 500 })
  }
}

// Helper function to convert 12-hour to 24-hour format
function convertTo24Hour(time12: string): string {
  if (!time12) return ""

  const [time, ampm] = time12.split(" ")
  const [hours, minutes] = time.split(":")
  let hour24 = Number.parseInt(hours)

  if (ampm === "PM" && hour24 !== 12) {
    hour24 += 12
  } else if (ampm === "AM" && hour24 === 12) {
    hour24 = 0
  }

  return `${hour24.toString().padStart(2, "0")}:${minutes}`
}
