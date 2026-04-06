import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import StatsBar from '@/components/landing/StatsBar'
import Features from '@/components/landing/Features'
import HowItWorks from '@/components/landing/HowItWorks'
import CtaBanner from '@/components/landing/CtaBanner'
import Footer from '@/components/landing/Footer'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen w-full bg-white text-[#0a0a0a] font-[var(--font-geist-sans)]">
      <Navbar />
      <Hero />
      <StatsBar />
      <Features />
      <HowItWorks />
      <CtaBanner />
      <Footer />
    </div>
  )
}
