import { NextResponse } from "next/server"
import { initializeDatabase, validateConnection } from "@/lib/database"

export async function POST() {
  try {
    // First validate the connection
    const connectionTest = await validateConnection()

    if (!connectionTest.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Database connection failed",
          error: connectionTest.error,
        },
        { status: 500 },
      )
    }

    // Initialize the database
    await initializeDatabase()

    return NextResponse.json({
      success: true,
      message: "Database initialized successfully",
      existingTables: connectionTest.tables,
      newTables: ["packages", "addons", "bookings"],
    })
  } catch (error) {
    console.error("Database initialization error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to initialize database",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return POST() // Allow GET requests for easy browser testing
}
