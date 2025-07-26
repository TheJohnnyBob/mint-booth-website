import { type NextRequest, NextResponse } from "next/server"
import { getPackages, getAddOns, createBooking, generateBookingReference } from "@/lib/database"

export async function GET() {
  try {
    const [packages, addons] = await Promise.all([getPackages(), getAddOns()])

    return NextResponse.json({
      success: true,
      packages,
      addons,
    })
  } catch (error) {
    console.error("Error fetching booking data:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch booking data",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const bookingData = await request.json()

    // Generate booking reference
    const bookingReference = generateBookingReference()

    // Calculate totals (ensure whole numbers)
    const packages = await getPackages()
    const addons = await getAddOns()

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

    let subtotal = selectedPackage.price
    let totalAmount = selectedPackage.price

    // Calculate addon costs
    Object.entries(bookingData.selectedAddons).forEach(([addonId, quantity]: [string, any]) => {
      const addon = addons.find((a) => a.id === Number.parseInt(addonId))
      if (addon && quantity > 0) {
        const addonCost = addon.is_hourly
          ? addon.price * quantity * selectedPackage.duration_hours
          : addon.price * quantity
        totalAmount += addonCost
      }
    })

    // Ensure whole numbers
    subtotal = Math.round(subtotal)
    totalAmount = Math.round(totalAmount)

    // Convert time format for database storage
    const convertTo24Hour = (time12: string): string => {
      if (!time12) return ""
      const [time, ampm] = time12.split(" ")
      const [hours, minutes] = time.split(":")
      let hour24 = Number.parseInt(hours)
      if (ampm === "PM" && hour24 !== 12) hour24 += 12
      if (ampm === "AM" && hour24 === 12) hour24 = 0
      return `${hour24.toString().padStart(2, "0")}:${minutes}:00`
    }

    const bookingRecord = {
      booking_reference: bookingReference,
      customer_name: bookingData.customerName,
      customer_email: bookingData.customerEmail,
      customer_phone: bookingData.customerPhone || null,
      event_date: bookingData.eventDate,
      event_time: convertTo24Hour(bookingData.eventTime),
      event_type: bookingData.eventType || null,
      guest_count: bookingData.guestCount || null,
      venue_address: bookingData.venueAddress || null,
      package_id: bookingData.packageId,
      selected_addons: bookingData.selectedAddons,
      subtotal,
      total_amount: totalAmount,
      status: "pending",
      special_requests: bookingData.specialRequests || null,
    }

    await createBooking(bookingRecord)

    return NextResponse.json({
      success: true,
      bookingReference,
      message: "Booking created successfully",
    })
  } catch (error) {
    console.error("Error creating booking:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create booking",
      },
      { status: 500 },
    )
  }
}
