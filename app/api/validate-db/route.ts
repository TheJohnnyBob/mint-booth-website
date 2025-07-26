import { NextResponse } from "next/server"
import { validateConnection } from "@/lib/server/database"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const result = await validateConnection()
    return NextResponse.json({
      success: result.success,
      message: result.success ? "Database connection successful" : "Database connection failed",
      tables: result.tables || [],
      error: result.error || null,
    })
  } catch (error) {
    console.error("Database validation error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Database validation failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
