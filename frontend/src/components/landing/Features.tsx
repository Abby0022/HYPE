import { features } from './data'

export default function Features() {
  return (
    <section id="features" className="py-24 px-6 bg-white">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="max-w-xl mb-16">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Features</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#0a0a0a] tracking-tight leading-tight mb-4">
            Built for one thing.<br />Doing it perfectly.
          </h2>
          <p className="text-gray-500 text-base leading-relaxed">
            Every feature in Hype Tracker exists to eliminate a manual step in your campaign reconciliation workflow.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-gray-100 rounded-2xl overflow-hidden border border-gray-100">
          {features.map((f) => (
            <div key={f.title} className="bg-white p-7 hover:bg-gray-50 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
                <f.icon className="w-[18px] h-[18px] text-gray-700" strokeWidth={1.8} />
              </div>
              <h3 className="font-bold text-[15px] text-[#0a0a0a] mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
