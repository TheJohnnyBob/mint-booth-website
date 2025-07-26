"use client"

import type React from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface Step3DateTimeProps {
  eventDate: string
  eventTime: string
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
}

const generateTimeSlots = (): string[] => {
  const slots = []
  for (let hour = 9; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const date = new Date(1970, 0, 1, hour, minute)
      slots.push(date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }))
    }
  }
  return slots
}

export function Step3DateTime({ eventDate, eventTime, onInputChange }: Step3DateTimeProps) {
  return (
    <div>
      <h3 className="text-2xl font-bold text-center mb-8">Select Date & Time</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <Label htmlFor="eventDate" className="text-base font-semibold">
            Event Date *
          </Label>
          <Input
            id="eventDate"
            name="eventDate"
            type="date"
            value={eventDate}
            onChange={onInputChange}
            className="mt-2 bg-white h-12"
            min={new Date().toISOString().split("T")[0]}
            required
          />
        </div>
        <div>
          <Label htmlFor="eventTime" className="text-base font-semibold">
            Start Time *
          </Label>
          <select
            id="eventTime"
            name="eventTime"
            value={eventTime}
            onChange={onInputChange}
            className="mt-2 w-full p-3 border border-gray-300 rounded-lg bg-white h-12"
            required
          >
            <option value="">Select time</option>
            {generateTimeSlots().map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
