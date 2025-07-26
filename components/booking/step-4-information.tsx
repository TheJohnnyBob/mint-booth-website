"use client"

import type React from "react"
import type { BookingData } from "@/lib/types"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface Step4InformationProps {
  bookingData: BookingData
  formErrors: Record<string, string>
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
}

export function Step4Information({ bookingData, formErrors, onInputChange }: Step4InformationProps) {
  return (
    <div>
      <h3 className="text-2xl font-bold text-center mb-8">Your Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="customerName">Full Name *</Label>
          <Input
            id="customerName"
            name="customerName"
            value={bookingData.customerName}
            onChange={onInputChange}
            placeholder="Jane Doe"
          />
          {formErrors.customerName && <p className="text-red-500 text-xs">{formErrors.customerName}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="customerEmail">Email Address *</Label>
          <Input
            id="customerEmail"
            name="customerEmail"
            type="email"
            value={bookingData.customerEmail}
            onChange={onInputChange}
            placeholder="jane.doe@example.com"
          />
          {formErrors.customerEmail && <p className="text-red-500 text-xs">{formErrors.customerEmail}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="customerPhone">Phone Number</Label>
          <Input
            id="customerPhone"
            name="customerPhone"
            type="tel"
            value={bookingData.customerPhone}
            onChange={onInputChange}
            placeholder="(555) 123-4567"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="eventType">Event Type</Label>
          <Input
            id="eventType"
            name="eventType"
            value={bookingData.eventType}
            onChange={onInputChange}
            placeholder="Wedding, Birthday Party, etc."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="guestCount">Estimated Guest Count</Label>
          <Input
            id="guestCount"
            name="guestCount"
            type="number"
            value={bookingData.guestCount}
            onChange={onInputChange}
            placeholder="100"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="venueAddress">Venue Address</Label>
          <Input
            id="venueAddress"
            name="venueAddress"
            value={bookingData.venueAddress}
            onChange={onInputChange}
            placeholder="123 Main St, Anytown, USA"
          />
        </div>
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="specialRequests">Special Requests</Label>
          <Textarea
            id="specialRequests"
            name="specialRequests"
            value={bookingData.specialRequests}
            onChange={onInputChange}
            placeholder="Any special requirements or notes..."
          />
        </div>
      </div>
    </div>
  )
}
