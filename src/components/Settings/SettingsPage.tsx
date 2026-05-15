import { Link } from 'react-router-dom'

export default function SettingsPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <h1 className="text-xl font-semibold">Settings</h1>
      <p className="mt-2 text-[color:var(--color-text-muted)]">
        Storage usage and clear-all coming in phase 8.
      </p>
      <Link to="/" className="mt-6 text-[color:var(--color-accent)] underline">
        Back to library
      </Link>
    </div>
  )
}
