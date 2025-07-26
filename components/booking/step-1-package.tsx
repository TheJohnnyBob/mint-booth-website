"use client"

import type { Package } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { CardContent } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"

interface Step1PackageProps {
  packages: Package[]
  selectedPackageId: number | null
  onSelectPackage: (id: number) => void
}

export function Step1Package({ packages, selectedPackageId, onSelectPackage }: Step1PackageProps) {
  return (
    <div>
      <h3 className="text-2xl font-bold text-center mb-8">Choose Your Package</h3>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className={`cursor-pointer transition-all duration-300 rounded-2xl ${
              selectedPackageId === pkg.id
                ? "glass-card-mint glass-highlight-mint scale-105 shadow-2xl"
                : "glass-card glass-highlight hover:scale-105"
            }`}
            onClick={() => onSelectPackage(pkg.id)}
          >
            <CardContent className="p-6">
              <h4 className="text-xl font-bold text-center">{pkg.name}</h4>
              <p className="text-3xl font-bold text-center mt-4 text-[#0ABAB5]">{formatCurrency(pkg.price)}</p>
              <p className="text-gray-500 text-center mt-2 text-sm">{pkg.description}</p>
              <ul className="mt-6 space-y-3">
                {pkg.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-[#0ABAB5]" />
                    <span className="text-sm text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </div>
        ))}
      </div>
    </div>
  )
}
