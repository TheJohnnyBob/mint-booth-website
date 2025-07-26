import { neon } from "@neondatabase/serverless"
import type { Package, AddOn, Booking } from "@/lib/types"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

export const sql = neon(process.env.DATABASE_URL)

export async function validateConnection() {
  try {
    const tables = await sql`
      SELECT table_name, table_schema 
      FROM information_schema.tables 
      WHERE table_schema IN ('public', 'neon_auth')
      ORDER BY table_schema, table_name
    `
    return {
      success: true,
      tables: tables.map((t: any) => `${t.table_schema}.${t.table_name}`),
    }
  } catch (error) {
    console.error("Database connection failed:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function initializeDatabase() {
  try {
    const connectionTest = await validateConnection()
    if (!connectionTest.success) {
      throw new Error(`Database connection failed: ${connectionTest.error}`)
    }

    await sql`CREATE TABLE IF NOT EXISTS packages (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, price INTEGER NOT NULL, duration_hours INTEGER NOT NULL, description TEXT, features TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`
    await sql`CREATE TABLE IF NOT EXISTS addons (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, price INTEGER NOT NULL, description TEXT, category VARCHAR(100), is_hourly BOOLEAN DEFAULT FALSE, available_packages TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`
    await sql`CREATE TABLE IF NOT EXISTS bookings (id SERIAL PRIMARY KEY, booking_reference VARCHAR(50) UNIQUE NOT NULL, customer_name VARCHAR(255) NOT NULL, customer_email VARCHAR(255) NOT NULL, customer_phone VARCHAR(50), event_date DATE NOT NULL, event_time TIME NOT NULL, event_type VARCHAR(100), guest_count INTEGER, venue_address TEXT, package_id INTEGER NOT NULL, selected_addons TEXT, subtotal INTEGER NOT NULL, total_amount INTEGER NOT NULL, status VARCHAR(50) DEFAULT 'pending', special_requests TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (package_id) REFERENCES packages (id))`
    await sql`CREATE INDEX IF NOT EXISTS idx_bookings_event_date_time ON bookings (event_date, event_time)`
    await sql`CREATE TABLE IF NOT EXISTS availability (id SERIAL PRIMARY KEY, date DATE NOT NULL, time_slot TIME NOT NULL, is_available BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(date, time_slot))`

    const existingPackages = await sql`SELECT COUNT(*) as count FROM packages`
    if (Number(existingPackages[0].count) === 0) {
      await seedDatabase()
    }

    return { success: true, message: "Database initialized successfully" }
  } catch (error) {
    console.error("Database initialization error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function seedDatabase() {
  try {
    // Prices are in cents
    await sql`
      INSERT INTO packages (id, name, price, duration_hours, description, features) VALUES
      (1, 'Mint Pro', 29900, 2, 'Our entry-level package for small events or budgets.', '["2 Hours of Booth Rental", "Unlimited Digital Captures", "Fun Filters & Digital Stickers", "Standard Template Overlay", "LED Ring Light", "Standard Backdrop"]'),
      (2, 'Mint Max', 39900, 3, 'A longer session with extra flair for most events.', '["3 Hours of Booth Rental", "All Pro features, plus:", "Animated GIF Capture", "Glam B&W Filter & AR Masks", "Custom Event Overlay", "Color-Tunable LED Lighting"]'),
      (3, 'Mint Ultra', 59900, 4, 'The ultimate, all-inclusive photobooth experience.', '["4 Hours of Booth Rental", "All Max features, plus:", "HD Video Messages", "AI Green Screen Backgrounds", "Unlimited On-Site Prints", "Premium Backdrop Included", "Live Slideshow Feed"]')
      ON CONFLICT (id) DO NOTHING
    `
    await sql`
      INSERT INTO addons (id, name, price, description, category, is_hourly, available_packages) VALUES
      (1, 'Booth Attendant', 4900, 'Professional attendant per hour', 'service', TRUE, '[1,2,3]'),
      (2, 'Guest Scrapbook Service', 11900, 'Physical scrapbook creation', 'service', FALSE, '[1,2,3]'),
      (3, 'Live Slideshow Station', 11900, 'Real-time photo display', 'equipment', FALSE, '[1,2]'),
      (4, 'Unlimited Prints', 14900, 'On-site photo printing', 'service', FALSE, '[1,2,3]'),
      (5, 'Green-Screen / AI Scene Pack', 7900, 'Digital background effects', 'digital', FALSE, '[1,2]'),
      (6, 'Idle / Early Setup', 4900, 'Setup time per hour', 'service', TRUE, '[1,2,3]'),
      (7, 'Premium Backdrop', 9900, 'Upgraded backdrop option', 'equipment', FALSE, '[1,2]'),
      (8, 'Virtual Booth', 4900, 'Remote photo booth access', 'digital', FALSE, '[1,2,3]'),
      (9, 'Additional Hour', 9900, 'Extend booth rental per hour', 'service', TRUE, '[1,2,3]')
      ON CONFLICT (id) DO NOTHING
    `
    return { success: true }
  } catch (error) {
    console.error("Database seeding error:", error)
    throw error
  }
}

export async function getPackages(): Promise<Package[]> {
  const rows = await sql<any[]>`SELECT * FROM packages ORDER BY price ASC`
  return rows.map((row) => {
    let features = []
    try {
      if (row.features) features = JSON.parse(row.features)
    } catch (e) {
      console.error(`Failed to parse features for package ${row.id}:`, e)
    }
    return {
      ...row,
      price: Number(row.price),
      duration_hours: Number(row.duration_hours),
      features,
    }
  })
}

export async function getAddOns(): Promise<AddOn[]> {
  const rows = await sql<any[]>`SELECT * FROM addons ORDER BY category, name`
  return rows.map((row) => {
    let available_packages = []
    try {
      if (row.available_packages) available_packages = JSON.parse(row.available_packages)
    } catch (e) {
      console.error(`Failed to parse available_packages for addon ${row.id}:`, e)
    }
    return {
      ...row,
      price: Number(row.price),
      is_hourly: Boolean(row.is_hourly),
      available_packages,
    }
  })
}

export async function createBooking(bookingData: Omit<Booking, "id" | "created_at" | "updated_at">): Promise<string> {
  await sql`
    INSERT INTO bookings (
      booking_reference, customer_name, customer_email, customer_phone,
      event_date, event_time, event_type, guest_count, venue_address,
      package_id, selected_addons, subtotal, total_amount, status, special_requests
    ) VALUES (
      ${bookingData.booking_reference}, ${bookingData.customer_name}, 
      ${bookingData.customer_email}, ${bookingData.customer_phone || null},
      ${bookingData.event_date}, ${bookingData.event_time}, 
      ${bookingData.event_type || null}, ${bookingData.guest_count || null}, 
      ${bookingData.venue_address || null}, ${bookingData.package_id},
      ${JSON.stringify(bookingData.selected_addons)}, ${bookingData.subtotal},
      ${bookingData.total_amount}, ${bookingData.status}, 
      ${bookingData.special_requests || null}
    )
  `
  return bookingData.booking_reference
}

export async function checkAvailability(date: string, time: string): Promise<boolean> {
  const rows = await sql`
    SELECT COUNT(*) as count FROM bookings 
    WHERE event_date = ${date} AND event_time = ${time} AND status != 'cancelled'
  `
  return Number(rows[0].count) === 0
}

export async function getAllBookings(): Promise<Booking[]> {
  const rows = await sql`
    SELECT b.*, p.name as package_name
    FROM bookings b
    JOIN packages p ON b.package_id = p.id
    ORDER BY b.event_date DESC, b.event_time DESC
  `
  return rows.map((row: any) => ({
    ...row,
    selected_addons: JSON.parse(row.selected_addons || "{}"),
  }))
}

export function generateBookingReference(): string {
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `MB${timestamp}${random}`
}
