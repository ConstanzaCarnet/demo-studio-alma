import { Link } from 'react-router-dom'
import { business } from '../../data/business'
import { cx } from '../../lib/format'

export function Logo({ light, to = '/', compact }: { light?: boolean; to?: string; compact?: boolean }) {
  return (
    <Link to={to} className="group flex items-center gap-2.5" aria-label={business.name}>
      <span
        className={cx(
          'grid size-9 place-items-center rounded-full font-display text-xl italic transition group-hover:rotate-[-8deg]',
          light ? 'bg-ivory text-ink' : 'bg-ink text-blush',
        )}
      >
        A
      </span>
      {!compact && (
        <span className="leading-none">
          <span className={cx('block font-display text-[22px] font-semibold', light ? 'text-ivory' : 'text-ink')}>{business.name}</span>
          <span className={cx('block text-[10px] tracking-[0.18em] uppercase', light ? 'text-ivory/70' : 'text-muted')}>
            {business.tagline}
          </span>
        </span>
      )}
    </Link>
  )
}

export function DemoPill({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[10px] font-bold tracking-widest text-[#7d6340] uppercase',
        className,
      )}
    >
      Demo
    </span>
  )
}
