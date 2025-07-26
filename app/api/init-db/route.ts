import { NextResponse } from "next/server"
import { initializeDatabase } from "@/lib/database"

export async function POST() {
  try {
    const result = await initializeDatabase()

    return NextResponse.json({
      success: result.success,
      message:
        result.message || (result.success ? "Database initialized successfully" : "Database initialization failed"),
      error: result.error || null,
    })
  } catch (error) {
    console.error("Database initialization error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Database initialization failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
