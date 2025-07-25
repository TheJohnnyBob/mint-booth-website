import Image from "next/image"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getLogoUrl } from "@/lib/images"

export default function HeroSection() {
  return (
    <section className="relative h-[80vh] min-h-[600px] w-full flex items-center justify-center text-white">
      <Image
        src="/placeholder.svg?width=1800&height=1200"
        alt="Guests enjoying The Mint Booth at an elegant event"
        layout="fill"
        objectFit="cover"
        className="z-0"
      />
      <div className="absolute inset-0 bg-black/40 z-10"></div>
      <div className="relative z-20 container mx-auto px-4 text-center">
        <div className="max-w-3xl mx-auto glass-panel-mint glass-highlight-mint animate-mint-glow p-8 md:p-12">
          <div className="mb-6">
            <Image
              src={getLogoUrl("horizontal_white") || "/placeholder.svg"}
              alt="The Mint Booth"
              width={300}
              height={60}
              className="h-12 w-auto mx-auto mb-4"
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter leading-tight">
            Fresh, Fun & Luxurious Photo Experiences.
          </h1>
          <p className="mt-4 max-w-xl mx-auto text-lg md:text-xl text-gray-200">
            A modern, open-air photobooth that brings Apple-like innovation and style to your special event in The
            Woodlands, TX and beyond.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-white text-gray-900 hover:bg-gray-200 rounded-xl h-12 px-8 text-base"
            >
              <Link href="#book">Book Your Date</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10 rounded-xl h-12 px-8 text-base bg-transparent"
            >
              <Link href="#packages">View Packages</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
