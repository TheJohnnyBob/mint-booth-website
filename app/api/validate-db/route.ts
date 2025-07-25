import { NextResponse } from "next/server"
import { validateConnection } from "@/lib/database"

export async function GET() {
  try {
    const result = await validateConnection()

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Database connection successful!",
        tables: result.tables,
        status: "Connected to Neon database",
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Database connection failed",
          error: result.error,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Database validation error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to validate database connection",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
