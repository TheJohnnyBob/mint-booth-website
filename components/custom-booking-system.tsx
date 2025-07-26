"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Clock, AlertTriangle, CheckCircle, Calendar, MapPin, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CardContent } from "@/components/ui/card"

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

export default function CustomBookingSystem() {
  const [currentStep, setCurrentStep] = useState(1)
  const [packages, setPackages] = useState<PackageType[]>([])
  const [addons, setAddons] = useState<AddOn[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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

  // Load data on component mount
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
        setAddons(data.addons || [])
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Failed to load booking data. Please refresh the page.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Format date to M/D/YY
  const formatDate = (dateString: string): string => {
    if (!dateString) return ""
    const date = new Date(dateString)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const year = date.getFullYear().toString().slice(-2)
    return `${month}/${day}/${year}`
  }

  // Get additional hours from "Additional Hour" addon (ID: 9)
  const getAdditionalHours = (): number => {
    return bookingData.selectedAddons[9] || 0
  }

  // Calculate total event duration
  const getTotalEventHours = (): number => {
    const baseHours = selectedPackage?.duration_hours || 0
    const additionalHours = getAdditionalHours()
    return baseHours + additionalHours
  }

  // Validate hourly addon quantities against total event time
  const validateHourlyAddons = (): {
    isValid: boolean
    violations: Array<{ addonId: number; current: number; max: number }>
  } => {
    const totalEventHours = getTotalEventHours()
    const violations: Array<{ addonId: number; current: number; max: number }> = []

    Object.entries(bookingData.selectedAddons).forEach(([addonIdStr, quantity]) => {
      const addonId = Number.parseInt(addonIdStr)
      const addon = addons.find((a) => a.id === addonId)

      if (addon?.is_hourly && addonId !== 9) {
        // Exclude "Additional Hour" from validation
        let maxAllowed = totalEventHours

        // Special case for "Idle / Early Setup" - max 2 hours
        if (addonId === 6) {
          maxAllowed = Math.min(2, totalEventHours)
        }

        if (quantity > maxAllowed) {
          violations.push({
            addonId,
            current: quantity,
            max: maxAllowed,
          })
        }
      }
    })

    return {
      isValid: violations.length === 0,
      violations,
    }
  }

  // Use useMemo to calculate total and ensure it updates when dependencies change
  const totalPrice = useMemo(() => {
    const packagePrice = selectedPackage?.price || 0
    console.log(`Starting calculation - Package: ${selectedPackage?.name} = $${packagePrice}`)

    // Convert to cents to avoid floating point issues
    let totalCents = Math.round(packagePrice * 100)

    Object.entries(bookingData.selectedAddons).forEach(([addonId, quantity]) => {
      const addon = addons.find((a) => a.id === Number.parseInt(addonId))
      if (addon && quantity > 0) {
        const addonCostCents = Math.round(addon.price * quantity * 100)
        totalCents += addonCostCents
        const totalDollars = totalCents / 100
        console.log(
          `Adding ${addon.name}: $${addon.price} × ${quantity} = $${addon.price * quantity} (Running total: $${totalDollars})`,
        )
      }
    })

    // Convert back to dollars
    const finalTotal = totalCents / 100
    console.log(`Final total: $${finalTotal}`)
    return Math.round(finalTotal)
  }, [selectedPackage, bookingData.selectedAddons, addons])

  // Format price to whole number
  const formatPrice = (price: number): string => {
    return Math.round(price).toString()
  }

  const handleAddonQuantityChange = (addonId: number, change: number) => {
    setBookingData((prev) => {
      const currentQuantity = prev.selectedAddons[addonId] || 0
      let newQuantity = Math.max(0, currentQuantity + change)

      // For hourly addons (except Additional Hour), enforce limits
      const addon = addons.find((a) => a.id === addonId)
      if (addon?.is_hourly && addonId !== 9) {
        const totalEventHours = getTotalEventHours()
        let maxAllowed = totalEventHours

        // Special case for "Idle / Early Setup"
        if (addonId === 6) {
          maxAllowed = Math.min(2, totalEventHours)
        }

        newQuantity = Math.min(newQuantity, maxAllowed)
      }

      const newSelectedAddons = {
        ...prev.selectedAddons,
        [addonId]: newQuantity,
      }

      // Remove addon if quantity is 0
      if (newQuantity === 0) {
        delete newSelectedAddons[addonId]
      }

      return {
        ...prev,
        selectedAddons: newSelectedAddons,
      }
    })
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
        const validation = validateHourlyAddons()
        return validation.isValid
      case 3:
        return bookingData.eventDate && bookingData.eventTime
      case 4:
        return bookingData.customerName && bookingData.customerEmail
      default:
        return false
    }
  }

  // Generate time slots
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
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-red-600 mb-2">Error Loading Booking System</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} className="btn-mint">
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Step Progress Bar */}
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
        </div>
      </div>

      <div className="glass-card glass-highlight p-8 rounded-3xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Step 1: Package Selection */}
            {currentStep === 1 && (
              <div>
                <h3 className="text-2xl font-bold text-center mb-8">Choose Your Package</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className={`cursor-pointer transition-all duration-300 ${
                        bookingData.packageId === pkg.id
                          ? "glass-card-mint glass-highlight-mint scale-105 shadow-2xl"
                          : "glass-card glass-highlight hover:scale-105"
                      }`}
                      onClick={() => setBookingData((prev) => ({ ...prev, packageId: pkg.id, selectedAddons: {} }))}
                    >
                      <CardContent className="p-6">
                        <h4 className="text-xl font-bold text-center">{pkg.name}</h4>
                        <p className="text-3xl font-bold text-center mt-4" style={{ color: "#0ABAB5" }}>
                          ${formatPrice(pkg.price)}
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
                    disabled={!bookingData.packageId}
                    size="lg"
                    className="btn-mint rounded-xl h-12 px-8"
                  >
                    Continue to Add-Ons
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Add-ons Selection */}
            {currentStep === 2 && (
              <div>
                <h3 className="text-2xl font-bold text-center mb-2">Enhance Your Experience</h3>
                <p className="text-center text-gray-600 mb-8">Select any add-ons to customize your package</p>

                {/* Validation Errors Display */}
                {(() => {
                  const validation = validateHourlyAddons()
                  if (!validation.isValid) {
                    return (
                      <div className="mb-8 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-white text-sm font-bold">!</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-red-800 mb-2">Configuration Error</h4>
                            <p className="text-red-700 text-sm mb-3">
                              Some add-ons exceed your total event time. Please adjust the hours or add more event time
                              to continue.
                            </p>
                            <div className="space-y-1">
                              {validation.violations.map(({ addonId, current, max }) => {
                                const addon = addons.find((a) => a.id === addonId)
                                return addon ? (
                                  <div key={addonId} className="text-sm text-red-600">
                                    • <strong>{addon.name}</strong>: {current} hrs selected, max {max} hrs allowed
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

                {/* Event Duration Info */}
                <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-blue-900">Total Event Duration: {getTotalEventHours()} hours</p>
                      <p className="text-sm text-blue-700">
                        Base: {selectedPackage?.duration_hours || 0} hrs
                        {getAdditionalHours() > 0 && ` + Additional: ${getAdditionalHours()} hrs`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 mb-8">
                  {availableAddons.map((addon) => {
                    const totalEventHours = getTotalEventHours()
                    const violations = validateHourlyAddons()
                    const hasViolation = violations.violations.some((v) => v.addonId === addon.id)
                    const currentQuantity = bookingData.selectedAddons[addon.id] || 0
                    let maxAllowed = totalEventHours

                    // Special limits for specific addons
                    if (addon.id === 6) {
                      // Idle / Early Setup
                      maxAllowed = Math.min(2, totalEventHours)
                    }

                    return (
                      <div
                        key={addon.id}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          currentQuantity > 0
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
                                  currentQuantity > 0
                                    ? hasViolation
                                      ? "border-red-500 bg-red-500"
                                      : "border-[#0ABAB5] bg-[#0ABAB5]"
                                    : "border-gray-300"
                                }`}
                                onClick={() => {
                                  if (currentQuantity === 0) {
                                    handleAddonQuantityChange(addon.id, 1)
                                  } else {
                                    setBookingData((prev) => {
                                      const newSelectedAddons = { ...prev.selectedAddons }
                                      delete newSelectedAddons[addon.id]
                                      return {
                                        ...prev,
                                        selectedAddons: newSelectedAddons,
                                      }
                                    })
                                  }
                                }}
                              >
                                {currentQuantity > 0 && <CheckCircle className="h-4 w-4 text-white" />}
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
                            {addon.is_hourly && currentQuantity > 0 && (
                              <div className="flex flex-col items-end gap-2">
                                <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
                                  <button
                                    onClick={() => handleAddonQuantityChange(addon.id, -1)}
                                    className="w-8 h-8 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold"
                                    disabled={currentQuantity <= 1}
                                  >
                                    -
                                  </button>
                                  <span
                                    className={`w-8 text-center font-semibold ${hasViolation ? "text-red-600" : ""}`}
                                  >
                                    {currentQuantity}
                                  </span>
                                  <button
                                    onClick={() => handleAddonQuantityChange(addon.id, 1)}
                                    className="w-8 h-8 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold"
                                    disabled={addon.id !== 9 && currentQuantity >= maxAllowed}
                                  >
                                    +
                                  </button>
                                </div>

                                {addon.id === 1 && (
                                  <div
                                    className={`text-xs ${hasViolation ? "text-red-500 font-medium" : "text-gray-500"}`}
                                  >
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
                                {addon.id === 6 && (
                                  <div
                                    className={`text-xs ${hasViolation ? "text-red-500 font-medium" : "text-gray-500"}`}
                                  >
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
                                ${formatPrice(addon.price)}
                                {addon.is_hourly && "/hr"}
                              </span>
                              {currentQuantity > 0 && (
                                <div className={`text-sm ${hasViolation ? "text-red-600" : "text-gray-600"}`}>
                                  Total: ${formatPrice(addon.price * currentQuantity)}
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

                {/* Pricing Summary */}
                <div className="glass-panel-mint p-6 rounded-2xl mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-semibold">Package: {selectedPackage?.name}</span>
                    <span className="font-bold">${formatPrice(selectedPackage?.price || 0)}</span>
                  </div>
                  {Object.entries(bookingData.selectedAddons).map(([addonId, quantity]) => {
                    const addon = addons.find((a) => a.id === Number.parseInt(addonId))
                    if (!addon || quantity === 0) return null

                    const totalPrice = addon.price * quantity

                    return (
                      <div key={addon.id} className="flex justify-between items-center mb-2">
                        <span className="text-sm">
                          {addon.name}
                          {quantity > 1 &&
                            ` (${quantity} ${addon.is_hourly ? (quantity === 1 ? "hr" : "hrs") : "items"})`}
                        </span>
                        <span className="text-sm font-medium">
                          {quantity > 1 ? (
                            <span>
                              ${formatPrice(addon.price)} × {quantity} = ${formatPrice(totalPrice)}
                            </span>
                          ) : (
                            `$${formatPrice(totalPrice)}`
                          )}
                        </span>
                      </div>
                    )
                  })}
                  <div className="border-t border-white/20 pt-4 mt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>${formatPrice(totalPrice)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center gap-4">
                  <Button
                    onClick={() => setCurrentStep(1)}
                    variant="outline"
                    size="lg"
                    className="rounded-xl h-12 px-8"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => setCurrentStep(3)}
                    disabled={!validateHourlyAddons().isValid}
                    size="lg"
                    className={`rounded-xl h-12 px-8 ${
                      !validateHourlyAddons().isValid ? "bg-gray-400 hover:bg-gray-400 cursor-not-allowed" : "btn-mint"
                    }`}
                  >
                    {!validateHourlyAddons().isValid ? "Fix Errors to Continue" : "Continue to Date & Time"}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Date & Time */}
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
                      <p className="font-semibold text-blue-900">Event Duration: {getTotalEventHours()} hours</p>
                      {bookingData.eventTime && (
                        <p className="text-sm text-blue-700">
                          Booth available: {bookingData.eventTime} - {(() => {
                            const [time, ampm] = bookingData.eventTime.split(" ")
                            const [hours, minutes] = time.split(":")
                            let hour24 = Number.parseInt(hours)
                            if (ampm === "PM" && hour24 !== 12) hour24 += 12
                            if (ampm === "AM" && hour24 === 12) hour24 = 0

                            const endTime = new Date()
                            endTime.setHours(hour24, Number.parseInt(minutes), 0, 0)
                            endTime.setHours(endTime.getHours() + getTotalEventHours())

                            return endTime.toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            })
                          })()}
                        </p>
                      )}

                      {Object.entries(bookingData.selectedAddons).some(([addonId, quantity]) => {
                        const addon = addons.find((a) => a.id === Number.parseInt(addonId))
                        return addon?.is_hourly && Number.parseInt(addonId) !== 9 && quantity > 0
                      }) && (
                        <div className="mt-3 p-3 bg-white/50 rounded-lg">
                          <p className="text-sm font-medium text-blue-800 mb-2">Hourly Add-ons Schedule:</p>
                          {Object.entries(bookingData.selectedAddons).map(([addonId, quantity]) => {
                            const addon = addons.find((a) => a.id === Number.parseInt(addonId))
                            if (!addon?.is_hourly || Number.parseInt(addonId) === 9 || quantity === 0) return null

                            return (
                              <div key={addonId} className="text-xs text-blue-700 flex justify-between">
                                <span>{addon.name}:</span>
                                <span>
                                  {quantity} {quantity === 1 ? "hour" : "hours"}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-center gap-4 mt-8">
                  <Button
                    onClick={() => setCurrentStep(2)}
                    variant="outline"
                    size="lg"
                    className="rounded-xl h-12 px-8"
                  >
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

            {/* Step 4: Contact Information */}
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
                        value={bookingData.guestCount || ""}
                        onChange={(e) =>
                          setBookingData((prev) => ({ ...prev, guestCount: Number.parseInt(e.target.value) || 0 }))
                        }
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

                {/* Enhanced Booking Summary */}
                <div className="mt-8 glass-panel-mint p-8 rounded-2xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-gray-700" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900">Booking Summary</h4>
                  </div>

                  {/* Package Section */}
                  <div className="bg-white/10 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                        <span className="font-semibold text-gray-900">Package</span>
                      </div>
                      <span className="font-bold text-gray-900 text-lg">
                        ${formatPrice(selectedPackage?.price || 0)}
                      </span>
                    </div>
                    <div className="text-gray-700 text-sm ml-4">
                      {selectedPackage?.name} • {selectedPackage?.duration_hours} hours base
                    </div>
                  </div>

                  {/* Add-ons Section */}
                  {Object.entries(bookingData.selectedAddons).some(([_, quantity]) => quantity > 0) && (
                    <div className="bg-white/10 rounded-xl p-4 mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                        <span className="font-semibold text-gray-900">Add-ons</span>
                      </div>
                      <div className="space-y-2 ml-4">
                        {Object.entries(bookingData.selectedAddons).map(([addonId, quantity]) => {
                          const addon = addons.find((a) => a.id === Number.parseInt(addonId))
                          if (!addon || quantity === 0) return null

                          const totalPrice = addon.price * quantity

                          return (
                            <div key={addonId} className="flex justify-between items-center">
                              <span className="text-gray-700 text-sm">
                                {addon.name}
                                {quantity > 1 &&
                                  ` (${quantity} ${addon.is_hourly ? (quantity === 1 ? "hr" : "hrs") : "items"})`}
                              </span>
                              <span className="text-gray-900 font-medium">
                                {quantity > 1 ? (
                                  <span className="text-sm">
                                    ${formatPrice(addon.price)} × {quantity} = ${formatPrice(totalPrice)}
                                  </span>
                                ) : (
                                  `$${formatPrice(totalPrice)}`
                                )}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Event Details Section */}
                  <div className="bg-white/10 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                      <span className="font-semibold text-gray-900">Event Details</span>
                    </div>
                    <div className="space-y-2 ml-4">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700 text-sm">
                          {formatDate(bookingData.eventDate)} at {bookingData.eventTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700 text-sm">
                          Duration: {getTotalEventHours()} hours
                          {bookingData.eventTime && (
                            <span className="ml-2">
                              (until {(() => {
                                const [time, ampm] = bookingData.eventTime.split(" ")
                                const [hours, minutes] = time.split(":")
                                let hour24 = Number.parseInt(hours)
                                if (ampm === "PM" && hour24 !== 12) hour24 += 12
                                if (ampm === "AM" && hour24 === 12) hour24 = 0

                                const endTime = new Date()
                                endTime.setHours(hour24, Number.parseInt(minutes), 0, 0)
                                endTime.setHours(endTime.getHours() + getTotalEventHours())

                                return endTime.toLocaleTimeString("en-US", {
                                  hour: "numeric",
                                  minute: "2-digit",
                                  hour12: true,
                                })
                              })()})
                            </span>
                          )}
                        </span>
                      </div>
                      {bookingData.eventType && (
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 flex items-center justify-center">
                            <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                          </div>
                          <span className="text-gray-700 text-sm capitalize">{bookingData.eventType}</span>
                        </div>
                      )}
                      {bookingData.guestCount > 0 && (
                        <div className="flex items-center gap-3">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700 text-sm">{bookingData.guestCount} guests expected</span>
                        </div>
                      )}
                      {bookingData.venueAddress && (
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700 text-sm">{bookingData.venueAddress}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Total Section */}
                  <div className="border-t border-white/20 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-gray-900">Total Amount:</span>
                      <span className="text-2xl font-bold text-gray-900">${formatPrice(totalPrice)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center gap-4 mt-8">
                  <Button
                    onClick={() => setCurrentStep(3)}
                    variant="outline"
                    size="lg"
                    className="rounded-xl h-12 px-8"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!bookingData.customerName || !bookingData.customerEmail || isSubmitting}
                    size="lg"
                    className="btn-mint rounded-xl h-12 px-8"
                  >
                    {isSubmitting ? "Processing..." : "Confirm Booking"}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
