import { Ban, CheckCheck, CircleCheck, Clock3, UserX } from 'lucide-react'
import type { AppointmentStatus } from '../../domain/types'
import { cx } from '../../lib/format'
import { STATUS_LABEL } from '../../services/stats'

export const STATUS_STYLE: Record<AppointmentStatus, { badge: string; block: string; dot: string; icon: typeof Clock3 }> = {
  confirmed: { badge: 'bg-[#e5efe4] text-[#2e5a36]', block: 'border-l-[#4f8a5c] bg-[#f1f7f0]', dot: 'bg-[#4f8a5c]', icon: CircleCheck },
  pending: { badge: 'bg-[#fbf0d8] text-[#7f5310]', block: 'border-l-[#d19a2e] bg-[#fdf7ea]', dot: 'bg-[#d19a2e]', icon: Clock3 },
  completed: { badge: 'bg-[#e7ebf2] text-[#394b68]', block: 'border-l-[#6a80a6] bg-[#f3f5f9]', dot: 'bg-[#6a80a6]', icon: CheckCheck },
  cancelled: { badge: 'bg-[#f7e2df] text-[#963a31]', block: 'border-l-[#c4574c] bg-[#fbf1ef] opacity-70', dot: 'bg-[#c4574c]', icon: Ban },
  no_show: { badge: 'bg-[#ede8ee] text-[#5b4a63]', block: 'border-l-[#8d7a98] bg-[#f5f2f6] opacity-80', dot: 'bg-[#8d7a98]', icon: UserX },
}

export function StatusBadge({ status, className }: { status: AppointmentStatus; className?: string }) {
  const s = STATUS_STYLE[status]
  const Icon = s.icon
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap', s.badge, className)}>
      <Icon className="size-3.5" />
      {STATUS_LABEL[status]}
    </span>
  )
}
