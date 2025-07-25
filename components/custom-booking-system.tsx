"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Minus, Check, ArrowLeft, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface PackageType {
  id: number
  name: string
  price: number
  duration_hours: number
  description: string
  features: string[]
}

interface AddOn {
  id: number
  name: string
  price: number
  description: string
  category: string
  is_hourly: boolean
  available_packages: number[]
}

interface BookingData {
  customerName: string
  customerEmail: string
  customerPhone: string
  eventDate: string
  eventTime: string
  eventType: string
  guestCount: number
  venueAddress: string
  packageId: number
  selectedAddons: Record<number, number>
  specialRequests: string
}

const mockPackages: PackageType[] = [
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

const mockAddons: AddOn[] = [
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

export default function CustomBookingSystem() {
  const [currentStep, setCurrentStep] = useState(1)
  const [packages, setPackages] = useState<PackageType[]>(mockPackages)
  const [addons, setAddons] = useState<AddOn[]>(mockAddons)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingData, setBookingData] = useState<BookingData>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    eventDate: "",
    eventTime: "",
    eventType: "",
    guestCount: 0,
    venueAddress: "",
    packageId: 0,
    selectedAddons: {},
    specialRequests: "",
  })

  const selectedPackage = packages.find((p) => p.id === bookingData.packageId)
  const availableAddons = addons.filter((addon) => addon.available_packages.includes(bookingData.packageId))

  const calculateTotal = () => {
    let total = selectedPackage?.price || 0

    Object.entries(bookingData.selectedAddons).forEach(([addonId, quantity]) => {
      const addon = addons.find((a) => a.id === Number.parseInt(addonId))
      if (addon && quantity > 0) {
        const addonCost = addon.is_hourly
          ? addon.price * quantity * (selectedPackage?.duration_hours || 1)
          : addon.price * quantity
        total += addonCost
      }
    })

    return total
  }

  const handleAddonQuantityChange = (addonId: number, change: number) => {
    setBookingData((prev) => ({
      ...prev,
      selectedAddons: {
        ...prev.selectedAddons,
        [addonId]: Math.max(0, (prev.selectedAddons[addonId] || 0) + change),
      },
    }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      })

      const result = await response.json()

      if (result.success) {
        alert(`Booking confirmed! Reference: ${result.bookingReference}`)
        // Reset form
        setBookingData({
          customerName: "",
          customerEmail: "",
          customerPhone: "",
          eventDate: "",
          eventTime: "",
          eventType: "",
          guestCount: 0,
          venueAddress: "",
          packageId: 0,
          selectedAddons: {},
          specialRequests: "",
        })
        setCurrentStep(1)
      } else {
        alert(`Booking failed: ${result.message}`)
      }
    } catch (error) {
      console.error("Booking error:", error)
      alert("Booking failed. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return bookingData.packageId > 0
      case 2:
        return true // Add-ons are optional
      case 3:
        return bookingData.eventDate && bookingData.eventTime
      case 4:
        return bookingData.customerName && bookingData.customerEmail
      default:
        return false
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                step <= currentStep ? "bg-mint-500 border-mint-500 text-white" : "border-gray-300 text-gray-400"
              }`}
            >
              {step < currentStep ? <Check className="w-5 h-5" /> : step}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Package</span>
          <span>Add-ons</span>
          <span>Date & Time</span>
          <span>Details</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center mb-6">Choose Your Package</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {packages.map((pkg) => (
                  <Card
                    key={pkg.id}
                    className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                      bookingData.packageId === pkg.id ? "ring-2 ring-mint-500 bg-mint-50" : "hover:shadow-md"
                    }`}
                    onClick={() => setBookingData((prev) => ({ ...prev, packageId: pkg.id }))}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {pkg.name}
                        <span className="text-mint-600">${pkg.price}</span>
                      </CardTitle>
                      <CardDescription>{pkg.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {pkg.features.map((feature, index) => (
                          <li key={index} className="flex items-center text-sm">
                            <Check className="w-4 h-4 text-mint-500 mr-2 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center mb-6">Add-ons & Extras</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {availableAddons.map((addon) => (
                  <Card key={addon.id} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold">{addon.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{addon.description}</p>
                        <p className="text-mint-600 font-medium">
                          ${addon.price}
                          {addon.is_hourly ? "/hour" : ""}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddonQuantityChange(addon.id, -1)}
                          disabled={(bookingData.selectedAddons[addon.id] || 0) === 0}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center">{bookingData.selectedAddons[addon.id] || 0}</span>
                        <Button variant="outline" size="sm" onClick={() => handleAddonQuantityChange(addon.id, 1)}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center mb-6">Event Details</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="eventDate">Event Date</Label>
                    <Input
                      id="eventDate"
                      type="date"
                      value={bookingData.eventDate}
                      onChange={(e) => setBookingData((prev) => ({ ...prev, eventDate: e.target.value }))}
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  <div>
                    <Label htmlFor="eventTime">Event Time</Label>
                    <Input
                      id="eventTime"
                      type="time"
                      value={bookingData.eventTime}
                      onChange={(e) => setBookingData((prev) => ({ ...prev, eventTime: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="eventType">Event Type</Label>
                    <Input
                      id="eventType"
                      placeholder="Wedding, Birthday, Corporate, etc."
                      value={bookingData.eventType}
                      onChange={(e) => setBookingData((prev) => ({ ...prev, eventType: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="guestCount">Expected Guest Count</Label>
                    <Input
                      id="guestCount"
                      type="number"
                      min="1"
                      value={bookingData.guestCount || ""}
                      onChange={(e) =>
                        setBookingData((prev) => ({ ...prev, guestCount: Number.parseInt(e.target.value) || 0 }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="venueAddress">Venue Address</Label>
                    <Textarea
                      id="venueAddress"
                      placeholder="Full venue address including city and zip code"
                      value={bookingData.venueAddress}
                      onChange={(e) => setBookingData((prev) => ({ ...prev, venueAddress: e.target.value }))}
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center mb-6">Contact Information</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="customerName">Full Name *</Label>
                    <Input
                      id="customerName"
                      value={bookingData.customerName}
                      onChange={(e) => setBookingData((prev) => ({ ...prev, customerName: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerEmail">Email Address *</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={bookingData.customerEmail}
                      onChange={(e) => setBookingData((prev) => ({ ...prev, customerEmail: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerPhone">Phone Number</Label>
                    <Input
                      id="customerPhone"
                      type="tel"
                      value={bookingData.customerPhone}
                      onChange={(e) => setBookingData((prev) => ({ ...prev, customerPhone: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="specialRequests">Special Requests</Label>
                    <Textarea
                      id="specialRequests"
                      placeholder="Any special requirements or requests for your event"
                      value={bookingData.specialRequests}
                      onChange={(e) => setBookingData((prev) => ({ ...prev, specialRequests: e.target.value }))}
                      rows={5}
                    />
                  </div>
                </div>
              </div>

              {/* Booking Summary */}
              <Card className="bg-mint-50 border-mint-200">
                <CardHeader>
                  <CardTitle>Booking Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Package: {selectedPackage?.name}</span>
                      <span>${selectedPackage?.price}</span>
                    </div>
                    {Object.entries(bookingData.selectedAddons).map(([addonId, quantity]) => {
                      const addon = addons.find((a) => a.id === Number.parseInt(addonId))
                      if (!addon || quantity === 0) return null
                      const cost = addon.is_hourly
                        ? addon.price * quantity * (selectedPackage?.duration_hours || 1)
                        : addon.price * quantity
                      return (
                        <div key={addonId} className="flex justify-between text-sm">
                          <span>
                            {addon.name} x{quantity}
                          </span>
                          <span>${cost}</span>
                        </div>
                      )
                    })}
                    <div className="border-t pt-2 font-bold flex justify-between">
                      <span>Total</span>
                      <span>${calculateTotal()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
          className="flex items-center bg-transparent"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        {currentStep < 4 ? (
          <Button
            onClick={nextStep}
            disabled={!canProceed()}
            className="flex items-center bg-mint-600 hover:bg-mint-700"
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!canProceed() || isSubmitting}
            className="flex items-center bg-mint-600 hover:bg-mint-700"
          >
            {isSubmitting ? "Processing..." : "Confirm Booking"}
            <Check className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  )
}
