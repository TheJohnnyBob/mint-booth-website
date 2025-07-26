import { type NextRequest, NextResponse } from "next/server"
import { getPackages, getAddOns, createBooking, generateBookingReference } from "@/lib/server/database"
import type { Package, AddOn } from "@/lib/types"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const [packages, addons] = await Promise.all([getPackages(), getAddOns()])
    return NextResponse.json({ success: true, packages, addons })
  } catch (error) {
    console.error("Error fetching booking data:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch booking data" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { packageId, selectedAddons, eventDate, eventTime, customerName, customerEmail } = body

    // --- Server-side Validation ---
    if (!packageId || !eventDate || !eventTime || !customerName || !customerEmail) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    const [packages, addons] = await Promise.all([getPackages(), getAddOns()])
    const selectedPackage = packages.find((p: Package) => p.id === packageId)

    if (!selectedPackage) {
      return NextResponse.json({ success: false, message: "Invalid package selected" }, { status: 400 })
    }

    // --- Server-side Price Calculation (CRITICAL SECURITY FIX) ---
    const subtotal = selectedPackage.price
    let totalAmount = selectedPackage.price

    for (const addonIdStr in selectedAddons) {
      const addonId = Number.parseInt(addonIdStr, 10)
      const quantity = selectedAddons[addonId]
      const addon = addons.find((a: AddOn) => a.id === addonId)

      if (!addon || quantity <= 0) {
        // Ignore invalid or zero-quantity addons
        continue
      }
      totalAmount += addon.price * quantity
    }

    const convertTo24Hour = (time12: string): string => {
      if (!time12) return ""
      const [time, ampm] = time12.split(" ")
      const [hours, minutes] = time.split(":")
      let hour24 = Number.parseInt(hours, 10)
      if (ampm === "PM" && hour24 !== 12) hour24 += 12
      if (ampm === "AM" && hour24 === 12) hour24 = 0
      return `${hour24.toString().padStart(2, "0")}:${minutes}:00`
    }

    const bookingRecord = {
      booking_reference: generateBookingReference(),
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: body.customerPhone || null,
      event_date: eventDate,
      event_time: convertTo24Hour(eventTime),
      event_type: body.eventType || null,
      guest_count: body.guestCount ? Number.parseInt(body.guestCount, 10) : null,
      venue_address: body.venueAddress || null,
      package_id: packageId,
      selected_addons: selectedAddons,
      subtotal,
      total_amount: totalAmount,
      status: "pending" as const,
      special_requests: body.specialRequests || null,
    }

    const bookingReference = await createBooking(bookingRecord)

    return NextResponse.json({
      success: true,
      bookingReference,
      message: "Booking created successfully",
    })
  } catch (error) {
    console.error("Error creating booking:", error)
    return NextResponse.json({ success: false, message: "Failed to create booking" }, { status: 500 })
  }
}
