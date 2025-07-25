import { Mail, Phone, Instagram, Facebook, Twitter } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { getLogoUrl } from "@/lib/images"

export default function Footer() {
  return (
    <footer id="footer" className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-12">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center">
              <Image
                src={getLogoUrl("horizontal_white") || "/placeholder.svg"}
                alt="The Mint Booth"
                width={240}
                height={48}
                className="h-10 w-auto"
              />
            </Link>
            <p className="mt-4 text-gray-400 max-w-md">
              Providing fresh, fun, and luxurious photo experiences for weddings, corporate events, and parties in The
              Woodlands, TX and the Greater Houston area.
            </p>
          </div>
          <div>
            <h4 className="font-semibold tracking-wider uppercase text-gray-400">Contact</h4>
            <ul className="mt-4 space-y-3">
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <a href="mailto:info@themintbooth.com" className="hover:text-white transition-colors">
                  info@themintbooth.com
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <a href="tel:+1234567890" className="hover:text-white transition-colors">
                  (123) 456-7890
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold tracking-wider uppercase text-gray-400">Follow Us</h4>
            <div className="flex gap-4 mt-4">
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter />
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} The Mint Booth. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  )
}
