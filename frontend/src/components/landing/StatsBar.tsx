import { stats } from './data'

export default function StatsBar() {
  return (
    <section id="stats" className="py-16 px-6 border-y border-gray-100 bg-gray-50">
      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {stats.map((s) => (
          <div key={s.label}>
            <div className="text-3xl md:text-4xl font-extrabold text-[#0a0a0a] mb-1">{s.value}</div>
            <div className="text-sm text-gray-400 font-medium">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
