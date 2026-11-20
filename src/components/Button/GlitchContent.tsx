import type { PropsWithChildren } from 'react'

export function GlitchLayer({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return (
    <span aria-hidden="true" className={`cybr-btn__glitch ${className}`.trim()}>
      {children}
    </span>
  )
}

export function GlitchContent({ children }: PropsWithChildren) {
  return (
    <>
      <span className="cybr-glitch-content">{children}</span>
      <GlitchLayer className="cybr-btn__glitch--content">
        <span className="cybr-glitch-content">{children}</span>
      </GlitchLayer>
    </>
  )
}
