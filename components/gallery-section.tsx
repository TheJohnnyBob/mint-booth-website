import Image from "next/image"

const galleryImages = [
  { src: "/placeholder.svg?width=600&height=800", alt: "Friends making a boomerang" },
  { src: "/placeholder.svg?width=600&height=800", alt: "Couple at a wedding photobooth" },
  { src: "/placeholder.svg?width=600&height=800", alt: "Corporate event photobooth" },
  { src: "/placeholder.svg?width=600&height=800", alt: "Glam black and white photo" },
  { src: "/placeholder.svg?width=600&height=800", alt: "Group photo fun" },
  { src: "/placeholder.svg?width=600&height=800", alt: "Kid enjoying the photobooth" },
]

export default function GallerySection() {
  return (
    <section id="gallery" className="py-20 md:py-28 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tighter">Quality You Can See</h2>
          <p className="mt-4 text-lg text-gray-600">Browse photos from past events and imagine the fun at yours.</p>
        </div>
        <div className="mt-16 columns-2 md:columns-3 gap-4">
          {galleryImages.map((image, i) => (
            <div key={i} className="mb-4 break-inside-avoid">
              <Image
                src={image.src || "/placeholder.svg"}
                alt={image.alt}
                width={600}
                height={800}
                className="w-full h-auto rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
