import CustomBookingSystem from "./custom-booking-system"

export default function BookingSection() {
  return (
    <section id="book" className="py-20 md:py-28 bg-gray-50 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tighter">Ready to Book?</h2>
          <p className="mt-4 text-lg text-gray-600">
            Secure your date instantly with our custom booking system. Real-time pricing and availability.
          </p>
        </div>

        <CustomBookingSystem />
      </div>
    </section>
  )
}
