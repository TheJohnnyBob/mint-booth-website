"use client"

import type { AddOn } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Minus, Plus } from "lucide-react"

interface Step2AddonsProps {
  addons: AddOn[]
  selectedAddons: Record<number, number>
  onAddonQuantityChange: (id: number, change: number) => void
}

export function Step2Addons({ addons, selectedAddons, onAddonQuantityChange }: Step2AddonsProps) {
  return (
    <div>
      <h3 className="text-2xl font-bold text-center mb-2">Enhance Your Experience</h3>
      <p className="text-center text-gray-600 mb-8">Select any add-ons to customize your package.</p>
      <div className="space-y-4">
        {addons.length > 0 ? (
          addons.map((addon) => (
            <Card
              key={addon.id}
              className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex-grow">
                <h4 className="font-semibold">
                  {addon.name} - <span className="text-[#0ABAB5]">{formatCurrency(addon.price)}</span>
                </h4>
                <p className="text-sm text-gray-500">{addon.description}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => onAddonQuantityChange(addon.id, -1)}
                  disabled={(selectedAddons[addon.id] || 0) === 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-bold">{selectedAddons[addon.id] || 0}</span>
                <Button size="icon" variant="outline" onClick={() => onAddonQuantityChange(addon.id, 1)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <p className="text-center text-gray-500">No add-ons available for this package.</p>
        )}
      </div>
    </div>
  )
}
