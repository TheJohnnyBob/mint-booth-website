"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Package, AddOn, BookingData } from "@/lib/types"

import { StepIndicator } from "./booking/step-indicator"
import { Step1Package } from "./booking/step-1-package"
import { Step2Addons } from "./booking/step-2-addons"
import { Step3DateTime } from "./booking/step-3-datetime"
import { Step4Information } from "./booking/step-4-information"
import { BookingSummary } from "./booking/booking-summary"

export default function CustomBookingSystem() {
  const [currentStep, setCurrentStep] = useState(1)
  const [packages, setPackages] = useState<Package[]>([])
  const [addons, setAddons] = useState<AddOn[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const [bookingData, setBookingData] = useState<BookingData>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    eventDate: "",
    eventTime: "",
    eventType: "",
    guestCount: "",
    packageId: null,
    selectedAddons: {},
    specialRequests: "",
    venueAddress: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch("/api/bookings")
        if (!response.ok) throw new Error("Failed to fetch booking options.")
        const data = await response.json()
        if (!data.success) throw new Error(data.message || "Failed to load data.")
        setPackages(data.packages || [])
        setAddons(data.addons || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred.")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setBookingData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePackageSelect = (id: number) => {
    setBookingData((prev) => ({ ...prev, packageId: id, selectedAddons: {} }))
  }

  const handleAddonQuantityChange = (addonId: number, change: number) => {
    setBookingData((prev) => {
      const currentQuantity = prev.selectedAddons[addonId] || 0
      const newQuantity = Math.max(0, currentQuantity + change)
      const newSelectedAddons = { ...prev.selectedAddons, [addonId]: newQuantity }
      if (newQuantity === 0) delete newSelectedAddons[addonId]
      return { ...prev, selectedAddons: newSelectedAddons }
    })
  }

  const selectedPackage = useMemo(
    () => (bookingData.packageId ? packages.find((p) => p.id === bookingData.packageId) : null),
    [packages, bookingData.packageId],
  )

  const availableAddons = useMemo(
    () => (selectedPackage ? addons.filter((addon) => addon.available_packages.includes(selectedPackage.id)) : []),
    [addons, selectedPackage],
  )

  const totalPrice = useMemo(() => {
    let totalCents = selectedPackage?.price || 0
    Object.entries(bookingData.selectedAddons).forEach(([addonId, quantity]) => {
      const addon = addons.find((a) => a.id === Number(addonId))
      if (addon && quantity > 0) totalCents += addon.price * quantity
    })
    return totalCents
  }, [selectedPackage, bookingData.selectedAddons, addons])

  const validateStep4 = () => {
    const errors: Record<string, string> = {}
    if (!bookingData.customerName.trim()) errors.customerName = "Name is required"
    if (!bookingData.customerEmail.trim()) {
      errors.customerEmail = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(bookingData.customerEmail)) {
      errors.customerEmail = "Email is invalid"
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateStep4()) return
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.message || "Booking failed")
      alert(`Booking confirmed! Reference: ${result.bookingReference}`)
      setBookingData({
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        eventDate: "",
        eventTime: "",
        eventType: "",
        guestCount: "",
        packageId: null,
        selectedAddons: {},
        specialRequests: "",
        venueAddress: "",
      })
      setCurrentStep(1)
    } catch (error) {
      alert(error instanceof Error ? error.message : "Booking failed. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1Package
            packages={packages}
            selectedPackageId={bookingData.packageId}
            onSelectPackage={handlePackageSelect}
          />
        )
      case 2:
        return (
          <Step2Addons
            addons={availableAddons}
            selectedAddons={bookingData.selectedAddons}
            onAddonQuantityChange={handleAddonQuantityChange}
          />
        )
      case 3:
        return (
          <Step3DateTime
            eventDate={bookingData.eventDate}
            eventTime={bookingData.eventTime}
            onInputChange={handleInputChange}
          />
        )
      case 4:
        return <Step4Information bookingData={bookingData} formErrors={formErrors} onInputChange={handleInputChange} />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-[#0ABAB5]" />
        <p className="ml-4 text-muted-foreground">Loading booking options...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-red-600 mb-2">Error Loading Booking System</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <StepIndicator currentStep={currentStep} />
      <div className="glass-card glass-highlight p-8 rounded-3xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>

        {(currentStep === 2 || currentStep === 4) && (
          <BookingSummary
            selectedPackage={selectedPackage}
            selectedAddons={bookingData.selectedAddons}
            addons={addons}
            totalPrice={totalPrice}
          />
        )}

        <div className="flex justify-center gap-4 mt-8">
          {currentStep > 1 && (
            <Button
              onClick={() => setCurrentStep(currentStep - 1)}
              variant="outline"
              size="lg"
              className="rounded-xl h-12 px-8"
            >
              Back
            </Button>
          )}
          {currentStep < 4 && (
            <Button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={
                (currentStep === 1 && !bookingData.packageId) ||
                (currentStep === 3 && (!bookingData.eventDate || !bookingData.eventTime))
              }
              size="lg"
              className="btn-mint rounded-xl h-12 px-8"
            >
              Continue
            </Button>
          )}
          {currentStep === 4 && (
            <Button onClick={handleSubmit} disabled={isSubmitting} size="lg" className="btn-mint rounded-xl h-12 px-8">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                </>
              ) : (
                "Confirm & Book"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
