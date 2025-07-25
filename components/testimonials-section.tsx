import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"

const testimonials = [
  {
    name: "Sarah L.",
    event: "Bride at Magnolia Gardens",
    quote:
      "The Mint Booth was the absolute highlight of our wedding! The booth is so sleek and modern, and our guests are still raving about the photo quality. The instant sharing was a huge hit!",
    avatar: "/placeholder.svg?width=100&height=100",
  },
  {
    name: "Mark C.",
    event: "Corporate Event Planner",
    quote:
      "Professional, seamless, and so much fun. We used the branded overlays for our company gala and it was fantastic for our social media engagement. Will definitely be booking again.",
    avatar: "/placeholder.svg?width=100&height=100",
  },
  {
    name: "Jessica P.",
    event: "Quinceañera Mom",
    quote:
      "I'm so glad we chose The Mint Booth for my daughter's party. The attendant was amazing with the kids and the scrapbook add-on is a treasure we'll keep forever. Worth every penny!",
    avatar: "/placeholder.svg?width=100&height=100",
  },
]

export default function TestimonialsSection() {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tighter">Loved by Our Clients</h2>
          <p className="mt-4 text-lg text-gray-600">
            Don't just take our word for it. Here's what people are saying about their Mint Booth experience.
          </p>
        </div>
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} className="glass-card glass-highlight shadow-sm">
              <CardContent className="p-8">
                <p className="text-gray-700">"{testimonial.quote}"</p>
                <div className="flex items-center mt-6">
                  <Image
                    src={testimonial.avatar || "/placeholder.svg"}
                    alt={`Avatar of ${testimonial.name}`}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                  <div className="ml-4">
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.event}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
