import { Camera, Smartphone, Sparkles, Users } from "lucide-react"

const features = [
  {
    icon: <Camera className="h-8 w-8 text-gray-700" />,
    title: "Sleek Open-Air Booth",
    description:
      "Our minimalist, iPad-based booth fits elegantly into any venue, complementing your decor instead of clashing with it.",
  },
  {
    icon: <Smartphone className="h-8 w-8 text-gray-700" />,
    title: "Instant Digital Sharing",
    description:
      "Guests receive their photos, GIFs, and boomerangs instantly via AirDrop, text, or email for immediate social sharing.",
  },
  {
    icon: <Sparkles className="h-8 w-8 text-gray-700" />,
    title: "Studio-Quality Lighting",
    description:
      "A built-in LED ring light ensures everyone looks their best with flattering, professional-grade lighting in every shot.",
  },
  {
    icon: <Users className="h-8 w-8 text-gray-700" />,
    title: "Fun for Everyone",
    description:
      "With fun filters, digital props, and an intuitive interface, our booth is an interactive experience that guests of all ages will love.",
  },
]

export default function ValuePropSection() {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tighter">The Modern Photobooth Experience</h2>
          <p className="mt-4 text-lg text-gray-600">
            We combine high-tech features with a luxury aesthetic to create unforgettable memories.
          </p>
        </div>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="text-center p-6 glass-card glass-highlight">
              <div className="flex justify-center items-center h-16 w-16 rounded-full bg-gray-100 mx-auto">
                {feature.icon}
              </div>
              <h3 className="mt-6 text-xl font-semibold">{feature.title}</h3>
              <p className="mt-2 text-gray-500">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
