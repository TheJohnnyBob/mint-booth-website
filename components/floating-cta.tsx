"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { getLogoUrl } from "@/lib/images"

export default function FloatingCTA() {
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 800 && !isDismissed) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [isDismissed])

  const handleDismiss = () => {
    setIsDismissed(true)
    setIsVisible(false)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <div className="glass-panel-mint glass-highlight-mint p-4 max-w-sm">
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="h-4 w-4 text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full" style={{ backgroundColor: "#0ABAB5" }}>
                <Image
                  src={getLogoUrl("shape_white") || "/placeholder.svg"}
                  alt="Mint Booth"
                  width={20}
                  height={20}
                  className="h-5 w-5"
                />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">Ready to book?</p>
                <p className="text-xs text-gray-600">Check availability now</p>
              </div>
            </div>
            <Link
              href="#book"
              className="mt-3 w-full inline-flex items-center justify-center h-9 px-4 rounded-lg btn-mint text-white text-sm font-medium"
            >
              Book Now
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
