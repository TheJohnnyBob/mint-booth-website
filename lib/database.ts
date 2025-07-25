import { neon } from "@neondatabase/serverless"

export interface Package {
  id: number
  name: string
  price: number
  duration_hours: number
  description: string
  features: string[]
}

export interface AddOn {
  id: number
  name: string
  price: number
  description: string
  category: string
  is_hourly: boolean
  available_packages: number[]
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
  selected_addons: Record<number, number>
  subtotal: number
  total_amount: number
  status: string
  special_requests?: string
  created_at: string
}

// Initialize Neon connection
const sql = neon(process.env.DATABASE_URL!)

// Validate database connection and check existing schema
export async function validateConnection() {
  try {
    // Test connection by checking existing tables
    const tables = await sql`
      SELECT table_name, table_schema 
      FROM information_schema.tables 
      WHERE table_schema IN ('public', 'neon_auth')
      ORDER BY table_schema, table_name
    `

    console.log("Database connection successful!")
    console.log("Existing tables:", tables)

    return {
      success: true,
      tables: tables.map((t) => `${t.table_schema}.${t.table_name}`),
    }
  } catch (error) {
    console.error("Database connection failed:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// Initialize database tables (run once)
export async function initializeDatabase() {
  try {
    // First validate connection
    const connectionTest = await validateConnection()
    if (!connectionTest.success) {
      throw new Error(`Database connection failed: ${connectionTest.error}`)
    }

    // Create packages table
    await sql`
      CREATE TABLE IF NOT EXISTS packages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        duration_hours INTEGER NOT NULL,
        description TEXT,
        features TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create addons table
    await sql`
      CREATE TABLE IF NOT EXISTS addons (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        is_hourly BOOLEAN DEFAULT FALSE,
        available_packages TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create bookings table
    await sql`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        booking_reference VARCHAR(50) UNIQUE NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50),
        event_date DATE NOT NULL,
        event_time TIME NOT NULL,
        event_type VARCHAR(100),
        guest_count INTEGER,
        venue_address TEXT,
        package_id INTEGER NOT NULL,
        selected_addons TEXT,
        subtotal DECIMAL(10,2) NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        special_requests TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (package_id) REFERENCES packages (id)
      )
    `

    // Check if packages exist, if not, seed them
    const existingPackages = await sql`SELECT COUNT(*) as count FROM packages`

    if (existingPackages[0].count === 0) {
      await seedDatabase()
    }

    console.log("Database initialized successfully")
    return { success: true }
  } catch (error) {
    console.error("Database initialization error:", error)
    throw error
  }
}

// Seed database with initial data
export async function seedDatabase() {
  try {
    // Insert packages
    await sql`
      INSERT INTO packages (id, name, price, duration_hours, description, features) VALUES
      (1, 'Mint Pro', 299.00, 2, 'Our entry-level package for small events or budgets.', 
       '["2 Hours of Booth Rental", "Unlimited Digital Captures", "Fun Filters & Digital Stickers", "Standard Template Overlay", "LED Ring Light", "Standard Backdrop"]'),
      (2, 'Mint Max', 399.00, 3, 'A longer session with extra flair for most events.',
       '["3 Hours of Booth Rental", "All Pro features, plus:", "Animated GIF Capture", "Glam B&W Filter & AR Masks", "Custom Event Overlay", "Color-Tunable LED Lighting"]'),
      (3, 'Mint Ultra', 599.00, 4, 'The ultimate, all-inclusive photobooth experience.',
       '["4 Hours of Booth Rental", "All Max features, plus:", "HD Video Messages", "AI Green Screen Backgrounds", "Unlimited On-Site Prints", "Premium Backdrop Included", "Live Slideshow Feed"]')
      ON CONFLICT (id) DO NOTHING
    `

    // Insert add-ons
    await sql`
      INSERT INTO addons (id, name, price, description, category, is_hourly, available_packages) VALUES
      (1, 'Booth Attendant', 49.00, 'Professional attendant per hour', 'service', TRUE, '[1,2,3]'),
      (2, 'Guest Scrapbook Service', 119.00, 'Physical scrapbook creation', 'service', FALSE, '[1,2,3]'),
      (3, 'Live Slideshow Station', 119.00, 'Real-time photo display', 'equipment', FALSE, '[1,2]'),
      (4, 'Unlimited Prints', 149.00, 'On-site photo printing', 'service', FALSE, '[1,2,3]'),
      (5, 'Green-Screen / AI Scene Pack', 79.00, 'Digital background effects', 'digital', FALSE, '[1,2]'),
      (6, 'Idle / Early Setup', 49.00, 'Setup time per hour', 'service', TRUE, '[1,2,3]'),
      (7, 'Premium Backdrop', 99.00, 'Upgraded backdrop option', 'equipment', FALSE, '[1,2]'),
      (8, 'Virtual Booth', 49.00, 'Remote photo booth access', 'digital', FALSE, '[1,2,3]'),
      (9, 'Additional Hour', 99.00, 'Extend booth rental per hour', 'service', TRUE, '[1,2,3]')
      ON CONFLICT (id) DO NOTHING
    `

    console.log("Database seeded successfully")
    return { success: true }
  } catch (error) {
    console.error("Database seeding error:", error)
    throw error
  }
}

// Fetch all packages from database
export async function getPackages(): Promise<Package[]> {
  try {
    const rows = await sql`SELECT * FROM packages ORDER BY price ASC`

    return rows.map((row: any) => ({
      ...row,
      features: JSON.parse(row.features || "[]"),
    }))
  } catch (error) {
    console.error("Error fetching packages:", error)
    // Fallback to mock data if database fails
    return getMockPackages()
  }
}

// Fetch all add-ons from database
export async function getAddOns(): Promise<AddOn[]> {
  try {
    const rows = await sql`SELECT * FROM addons ORDER BY category, name`

    return rows.map((row: any) => ({
      ...row,
      is_hourly: Boolean(row.is_hourly),
      available_packages: JSON.parse(row.available_packages || "[]"),
    }))
  } catch (error) {
    console.error("Error fetching add-ons:", error)
    // Fallback to mock data if database fails
    return getMockAddons()
  }
}

// Create a new booking
export async function createBooking(bookingData: Omit<Booking, "id" | "created_at">): Promise<string> {
  try {
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
  } catch (error) {
    console.error("Error creating booking:", error)
    throw new Error("Failed to create booking")
  }
}

// Check availability
export async function checkAvailability(date: string, time: string): Promise<boolean> {
  try {
    const rows = await sql`
      SELECT COUNT(*) as count FROM bookings 
      WHERE event_date = ${date} AND event_time = ${time} AND status != 'cancelled'
    `

    return rows[0].count === 0
  } catch (error) {
    console.error("Error checking availability:", error)
    return true // Default to available if check fails
  }
}

// Get booking by reference
export async function getBookingByReference(reference: string): Promise<Booking | null> {
  try {
    const rows = await sql`
      SELECT * FROM bookings WHERE booking_reference = ${reference}
    `

    if (rows.length === 0) return null

    const booking = rows[0]
    return {
      ...booking,
      selected_addons: JSON.parse(booking.selected_addons || "{}"),
    }
  } catch (error) {
    console.error("Error fetching booking:", error)
    return null
  }
}

// Get all bookings for admin
export async function getAllBookings(): Promise<Booking[]> {
  try {
    const rows = await sql`
      SELECT 
        b.*,
        p.name as package_name,
        p.price as package_price
      FROM bookings b
      LEFT JOIN packages p ON b.package_id = p.id
      ORDER BY b.created_at DESC
      LIMIT 50
    `

    return rows.map((booking: any) => ({
      ...booking,
      selected_addons: JSON.parse(booking.selected_addons || "{}"),
    }))
  } catch (error) {
    console.error("Error fetching bookings:", error)
    return []
  }
}

// Generate unique booking reference
export function generateBookingReference(): string {
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `MB${timestamp}${random}`
}

// Fallback mock data functions
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
