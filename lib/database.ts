// Database utility functions for Cloudflare D1

export interface Package {
  id: number
  name: string
  price: number
  duration_hours: number
  description: string
  features: string[] // Will be parsed from JSON
}

export interface AddOn {
  id: number
  name: string
  price: number
  description: string
  category: string
  is_hourly: boolean // Will be converted from integer
  available_packages: number[] // Will be parsed from JSON
}

export interface Booking {
  id: number
  booking_reference: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  event_date: string
  event_time: string
  event_type?: string
  guest_count?: number
  venue_address?: string
  package_id: number
  selected_addons: Record<number, number> // Will be parsed from JSON
  subtotal: number
  total_amount: number
  status: string
  special_requests?: string
  created_at: string
}

// Get database instance (this will be available in Cloudflare Workers)
export function getDatabase() {
  // In Cloudflare Workers, D1 databases are available as bindings
  // The actual database will be bound to the environment
  if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
    // For local development, you might want to use a different approach
    console.warn("Database connection not available in development mode")
    return null
  }

  // In production, this will be available as env.DB or similar
  return null // This will be replaced with actual D1 binding
}

// Fetch all packages from database
export async function getPackages(db: any): Promise<Package[]> {
  try {
    const { results } = await db.prepare("SELECT * FROM packages ORDER BY price ASC").all()

    return results.map((row: any) => ({
      ...row,
      features: JSON.parse(row.features || "[]"),
    }))
  } catch (error) {
    console.error("Error fetching packages:", error)
    throw new Error("Failed to fetch packages")
  }
}

// Fetch all add-ons from database
export async function getAddOns(db: any): Promise<AddOn[]> {
  try {
    const { results } = await db.prepare("SELECT * FROM addons ORDER BY category, name").all()

    return results.map((row: any) => ({
      ...row,
      is_hourly: Boolean(row.is_hourly),
      available_packages: JSON.parse(row.available_packages || "[]"),
    }))
  } catch (error) {
    console.error("Error fetching add-ons:", error)
    throw new Error("Failed to fetch add-ons")
  }
}

// Create a new booking
export async function createBooking(db: any, bookingData: Omit<Booking, "id" | "created_at">): Promise<string> {
  try {
    const stmt = db.prepare(`
      INSERT INTO bookings (
        booking_reference, customer_name, customer_email, customer_phone,
        event_date, event_time, event_type, guest_count, venue_address,
        package_id, selected_addons, subtotal, total_amount, status, special_requests
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const result = await stmt
      .bind(
        bookingData.booking_reference,
        bookingData.customer_name,
        bookingData.customer_email,
        bookingData.customer_phone || null,
        bookingData.event_date,
        bookingData.event_time,
        bookingData.event_type || null,
        bookingData.guest_count || null,
        bookingData.venue_address || null,
        bookingData.package_id,
        JSON.stringify(bookingData.selected_addons),
        bookingData.subtotal,
        bookingData.total_amount,
        bookingData.status,
        bookingData.special_requests || null,
      )
      .run()

    if (!result.success) {
      throw new Error("Failed to create booking")
    }

    return bookingData.booking_reference
  } catch (error) {
    console.error("Error creating booking:", error)
    throw new Error("Failed to create booking")
  }
}

// Check if a date/time slot is available
export async function checkAvailability(db: any, date: string, time: string): Promise<boolean> {
  try {
    const { results } = await db
      .prepare(`
      SELECT COUNT(*) as count FROM bookings 
      WHERE event_date = ? AND event_time = ? AND status != 'cancelled'
    `)
      .bind(date, time)
      .all()

    return results[0].count === 0
  } catch (error) {
    console.error("Error checking availability:", error)
    return false
  }
}

// Get booking by reference
export async function getBookingByReference(db: any, reference: string): Promise<Booking | null> {
  try {
    const { results } = await db
      .prepare(`
      SELECT * FROM bookings WHERE booking_reference = ?
    `)
      .bind(reference)
      .all()

    if (results.length === 0) return null

    const booking = results[0]
    return {
      ...booking,
      selected_addons: JSON.parse(booking.selected_addons || "{}"),
    }
  } catch (error) {
    console.error("Error fetching booking:", error)
    return null
  }
}

// Generate unique booking reference
export function generateBookingReference(): string {
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `MB${timestamp}${random}`
}
