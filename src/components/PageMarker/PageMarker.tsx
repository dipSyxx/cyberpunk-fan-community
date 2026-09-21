interface PageMarkerProps {
  label: string
  index: string
}

export function PageMarker({ label, index }: PageMarkerProps) {
  return (
    <footer className="page-marker">
      <span className="page-marker__accent" aria-hidden="true" />
      <span className="page-marker__meta">
        <strong>{label}</strong>
        <span>{index} / 04</span>
      </span>
    </footer>
  )
}
