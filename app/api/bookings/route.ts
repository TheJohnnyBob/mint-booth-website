import { type NextRequest, NextResponse } from "next/server"
import {
  getPackages,
  getAddOns,
  createBooking,
  checkAvailability,
  generateBookingReference,
  initializeDatabase,
} from "@/lib/database"

interface BookingRequest {
  customerName: string
  customerEmail: string
  customerPhone: string
  eventDate: string
  eventTime: string
  eventType: string
  guestCount: string
  venueAddress: string
  packageId: number
  selectedAddons: number[]
  addonQuantities: Record<number, number>
  specialRequests: string
}

export async function POST(request: NextRequest) {
  try {
    // Initialize database on first request
    await initializeDatabase()

    const body = await request.json()

    // Validate required fields
    const requiredFields = ["customerName", "customerEmail", "eventDate", "eventTime", "packageId"]
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ success: false, message: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Check availability
    const isAvailable = await checkAvailability(body.eventDate, convertTo24Hour(body.eventTime))
    if (!isAvailable) {
      return NextResponse.json(
        {
          success: false,
          message: "Selected date and time is not available",
        },
        { status: 409 },
      )
    }

    // Generate booking reference
    const bookingReference = generateBookingReference()

    // Calculate totals
    const packages = await getPackages()
    const addons = await getAddOns()

    const selectedPackage = packages.find((p) => p.id === body.packageId)
    if (!selectedPackage) {
      return NextResponse.json({ success: false, message: "Invalid package selected" }, { status: 400 })
    }

    let subtotal = selectedPackage.price
    const selectedAddons = body.selectedAddons || {}

    // Calculate addon costs
    for (const [addonId, quantity] of Object.entries(selectedAddons)) {
      const addon = addons.find((a) => a.id === Number.parseInt(addonId))
      if (addon && quantity > 0) {
        const addonCost = addon.is_hourly
          ? addon.price * quantity * selectedPackage.duration_hours
          : addon.price * quantity
        subtotal += addonCost
      }
    }

    const totalAmount = subtotal // Add tax calculation here if needed

    // Create booking data
    const bookingData = {
      booking_reference: bookingReference,
      customer_name: body.customerName,
      customer_email: body.customerEmail,
      customer_phone: body.customerPhone || null,
      event_date: body.eventDate,
      event_time: convertTo24Hour(body.eventTime),
      event_type: body.eventType || null,
      guest_count: body.guestCount || null,
      venue_address: body.venueAddress || null,
      package_id: body.packageId,
      selected_addons: selectedAddons,
      subtotal: subtotal,
      total_amount: totalAmount,
      status: "pending",
      special_requests: body.specialRequests || null,
    }

    // Save to database
    const result = await createBooking(bookingData)

    return NextResponse.json({
      success: true,
      message: "Booking created successfully",
      bookingReference: result,
      totalAmount: totalAmount,
    })
  } catch (error) {
    console.error("Booking creation error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create booking",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    // Initialize database on first request
    await initializeDatabase()

    const [packages, addons] = await Promise.all([getPackages(), getAddOns()])
    return NextResponse.json({ packages, addons })
  } catch (error) {
    console.error("Error fetching data:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch data",
      },
      { status: 500 },
    )
  }
}

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
