import { CalendarHeart } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AboutSection } from '../components/site/AboutSection'
import { Hero } from '../components/site/Hero'
import { ServicesSection } from '../components/site/ServicesSection'
import { ContactSection, SiteFooter } from '../components/site/SiteFooter'
import { SiteHeader } from '../components/site/SiteHeader'
import { TeamSection } from '../components/site/TeamSection'
import { cx } from '../lib/format'

export default function HomePage() {
  const [showBar, setShowBar] = useState(false)
  useEffect(() => {
    const onScroll = () => setShowBar(window.scrollY > 520)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <ServicesSection />
        <TeamSection />
        <AboutSection />
        <ContactSection />
      </main>
      <SiteFooter />

      {/* CTA fijo en móvil (junto al botón del asistente) */}
      <div
        className={cx(
          'fixed bottom-4 left-4 z-30 pb-[env(safe-area-inset-bottom)] transition duration-300 sm:hidden',
          showBar ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-24 opacity-0',
        )}
        style={{ right: 'calc(1rem + 140px)' }}
      >
        <Link to="/reservar" className="btn-accent h-14 w-full shadow-lift">
          <CalendarHeart className="size-4" /> Reservar turno
        </Link>
      </div>
    </>
  )
}
