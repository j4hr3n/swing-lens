import { Link } from 'react-router-dom'

export default function CapturePage() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <h1 className="text-xl font-semibold">Capture</h1>
      <p className="mt-2 text-[color:var(--color-text-muted)]">
        In-app recording coming in phase 7.
      </p>
      <Link to="/" className="mt-6 text-[color:var(--color-accent)] underline">
        Back to library
      </Link>
    </div>
  )
}
