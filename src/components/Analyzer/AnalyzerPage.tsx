import { Link, useParams } from 'react-router-dom'

export default function AnalyzerPage() {
  const { id } = useParams()
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <h1 className="text-xl font-semibold">Analyzer</h1>
      <p className="mt-2 text-[color:var(--color-text-muted)]">id: {id}</p>
      <Link to="/" className="mt-6 text-[color:var(--color-accent)] underline">
        Back to library
      </Link>
    </div>
  )
}
