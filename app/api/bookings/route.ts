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

    const bookingData: BookingRequest = await request.json()

    // Check availability
    const isAvailable = await checkAvailability(bookingData.eventDate, convertTo24Hour(bookingData.eventTime))
    if (!isAvailable) {
      return NextResponse.json(
        {
          success: false,
          message: "Selected date and time is not available",
        },
        { status: 409 },
      )
    }

    // Fetch packages and addons
    const packages = await getPackages()
    const addons = await getAddOns()

    // Calculate pricing
    const selectedPackage = packages.find((p) => p.id === bookingData.packageId)
    if (!selectedPackage) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid package selected",
        },
        { status: 400 },
      )
    }

    const packagePrice = selectedPackage.price
    const addonsTotal = bookingData.selectedAddons.reduce((total, addonId) => {
      const addon = addons.find((a) => a.id === addonId)
      if (!addon) return total
      const quantity = bookingData.addonQuantities[addonId] || 1
      return total + addon.price * quantity
    }, 0)

    const totalAmount = packagePrice + addonsTotal
    const bookingReference = generateBookingReference()

    // Create booking
    await createBooking({
      booking_reference: bookingReference,
      customer_name: bookingData.customerName,
      customer_email: bookingData.customerEmail,
      customer_phone: bookingData.customerPhone,
      event_date: bookingData.eventDate,
      event_time: convertTo24Hour(bookingData.eventTime),
      event_type: bookingData.eventType,
      guest_count: bookingData.guestCount ? Number.parseInt(bookingData.guestCount) : undefined,
      venue_address: bookingData.venueAddress,
      package_id: bookingData.packageId,
      selected_addons: bookingData.addonQuantities,
      subtotal: packagePrice,
      total_amount: totalAmount,
      status: "pending",
      special_requests: bookingData.specialRequests,
    })

    return NextResponse.json({
      success: true,
      bookingReference,
      totalAmount,
      message: "Booking created successfully",
    })
  } catch (error) {
    console.error("Booking error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create booking",
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
