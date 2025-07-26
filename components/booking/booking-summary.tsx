"use client"

import type { Package, AddOn } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

interface BookingSummaryProps {
  selectedPackage: Package | null | undefined
  selectedAddons: Record<number, number>
  addons: AddOn[]
  totalPrice: number
}

export function BookingSummary({ selectedPackage, selectedAddons, addons, totalPrice }: BookingSummaryProps) {
  if (!selectedPackage) return null

  return (
    <div className="mt-8 glass-panel-mint p-6 rounded-2xl">
      <h4 className="text-xl font-bold text-gray-900 mb-4">Booking Summary</h4>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="font-semibold">{selectedPackage.name}</span>
          <span className="font-bold">{formatCurrency(selectedPackage.price)}</span>
        </div>
        {Object.entries(selectedAddons).map(([addonId, quantity]) => {
          const addon = addons.find((a) => a.id === Number(addonId))
          if (!addon || quantity === 0) return null
          return (
            <div key={addonId} className="flex justify-between items-center text-sm">
              <span className="text-gray-700">
                {addon.name} x {quantity}
              </span>
              <span className="text-gray-900 font-medium">{formatCurrency(addon.price * quantity)}</span>
            </div>
          )
        })}
      </div>
      <div className="border-t border-white/20 pt-4 mt-4">
        <div className="flex justify-between text-lg font-bold">
          <span>Total:</span>
          <span>{formatCurrency(totalPrice)}</span>
        </div>
      </div>
    </div>
  )
}
