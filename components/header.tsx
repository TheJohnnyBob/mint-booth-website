"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, useAnimation } from "framer-motion"
import { Menu, X } from "lucide-react"
import Image from "next/image"
import { getLogoUrl } from "@/lib/images"

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const controls = useAnimation()

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (isScrolled) {
      controls.start({ height: "60px", paddingTop: "0px", paddingBottom: "0px" })
    } else {
      controls.start({ height: "80px", paddingTop: "10px", paddingBottom: "10px" })
    }
  }, [isScrolled, controls])

  const navLinks = [
    { name: "Packages", href: "#packages" },
    { name: "Gallery", href: "#gallery" },
    { name: "Book Now", href: "#book" },
    { name: "Contact", href: "#footer" },
  ]

  return (
    <motion.header
      initial={{ height: "80px", paddingTop: "10px", paddingBottom: "10px" }}
      animate={controls}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed top-0 left-0 right-0 z-50 mx-4 mt-2 rounded-2xl overflow-hidden"
    >
      <div className="absolute inset-0 glass-panel glass-highlight"></div>
      <div className="container mx-auto px-4 h-full flex justify-between items-center relative">
        <Link href="/" className="flex items-center">
          <Image
            src={getLogoUrl("horizontal_black") || "/placeholder.svg"}
            alt="The Mint Booth"
            width={180}
            height={40}
            className="h-8 w-auto"
            priority
          />
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <Link
          href="#book"
          className="hidden md:inline-flex h-10 items-center justify-center rounded-lg btn-mint px-5 text-sm font-medium text-white shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          Check Availability
        </Link>

        <div className="md:hidden">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-md text-gray-700">
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 glass-panel mt-2 rounded-2xl">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="text-lg font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                {link.name}
              </Link>
            ))}
            <Link
              href="#book"
              onClick={() => setIsMenuOpen(false)}
              className="mt-2 w-full inline-flex h-12 items-center justify-center rounded-lg btn-mint px-5 text-base font-medium text-white shadow-sm"
            >
              Check Availability
            </Link>
          </div>
        </div>
      )}
    </motion.header>
  )
}
