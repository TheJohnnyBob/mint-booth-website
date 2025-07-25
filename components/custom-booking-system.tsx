"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, Clock } from "lucide-react"
import { CardContent } from "@/components/ui/card"

// Update the Package and AddOn interfaces to match the database types:
interface Package {
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
  guestCount: string
  venueAddress: string
  packageId: number
  selectedAddons: number[]
  specialRequests: string
}

// Update the AddOn interface and add quantity management

// Remove the hardcoded packages and addOns arrays and replace with state:
export default function CustomBookingSystem() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [packages, setPackages] = useState<Package[]>([])
  const [addOns, setAddOns] = useState<AddOn[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Add useEffect to fetch data from API:
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/bookings")

        if (!response.ok) {
          throw new Error("Failed to fetch data")
        }

        const data = await response.json()
        setPackages(data.packages || [])
        setAddOns(data.addons || [])
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Failed to load booking data. Please refresh the page.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const [bookingData, setBookingData] = useState<BookingData>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    eventDate: "",
    eventTime: "",
    eventType: "",
    guestCount: "",
    venueAddress: "",
    packageId: 0,
    selectedAddons: [],
    specialRequests: "",
  })

  // Add state for addon quantities and last selected quantities
  const [selectedAddons, setSelectedAddons] = useState<number[]>([])
  const [addonQuantities, setAddonQuantities] = useState<Record<number, number>>({})
  const [lastSelectedQuantities, setLastSelectedQuantities] = useState<Record<number, number>>({})

  // Helper function implementations
  const getAdditionalHours = (quantities: Record<number, number>): number => {
    return quantities[9] || 0 // Additional Hour addon ID is 9
  }

  const getTotalHours = (packageId: number, additionalHours: number): number => {
    const baseHours = selectedPackage?.duration_hours || 0
    return baseHours + additionalHours
  }

  const getMaxAllowedHours = (addonId: number, totalHours: number): number => {
    if (addonId === 1) {
      // Booth Attendant
      return totalHours // Can't exceed total event time
    }
    if (addonId === 6) {
      // Idle / Early Setup
      return 2 // Maximum 2 hours of setup time
    }
    return 10 // Default max for other hourly addons
  }

  const validateAddonHours = (quantities: Record<number, number>, totalHours: number): number[] => {
    const violations: number[] = []

    Object.entries(quantities).forEach(([addonIdStr, quantity]) => {
      const addonId = Number.parseInt(addonIdStr)
      const addon = addOns.find((a) => a.id === addonId)

      if (addon?.is_hourly && addonId !== 9) {
        // Skip Additional Hour
        const maxAllowed = getMaxAllowedHours(addonId, totalHours)
        if (quantity > maxAllowed) {
          violations.push(addonId)
        }
      }
    })

    return violations
  }

  const hasValidationErrors = (quantities: Record<number, number>, packageId: number): boolean => {
    const additionalHours = getAdditionalHours(quantities)
    const totalHours = getTotalHours(packageId, additionalHours)
    const violations = validateAddonHours(quantities, totalHours)
    return violations.length > 0
  }

  const generateTimeSlots = (): string[] => {
    const slots = []
    for (let hour = 9; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time24 = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
        const time12 = formatTimeTo12Hour(time24)
        slots.push(time12)
      }
    }
    return slots
  }

  const formatTimeTo12Hour = (time24: string): string => {
    if (!time24) return ""

    const [hours, minutes] = time24.split(":")
    const hour24 = Number.parseInt(hours)
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24
    const ampm = hour24 >= 12 ? "PM" : "AM"

    return `${hour12}:${minutes} ${ampm}`
  }

  const convertTo24Hour = (time12: string): string => {
    if (!time12) return ""

    const [time, ampm] = time12.split(" ")
    const [hours, minutes] = time.split(":")
    let hour24 = Number.parseInt(hours)

    if (ampm === "PM" && hour24 !== 12) {
      hour24 += 12
    } else if (ampm === "AM" && hour24 === 12) {
      hour24 = 0
    }

    return `${hour24.toString().padStart(2, "0")}:${minutes}`
  }

  // Update the calculateTotal function to handle quantities
  const calculateTotal = () => {
    const packagePrice = selectedPackage?.price || 0
    const addonsPrice = selectedAddons.reduce((total, addonId) => {
      const addon = addOns.find((a) => a.id === addonId)
      if (!addon) return total

      const quantity = addonQuantities[addonId] || 1
      return total + addon.price * quantity
    }, 0)
    return packagePrice + addonsPrice
  }

  // Update the toggleAddon function to handle quantities
  const toggleAddon = (addonId: number) => {
    const addon = addOns.find((a) => a.id === addonId)
    if (!addon) return

    setSelectedAddons((prev) => {
      if (prev.includes(addonId)) {
        // Store the current quantity before removing
        setLastSelectedQuantities((prevLast) => ({
          ...prevLast,
          [addonId]: addonQuantities[addonId] || 1,
        }))

        // Remove from selected and quantities
        setAddonQuantities((prevQty) => {
          const newQty = { ...prevQty }
          delete newQty[addonId]
          return newQty
        })

        return prev.filter((id) => id !== addonId)
      } else {
        // Add to selected and restore last quantity or default to 1
        const lastQuantity = lastSelectedQuantities[addonId] || 1
        setAddonQuantities((prevQty) => ({
          ...prevQty,
          [addonId]: lastQuantity,
        }))

        return [...prev, addonId]
      }
    })
  }

  // Update the updateAddonQuantity function
  const updateAddonQuantity = (addonId: number, change: number) => {
    setAddonQuantities((prev) => {
      const currentQty = prev[addonId] || 1
      let newQty = Math.max(1, currentQty + change)

      // For Additional Hours, we don't apply constraints here
      // but we'll validate other addons after the change
      if (addonId === 9) {
        // Additional Hour
        return {
          ...prev,
          [addonId]: newQty,
        }
      }

      // For other hourly addons, apply constraints
      const additionalHours = getAdditionalHours(prev)
      const totalHours = getTotalHours(selectedPackage?.id || 0, additionalHours)
      const maxAllowed = getMaxAllowedHours(addonId, totalHours)

      newQty = Math.min(newQty, maxAllowed)

      return {
        ...prev,
        [addonId]: newQty,
      }
    })
  }

  // Update the getAvailableAddons function to use the fetched data:
  const getAvailableAddons = () => {
    if (!selectedPackage) return []
    return addOns.filter((addon) => addon.available_packages.includes(selectedPackage.id))
  }

  const handleSubmit = async () => {
    if (!selectedPackage) return

    // Update the final booking data to include quantities
    const finalBookingData = {
      ...bookingData,
      packageId: selectedPackage.id,
      selectedAddons: selectedAddons,
      addonQuantities: addonQuantities, // Add this line
    }

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalBookingData),
      })

      if (response.ok) {
        const result = await response.json()
        setCurrentStep(5) // Success step
      } else {
        console.error("Booking failed")
      }
    } catch (error) {
      console.error("Error submitting booking:", error)
    }
  }

  // Add loading and error states at the beginning of the render:
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="glass-card glass-highlight p-8 rounded-3xl">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0ABAB5] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading booking system...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="glass-card glass-highlight p-8 rounded-3xl">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl">⚠️</span>
            </div>
            <h3 className="text-xl font-bold text-red-600 mb-2">Error Loading Booking System</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="btn-mint px-6 py-2 rounded-lg text-white">
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex justify-center items-center gap-4">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step ? "btn-mint text-white" : "bg-gray-200 text-gray-600"
                }`}
              >
                {step}
              </div>
              {step < 4 && <div className={`w-12 h-0.5 mx-2 ${currentStep > step ? "bg-[#0ABAB5]" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>
        <div className="text-center mt-4 text-sm text-gray-600">
          {currentStep === 1 && "Choose Your Package"}
          {currentStep === 2 && "Select Add-Ons"}
          {currentStep === 3 && "Pick Date & Time"}
          {currentStep === 4 && "Your Information"}
          {currentStep === 5 && "Booking Confirmed!"}
        </div>
      </div>

      <div className="glass-card glass-highlight p-8 rounded-3xl">
        {/* Step 1: Package Selection */}
        {currentStep === 1 && (
          <div>
            <h3 className="text-2xl font-bold text-center mb-8">Choose Your Package</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`cursor-pointer transition-all duration-300 ${
                    selectedPackage?.id === pkg.id
                      ? "glass-card-mint glass-highlight-mint scale-105 shadow-2xl"
                      : "glass-card glass-highlight hover:scale-105"
                  }`}
                  onClick={() => setSelectedPackage(pkg)}
                >
                  <CardContent className="p-6">
                    <h4 className="text-xl font-bold text-center">{pkg.name}</h4>
                    <p className="text-3xl font-bold text-center mt-4" style={{ color: "#0ABAB5" }}>
                      ${pkg.price}
                    </p>
                    <p className="text-gray-500 text-center mt-2">{pkg.description}</p>
                    <ul className="mt-6 space-y-3">
                      {pkg.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: "#0ABAB5" }} />
                          <span className="text-sm text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Button
                onClick={() => setCurrentStep(2)}
                disabled={!selectedPackage}
                size="lg"
                className="btn-mint rounded-xl h-12 px-8"
              >
                Continue to Add-Ons
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Add-Ons Selection */}
        {currentStep === 2 && (
          <div>
            <h3 className="text-2xl font-bold text-center mb-2">Enhance Your Experience</h3>
            <p className="text-center text-gray-600 mb-8">Select any add-ons to customize your package</p>
            // In Step 2: Add-Ons Selection, replace the add-ons grid with:
            <div className="grid grid-cols-1 gap-4 mb-8">
              {getAvailableAddons().map((addon) => {
                const additionalHours = getAdditionalHours(addonQuantities)
                const totalHours = getTotalHours(selectedPackage?.id || 0, additionalHours)
                const violations = validateAddonHours(addonQuantities, totalHours)
                const hasViolation = violations.includes(addon.id)
                const currentQuantity = addonQuantities[addon.id] || 1
                const maxAllowed = getMaxAllowedHours(addon.id, totalHours)

                return (
                  <div
                    key={addon.id}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedAddons.includes(addon.id)
                        ? hasViolation
                          ? "border-red-500 bg-red-50"
                          : "border-[#0ABAB5] bg-[#0ABAB5]/10"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer ${
                              selectedAddons.includes(addon.id)
                                ? hasViolation
                                  ? "border-red-500 bg-red-500"
                                  : "border-[#0ABAB5] bg-[#0ABAB5]"
                                : "border-gray-300"
                            }`}
                            onClick={() => toggleAddon(addon.id)}
                          >
                            {selectedAddons.includes(addon.id) && <CheckCircle className="h-4 w-4 text-white" />}
                          </div>
                          <div>
                            <h4 className={`font-semibold ${hasViolation ? "text-red-600" : ""}`}>{addon.name}</h4>
                            <p className={`text-sm ${hasViolation ? "text-red-500" : "text-gray-600"}`}>
                              {addon.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Quantity controls for hourly add-ons */}
                        {addon.is_hourly && selectedAddons.includes(addon.id) && (
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
                              <button
                                onClick={() => updateAddonQuantity(addon.id, -1)}
                                className="w-8 h-8 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold"
                                disabled={currentQuantity <= 1}
                              >
                                -
                              </button>
                              <span className={`w-8 text-center font-semibold ${hasViolation ? "text-red-600" : ""}`}>
                                {currentQuantity}
                              </span>
                              <button
                                onClick={() => updateAddonQuantity(addon.id, 1)}
                                className="w-8 h-8 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold"
                                disabled={addon.id !== 9 && currentQuantity >= maxAllowed} // Don't disable for Additional Hours
                              >
                                +
                              </button>
                            </div>

                            {/* Show constraint info with validation */}
                            {addon.id === 1 && ( // Booth Attendant
                              <div className={`text-xs ${hasViolation ? "text-red-500 font-medium" : "text-gray-500"}`}>
                                {hasViolation ? (
                                  <>
                                    ⚠️ Exceeds limit: {currentQuantity}/{maxAllowed} hrs
                                    <br />
                                    <span className="font-semibold">
                                      Reduce to {maxAllowed} hours or add more event time
                                    </span>
                                  </>
                                ) : (
                                  `Max: ${maxAllowed} hrs (total event time)`
                                )}
                              </div>
                            )}
                            {addon.id === 6 && ( // Idle / Early Setup
                              <div className={`text-xs ${hasViolation ? "text-red-500 font-medium" : "text-gray-500"}`}>
                                {hasViolation ? (
                                  <>
                                    ⚠️ Exceeds limit: {currentQuantity}/{maxAllowed} hrs
                                    <br />
                                    <span className="font-semibold">Reduce to {maxAllowed} hours maximum</span>
                                  </>
                                ) : (
                                  `Max: ${maxAllowed} hrs`
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="text-right">
                          <span
                            className={`font-bold text-lg ${hasViolation ? "text-red-600" : ""}`}
                            style={{ color: hasViolation ? "#dc2626" : "#0ABAB5" }}
                          >
                            ${addon.price}
                            {addon.is_hourly && "/hr"}
                          </span>
                          {addon.is_hourly && selectedAddons.includes(addon.id) && (
                            <div className={`text-sm ${hasViolation ? "text-red-600" : "text-gray-600"}`}>
                              Total: ${addon.price * currentQuantity}
                              {hasViolation && (
                                <div className="text-xs text-red-500 font-medium">(Cannot be honored)</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            {/* Add validation warning banner */}
            {(() => {
              const additionalHours = getAdditionalHours(addonQuantities)
              const totalHours = getTotalHours(selectedPackage?.id || 0, additionalHours)
              const violations = validateAddonHours(addonQuantities, totalHours)

              if (violations.length > 0) {
                return (
                  <div className="mb-8 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-sm font-bold">!</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-red-800 mb-2">Configuration Error</h4>
                        <p className="text-red-700 text-sm mb-3">
                          Some add-ons exceed your total event time. Please adjust the hours or add more event time to
                          continue.
                        </p>
                        <div className="space-y-1">
                          {violations.map((addonId) => {
                            const addon = addOns.find((a) => a.id === addonId)
                            const currentQty = addonQuantities[addonId] || 1
                            const maxAllowed = getMaxAllowedHours(addonId, totalHours)

                            return addon ? (
                              <div key={addonId} className="text-sm text-red-600">
                                • <strong>{addon.name}</strong>: {currentQty} hrs selected, max {maxAllowed} hrs allowed
                              </div>
                            ) : null
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }
              return null
            })()}
            {/* Pricing Summary */}
            // Update the pricing summary section to show quantities:
            <div className="glass-panel-mint p-6 rounded-2xl mb-8">
              <div className="flex justify-between items-center mb-4">
                <span className="font-semibold">Package: {selectedPackage?.name}</span>
                <span className="font-bold">${selectedPackage?.price}</span>
              </div>
              {selectedAddons.map((addonId) => {
                const addon = addOns.find((a) => a.id === addonId)
                if (!addon) return null

                const quantity = addonQuantities[addonId] || 1
                const totalPrice = addon.price * quantity

                return (
                  <div key={addon.id} className="flex justify-between items-center mb-2">
                    <span className="text-sm">
                      {addon.name}
                      {addon.is_hourly && quantity > 1 && ` (${quantity} ${quantity === 1 ? "hr" : "hrs"})`}
                    </span>
                    <span className="text-sm font-medium">
                      {addon.is_hourly && quantity > 1 ? (
                        <span>
                          ${addon.price} × {quantity} = ${totalPrice}
                        </span>
                      ) : (
                        `$${totalPrice}`
                      )}
                    </span>
                  </div>
                )
              })}
              <div className="border-t border-white/20 pt-4 mt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>${calculateTotal()}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-center gap-4">
              <Button onClick={() => setCurrentStep(1)} variant="outline" size="lg" className="rounded-xl h-12 px-8">
                Back
              </Button>
              <Button
                onClick={() => setCurrentStep(3)}
                disabled={hasValidationErrors(addonQuantities, selectedPackage?.id || 0)}
                size="lg"
                className={`rounded-xl h-12 px-8 ${
                  hasValidationErrors(addonQuantities, selectedPackage?.id || 0)
                    ? "bg-gray-400 hover:bg-gray-400 cursor-not-allowed"
                    : "btn-mint"
                }`}
              >
                {hasValidationErrors(addonQuantities, selectedPackage?.id || 0)
                  ? "Fix Errors to Continue"
                  : "Continue to Date & Time"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Date & Time Selection */}
        {currentStep === 3 && (
          <div>
            <h3 className="text-2xl font-bold text-center mb-8">Select Date & Time</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <Label htmlFor="event-date" className="text-base font-semibold">
                  Event Date *
                </Label>
                <Input
                  id="event-date"
                  type="date"
                  value={bookingData.eventDate}
                  onChange={(e) => setBookingData((prev) => ({ ...prev, eventDate: e.target.value }))}
                  className="mt-2 bg-white h-12"
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>

              <div>
                <Label htmlFor="event-time" className="text-base font-semibold">
                  Start Time *
                </Label>
                <select
                  id="event-time"
                  value={bookingData.eventTime}
                  onChange={(e) => setBookingData((prev) => ({ ...prev, eventTime: e.target.value }))}
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

            <div className="mt-8 p-4 bg-blue-50 rounded-xl">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  {(() => {
                    const additionalHours = getAdditionalHours(addonQuantities)
                    const totalHours = getTotalHours(selectedPackage?.id || 0, additionalHours)
                    const baseHours = selectedPackage?.duration_hours || 0

                    return (
                      <>
                        <p className="font-semibold text-blue-900">
                          Event Duration: {totalHours} hours
                          {additionalHours > 0 && (
                            <span className="text-sm font-normal">
                              {" "}
                              ({baseHours} base + {additionalHours} additional)
                            </span>
                          )}
                        </p>
                        {bookingData.eventTime && (
                          <p className="text-sm text-blue-700">
                            Booth available: {formatTimeTo12Hour(convertTo24Hour(bookingData.eventTime))} - {(() => {
                              const startTime24 = convertTo24Hour(bookingData.eventTime)
                              const endTime = new Date(
                                new Date(`2000-01-01T${startTime24}`).getTime() + totalHours * 60 * 60 * 1000,
                              ).toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              })
                              return endTime
                            })()}
                          </p>
                        )}

                        {/* Show breakdown of selected hourly add-ons */}
                        {selectedAddons.some((id) => {
                          const addon = addOns.find((a) => a.id === id)
                          return addon?.is_hourly && id !== 9 // Don't show Additional Hour in breakdown
                        }) && (
                          <div className="mt-3 p-3 bg-white/50 rounded-lg">
                            <p className="text-sm font-medium text-blue-800 mb-2">Hourly Add-ons Schedule:</p>
                            {selectedAddons.map((addonId) => {
                              const addon = addOns.find((a) => a.id === addonId)
                              if (!addon?.is_hourly || addonId === 9) return null // Skip Additional Hour

                              const hours = addonQuantities[addonId] || 1
                              return (
                                <div key={addonId} className="text-xs text-blue-700 flex justify-between">
                                  <span>{addon.name}:</span>
                                  <span>
                                    {hours} {hours === 1 ? "hour" : "hours"}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-4 mt-8">
              <Button onClick={() => setCurrentStep(2)} variant="outline" size="lg" className="rounded-xl h-12 px-8">
                Back
              </Button>
              <Button
                onClick={() => setCurrentStep(4)}
                disabled={!bookingData.eventDate || !bookingData.eventTime}
                size="lg"
                className="btn-mint rounded-xl h-12 px-8"
              >
                Continue to Details
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Customer Information */}
        {currentStep === 4 && (
          <div>
            <h3 className="text-2xl font-bold text-center mb-8">Your Information</h3>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="customer-name" className="text-base font-semibold">
                    Full Name *
                  </Label>
                  <Input
                    id="customer-name"
                    value={bookingData.customerName}
                    onChange={(e) => setBookingData((prev) => ({ ...prev, customerName: e.target.value }))}
                    placeholder="Your full name"
                    className="mt-2 bg-white h-12"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="customer-email" className="text-base font-semibold">
                    Email Address *
                  </Label>
                  <Input
                    id="customer-email"
                    type="email"
                    value={bookingData.customerEmail}
                    onChange={(e) => setBookingData((prev) => ({ ...prev, customerEmail: e.target.value }))}
                    placeholder="your@email.com"
                    className="mt-2 bg-white h-12"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="customer-phone" className="text-base font-semibold">
                    Phone Number
                  </Label>
                  <Input
                    id="customer-phone"
                    type="tel"
                    value={bookingData.customerPhone}
                    onChange={(e) => setBookingData((prev) => ({ ...prev, customerPhone: e.target.value }))}
                    placeholder="(123) 456-7890"
                    className="mt-2 bg-white h-12"
                  />
                </div>

                <div>
                  <Label htmlFor="event-type" className="text-base font-semibold">
                    Event Type
                  </Label>
                  <select
                    id="event-type"
                    value={bookingData.eventType}
                    onChange={(e) => setBookingData((prev) => ({ ...prev, eventType: e.target.value }))}
                    className="mt-2 w-full p-3 border border-gray-300 rounded-lg bg-white h-12"
                  >
                    <option value="">Select event type</option>
                    <option value="wedding">Wedding</option>
                    <option value="corporate">Corporate Event</option>
                    <option value="birthday">Birthday Party</option>
                    <option value="quinceañera">Quinceañera</option>
                    <option value="graduation">Graduation</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="guest-count" className="text-base font-semibold">
                    Expected Guest Count
                  </Label>
                  <Input
                    id="guest-count"
                    type="number"
                    value={bookingData.guestCount}
                    onChange={(e) => setBookingData((prev) => ({ ...prev, guestCount: e.target.value }))}
                    placeholder="50"
                    className="mt-2 bg-white h-12"
                  />
                </div>

                <div>
                  <Label htmlFor="venue-address" className="text-base font-semibold">
                    Venue Address
                  </Label>
                  <Input
                    id="venue-address"
                    value={bookingData.venueAddress}
                    onChange={(e) => setBookingData((prev) => ({ ...prev, venueAddress: e.target.value }))}
                    placeholder="123 Event St, Houston, TX"
                    className="mt-2 bg-white h-12"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="special-requests" className="text-base font-semibold">
                  Special Requests
                </Label>
                <Textarea
                  id="special-requests"
                  value={bookingData.specialRequests}
                  onChange={(e) => setBookingData((prev) => ({ ...prev, specialRequests: e.target.value }))}
                  placeholder="Any special requests, setup instructions, or questions..."
                  className="mt-2 bg-white min-h-[100px]"
                />
              </div>
            </div>

            {/* Final Summary */}
            <div className="mt-8 glass-panel-mint p-6 rounded-2xl">
              <h4 className="font-bold text-lg mb-4">Booking Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Package:</span>
                  <span className="font-medium">
                    {selectedPackage?.name} - ${selectedPackage?.price}
                  </span>
                </div>

                {/* Show total duration */}
                <div className="flex justify-between">
                  <span>Total Duration:</span>
                  <span className="font-medium">
                    {getTotalHours(selectedPackage?.id || 0, getAdditionalHours(addonQuantities))} hours
                  </span>
                </div>

                {selectedAddons.map((addonId) => {
                  const addon = addOns.find((a) => a.id === addonId)
                  if (!addon) return null

                  const quantity = addonQuantities[addonId] || 1
                  const totalPrice = addon.price * quantity

                  return (
                    <div key={addon.id} className="flex justify-between">
                      <span>
                        {addon.name}
                        {addon.is_hourly && quantity > 1 && ` (${quantity} ${quantity === 1 ? "hr" : "hrs"})`}:
                      </span>
                      <span className="font-medium">
                        {addon.is_hourly && quantity > 1 ? (
                          <span>
                            ${addon.price} × {quantity} = ${totalPrice}
                          </span>
                        ) : (
                          `$${totalPrice}`
                        )}
                      </span>
                    </div>
                  )
                })}

                <div className="flex justify-between">
                  <span>Date & Time:</span>
                  <span className="font-medium">
                    {bookingData.eventDate} at {formatTimeTo12Hour(convertTo24Hour(bookingData.eventTime))}
                    {bookingData.eventTime && (
                      <span className="block text-xs text-gray-600">
                        Until {(() => {
                          const startTime24 = convertTo24Hour(bookingData.eventTime)
                          const endTime = new Date(
                            new Date(`2000-01-01T${startTime24}`).getTime() +
                              getTotalHours(selectedPackage?.id || 0, getAdditionalHours(addonQuantities)) *
                                60 *
                                60 *
                                1000,
                          ).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })
                          return endTime
                        })()}
                      </span>
                    )}
                  </span>
                </div>

                <div className="border-t border-white/20 pt-2 mt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>${calculateTotal()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-4 mt-8">
              <Button onClick={() => setCurrentStep(3)} variant="outline" size="lg" className="rounded-xl h-12 px-8">
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!bookingData.customerName || !bookingData.customerEmail}
                size="lg"
                className="btn-mint rounded-xl h-12 px-8"
              >
                Confirm Booking
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Confirmation */}
        {currentStep === 5 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Booking Confirmed!</h3>
            <p className="text-gray-600 mb-6">
              Thank you for choosing The Mint Booth! We've sent a confirmation email to {bookingData.customerEmail}.
            </p>
            <div className="glass-panel p-6 rounded-2xl max-w-md mx-auto">
              <h4 className="font-semibold mb-4">Next Steps:</h4>
              <ul className="text-left space-y-2 text-sm">
                <li>• Check your email for booking details</li>
                <li>• We'll contact you 48 hours before your event</li>
                <li>• Payment will be processed separately</li>
                <li>• Questions? Call us at (123) 456-7890</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
