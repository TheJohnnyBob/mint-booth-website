import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, eventDate, eventTime, duration, packageType, location, specialRequests, totalPrice } =
      body

    // Validate required fields
    if (
      !name ||
      !email ||
      !phone ||
      !eventDate ||
      !eventTime ||
      !duration ||
      !packageType ||
      !location ||
      !totalPrice
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 },
      )
    }

    // Check if the time slot is available
    const existingBooking = await sql`
      SELECT id FROM bookings 
      WHERE event_date = ${eventDate} 
      AND event_time = ${eventTime}
      AND status != 'cancelled'
    `

    if (existingBooking.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Time slot is not available",
        },
        { status: 409 },
      )
    }

    // Create the booking
    const result = await sql`
      INSERT INTO bookings (
        name, email, phone, event_date, event_time, duration, 
        package_type, location, special_requests, total_price, status
      ) VALUES (
        ${name}, ${email}, ${phone}, ${eventDate}, ${eventTime}, ${duration},
        ${packageType}, ${location}, ${specialRequests || null}, ${totalPrice}, 'pending'
      ) RETURNING id, created_at
    `

    return NextResponse.json({
      success: true,
      message: "Booking created successfully",
      booking: {
        id: result[0].id,
        created_at: result[0].created_at,
      },
    })
  } catch (error) {
    console.error("Booking creation failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create booking",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    const bookings = await sql`
      SELECT * FROM bookings 
      ORDER BY event_date DESC, event_time DESC
    `

    return NextResponse.json({
      success: true,
      bookings,
    })
  } catch (error) {
    console.error("Failed to fetch bookings:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch bookings",
      },
      { status: 500 },
    )
  }
}
