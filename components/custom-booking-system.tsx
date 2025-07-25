"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Clock, MapPin, Package, User, Mail, Phone } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

const packages = [
  {
    id: "basic",
    name: "Basic Package",
    duration: 2,
    price: 299,
    features: ["2 hours of service", "Basic props", "Digital gallery"],
  },
  {
    id: "premium",
    name: "Premium Package",
    duration: 4,
    price: 499,
    features: ["4 hours of service", "Premium props", "Digital gallery", "Custom backdrop"],
  },
  {
    id: "deluxe",
    name: "Deluxe Package",
    duration: 6,
    price: 699,
    features: ["6 hours of service", "All props included", "Digital gallery", "Custom backdrop", "On-site attendant"],
  },
]

const timeSlots = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
]

interface BookingFormData {
  name: string
  email: string
  phone: string
  eventDate: Date | undefined
  eventTime: string
  packageType: string
  location: string
  specialRequests: string
}

export default function CustomBookingSystem() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<string[]>(timeSlots)
  const [formData, setFormData] = useState<BookingFormData>({
    name: "",
    email: "",
    phone: "",
    eventDate: undefined,
    eventTime: "",
    packageType: "",
    location: "",
    specialRequests: "",
  })

  const selectedPackage = packages.find((pkg) => pkg.id === formData.packageType)
  const totalPrice = selectedPackage?.price || 0

  const checkAvailability = async (date: Date) => {
    try {
      const dateStr = format(date, "yyyy-MM-dd")
      const response = await fetch(`/api/availability?date=${dateStr}`)
      const data = await response.json()

      if (data.success) {
        setAvailableSlots(data.availableSlots)
      }
    } catch (error) {
      console.error("Failed to check availability:", error)
    }
  }

  const handleDateSelect = (date: Date | undefined) => {
    setFormData((prev) => ({ ...prev, eventDate: date, eventTime: "" }))
    if (date) {
      checkAvailability(date)
    }
  }

  const handleSubmit = async () => {
    if (!formData.eventDate) return

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          eventDate: format(formData.eventDate, "yyyy-MM-dd"),
          eventTime: formData.eventTime,
          duration: selectedPackage?.duration || 2,
          packageType: formData.packageType,
          location: formData.location,
          specialRequests: formData.specialRequests,
          totalPrice,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setCurrentStep(4) // Success step
      } else {
        alert(`Booking failed: ${data.error}`)
      }
    } catch (error) {
      console.error("Booking submission failed:", error)
      alert("Failed to submit booking. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    } else {
      handleSubmit()
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.packageType && formData.eventDate && formData.eventTime
      case 2:
        return formData.location.trim() !== ""
      case 3:
        return formData.name.trim() !== "" && formData.email.trim() !== "" && formData.phone.trim() !== ""
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                    currentStep >= step ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-600",
                  )}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={cn(
                      "h-1 w-24 mx-2 transition-colors",
                      currentStep > step ? "bg-emerald-600" : "bg-gray-200",
                    )}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Package & Date</span>
            <span>Location</span>
            <span>Contact Info</span>
          </div>
        </div>

        {/* Step Content */}
        <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-emerald-800">
              {currentStep === 1 && "Choose Package & Date"}
              {currentStep === 2 && "Event Location"}
              {currentStep === 3 && "Contact Information"}
              {currentStep === 4 && "Booking Confirmed!"}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Select your package and preferred date & time"}
              {currentStep === 2 && "Where will your event take place?"}
              {currentStep === 3 && "We need your details to confirm the booking"}
              {currentStep === 4 && "Your booking has been successfully submitted"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1: Package & Date Selection */}
            {currentStep === 1 && (
              <>
                <div className="space-y-4">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Select Package
                  </Label>
                  <div className="grid gap-4">
                    {packages.map((pkg) => (
                      <div
                        key={pkg.id}
                        className={cn(
                          "p-4 rounded-lg border-2 cursor-pointer transition-all",
                          formData.packageType === pkg.id
                            ? "border-emerald-500 bg-emerald-50"
                            : "border-gray-200 hover:border-emerald-300",
                        )}
                        onClick={() => setFormData((prev) => ({ ...prev, packageType: pkg.id }))}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">{pkg.name}</h3>
                            <p className="text-gray-600">{pkg.duration} hours</p>
                            <ul className="text-sm text-gray-600 mt-2">
                              {pkg.features.map((feature, index) => (
                                <li key={index}>• {feature}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-emerald-600">${pkg.price}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      Event Date
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.eventDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.eventDate ? format(formData.eventDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.eventDate}
                          onSelect={handleDateSelect}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Event Time
                    </Label>
                    <Select
                      value={formData.eventTime}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, eventTime: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Location */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <Label className="text-base font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Event Location
                </Label>
                <Textarea
                  placeholder="Enter the full address where the photobooth will be set up..."
                  value={formData.location}
                  onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                  className="min-h-[100px]"
                />
                <div className="space-y-2">
                  <Label>Special Requests (Optional)</Label>
                  <Textarea
                    placeholder="Any special requirements, themes, or requests for your event..."
                    value={formData.specialRequests}
                    onChange={(e) => setFormData((prev) => ({ ...prev, specialRequests: e.target.value }))}
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Contact Information */}
            {currentStep === 3 && (
              <>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Full Name
                    </Label>
                    <Input
                      placeholder="Your full name"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone Number
                    </Label>
                    <Input
                      placeholder="Your phone number"
                      value={formData.phone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </Label>
                  <Input
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>

                {/* Booking Summary */}
                <div className="bg-emerald-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Booking Summary</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Package:</strong> {selectedPackage?.name}
                    </p>
                    <p>
                      <strong>Date:</strong> {formData.eventDate ? format(formData.eventDate, "PPP") : "Not selected"}
                    </p>
                    <p>
                      <strong>Time:</strong> {formData.eventTime}
                    </p>
                    <p>
                      <strong>Duration:</strong> {selectedPackage?.duration} hours
                    </p>
                    <p>
                      <strong>Location:</strong> {formData.location}
                    </p>
                    <div className="pt-2 border-t border-emerald-200">
                      <p className="text-lg font-bold text-emerald-600">Total: ${totalPrice}</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 4: Success */}
            {currentStep === 4 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-emerald-800 mb-2">Booking Confirmed!</h3>
                <p className="text-gray-600 mb-6">
                  Thank you for choosing The Mint Booth! We'll contact you within 24 hours to confirm all details.
                </p>
                <Button onClick={() => window.location.reload()} className="bg-emerald-600 hover:bg-emerald-700">
                  Book Another Event
                </Button>
              </div>
            )}
          </CardContent>

          {/* Navigation Buttons */}
          {currentStep < 4 && (
            <div className="flex justify-between p-6 pt-0">
              <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
                Previous
              </Button>
              <Button
                onClick={nextStep}
                disabled={!canProceed() || isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? "Submitting..." : currentStep === 3 ? "Confirm Booking" : "Next"}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
