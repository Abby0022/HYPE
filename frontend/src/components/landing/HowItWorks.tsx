import { steps } from './data'

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6 bg-gray-50 border-y border-gray-100">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">How it works</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#0a0a0a] tracking-tight">
            Four steps to a clean ledger.
          </h2>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-8 left-8 right-8 h-px bg-gray-200 z-0" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
            {steps.map((step) => (
              <div key={step.num} className="flex flex-col gap-5">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white border border-gray-200 shadow-sm text-xl font-black text-[#0a0a0a] mx-auto md:mx-0">
                  {step.num}
                </div>
                <div>
                  <h3 className="font-bold text-[15px] text-[#0a0a0a] mb-1.5">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
