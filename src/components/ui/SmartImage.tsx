import { Sparkles } from 'lucide-react'
import { useState } from 'react'
import { cx } from '../../lib/format'

/** Imagen con fade-in y un fallback elegante si la foto no carga (demo sin conexión). */
export function SmartImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading')
  return (
    <div className={cx('relative overflow-hidden bg-gradient-to-br from-blush via-sand to-shell', className)}>
      {state !== 'error' && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setState('ok')}
          onError={() => setState('error')}
          className={cx('h-full w-full object-cover transition duration-700', state === 'ok' ? 'opacity-100' : 'opacity-0')}
        />
      )}
      {state !== 'ok' && (
        <div className="absolute inset-0 grid place-items-center">
          <Sparkles className={cx('size-7 text-rose/40', state === 'loading' && 'animate-pulse')} />
        </div>
      )}
    </div>
  )
}
