import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const db = (request as any).env?.DB || null

    if (!db) {
      return NextResponse.json({
        bookings: [],
        message: "Database not available (development mode)",
      })
    }

    // Fetch all bookings with package information
    const { results } = await db
      .prepare(`
      SELECT 
        b.*,
        p.name as package_name,
        p.price as package_price
      FROM bookings b
      LEFT JOIN packages p ON b.package_id = p.id
      ORDER BY b.created_at DESC
      LIMIT 50
    `)
      .all()

    const bookings = results.map((booking: any) => ({
      ...booking,
      selected_addons: JSON.parse(booking.selected_addons || "{}"),
    }))

    return NextResponse.json({
      bookings,
      total: bookings.length,
    })
  } catch (error) {
    console.error("Error fetching bookings:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch bookings" }, { status: 500 })
  }
}
