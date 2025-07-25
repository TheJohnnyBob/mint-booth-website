import { type NextRequest, NextResponse } from "next/server"
import {
  getPackages,
  getAddOns,
  createBooking,
  checkAvailability,
  generateBookingReference,
  type Package,
  type AddOn,
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

// This function will be called in Cloudflare Workers environment
export async function POST(request: NextRequest, { env }: { env: any }) {
  const db = env?.DB || null

  try {
    const bookingData: BookingRequest = await request.json()

    // In Cloudflare Workers, the database will be available as env.DB
    // For now, we'll simulate this - in production, you'll get this from the environment

    if (!db) {
      // Fallback to mock data for development
      return handleMockBooking(bookingData)
    }

    // Validate availability
    const isAvailable = await checkAvailability(db, bookingData.eventDate, bookingData.eventTime)
    if (!isAvailable) {
      return NextResponse.json({ success: false, message: "Selected date and time is not available" }, { status: 409 })
    }

    // Fetch packages and addons from database
    const packages = await getPackages(db)
    const addons = await getAddOns(db)

    // Calculate pricing from database data
    const selectedPackage = packages.find((p) => p.id === bookingData.packageId)
    if (!selectedPackage) {
      return NextResponse.json({ success: false, message: "Invalid package selected" }, { status: 400 })
    }

    const packagePrice = selectedPackage.price

    const addonsTotal = bookingData.selectedAddons.reduce((total, addonId) => {
      const addon = addons.find((a) => a.id === addonId)
      if (!addon) return total

      const quantity = bookingData.addonQuantities[addonId] || 1
      return total + addon.price * quantity
    }, 0)

    const totalAmount = packagePrice + addonsTotal

    // Generate booking reference
    const bookingReference = generateBookingReference()

    // Convert time format for database storage
    const eventTime24 = convertTo24Hour(bookingData.eventTime)

    // Create booking in database
    await createBooking(db, {
      booking_reference: bookingReference,
      customer_name: bookingData.customerName,
      customer_email: bookingData.customerEmail,
      customer_phone: bookingData.customerPhone,
      event_date: bookingData.eventDate,
      event_time: eventTime24,
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

    // TODO: Send confirmation email
    // TODO: Create payment intent
    // TODO: Update availability calendar

    return NextResponse.json({
      success: true,
      bookingReference,
      totalAmount,
      message: "Booking created successfully",
    })
  } catch (error) {
    console.error("Booking error:", error)
    return NextResponse.json({ success: false, message: "Failed to create booking" }, { status: 500 })
  }
}

// Fallback function for development/testing
async function handleMockBooking(bookingData: BookingRequest) {
  // Generate booking reference
  const bookingReference = generateBookingReference()

  // Mock pricing calculation
  const packagePrices = { 1: 299, 2: 399, 3: 599 }
  const addonPrices = { 1: 49, 2: 119, 3: 119, 4: 149, 5: 79, 6: 49, 7: 99, 8: 49, 9: 99 }

  const packagePrice = packagePrices[bookingData.packageId as keyof typeof packagePrices] || 0

  const addonsTotal = bookingData.selectedAddons.reduce((total, addonId) => {
    const addonPrice = addonPrices[addonId as keyof typeof addonPrices] || 0
    const quantity = bookingData.addonQuantities[addonId] || 1
    return total + addonPrice * quantity
  }, 0)

  const totalAmount = packagePrice + addonsTotal

  // Simulate database insert
  console.log("Mock booking created:", {
    bookingReference,
    ...bookingData,
    selectedAddons: JSON.stringify(bookingData.addonQuantities),
    subtotal: packagePrice,
    totalAmount,
    status: "pending",
    createdAt: new Date().toISOString(),
  })

  return NextResponse.json({
    success: true,
    bookingReference,
    totalAmount,
    message: "Booking created successfully (mock mode)",
  })
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

// GET endpoint for fetching packages and addons
export async function GET(request: NextRequest, { env }: { env: any }) {
  const db = env?.DB || null
  try {
    const url = new URL(request.url)
    const type = url.searchParams.get("type")

    if (!db) {
      // Return mock data for development
      return NextResponse.json({
        packages: getMockPackages(),
        addons: getMockAddons(),
        message: "Using mock data (development mode)",
      })
    }

    if (type === "packages") {
      const packages = await getPackages(db)
      return NextResponse.json({ packages })
    }

    if (type === "addons") {
      const addons = await getAddOns(db)
      return NextResponse.json({ addons })
    }

    // Return both by default
    const [packages, addons] = await Promise.all([getPackages(db), getAddOns(db)])

    return NextResponse.json({ packages, addons })
  } catch (error) {
    console.error("Error fetching data:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch data" }, { status: 500 })
  }
}

// Mock data for development
function getMockPackages(): Package[] {
  return [
    {
      id: 1,
      name: "Mint Pro",
      price: 299,
      duration_hours: 2,
      description: "Our entry-level package for small events or budgets.",
      features: [
        "2 Hours of Booth Rental",
        "Unlimited Digital Captures",
        "Fun Filters & Digital Stickers",
        "Standard Template Overlay",
        "LED Ring Light",
        "Standard Backdrop",
      ],
    },
    {
      id: 2,
      name: "Mint Max",
      price: 399,
      duration_hours: 3,
      description: "A longer session with extra flair for most events.",
      features: [
        "3 Hours of Booth Rental",
        "All Pro features, plus:",
        "Animated GIF Capture",
        "Glam B&W Filter & AR Masks",
        "Custom Event Overlay",
        "Color-Tunable LED Lighting",
      ],
    },
    {
      id: 3,
      name: "Mint Ultra",
      price: 599,
      duration_hours: 4,
      description: "The ultimate, all-inclusive photobooth experience.",
      features: [
        "4 Hours of Booth Rental",
        "All Max features, plus:",
        "HD Video Messages",
        "AI Green Screen Backgrounds",
        "Unlimited On-Site Prints",
        "Premium Backdrop Included",
        "Live Slideshow Feed",
      ],
    },
  ]
}

function getMockAddons(): AddOn[] {
  return [
    {
      id: 1,
      name: "Booth Attendant",
      price: 49,
      description: "Professional attendant per hour",
      category: "service",
      is_hourly: true,
      available_packages: [1, 2, 3],
    },
    {
      id: 2,
      name: "Guest Scrapbook Service",
      price: 119,
      description: "Physical scrapbook creation",
      category: "service",
      is_hourly: false,
      available_packages: [1, 2, 3],
    },
    {
      id: 3,
      name: "Live Slideshow Station",
      price: 119,
      description: "Real-time photo display",
      category: "equipment",
      is_hourly: false,
      available_packages: [1, 2],
    },
    {
      id: 4,
      name: "Unlimited Prints",
      price: 149,
      description: "On-site photo printing",
      category: "service",
      is_hourly: false,
      available_packages: [1, 2, 3],
    },
    {
      id: 5,
      name: "Green-Screen / AI Scene Pack",
      price: 79,
      description: "Digital background effects",
      category: "digital",
      is_hourly: false,
      available_packages: [1, 2],
    },
    {
      id: 6,
      name: "Idle / Early Setup",
      price: 49,
      description: "Setup time per hour",
      category: "service",
      is_hourly: true,
      available_packages: [1, 2, 3],
    },
    {
      id: 7,
      name: "Premium Backdrop",
      price: 99,
      description: "Upgraded backdrop option",
      category: "equipment",
      is_hourly: false,
      available_packages: [1, 2],
    },
    {
      id: 8,
      name: "Virtual Booth",
      price: 49,
      description: "Remote photo booth access",
      category: "digital",
      is_hourly: false,
      available_packages: [1, 2, 3],
    },
    {
      id: 9,
      name: "Additional Hour",
      price: 99,
      description: "Extend booth rental per hour",
      category: "service",
      is_hourly: true,
      available_packages: [1, 2, 3],
    },
  ]
}
