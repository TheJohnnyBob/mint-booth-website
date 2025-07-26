"use client"

interface StepIndicatorProps {
  currentStep: number
}

const steps = [
  { number: 1, title: "Choose Package" },
  { number: 2, title: "Select Add-Ons" },
  { number: 3, title: "Pick Date & Time" },
  { number: 4, title: "Your Information" },
]

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="mb-8">
      <div className="flex justify-center items-center gap-4">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                currentStep >= step.number ? "btn-mint text-white" : "bg-gray-200 text-gray-600"
              }`}
            >
              {step.number}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-12 h-0.5 mx-2 transition-colors ${
                  currentStep > step.number ? "bg-[#0ABAB5]" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <div className="text-center mt-4 text-sm text-gray-600">{steps[currentStep - 1]?.title}</div>
    </div>
  )
}
