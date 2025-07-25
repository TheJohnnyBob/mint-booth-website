import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const packages = [
  {
    name: "Mint Pro",
    price: "$299",
    description: "Our entry-level package for small events or budgets.",
    features: [
      "2 Hours of Booth Rental",
      "Unlimited Digital Captures",
      "Fun Filters & Digital Stickers",
      "Standard Template Overlay",
      "LED Ring Light",
      "Standard Backdrop",
    ],
    cta: "Choose Pro",
  },
  {
    name: "Mint Max",
    price: "$399",
    description: "A longer session with extra flair for most events.",
    features: [
      "3 Hours of Booth Rental",
      "All Pro features, plus:",
      "Animated GIF Capture",
      "Glam B&W Filter & AR Masks",
      "Custom Event Overlay",
      "Color-Tunable LED Lighting",
    ],
    popular: true,
    cta: "Choose Max",
  },
  {
    name: "Mint Ultra",
    price: "$599",
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
    cta: "Choose Ultra",
  },
]

export default function PackagesSection() {
  return (
    <section id="packages" className="py-20 md:py-28 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tighter">Find Your Perfect Package</h2>
          <p className="mt-4 text-lg text-gray-600">
            Simple, transparent pricing for any event. Add-ons available for all packages.
          </p>
        </div>
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {packages.map((pkg) => (
            <div
              key={pkg.name}
              className={`relative p-8 transition-all duration-300 ${
                pkg.popular
                  ? "glass-card-mint glass-highlight-mint scale-105 shadow-2xl animate-mint-glow"
                  : "glass-card glass-highlight"
              }`}
            >
              {pkg.popular && (
                <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                  <div className="btn-mint text-xs font-semibold px-4 py-1 rounded-full uppercase">Most Popular</div>
                </div>
              )}
              <h3 className="text-2xl font-bold text-center">{pkg.name}</h3>
              <p className="text-4xl font-bold text-center mt-4" style={{ color: "#0ABAB5" }}>
                {pkg.price}
              </p>
              <p className="text-gray-500 text-center mt-2 h-10">{pkg.description}</p>
              <ul className="mt-8 space-y-4">
                {pkg.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: "#0ABAB5" }} />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button asChild size="lg" className="w-full mt-8 rounded-xl h-12 text-base btn-mint">
                <Link href="#book">{pkg.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
