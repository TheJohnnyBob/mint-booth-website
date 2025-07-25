import Header from "@/components/header"
import HeroSection from "@/components/hero-section"
import PackagesSection from "@/components/packages-section"
import GallerySection from "@/components/gallery-section"
import BookingSection from "@/components/booking-section"
import TestimonialsSection from "@/components/testimonials-section"
import Footer from "@/components/footer"
import ValuePropSection from "@/components/value-prop-section"
import FloatingCTA from "@/components/floating-cta"

export default function MintBoothPage() {
  return (
    <div className="w-full bg-gray-50 text-gray-900">
      <Header />
      <main className="pt-20">
        <HeroSection />
        <ValuePropSection />
        <PackagesSection />
        <GallerySection />
        <BookingSection />
        <TestimonialsSection />
      </main>
      <Footer />
      <FloatingCTA />
    </div>
  )
}
